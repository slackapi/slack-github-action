import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import webhook from "@slack/webhook";
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
      mocks.webhook.trigger.resolves({ ok: true, body: { ok: true } });
      try {
        await send(mocks.core);
        assert.equal(mocks.webhook.trigger.getCalls().length, 1);
        assert.deepEqual(mocks.webhook.trigger.getCall(0).firstArg, {
          drinks: "coffee",
        });
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
      mocks.webhook.incoming.resolves({ text: "ok" });
      try {
        await send(mocks.core);
        assert.equal(mocks.webhook.incoming.getCalls().length, 1);
        assert.deepEqual(mocks.webhook.incoming.getCall(0).firstArg, {
          text: "greetings",
        });
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

    it("errors when an unknown webhook type is provided", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: mocks.core,
        inputs: {
          webhook: "https://hooks.slack.com",
          webhookType: "unknown-webhook",
          retries: "5",
        },
      };
      try {
        await new Webhook().post(config);
        assert.fail();
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Unknown webhook type: unknown-webhook"),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("returns the failures from a webhook trigger", async () => {
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      mocks.webhook.trigger.rejects(
        new Error("An HTTP protocol error occurred"),
      );
      try {
        await send(mocks.core);
        assert.fail();
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("An HTTP protocol error occurred"));
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.webhook.trigger.getCalls().length, 1);
      assert.deepEqual(mocks.webhook.trigger.getCall(0).firstArg, {
        drinks: "coffee",
      });
      assert.ok(mocks.core.setFailed.called);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("textt: oops");
      mocks.webhook.incoming.rejects(
        new Error("An HTTP protocol error occurred"),
      );
      try {
        await send(mocks.core);
        assert.fail();
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("An HTTP protocol error occurred"));
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.webhook.incoming.getCalls().length, 1);
      assert.deepEqual(mocks.webhook.incoming.getCall(0).firstArg, {
        textt: "oops",
      });
      assert.ok(mocks.core.setFailed.called);
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
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
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

    it("sets up the proxy agent for the provided http proxy", async () => {
      const proxy = "http://example.com";
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

    it("returns undefined when no proxy is set", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
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

    it("fails to configure proxies with an unknown url protocol", async () => {
      const proxy = "ssh://";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
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
          assert.ok(err.cause?.message?.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("retries", () => {
    it("uses a default of five retries in requests", async () => {
      const result = new Webhook().retries();
      assert.equal(result.retries, webhook.fiveRetriesInFiveMinutes.retries);
    });

    it('does not attempt retries when "0" is set', async () => {
      const result = new Webhook().retries("0");
      assert.equal(result.retries, 0);
    });

    it('attempts a default amount of "5" retries', async () => {
      const result = new Webhook().retries("5");
      assert.equal(result.retries, webhook.fiveRetriesInFiveMinutes.retries);
      assert.equal(result.factor, webhook.fiveRetriesInFiveMinutes.factor);
    });

    it('attempts "10" retries in around "30" minutes', async () => {
      const result = new Webhook().retries("10");
      assert.equal(
        result.retries,
        webhook.tenRetriesInAboutThirtyMinutes.retries,
      );
      assert.equal(
        result.factor,
        webhook.tenRetriesInAboutThirtyMinutes.factor,
      );
    });

    it('attempts a " rapid" burst of "12" retries in seconds', async () => {
      const result = new Webhook().retries(" rapid");
      assert.equal(result.retries, webhook.rapidRetryPolicy.retries);
      assert.equal(result.factor, webhook.rapidRetryPolicy.factor);
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
      const result = new Webhook().retries("RAPID");
      assert.equal(result.retries, webhook.rapidRetryPolicy.retries);
      assert.equal(result.factor, webhook.rapidRetryPolicy.factor);
    });
  });
});
