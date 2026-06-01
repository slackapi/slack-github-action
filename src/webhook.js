import { IncomingWebhook } from "@slack/webhook";
import { ProxyAgent } from "undici";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * This Webhook class posts the configured payload to the provided webhook, with
 * whatever additional settings set.
 *
 * NOTE: @slack/webhook v8 does not export addAppMetadata so there is no public
 * way to inject custom app metadata into its User-Agent. The SDK sets its own
 * User-Agent header internally. We supplement it by prepending our action's
 * identity in the custom fetch wrapper below.
 * @see {@link https://github.com/slackapi/node-slack-sdk/blob/webhook-8.0.0-development/packages/webhook/src/instrument.ts}
 */
export default class Webhook {
  /**
   * @param {Config} config
   */
  async post(config) {
    if (!config.inputs.webhook) {
      throw new SlackError(config.core, "No webhook was provided to post to");
    }
    const webhook = new IncomingWebhook(config.inputs.webhook, {
      fetch: this.customFetch(config),
    });
    try {
      const response = await webhook.send(config.content.values);
      config.core.setOutput("ok", true);
      config.core.setOutput("response", response.text);
      config.core.debug(response.text);
    } catch (/** @type {any} */ err) {
      config.core.setOutput("ok", false);
      config.core.setOutput("response", JSON.stringify(err.message));
      config.core.debug(err);
      throw new SlackError(config.core, err.message);
    }
  }

  /**
   * Return a custom fetch function that injects the User-Agent header and
   * routes through a proxy if configured.
   * @param {Config} config
   * @returns {(url: string | URL | Request, init?: any) => Promise<Response>}
   */
  customFetch(config) {
    const dispatcher = this.proxyDispatcher(config);
    return (url, init) => {
      const headers = new Headers(init?.headers);
      const existing = headers.get("User-Agent") || "";
      headers.set(
        "User-Agent",
        existing ? `${config.userAgent} ${existing}` : config.userAgent,
      );
      return fetch(url, {
        ...init,
        headers,
        ...(dispatcher ? { dispatcher } : {}),
      });
    };
  }

  /**
   * Return a proxy dispatcher if one is configured, or undefined.
   * @param {Config} config
   * @returns {any | undefined}
   */
  proxyDispatcher(config) {
    const { webhook, proxy } = config.inputs;
    if (!proxy) {
      return undefined;
    }
    try {
      if (webhook && new URL(webhook).protocol !== "https:") {
        config.core.debug(
          "The webhook destination is not HTTPS so skipping the HTTPS proxy",
        );
        return undefined;
      }
      const proxyUrl = new URL(proxy);
      switch (proxyUrl.protocol) {
        case "https:":
        case "http:":
          return /** @type {any} */ (new ProxyAgent(proxy));
        default:
          throw new SlackError(
            config.core,
            `Unsupported URL protocol: ${proxy}`,
          );
      }
    } catch (/** @type {any} */ err) {
      if (err instanceof SlackError) {
        throw err;
      }
      throw new SlackError(config.core, "Failed to configure the HTTPS proxy", {
        cause: err,
      });
    }
  }
}
