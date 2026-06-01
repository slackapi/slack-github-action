import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
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
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      mocks.fetch.resolves(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      try {
        await send(mocks.core);
        assert.equal(mocks.fetch.getCalls().length, 1);
        const [url, init] = mocks.fetch.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(JSON.parse(init.body), { drinks: "coffee" });
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify({ ok: true }),
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });

    it("sends the parsed payload to the provided incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("text: greetings");
      mocks.fetch.resolves(new Response(JSON.stringify("ok"), { status: 200 }));
      try {
        await send(mocks.core);
        assert.equal(mocks.fetch.getCalls().length, 1);
        const [url, init] = mocks.fetch.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(JSON.parse(init.body), { text: "greetings" });
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
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
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      mocks.core.getInput.withArgs("retries").returns("0");
      mocks.fetch.rejects(new Error("Request failed with status code 400"));
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
      assert.equal(mocks.fetch.getCalls().length, 1);
      const [url, init] = mocks.fetch.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(JSON.parse(init.body), { drinks: "coffee" });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("textt: oops");
      mocks.core.getInput.withArgs("retries").returns("0");
      mocks.fetch.rejects(new Error("Request failed with status code 400"));
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
      assert.equal(mocks.fetch.getCalls().length, 1);
      const [url, init] = mocks.fetch.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(JSON.parse(init.body), { textt: "oops" });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });
  });

  describe("proxies", () => {
    it("requires a webhook is included in the inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: mocks.core,
        fetch: globalThis.fetch,
        inputs: {},
      };
      try {
        new Webhook().proxiedFetch(config);
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
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const fetchFn = webhook.proxiedFetch(config);
      assert.strictEqual(typeof fetchFn, "function");
    });

    it("returns a proxy fetch function for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const fetchFn = webhook.proxiedFetch(config);
      assert.strictEqual(typeof fetchFn, "function");
    });

    it("returns a proxy fetch function for http proxies", async () => {
      const proxy = "http://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const fetchFn = webhook.proxiedFetch(config);
      assert.strictEqual(typeof fetchFn, "function");
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxiedFetch(config);
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
      const proxy = "ssh://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxiedFetch(config);
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
      assert.equal(result.retryDelay(5), 300000, "5th retry after 5 minutes");
    });

    it('attempts "10" retries in around "30" minutes', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("10");
      assert.equal(result.retries, 10);
      assert.ok(
        result.retryDelay(10) > 500000,
        "last attempt is well into the future",
      );
    });

    it('attempts a " rapid" burst of "12" retries in seconds', async () => {
      const webhook = new Webhook();
      const result = webhook.retries(" rapid");
      assert.equal(result.retries, 12);
      assert.equal(result.retryDelay(12), 12000, "12th retry after 12 seconds");
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("RAPID");
      assert.equal(result.retries, 12);
      assert.equal(result.retryDelay(12), 12000, "12th retry after 12 seconds");
    });
  });
});
