import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import Config from "../src/config.js";
import SlackError from "../src/errors.js";
import { fetch, proxyDispatcher } from "../src/proxies.js";
import { mocks } from "./index.spec.js";

describe("proxies", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("fetch", () => {
    it("returns a custom fetch function when a proxy is configured", async () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      assert.strictEqual(typeof fetchFn, "function");
    });

    it("returns undefined when no proxy is configured", async () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      assert.strictEqual(fetchFn, undefined);
    });

    it("fails to configure a fetch with an invalid proxied url", async () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("proxy").returns("not-a-url");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      try {
        const config = new Config(mocks.core);
        fetch(config);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("proxyDispatcher", () => {
    it("returns no dispatcher when a proxy is not configured", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      const config = new Config(mocks.core);
      const dispatcher = proxyDispatcher(config, config.inputs.webhook);
      assert.strictEqual(dispatcher, undefined);
    });

    it("skips proxying a non-https destination altogether", async () => {
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxyDispatcher(config, config.inputs.webhook);
      assert.strictEqual(dispatcher, undefined);
    });

    it("returns a proxy dispatcher for the provided https proxy", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxyDispatcher(config, config.inputs.webhook);
      assert.ok(dispatcher);
    });

    it("returns a proxy dispatcher for http proxies", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("http://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxyDispatcher(config, config.inputs.webhook);
      assert.ok(dispatcher);
    });

    it("fails to configure a dispatcher with an invalid proxied url", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://");
      try {
        const config = new Config(mocks.core);
        proxyDispatcher(config, config.inputs.webhook);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("fails to configure a dispatcher with an unknown url protocol", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("ssh://example.com");
      try {
        const config = new Config(mocks.core);
        proxyDispatcher(config, config.inputs.webhook);
        assert.fail("An unknown URL protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });
});
