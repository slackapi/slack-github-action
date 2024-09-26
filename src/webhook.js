import { exponentialDelay, linearDelay } from "axios-retry";
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
     * @type {import("axios").AxiosRequestConfig & import("axios-retry").IAxiosRetryConfig}
     */
    const options = {
      ...this.retries(config.inputs.retries),
      ...this.proxies(config),
    };
    const response = await config.axios.post(
      config.inputs.webhook,
      config.content.values,
      options,
    );
    config.core.debug(JSON.stringify(response?.data));
  }

  /**
   * Return configurations for http proxy options if these are set.
   * @param {Config} config
   * @returns {import("axios").AxiosRequestConfig | undefined}
   * @see {@link https://github.com/slackapi/slack-github-action/pull/132}
   */
  proxies(config) {
    try {
      if (!config.inputs.webhook) {
        throw new Error("No webhook was provided to proxy to");
      }
      const httpsProxy =
        process.env.HTTPS_PROXY || process.env.https_proxy || "";
      if (!httpsProxy) {
        return undefined;
      }
      if (new URL(config.inputs.webhook).protocol !== "https:") {
        config.core.debug(
          "The webhook destination is not HTTPS so skipping the HTTPS proxy",
        );
        return undefined;
      }
      switch (new URL(httpsProxy).protocol) {
        case "https:":
          return {
            httpsAgent: new HttpsProxyAgent(httpsProxy),
          };
        case "http:":
          return {
            httpsAgent: new HttpsProxyAgent(httpsProxy),
            proxy: false,
          };
      }
    } catch (err) {
      config.core.warning(
        "Failed to configure HTTPS proxy agent for HTTP proxy so using the default axios configuration.",
      );
      console.error(err);
    }
    return undefined;
  }

  /**
   * Return configurations for retry options with different delays.
   * @param {string} option
   * @returns {import("axios-retry").IAxiosRetryConfig}
   */
  retries(option) {
    switch (option) {
      case "0":
        return { retries: 0 };
      case "5":
        return { retries: 5, retryDelay: linearDelay(60 * 1000) }; // 5 minutes
      case "10":
        return {
          retries: 10,
          retryDelay: (count, err) => exponentialDelay(count, err, 2 * 1000), // 34.12 minutes
        };
      case "RAPID":
        return { retries: 12, retryDelay: linearDelay(1 * 1000) }; // 12 seconds
      default:
        return { retries: 5, retryDelay: linearDelay(60 * 1000) }; // 5 minutes
    }
  }
}
