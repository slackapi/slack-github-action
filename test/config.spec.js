import assert from "node:assert";
import { afterEach, beforeEach, describe, it } from "node:test";
import webapi from "@slack/web-api";
import sinon from "sinon";
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
      assert.ok(mocks.core.setSecret.withArgs("xoxb-example").called);
    });

    it("allows token environment variables with a webhook", async () => {
      process.env.SLACK_TOKEN = "xoxb-example";
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.equal(config.inputs.webhookType, "incoming-webhook");
      assert.ok(mocks.core.setSecret.withArgs("xoxb-example").called);
      assert.ok(mocks.core.setSecret.withArgs("https://example.com").called);
    });

    it("allows webhook environment variables with a token", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://example.com";
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.token, "xoxb-example");
      assert.equal(config.inputs.webhook, "https://example.com");
      assert.ok(mocks.core.setSecret.withArgs("xoxb-example").called);
      assert.ok(mocks.core.setSecret.withArgs("https://example.com").called);
    });

    it("errors when both the token and webhook is provided", () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      assert.throws(
        () => new Config(mocks.core),
        (err) => {
          assert.ok(err instanceof SlackError);
          assert.ok(
            err.message,
            "Invalid input! Either the token or webhook is required - not both.",
          );
          assert.ok(mocks.core.setSecret.withArgs("xoxb-example").called);
          assert.ok(
            mocks.core.setSecret.withArgs("https://example.com").called,
          );
          return true;
        },
      );
    });

    it("errors if the method is provided without a token", () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      assert.throws(() => new Config(mocks.core), {
        message:
          "Missing input! A token must be provided to use the method decided.",
        name: "SlackError",
      });
    });

    it("errors if neither the token or webhook is provided", () => {
      assert.throws(() => new Config(mocks.core), {
        message:
          "Missing input! Either a method or webhook is required to take action.",
        name: "SlackError",
      });
    });

    it("errors if a webhook is provided without the type", () => {
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      assert.throws(() => new Config(mocks.core), {
        message:
          "Missing input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
        name: "SlackError",
      });
    });

    it("errors if the webhook type does not match techniques", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://example.com");
      mocks.core.getInput.withArgs("webhook-type").returns("post");
      assert.throws(() => new Config(mocks.core), {
        message:
          "Invalid input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
        name: "SlackError",
      });
    });
  });

  describe("instrument", () => {
    const original = Object.getOwnPropertyDescriptor(webapi, "addAppMetadata");

    afterEach(() => {
      Object.defineProperty(webapi, "addAppMetadata", original);
    });

    it("adds metadata to webapi with package name and version", () => {
      const stub = sinon.stub();
      Object.defineProperty(webapi, "addAppMetadata", {
        value: stub,
        configurable: true,
      });
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      new Config(mocks.core);
      assert.ok(stub.calledOnce);
      const { name, version } = stub.firstCall.args[0];
      assert.equal(name, "@slack/slack-github-action");
      assert.ok(version);
    });

    it("adds metadata to webhook with package name and version", () => {
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.ok(
        config.axios.defaults.headers.common["User-Agent"].startsWith(
          "@slack:slack-github-action/",
        ),
      );
      assert.ok(
        config.axios.defaults.headers.common["User-Agent"].length >
          "@slack:slack-github-action/".length,
      );
    });
  });

  describe("mask", () => {
    it("treats the provided token as a secret", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      await assert.rejects(
        () => send(mocks.core),
        (_) => {
          assert.ok(mocks.core.setSecret.withArgs("xoxb-example").called);
          return true;
        },
      );
    });

    it("treats the provided webhook as a secret", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      await send(mocks.core);
      assert.ok(mocks.core.setSecret.withArgs("https://slack.com").called);
    });
  });

  describe("validate", () => {
    it('allow the "retries" option with lowercased space', async () => {
      mocks.axios.post.resolves("LGTM");
      mocks.core.getInput.withArgs("retries").returns(" rapid ");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");

      await send(mocks.core);
    });

    it("errors if an invalid retries option is provided", async () => {
      mocks.axios.post.resolves("LGTM");
      mocks.core.getInput.withArgs("retries").returns("FOREVER");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      await assert.rejects(() => send(mocks.core), {
        message: 'Invalid input! An unknown "retries" value was used: FOREVER',
        name: "SlackError",
      });
    });
  });
});
