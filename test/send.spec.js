import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
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
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "webhook-trigger",
        payload: '"greetings": "hello"',
      };
      mocks.axios.post._promise = Promise.resolve({
        status: 200,
        data: { ok: true },
      });
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
      mocks.calls._resolvesWith = { ok: true };
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: '"text": "hello"',
      };
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
      mocks.inputs = {
        ...mocks.inputs,
        webhook: "https://hooks.slack.com",
        "webhook-type": "incoming-webhook",
        payload: '"text": "hello"',
      };
      mocks.axios.post._promise = Promise.resolve({ status: 200, data: "ok" });
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
});
