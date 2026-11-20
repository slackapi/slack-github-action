import { ProxyAgent } from "undici";
import SlackError from "./errors.js";

/**
 * Return a fetch function that routes requests through a configured proxy.
 *
 * @param {import("./config.js").default} config
 * @param {string?} [destination] - A provided request destination.
 * @returns {typeof globalThis.fetch | undefined}
 */
export function fetch(config, destination) {
  const dispatcher = proxies(config, destination);
  if (!dispatcher) {
    return undefined;
  }
  return (url, init) => globalThis.fetch(url, { ...init, dispatcher });
}

/**
 * Return a configured proxy agent dispatcher to the request destination.
 *
 * @see {@link https://github.com/slackapi/slack-github-action/pull/132}
 * @see {@link https://github.com/slackapi/slack-github-action/pull/205}
 *
 * @param {import("./config.js").default} config
 * @param {string?} [destination] - The request destination to proxy towards.
 * @returns {ProxyAgent | undefined}
 */
export function proxies(config, destination) {
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
