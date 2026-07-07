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
      mocks.webhookTrigger.resolves({ ok: true, body: { ok: true } });
      await send(mocks.core);
      assert.equal(mocks.webhookTrigger.getCalls().length, 1);
      assert.deepEqual(mocks.webhookTrigger.getCall(0).firstArg, {
        drinks: "coffee",
      });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.equal(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify({ ok: true }),
      );
    });

    it("sends the parsed payload to the provided incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("text: greetings");
      mocks.incomingWebhook.resolves({ text: "ok" });
      await send(mocks.core);
      assert.equal(mocks.incomingWebhook.getCalls().length, 1);
      assert.deepEqual(mocks.incomingWebhook.getCall(0).firstArg, {
        text: "greetings",
      });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.equal(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify("ok"),
      );
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
      mocks.webhookTrigger.rejects(
        new Error("An HTTP protocol error occurred"),
      );
      try {
        await send(mocks.core);
      } catch (e) {
        assert.ok(e instanceof SlackError);
      }
      assert.equal(mocks.webhookTrigger.getCalls().length, 1);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("text: hi");
      mocks.incomingWebhook.rejects(
        new Error("An HTTP protocol error occurred"),
      );
      try {
        await send(mocks.core);
      } catch (e) {
        assert.ok(e instanceof SlackError);
      }
      assert.equal(mocks.incomingWebhook.getCalls().length, 1);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
    });
  });

  describe("proxies", () => {
    it("returns undefined when no proxy is set", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      assert.strictEqual(webhook.proxies(config), undefined);
    });

    it("sets up the proxy agent for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const httpsAgent = webhook.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
    });

    it("skips the proxy when the webhook destination is not HTTPS", async () => {
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      assert.strictEqual(webhook.proxies(config), undefined);
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

    it("fails to configure proxies with an unsupported protocol", async () => {
      const proxy = "ftp://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxies(config);
        assert.fail("An unsupported proxy protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
          assert.ok(err.cause?.message?.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("retries", () => {
    it("uses a default of five retries", async () => {
      const result = new Webhook().retries();
      assert.equal(result.retries, 5);
    });

    it('does not attempt retries when "0" is set', async () => {
      const result = new Webhook().retries("0");
      assert.equal(result.retries, 0);
    });

    it('maps "5" to a five-retry policy', async () => {
      const result = new Webhook().retries("5");
      assert.equal(result.retries, 5);
    });

    it('maps "10" to a ten-retry policy', async () => {
      const result = new Webhook().retries("10");
      assert.equal(result.retries, 10);
    });

    it('maps "RAPID" (case/space-insensitive) to a rapid policy', async () => {
      const rapid = new Webhook().retries("RAPID");
      const spaced = new Webhook().retries(" rapid");
      assert.deepEqual(rapid, spaced);
    });
  });
});
