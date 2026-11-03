import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import webapi from "@slack/web-api";
import webhook from "@slack/webhook";
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
      mocks.inputs.set("api", "http://localhost:8080");
      mocks.booleanInputs.set("errors", true);
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("payload", '"hello": "world"');
      mocks.inputs.set("proxy", "https://example.com");
      mocks.inputs.set("retries", "0");
      mocks.inputs.set("token", "xoxb-example");
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
          (call) => call.arguments[0] === "xoxb-example",
        ),
      );
    });

    it("allows token environment variables with a webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example";
      mocks.inputs.set("webhook", "https://example.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.equal(config.inputs.webhookType, "incoming-webhook");
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (call) => call.arguments[0] === "xoxb-example",
        ),
      );
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (call) => call.arguments[0] === "https://example.com",
        ),
      );
    });

    it("allows webhook environment variables with a token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com";
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("token", "xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (call) => call.arguments[0] === "xoxb-example",
        ),
      );
      assert.ok(
        mocks.core.setSecret.mock.calls.some(
          (call) => call.arguments[0] === "https://example.com",
        ),
      );
    });

    it("errors when both the token and webhook is provided", async () => {
      mocks.inputs.set("token", "xoxb-example");
      mocks.inputs.set("webhook", "https://example.com");
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
              (call) => call.arguments[0] === "xoxb-example",
            ),
          );
          assert.ok(
            mocks.core.setSecret.mock.calls.some(
              (call) => call.arguments[0] === "https://example.com",
            ),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("errors if the method is provided without a token", async () => {
      mocks.inputs.set("method", "chat.postMessage");
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
      mocks.inputs.set("webhook", "https://example.com");
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
      mocks.inputs.set("webhook", "https://example.com");
      mocks.inputs.set("webhook-type", "post");
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

  describe("instrument", () => {
    it("adds metadata to webapi with package name and version", async () => {
      const stub = mock.fn();
      const original = Object.getOwnPropertyDescriptor(
        webapi,
        "addAppMetadata",
      );
      Object.defineProperty(webapi, "addAppMetadata", {
        value: stub,
        configurable: true,
      });
      try {
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        new Config(mocks.core);
        assert.equal(stub.mock.callCount(), 1);
        const { name, version } = stub.mock.calls[0].arguments[0];
        assert.equal(name, "@slack/slack-github-action");
        assert.ok(version);
      } finally {
        Object.defineProperty(webapi, "addAppMetadata", original);
      }
    });

    it("adds metadata to webhook with package name and version", async () => {
      const stub = mock.fn();
      const original = Object.getOwnPropertyDescriptor(
        webhook,
        "addAppMetadata",
      );
      Object.defineProperty(webhook, "addAppMetadata", {
        value: stub,
        configurable: true,
      });
      try {
        mocks.inputs.set("webhook", "https://hooks.slack.com");
        mocks.inputs.set("webhook-type", "incoming-webhook");
        new Config(mocks.core);
        assert.equal(stub.mock.callCount(), 1);
        const { name, version } = stub.mock.calls[0].arguments[0];
        assert.equal(name, "@slack/slack-github-action");
        assert.ok(version);
      } finally {
        Object.defineProperty(webhook, "addAppMetadata", original);
      }
    });
  });

  describe("mask", async () => {
    it("treats the provided token as a secret", async () => {
      mocks.inputs.set("token", "xoxb-example");
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.ok(
          mocks.core.setSecret.mock.calls.some(
            (call) => call.arguments[0] === "xoxb-example",
          ),
        );
      }
    });

    it("treats the provided webhook as a secret", async () => {
      mocks.inputs.set("webhook", "https://slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      try {
        await send(mocks.core);
        assert.fail("Failed to error for incomplete inputs while testing");
      } catch {
        assert.ok(
          mocks.core.setSecret.mock.calls.some(
            (call) => call.arguments[0] === "https://slack.com",
          ),
        );
      }
    });
  });

  describe("validate", () => {
    it('allow the "retries" option with lowercased space', async () => {
      mocks.webhook.incoming.mock.mockImplementation(async () => ({
        text: "LGTM",
      }));
      mocks.inputs.set("retries", " rapid ");
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
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
      mocks.webhook.incoming.mock.mockImplementation(async () => ({
        text: "LGTM",
      }));
      mocks.inputs.set("retries", "FOREVER");
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
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
