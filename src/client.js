import webapi from "@slack/web-api";
import { HttpsProxyAgent } from "https-proxy-agent";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * The Client class creates a WebClient from @slack/web-api for use when calling
 * various Slack API methods.
 *
 * @see {@link https://tools.slack.dev/node-slack-sdk/web-api/}
 * @see {@link https://api.slack.com/methods/}
 */
export default class Client {
  /**
   * Perform the API call configured with the input payload.
   * @param {Config} config
   */
  async post(config) {
    if (!config.inputs.method) {
      throw new SlackError(config.core, "No API method was provided for use");
    }
    if (!config.inputs.token) {
      throw new SlackError(config.core, "No token was provided to post with");
    }
    const client = new config.webapi.WebClient(config.inputs.token, {
      agent: this.proxies(config)?.httpsAgent,
      allowAbsoluteUrls: false,
      logger: config.logger,
      retryConfig: this.retries(config.inputs.retries),
      slackApiUrl: config.inputs.api || undefined,
    });
    try {
      /**
       * @type {webapi.WebAPICallResult & import("@slack/web-api").ChatPostMessageResponse & import("@slack/web-api").ConversationsCreateResponse}
       */
      const response = await client.apiCall(
        config.inputs.method,
        config.content.values,
      );
      config.core.setOutput("ok", response.ok);
      config.core.setOutput("response", JSON.stringify(response));
      if (response.channel?.id ?? response.channel) {
        config.core.setOutput(
          "channel_id",
          response.channel?.id ?? response.channel,
        );
      }
      if (response.message?.thread_ts) {
        config.core.setOutput("thread_ts", response.message.thread_ts);
      }
      if (response.ts) {
        config.core.setOutput("ts", response.ts);
      }
    } catch (/** @type {any} */ err) {
      const slackErr = /** @type {webapi.WebAPICallError} */ (err);
      config.core.setOutput("ok", false);
      switch (slackErr.code) {
        case webapi.ErrorCode.RequestError:
          config.core.setOutput("response", JSON.stringify(slackErr.original));
          break;
        case webapi.ErrorCode.HTTPError:
          config.core.setOutput("response", JSON.stringify(slackErr));
          break;
        case webapi.ErrorCode.PlatformError:
          config.core.setOutput("response", JSON.stringify(slackErr.data));
          break;
        case webapi.ErrorCode.RateLimitedError:
          config.core.setOutput("response", JSON.stringify(slackErr));
          break;
      }
      throw new SlackError(config.core, err);
    }
  }

  /**
   * Return configurations for https proxy options if these are set.
   * @param {Config} config
   * @returns {import("axios").AxiosRequestConfig | undefined}
   * @see {@link https://github.com/slackapi/slack-github-action/pull/205}
   */
  proxies(config) {
    const proxy = config.inputs.proxy;
    try {
      if (!proxy) {
        return undefined;
      }
      return {
        httpsAgent: new HttpsProxyAgent(proxy),
      };
    } catch (/** @type {any} */ err) {
      throw new SlackError(config.core, "Failed to configure the HTTPS proxy", {
        cause: err,
      });
    }
  }

  /**
   * Return configurations for retry options with different delays.
   * @param {string} option
   * @returns {import("@slack/web-api").RetryOptions}
   */
  retries(option) {
    switch (option?.trim().toUpperCase()) {
      case "0":
        return { retries: 0 };
      case "5":
        return webapi.retryPolicies.fiveRetriesInFiveMinutes;
      case "10":
        return webapi.retryPolicies.tenRetriesInAboutThirtyMinutes;
      case "RAPID":
        return webapi.retryPolicies.rapidRetryPolicy;
      default:
        return webapi.retryPolicies.fiveRetriesInFiveMinutes;
    }
  }
}
