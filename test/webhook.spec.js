import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { AxiosError } from "axios";
import Config from "../src/config.js";
import SlackError from "../src/errors.js";
import send from "../src/send.js";
import Webhook from "../src/webhook.js";
import { mocks } from "./index.spec.js";

describe("webhook", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("success", () => {
    it("sends the parsed payload to the provided webhook trigger", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "webhook-trigger",
        payload: "drinks: coffee",
      };
      mocks.axios.post._promise = Promise.resolve({
        status: 200,
        data: { ok: true },
      });
      try {
        await send(mocks.core);
        assert.equal(mocks.axios.post.mock.calls.length, 1);
        const [url, payload, options] =
          mocks.axios.post.mock.calls[0].arguments;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(payload, { drinks: "coffee" });
        assert.deepEqual(options, {});
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify({ ok: true }),
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });

    it("sends the parsed payload to the provided incoming webhook", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        payload: "text: greetings",
      };
      mocks.axios.post._promise = Promise.resolve({ status: 200, data: "ok" });
      try {
        await send(mocks.core);
        assert.equal(mocks.axios.post.mock.calls.length, 1);
        const [url, payload, options] =
          mocks.axios.post.mock.calls[0].arguments;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(payload, { text: "greetings" });
        assert.deepEqual(options, {});
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify("ok"),
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });
  });

  describe("failure", () => {
    it("requires that a webhook is provided in inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: mocks.core,
        inputs: {},
      };
      try {
        await new Webhook().post(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("No webhook was provided to post to"));
        } else {
          assert.fail(err);
        }
      }
    });

    it("returns the failures from a webhook trigger", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "webhook-trigger",
        payload: "drinks: coffee",
      };
      const response = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {},
        {},
        { status: 400 },
      );
      mocks.axios.post._promise = Promise.reject(response);
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Request failed with status code 400"),
          );
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.axios.post.mock.calls.length, 1);
      const [url, payload, options] = mocks.axios.post.mock.calls[0].arguments;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(payload, { drinks: "coffee" });
      assert.deepEqual(options, {});
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        payload: "textt: oops",
      };
      const response = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {},
        {},
        { status: 400 },
      );
      mocks.axios.post._promise = Promise.reject(response);
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Request failed with status code 400"),
          );
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.axios.post.mock.calls.length, 1);
      const [url, payload, options] = mocks.axios.post.mock.calls[0].arguments;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(payload, { textt: "oops" });
      assert.deepEqual(options, {});
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
    });
  });

  describe("proxies", () => {
    it("requires a webhook is included in the inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: mocks.core,
        inputs: {},
      };
      try {
        new Webhook().proxies(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("No webhook was provided to proxy to"),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("skips proxying an http webhook url altogether", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "http://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        proxy: "https://example.com",
      };
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const request = webhook.proxies(config);
      assert.strictEqual(request, undefined);
    });

    it("sets up the proxy agent for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        proxy,
      };
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const { httpsAgent, proxy: proxying } = webhook.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.notStrictEqual(proxying, false);
    });

    it("sets up the agent without proxy for http proxies", async () => {
      const proxy = "http://example.com";
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        proxy,
      };
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const { httpsAgent, proxy: proxying } = webhook.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.strictEqual(proxying, false);
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        proxy,
      };
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxies(config);
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

    it("fails to configure proxies with an unknown url protocol", async () => {
      const proxy = "ssh://";
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        proxy,
      };
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxies(config);
        assert.fail("An unknown URL protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
          assert.ok(err.cause.message.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("retries", () => {
    it("uses a default of five retries in requests", async () => {
      const webhook = new Webhook();
      const result = webhook.retries();
      assert.equal(result.retries, 5);
    });

    it('does not attempt retries when "0" is set', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("0");
      assert.equal(result.retries, 0);
    });

    it('attempts a default amount of "5" retries', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("5");
      assert.equal(result.retries, 5);
      if (!result.retryDelay) {
        assert.fail("No retry delay found!");
      }
      assert.equal(
        result.retryDelay(5, mocks.errors.axios.network_failed),
        300000,
        "5th retry after 5 seconds",
      );
    });

    it('attempts "10" retries in around "30" minutes', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("10");
      assert.equal(result.retries, 10);
      if (!result.retryDelay) {
        assert.fail("No retry delay found!");
      }
      assert.ok(
        result.retryDelay(10, mocks.errors.axios.network_failed) > 1800000,
        "last attempt is around 30 minutes after starting",
      );
      assert.ok(
        result.retryDelay(10, mocks.errors.axios.network_failed) < 3600000,
        "last attempt is no more than an hour later",
      );
    });

    it('attempts a " rapid" burst of "12" retries in seconds', async () => {
      const webhook = new Webhook();
      const result = webhook.retries(" rapid");
      assert.equal(result.retries, 12);
      if (!result.retryDelay) {
        assert.fail("No retry delay found!");
      }
      assert.equal(
        result.retryDelay(12, mocks.errors.axios.network_failed),
        12000,
        "12th retry after 12 seconds",
      );
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("RAPID");
      assert.equal(result.retries, 12);
      if (!result.retryDelay) {
        assert.fail("No retry delay found!");
      }
      assert.equal(
        result.retryDelay(12, mocks.errors.axios.network_failed),
        12000,
        "12th retry after 12 seconds",
      );
    });
  });
});
