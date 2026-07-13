import { ProxyAgent } from "undici";
import SlackError from "./errors.js";

/**
 * Proxy support is shared between the API method client and the webhook clients
 * by injecting a custom fetch. Both @slack/web-api and @slack/webhook accept a
 * "fetch" option and fall back to the global fetch otherwise, so routing
 * requests through an undici ProxyAgent dispatcher keeps proxying opt-in and
 * free of any global side effects.
 *
 * @see {@link https://github.com/slackapi/slack-github-action/pull/132}
 * @see {@link https://github.com/slackapi/slack-github-action/pull/205}
 */

/**
 * Return a fetch function that routes requests through the configured proxy, or
 * undefined when no proxy applies. The returned function is injected into the
 * Slack clients so that proxying stays testable without touching global state.
 *
 * @param {import("./config.js").default} config
 * @param {string?} [destination] - The request destination used to decide if a
 *   proxy applies; a non-HTTPS destination skips the proxy.
 * @returns {((url: string | URL, init?: any) => Promise<Response>) | undefined}
 */
export function proxiedFetch(config, destination) {
  const dispatcher = proxyDispatcher(config, destination);
  if (!dispatcher) {
    return undefined;
  }
  return (url, init) => fetch(url, { ...init, dispatcher });
}

/**
 * Return an undici ProxyAgent dispatcher when a proxy is configured for an
 * HTTPS destination, or undefined otherwise.
 *
 * @param {import("./config.js").default} config
 * @param {string?} [destination] - The request destination to proxy towards.
 * @returns {ProxyAgent | undefined}
 */
export function proxyDispatcher(config, destination) {
  const proxy = config.inputs.proxy;
  if (!proxy) {
    return undefined;
  }
  try {
    if (destination && new URL(destination).protocol !== "https:") {
      config.core.debug(
        "The request destination is not HTTPS so skipping the HTTPS proxy",
      );
      return undefined;
    }
    switch (new URL(proxy).protocol) {
      case "https:":
      case "http:":
        return new ProxyAgent(proxy);
      default:
        throw new SlackError(config.core, `Unsupported URL protocol: ${proxy}`);
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
