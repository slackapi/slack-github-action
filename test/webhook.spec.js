import { assert } from "chai";
import { mocks } from "./index.spec.js";
import send from "../src/send.js";
import Webhook from "../src/webhook.js";

describe("webhook", () => {
  afterEach(() => {
    mocks.reset();
  });

  describe("success", () => {
    it("sends the parsed payload to the provided webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns('"message":"hello"');
      mocks.axios.post.returns(Promise.resolve("LGTM"));
      try {
        await send(mocks.core);
        assert.equal(mocks.axios.post.getCalls().length, 1);
        const [url, payload, options] = mocks.axios.post.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(payload, { message: "hello" });
        assert.equal(
          /** @type {import("axios-retry").IAxiosRetryConfig} */(options)
            .retries,
          5,
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });
  });

  describe("failure", () => {
    it("requires that a webhook is provided in inputs", async () => {
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Missing input! Either a token or webhook is required to take action.",
        );
      }
    });

    it("requires that a webhook type is provided in input", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Missing input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
        );
      }
    });
  });

  describe("retries", () => {
    it("uses the configured retries in requests", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
    });

    it('does not attempt retries when "0" is set', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("0").retries;
      assert.equal(result, 0);
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
      assert.isAtLeast(
        result.retryDelay(10, mocks.errors.axios.network_failed),
        1800000,
        "last attempt is around 30 minutes after starting",
      );
      assert.isAtMost(
        result.retryDelay(10, mocks.errors.axios.network_failed),
        3600000,
        "last attempt is no more than an hour later",
      );
    });

    it('attempts a "rapid" burst of "12" retries in seconds', async () => {
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
