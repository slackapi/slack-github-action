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
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns('"greetings": "hello"');
      mocks.webhook.trigger.resolves({ ok: true });
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.equal(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify({ ok: true }),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.ok(mocks.core.setOutput.getCall(2).lastArg >= 0);
    });

    it("token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com"; // https://github.com/slackapi/slack-github-action/issues/373
      mocks.calls.resolves({ ok: true });
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns('"text": "hello"');
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.equal(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify({ ok: true }),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.ok(mocks.core.setOutput.getCall(2).lastArg >= 0);
    });

    it("incoming webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example"; // https://github.com/slackapi/slack-github-action/issues/373
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns('"text": "hello"');
      mocks.webhook.incoming.resolves({ text: "ok" });
      await send(mocks.core);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.equal(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify("ok"),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.ok(mocks.core.setOutput.getCall(2).lastArg >= 0);
    });
  });

  describe("logging", async () => {
    it("warns of the failed request when errors are not fatal", async () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns('"text": "hello"');
      mocks.calls.rejects(
        new webapi.WebAPIPlatformError({ ok: false, error: "invalid_auth" }),
      );
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.called, false);
      assert.equal(mocks.core.warning.getCalls().length, 1);
      assert.match(mocks.core.warning.getCall(0).firstArg, /invalid_auth/);
    });

    it("warns of the failed webhook when errors are not fatal", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns('"greetings": "hello"');
      mocks.webhook.trigger.rejects(new Error("invalid_payload"));
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.called, false);
      assert.equal(mocks.core.warning.getCalls().length, 1);
      assert.match(mocks.core.warning.getCall(0).firstArg, /invalid_payload/);
    });

    it("fails the step without warning when errors are fatal", async () => {
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns('"text": "hello"');
      mocks.calls.rejects(
        new webapi.WebAPIPlatformError({ ok: false, error: "invalid_auth" }),
      );
      await assert.rejects(send(mocks.core));
      assert.ok(mocks.core.setFailed.called);
      assert.strictEqual(mocks.core.warning.called, false);
    });
  });
});
