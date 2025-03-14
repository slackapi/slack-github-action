import { assert } from "chai";
import Config from "../src/config.js";
import SlackError from "../src/errors.js";
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
      mocks.core.getInput.withArgs("api").returns("http://localhost:8080");
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("payload").returns('"hello": "world"');
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      mocks.core.getInput.withArgs("retries").returns("0");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.api, "http://localhost:8080");
      assert.equal(config.inputs.errors, true);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.payload, '"hello": "world"');
      assert.equal(config.inputs.proxy, "https://example.com");
      assert.equal(config.inputs.retries, config.Retries.ZERO);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
    });

    it("allows token environment variables with a webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example";
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.equal(config.inputs.webhookType, "incoming-webhook");
      assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
      assert.isTrue(
        mocks.core.setSecret.withArgs("https://example.com").called,
      );
    });

    it("allows webhook environment variables with a token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com";
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
      assert.isTrue(
        mocks.core.setSecret.withArgs("https://example.com").called,
      );
    });

    it("errors when both the token and webhook is provided", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Either the token or webhook is required - not both.",
          );
          assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
          assert.isTrue(
            mocks.core.setSecret.withArgs("https://example.com").called,
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("errors if the method is provided without a token", async () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Missing input! A token must be provided to use the method decided.",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("errors if neither the token or webhook is provided", async () => {
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Missing input! Either a method or webhook is required to take action.",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("errors if a webhook is provided without the type", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Missing input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("errors if the webhook type does not match techniques", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("post");
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });

  describe("mask", async () => {
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
    it('allow the "retries" option with lowercased space', async () => {
      mocks.axios.post.returns(Promise.resolve("LGTM"));
      mocks.core.getInput.withArgs("retries").returns(" rapid ");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            'Invalid input! An unknown "retries" value was used: FOREVER',
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("errors if an invalid retries option is provided", async () => {
      mocks.axios.post.returns(Promise.resolve("LGTM"));
      mocks.core.getInput.withArgs("retries").returns("FOREVER");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            'Invalid input! An unknown "retries" value was used: FOREVER',
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });
});
