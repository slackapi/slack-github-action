import webapi from "@slack/web-api";
import { ErrorCode, IncomingWebhook, WebhookTrigger } from "@slack/webhook";
import { HttpsProxyAgent } from "https-proxy-agent";
import pRetry, { AbortError } from "p-retry";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * The Webhook class posts the configured payload to the provided webhook using
 * the @slack/webhook SDK, choosing the client by the configured webhook type.
 *
 * @see {@link https://docs.slack.dev/tools/node-slack-sdk/webhook/}
 */
export default class Webhook {
  /**
   * @param {Config} config
   */
  async post(config) {
    if (!config.inputs.webhook) {
      throw new SlackError(config.core, "No webhook was provided to post to");
    }
    switch (config.inputs.webhookType) {
      case "incoming-webhook":
        return await this.postIncomingWebhook(config);
      case "webhook-trigger":
        return await this.postWebhookTrigger(config);
      default:
        throw new SlackError(
          config.core,
          `Unknown webhook type: ${config.inputs.webhookType}`,
        );
    }
  }

  /**
   * Post using the @slack/webhook IncomingWebhook client.
   * @param {Config} config
   */
  async postIncomingWebhook(config) {
    const webhook = new IncomingWebhook(
      /** @type {string} */ (config.inputs.webhook),
      { agent: this.proxies(config)?.httpsAgent },
    );
    try {
      const response = await this.send(config, () =>
        webhook.send(config.content.values),
      );
      config.core.setOutput("ok", true);
      config.core.setOutput("response", JSON.stringify(response.text));
      config.core.debug(JSON.stringify(response.text));
    } catch (/** @type {any} */ err) {
      config.core.setOutput("ok", false);
      config.core.setOutput("response", JSON.stringify(err.message));
      config.core.debug(err);
      throw new SlackError(config.core, err.message);
    }
  }

  /**
   * Post using the @slack/webhook WebhookTrigger client.
   * @param {Config} config
   */
  async postWebhookTrigger(config) {
    const trigger = new WebhookTrigger(
      /** @type {string} */ (config.inputs.webhook),
      { agent: this.proxies(config)?.httpsAgent },
    );
    try {
      const response = await this.send(config, () =>
        trigger.send(config.content.values),
      );
      config.core.setOutput("ok", response.ok);
      config.core.setOutput("response", JSON.stringify(response.body));
      config.core.debug(JSON.stringify(response.body));
    } catch (/** @type {any} */ err) {
      config.core.setOutput("ok", false);
      config.core.setOutput("response", JSON.stringify(err.message));
      config.core.debug(err);
      throw new SlackError(config.core, err.message);
    }
  }

  /**
   * Invoke a webhook send with retries, aborting on non-retryable errors.
   * @template T
   * @param {Config} config
   * @param {() => Promise<T>} attempt - the SDK send call to retry.
   * @returns {Promise<T>}
   */
  async send(config, attempt) {
    return await pRetry(async () => {
      try {
        return await attempt();
      } catch (/** @type {any} */ err) {
        if (this.retryable(err)) {
          throw err;
        }
        throw new AbortError(err);
      }
    }, this.retries(config.inputs.retries));
  }

  /**
   * Decide if a @slack/webhook error should be retried.
   *
   * Request errors (no response received) are always retried; HTTP errors are
   * retried only for rate limits and server errors.
   * @param {any} err
   * @returns {boolean}
   */
  retryable(err) {
    if (err?.code === ErrorCode.RequestError) {
      return true;
    }
    if (err?.code === ErrorCode.HTTPError) {
      const status = err?.original?.response?.status;
      return status === 429 || (status >= 500 && status <= 599);
    }
    return true;
  }

  /**
   * Return configurations for https proxy options if these are set.
   * @param {Config} config
   * @returns {{ httpsAgent: HttpsProxyAgent<string> } | undefined}
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
   * Map the retries input to a p-retry / node-retry policy.
   * @param {string} [option]
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
