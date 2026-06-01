import { ProxyAgent } from "undici";
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
    const retryConfig = this.retries(config.inputs.retries);
    const fetchFn = this.proxiedFetch(config);
    try {
      const response = await this.fetchWithRetry(
        config.inputs.webhook,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": config.userAgent,
          },
          body: JSON.stringify(config.content.values),
        },
        retryConfig,
        fetchFn,
      );
      const data = await this.parseResponseBody(response);
      config.core.setOutput("ok", response.status === 200);
      config.core.setOutput("response", JSON.stringify(data));
      config.core.debug(JSON.stringify(data));
    } catch (/** @type {any} */ err) {
      config.core.setOutput("ok", false);
      config.core.setOutput("response", JSON.stringify(err.message));
      config.core.debug(err);
      throw new SlackError(config.core, err.message);
    }
  }

  /**
   * Parse the response body as JSON, falling back to text.
   * @param {Response} response
   * @returns {Promise<any>}
   */
  async parseResponseBody(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Perform a fetch request with configurable retries on retryable errors.
   * @param {string} url
   * @param {RequestInit} init
   * @param {{retries: number, retryDelay: (attempt: number) => number, retryCondition: (status: number) => boolean}} retryConfig
   * @param {(url: string, init?: RequestInit) => Promise<Response>} fetchFn
   * @returns {Promise<Response>}
   */
  async fetchWithRetry(url, init, retryConfig, fetchFn) {
    let lastError;
    for (let attempt = 0; attempt <= retryConfig.retries; attempt++) {
      try {
        const response = await fetchFn(url, init);
        if (response.ok || !retryConfig.retryCondition(response.status)) {
          return response;
        }
        if (attempt < retryConfig.retries) {
          const delay = retryConfig.retryDelay(attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        return response;
      } catch (/** @type {any} */ err) {
        lastError = err;
        if (attempt < retryConfig.retries) {
          const delay = retryConfig.retryDelay(attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Return a fetch function that routes through a proxy if configured.
   * @param {Config} config
   * @returns {(url: string, init?: RequestInit) => Promise<Response>}
   * @see {@link https://github.com/slackapi/slack-github-action/pull/132}
   */
  proxiedFetch(config) {
    const { webhook, proxy } = config.inputs;
    if (!webhook) {
      throw new SlackError(config.core, "No webhook was provided to proxy to");
    }
    if (!proxy) {
      return (url, init) => config.fetch(url, init);
    }
    try {
      if (new URL(webhook).protocol !== "https:") {
        config.core.debug(
          "The webhook destination is not HTTPS so skipping the HTTPS proxy",
        );
        return (url, init) => config.fetch(url, init);
      }
      const proxyUrl = new URL(proxy);
      switch (proxyUrl.protocol) {
        case "https:":
        case "http:": {
          const dispatcher = /** @type {any} */ (new ProxyAgent(proxy));
          return (url, init) => config.fetch(url, { ...init, dispatcher });
        }
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
   * @returns {{retries: number, retryDelay: (attempt: number) => number, retryCondition: (status: number) => boolean}}
   */
  retries(option) {
    /** @param {number} status */
    const isRetryable = (status) => status >= 500 || status === 429;
    switch (option?.trim().toUpperCase()) {
      case "0":
        return { retries: 0, retryDelay: () => 0, retryCondition: isRetryable };
      case "5":
        return {
          retryCondition: isRetryable,
          retries: 5,
          retryDelay: (attempt) => attempt * 60 * 1000, // linear 60s
        };
      case "10":
        return {
          retryCondition: isRetryable,
          retries: 10,
          retryDelay: (attempt) => 2000 * 2 ** (attempt - 1), // exponential from 2s
        };
      case "RAPID":
        return {
          retryCondition: isRetryable,
          retries: 12,
          retryDelay: (attempt) => attempt * 1000, // linear 1s
        };
      default:
        return {
          retryCondition: isRetryable,
          retries: 5,
          retryDelay: (attempt) => attempt * 60 * 1000, // linear 60s
        };
    }
  }
}
