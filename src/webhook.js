import {
  fiveRetriesInFiveMinutes,
  IncomingWebhook,
  rapidRetryPolicy,
  tenRetriesInAboutThirtyMinutes,
  WebhookTrigger,
} from "@slack/webhook";
import { HttpsProxyAgent } from "https-proxy-agent";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * The Webhook class posts the configured payload to the provided webhook using
 * the @slack/webhook SDK, choosing the client by the configured webhook type.
 *
 * Retries are delegated to the SDK via the retryConfig option, matching how
 * the API-method technique passes retryConfig to @slack/web-api's WebClient.
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
      {
        agent: this.proxies(config)?.httpsAgent,
        retryConfig: this.retries(config.inputs.retries),
      },
    );
    try {
      const response = await webhook.send(config.content.values);
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
      {
        agent: this.proxies(config)?.httpsAgent,
        retryConfig: this.retries(config.inputs.retries),
      },
    );
    try {
      const response = await trigger.send(config.content.values);
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
      switch (new URL(proxy).protocol) {
        case "https:":
        case "http:":
          return {
            httpsAgent: new HttpsProxyAgent(proxy),
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
   * Map the retries input to a @slack/webhook retry policy.
   * @param {string} [option]
   * @returns {import("@slack/webhook").RetryOptions}
   */
  retries(option) {
    switch (option?.trim().toUpperCase()) {
      case "0":
        return { retries: 0 };
      case "5":
        return fiveRetriesInFiveMinutes;
      case "10":
        return tenRetriesInAboutThirtyMinutes;
      case "RAPID":
        return rapidRetryPolicy;
      default:
        return fiveRetriesInFiveMinutes;
    }
  }
}
