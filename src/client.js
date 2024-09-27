import webapi, { LogLevel } from "@slack/web-api";
import { HttpsProxyAgent } from "https-proxy-agent";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * The Client class creates a WebClient from @slack/web-api for use when calling
 * various Slack API methods.
 *
 * @see {@link https://slack.dev/node-slack-sdk/web-api/}
 * @see {@link https://api.slack.com/methods/}
 */
export default class Client {
  /**
   * Known response values from messages that are included in outputs.
   * @typedef MessageResultDetails
   * @prop {string} [thread_ts] - timestamp of the top threaded message.
   */

  /**
   * Possible response values related to messages from the API.
   * @typedef MessageResult - Possible message values from API methods.
   * @prop {MessageResultDetails} [message] - additional message details.
   * @prop {string} [ts] - timestamp of the message.
   * @prop {string} [channel] - ID of the channel.
   * @see {@link https://api.slack.com/methods/chat.postMessage#examples}
   */

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
      retryConfig: this.retries(config.inputs.retries),
      logger: {
        debug: config.core.debug,
        info: config.core.info,
        warn: config.core.warning,
        error: config.core.error,
        getLevel: () => {
          return config.core.isDebug() ? LogLevel.DEBUG : LogLevel.INFO;
        },
        setLevel: (_level) => {},
        setName: (_name) => {},
      },
    });
    /**
     * @type {webapi.WebAPICallResult & MessageResult}
     */
    const response = await client.apiCall(
      config.inputs.method,
      config.content.values,
    );
    config.core.setOutput("ok", response.ok);
    config.core.setOutput("response", JSON.stringify(response));
    if (!response.ok) {
      throw new Error(response.error);
    }
    if (response.channel) {
      config.core.setOutput("channel_id", response.channel);
    }
    if (response.message?.thread_ts) {
      config.core.setOutput("thread_ts", response.message?.thread_ts);
    }
    if (response.ts) {
      config.core.setOutput("ts", response.ts);
    }
  }

  /**
   * Return configurations for https proxy options if these are set.
   * @param {Config} config
   * @returns {import("axios").AxiosRequestConfig | undefined}
   * @see {@link https://github.com/slackapi/slack-github-action/pull/205}
   */
  proxies(config) {
    try {
      const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
      if (!httpsProxy) {
        return undefined;
      }
      return {
        httpsAgent: new HttpsProxyAgent(httpsProxy),
      };
    } catch (err) {
      config.core.warning(
        "Failed to configure the HTTPS proxy agent so using the default axios configuration.",
      );
      console.error(err);
      return undefined;
    }
  }

  /**
   * Return configurations for retry options with different delays.
   * @param {string} option
   * @returns {import("@slack/web-api").RetryOptions}
   */
  retries(option) {
    switch (option) {
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
