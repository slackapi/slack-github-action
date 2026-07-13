import webhook from "@slack/webhook";
import Config from "./config.js";
import SlackError from "./errors.js";
import { proxiedFetch } from "./proxies.js";

/**
 * This Webhook class posts the configured payload to the provided webhook, with
 * whatever additional settings set.
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
    const url = config.inputs.webhook;
    const options = {
      fetch: proxiedFetch(config, url),
      retryConfig: this.retries(config.inputs.retries),
    };
    try {
      switch (config.inputs.webhookType) {
        case "incoming-webhook": {
          const response = await new config.webhook.IncomingWebhook(
            url,
            options,
          ).send(config.content.values);
          config.core.setOutput("ok", true);
          config.core.setOutput("response", JSON.stringify(response.text));
          config.core.debug(JSON.stringify(response.text));
          return;
        }
        case "webhook-trigger": {
          const response = await new config.webhook.WebhookTrigger(
            url,
            options,
          ).send(config.content.values);
          config.core.setOutput("ok", response.ok);
          config.core.setOutput("response", JSON.stringify(response));
          config.core.debug(JSON.stringify(response));
          return;
        }
        default:
          throw new SlackError(
            config.core,
            `Unknown webhook type: ${config.inputs.webhookType}`,
          );
      }
    } catch (/** @type {any} */ err) {
      config.core.setOutput("ok", false);
      config.core.setOutput("response", JSON.stringify(err.message));
      config.core.debug(err);
      throw new SlackError(config.core, err.message);
    }
  }

  /**
   * Return configurations for retry options with different delays.
   * @param {string} option
   * @returns {import("@slack/webhook").RetryOptions}
   */
  retries(option) {
    switch (option?.trim().toUpperCase()) {
      case "0":
        return { retries: 0 };
      case "5":
        return webhook.retryPolicies.fiveRetriesInFiveMinutes;
      case "10":
        return webhook.retryPolicies.tenRetriesInAboutThirtyMinutes;
      case "RAPID":
        return webhook.retryPolicies.rapidRetryPolicy;
      default:
        return webhook.retryPolicies.fiveRetriesInFiveMinutes;
    }
  }
}
