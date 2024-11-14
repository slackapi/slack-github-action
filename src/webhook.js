import axiosRetry, { exponentialDelay, linearDelay } from "axios-retry";
import { HttpsProxyAgent } from "https-proxy-agent";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * This Webhook class posts the configured payload to the provided webhook, with
 * whatever additional settings set.
 */
export default class Webhook {
  /**
   * @param {Config} config
   */
  async post(config) {
    if (!config.inputs.webhook) {
      throw new SlackError(config.core, "No webhook was provided to post to");
    }
    /**
     * @type {import("axios-retry").IAxiosRetryConfig}
     * @see {@link https://www.npmjs.com/package/axios-retry}
     */
    const retries = this.retries(config.inputs.retries);
    axiosRetry(config.axios, retries);
    try {
      const response = await config.axios.post(
        config.inputs.webhook,
        config.content.values,
        {
          ...this.proxies(config),
        },
      );
      config.core.setOutput("ok", response.status === 200);
      config.core.setOutput("response", JSON.stringify(response.data));
      config.core.debug(JSON.stringify(response.data));
    } catch (/** @type {any} */ err) {
      const response = err.toJSON();
      config.core.setOutput("ok", response.status === 200);
      config.core.setOutput("response", JSON.stringify(response.message));
      config.core.debug(response);
      throw new SlackError(config.core, response.message);
    }
  }

  /**
   * Return configurations for http proxy options if these are set.
   * @param {Config} config
   * @returns {import("axios").AxiosRequestConfig | undefined}
   * @see {@link https://github.com/slackapi/slack-github-action/pull/132}
   */
  proxies(config) {
    const { webhook, proxy } = config.inputs;
    if (!webhook) {
      throw new SlackError(config.core, "No webhook was provided to proxy to");
    }
    if (!proxy) {
      return undefined;
    }
    try {
      if (new URL(webhook).protocol !== "https:") {
        config.core.debug(
          "The webhook destination is not HTTPS so skipping the HTTPS proxy",
        );
        return undefined;
      }
      switch (new URL(proxy).protocol) {
        case "https:":
          return {
            httpsAgent: new HttpsProxyAgent(proxy),
          };
        case "http:":
          return {
            httpsAgent: new HttpsProxyAgent(proxy),
            proxy: false,
          };
        default:
          throw new SlackError(
            config.core,
            `Unsupported URL protocol: ${proxy}`,
          );
      }
    } catch (/** @type {any} */ err) {
      throw new SlackError(config.core, "Failed to configure the HTTPS proxy", {
        cause: err,
      });
    }
  }

  /**
   * Return configurations for retry options with different delays.
   * @param {string} option
   * @returns {import("axios-retry").IAxiosRetryConfig}
   */
  retries(option) {
    switch (option?.trim().toUpperCase()) {
      case "0":
        return { retries: 0 };
      case "5":
        return {
          retryCondition: axiosRetry.isRetryableError,
          retries: 5,
          retryDelay: linearDelay(60 * 1000), // 5 minutes
        };
      case "10":
        return {
          retryCondition: axiosRetry.isRetryableError,
          retries: 10,
          retryDelay: (count, err) => exponentialDelay(count, err, 2 * 1000), // 34.12 minutes
        };
      case "RAPID":
        return {
          retryCondition: axiosRetry.isRetryableError,
          retries: 12,
          retryDelay: linearDelay(1 * 1000), // 12 seconds
        };
      default:
        return {
          retryCondition: axiosRetry.isRetryableError,
          retries: 5,
          retryDelay: linearDelay(60 * 1000), // 5 minutes
        };
    }
  }
}
