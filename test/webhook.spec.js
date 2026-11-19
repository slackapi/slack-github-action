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
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "webhook-trigger");
      mocks.inputs.set("payload", "drinks: coffee");
      mocks.webhook.trigger.mock.mockImplementation(async () => ({ ok: true }));
      try {
        await send(mocks.core);
        assert.equal(mocks.webhook.trigger.mock.callCount(), 1);
        assert.deepEqual(mocks.webhook.trigger.mock.calls[0].arguments[0], {
          drinks: "coffee",
        });
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
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("payload", "text: greetings");
      mocks.webhook.incoming.mock.mockImplementation(async () => ({
        text: "ok",
      }));
      try {
        await send(mocks.core);
        assert.equal(mocks.webhook.incoming.mock.callCount(), 1);
        assert.deepEqual(mocks.webhook.incoming.mock.calls[0].arguments[0], {
          text: "greetings",
        });
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
      mocks.booleanInputs.set("errors", true);
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "webhook-trigger");
      mocks.inputs.set("payload", "drinks: coffee");
      mocks.webhook.trigger.mock.mockImplementation(async () => {
        throw new Error("An HTTP protocol error occurred");
      });
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
      assert.equal(mocks.webhook.trigger.mock.callCount(), 1);
      assert.deepEqual(mocks.webhook.trigger.mock.calls[0].arguments[0], {
        drinks: "coffee",
      });
      assert.ok(mocks.core.setFailed.mock.callCount() > 0);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.booleanInputs.set("errors", true);
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("payload", "textt: oops");
      mocks.webhook.incoming.mock.mockImplementation(async () => {
        throw new Error("An HTTP protocol error occurred");
      });
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
      assert.equal(mocks.webhook.incoming.mock.callCount(), 1);
      assert.deepEqual(mocks.webhook.incoming.mock.calls[0].arguments[0], {
        textt: "oops",
      });
      assert.ok(mocks.core.setFailed.mock.callCount() > 0);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
    });
  });

  describe("retries", () => {
    it("uses a default of five retries in requests", async () => {
      const result = new Webhook().retries();
      assert.equal(
        result.retries,
        webhook.retryPolicies.fiveRetriesInFiveMinutes.retries,
      );
    });

    it('does not attempt retries when "0" is set', async () => {
      const result = new Webhook().retries("0");
      assert.equal(result.retries, 0);
    });

    it('attempts a default amount of "5" retries', async () => {
      const result = new Webhook().retries("5");
      assert.equal(
        result.retries,
        webhook.retryPolicies.fiveRetriesInFiveMinutes.retries,
      );
      assert.equal(
        result.factor,
        webhook.retryPolicies.fiveRetriesInFiveMinutes.factor,
      );
    });

    it('attempts "10" retries in around "30" minutes', async () => {
      const result = new Webhook().retries("10");
      assert.equal(
        result.retries,
        webhook.retryPolicies.tenRetriesInAboutThirtyMinutes.retries,
      );
      assert.equal(
        result.factor,
        webhook.retryPolicies.tenRetriesInAboutThirtyMinutes.factor,
      );
    });

    it('attempts a " rapid" burst of "12" retries in seconds', async () => {
      const result = new Webhook().retries(" rapid");
      assert.equal(
        result.retries,
        webhook.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(
        result.factor,
        webhook.retryPolicies.rapidRetryPolicy.factor,
      );
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
      const result = new Webhook().retries("RAPID");
      assert.equal(
        result.retries,
        webhook.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(
        result.factor,
        webhook.retryPolicies.rapidRetryPolicy.factor,
      );
    });
  });
});
