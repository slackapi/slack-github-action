import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import webapi from "@slack/web-api";
import send from "../src/send.js";
import { mocks } from "./index.spec.js";

/**
 * This is a collection of integration tests that make sure modules are doing
 * whatever's expected.
 *
 * Or at least that's planned...
 *
 * Edge cases for inputs are checked in separate modules including the config
 * specifications.
 */
describe("send", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("techniques", async () => {
    it("webhook trigger", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "webhook-trigger");
      mocks.inputs.set("payload", '"greetings": "hello"');
      mocks.webhook.trigger.mock.mockImplementation(async () => ({ ok: true }));
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify({ ok: true }),
      );
      assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
      assert.ok(mocks.core.setOutput.mock.calls[2].arguments[1] >= 0);
    });

    it("token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com"; // https://github.com/slackapi/slack-github-action/issues/373
      mocks.calls.mock.mockImplementation(async () => ({ ok: true }));
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("token", "xoxb-example");
      mocks.inputs.set("payload", '"text": "hello"');
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify({ ok: true }),
      );
      assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
      assert.ok(mocks.core.setOutput.mock.calls[2].arguments[1] >= 0);
    });

    it("incoming webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example"; // https://github.com/slackapi/slack-github-action/issues/373
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("payload", '"text": "hello"');
      mocks.webhook.incoming.mock.mockImplementation(async () => ({
        text: "ok",
      }));
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(mocks.core.setOutput.mock.calls[1].arguments[0], "response");
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify("ok"),
      );
      assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
      assert.ok(mocks.core.setOutput.mock.calls[2].arguments[1] >= 0);
    });
  });

  describe("logging", async () => {
    it("warns of the failed request when errors are not fatal", async () => {
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("token", "xoxb-example");
      mocks.inputs.set("payload", '"text": "hello"');
      mocks.calls.mock.mockImplementation(async () => {
        throw new webapi.WebAPIPlatformError({
          ok: false,
          error: "invalid_auth",
        });
      });
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.mock.callCount(), 0);
      assert.equal(mocks.core.warning.mock.callCount(), 1);
      assert.match(
        mocks.core.warning.mock.calls[0].arguments[0],
        /invalid_auth/,
      );
    });

    it("warns of the failed webhook when errors are not fatal", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "webhook-trigger");
      mocks.inputs.set("payload", '"greetings": "hello"');
      mocks.webhook.trigger.mock.mockImplementation(async () => {
        throw new Error("invalid_payload");
      });
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.mock.callCount(), 0);
      assert.equal(mocks.core.warning.mock.callCount(), 1);
      assert.match(
        mocks.core.warning.mock.calls[0].arguments[0],
        /invalid_payload/,
      );
    });

    it("fails the step without warning when errors are fatal", async () => {
      mocks.booleanInputs.set("errors", true);
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("token", "xoxb-example");
      mocks.inputs.set("payload", '"text": "hello"');
      mocks.calls.mock.mockImplementation(async () => {
        throw new webapi.WebAPIPlatformError({
          ok: false,
          error: "invalid_auth",
        });
      });
      await assert.rejects(send(mocks.core));
      assert.ok(mocks.core.setFailed.mock.callCount() > 0);
      assert.strictEqual(mocks.core.warning.mock.callCount(), 0);
    });
  });
});
