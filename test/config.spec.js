import { assert } from "chai";
import Config from "../src/config.js";
import send from "../src/send.js";
import { mocks } from "./index.spec.js";

/**
 * Confirm values from the action input or environment variables are gathered
 * or errors are thrown for invalid inputs.
 *
 * An assumption is made around these same checks and parsings being done for
 * each collection of configurations, but only the edge cases of checks are done
 * here.
 */
describe("config", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("inputs", () => {
    it("valid values are collected from the action inputs", async () => {
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("payload").returns('"hello": "world"');
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      mocks.core.getInput.withArgs("retries").returns("0");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.errors, true);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.payload, '"hello": "world"');
      assert.equal(config.inputs.proxy, "https://example.com");
      assert.equal(config.inputs.retries, config.Retries.ZERO);
      assert.equal(config.inputs.token, "xoxb-example");
    });

    it("errors when both the token and webhook is provided", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Invalid input! Either the token or webhook is required - not both.",
        );
        assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
        assert.isTrue(
          mocks.core.setSecret.withArgs("https://example.com").called,
        );
      }
    });

    it("errors if the webhook type does not match techniques", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("post");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Invalid input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
        );
      }
    });
  });

  describe("secrets", async () => {
    it("treats the provided token as a secret", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
      }
    });

    it("treats the provided webhook as a secret", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.isTrue(
          mocks.core.setSecret.withArgs("https://slack.com").called,
        );
      }
    });
  });

  describe("validate", () => {
    it("warns if an invalid retries option is provided", async () => {
      mocks.axios.post.returns(Promise.resolve("LGTM"));
      mocks.core.getInput.withArgs("retries").returns("FOREVER");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      await send(mocks.core);
      assert.isTrue(
        mocks.core.warning.calledWith(
          'Invalid input! An unknown "retries" value was used: FOREVER',
        ),
      );
    });
  });
});
