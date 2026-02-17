import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
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
      mocks.inputs = {
        ...mocks.inputs,
        api: "http://localhost:8080",
        method: "chat.postMessage",
        payload: '"hello": "world"',
        proxy: "https://example.com",
        retries: "0",
        token: "xoxb-example",
      };
      mocks.booleanInputs = {
        ...mocks.booleanInputs,
        errors: true,
      };
      const config = new Config(mocks.core);
      assert.equal(config.inputs.api, "http://localhost:8080");
      assert.equal(config.inputs.errors, true);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.payload, '"hello": "world"');
      assert.equal(config.inputs.proxy, "https://example.com");
      assert.equal(config.inputs.retries, config.Retries.ZERO);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (c) => c.arguments[0] === "xoxb-example",
        ),
      );
    });

    it("allows token environment variables with a webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example";
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://example.com",
        "webhook-type": "incoming-webhook",
      };
      const config = new Config(mocks.core);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.equal(config.inputs.webhookType, "incoming-webhook");
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (c) => c.arguments[0] === "xoxb-example",
        ),
      );
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (c) => c.arguments[0] === "https://example.com",
        ),
      );
    });

    it("allows webhook environment variables with a token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com";
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
      };
      const config = new Config(mocks.core);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (c) => c.arguments[0] === "xoxb-example",
        ),
      );
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (c) => c.arguments[0] === "https://example.com",
        ),
      );
    });

    it("errors when both the token and webhook is provided", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        token: "xoxb-example",
        webhook: "https://example.com",
      };
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              "Invalid input! Either the token or webhook is required - not both.",
            ),
          );
          assert.ok(
            mocks.core.setSecret.mock.calls.some(
              (c) => c.arguments[0] === "xoxb-example",
            ),
          );
          assert.ok(
            mocks.core.setSecret.mock.calls.some(
              (c) => c.arguments[0] === "https://example.com",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if the method is provided without a token", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
      };
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              "Missing input! A token must be provided to use the method decided.",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if neither the token or webhook is provided", async () => {
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              "Missing input! Either a method or webhook is required to take action.",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if a webhook is provided without the type", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://example.com",
      };
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              "Missing input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if the webhook type does not match techniques", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://example.com",
        "webhook-type": "post",
      };
      try {
        new Config(mocks.core);
        assert.fail("Failed to error when invalid inputs are provided");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              "Invalid input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("mask", async () => {
    it("treats the provided token as a secret", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        token: "xoxb-example",
      };
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.ok(
          mocks.core.setSecret.mock.calls.some(
            (c) => c.arguments[0] === "xoxb-example",
          ),
        );
      }
    });

    it("treats the provided webhook as a secret", async () => {
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://slack.com",
        "webhook-type": "incoming-webhook",
      };
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.ok(
          mocks.core.setSecret.mock.calls.some(
            (c) => c.arguments[0] === "https://slack.com",
          ),
        );
      }
    });
  });

  describe("validate", () => {
    it('allow the "retries" option with lowercased space', async () => {
      mocks.axios.post._promise = Promise.resolve("LGTM");
      mocks.inputs = {
        ...mocks.inputs,
        retries: " rapid ",
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
      };
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              'Invalid input! An unknown "retries" value was used: FOREVER',
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if an invalid retries option is provided", async () => {
      mocks.axios.post._promise = Promise.resolve("LGTM");
      mocks.inputs = {
        ...mocks.inputs,
        retries: "FOREVER",
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
      };
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes(
              'Invalid input! An unknown "retries" value was used: FOREVER',
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });
  });
});
