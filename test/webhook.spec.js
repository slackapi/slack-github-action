import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
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
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      mocks.fetch.resolves(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      try {
        await send(mocks.core);
        assert.equal(mocks.fetch.getCalls().length, 1);
        const [url, init] = mocks.fetch.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(JSON.parse(init.body), { drinks: "coffee" });
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify({ ok: true }),
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });

    it("sends the parsed payload to the provided incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("text: greetings");
      mocks.fetch.resolves(new Response("ok", { status: 200 }));
      try {
        await send(mocks.core);
        assert.equal(mocks.fetch.getCalls().length, 1);
        const [url, init] = mocks.fetch.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(JSON.parse(init.body), { text: "greetings" });
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(mocks.core.setOutput.getCall(1).lastArg, "ok");
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });

    it("includes the user agent header in requests", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("text: hello");
      mocks.fetch.resolves(new Response("ok", { status: 200 }));
      await send(mocks.core);
      const [, init] = mocks.fetch.getCall(0).args;
      const headers = new Headers(init.headers);
      const ua = headers.get("User-Agent");
      assert.ok(ua.includes("@slack:slack-github-action/"));
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
        userAgent: "",
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

    it("returns the failures from a webhook trigger", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      mocks.fetch.rejects(new Error("Request failed with status code 400"));
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Request failed with status code 400"),
          );
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.fetch.getCalls().length, 1);
      const [url, init] = mocks.fetch.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(JSON.parse(init.body), { drinks: "coffee" });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });

    it("returns the failures from an incoming webhook", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("payload").returns("textt: oops");
      mocks.fetch.rejects(new Error("Request failed with status code 400"));
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Request failed with status code 400"),
          );
        } else {
          assert.fail(err);
        }
      }
      assert.equal(mocks.fetch.getCalls().length, 1);
      const [url, init] = mocks.fetch.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(JSON.parse(init.body), { textt: "oops" });
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });
  });

  describe("proxies", () => {
    it("returns no dispatcher when proxy is not configured", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const dispatcher = webhook.proxyDispatcher(config);
      assert.strictEqual(dispatcher, undefined);
    });

    it("skips proxying an http webhook url altogether", async () => {
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const dispatcher = webhook.proxyDispatcher(config);
      assert.strictEqual(dispatcher, undefined);
    });

    it("returns a proxy dispatcher for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const dispatcher = webhook.proxyDispatcher(config);
      assert.ok(dispatcher);
    });

    it("returns a proxy dispatcher for http proxies", async () => {
      const proxy = "http://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const dispatcher = webhook.proxyDispatcher(config);
      assert.ok(dispatcher);
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxyDispatcher(config);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("fails to configure proxies with an unknown url protocol", async () => {
      const proxy = "ssh://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxyDispatcher(config);
        assert.fail("An unknown URL protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });
});
