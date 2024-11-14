import core from "@actions/core";
import { AxiosError } from "axios";
import { assert } from "chai";
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
      mocks.axios.post.returns(
        Promise.resolve({ status: 200, data: { ok: true } }),
      );
      try {
        await send(mocks.core);
        assert.equal(mocks.axios.post.getCalls().length, 1);
        const [url, payload, options] = mocks.axios.post.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(payload, { drinks: "coffee" });
        assert.deepEqual(options, {});
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
      mocks.axios.post.returns(Promise.resolve({ status: 200, data: "ok" }));
      try {
        await send(mocks.core);
        assert.equal(mocks.axios.post.getCalls().length, 1);
        const [url, payload, options] = mocks.axios.post.getCall(0).args;
        assert.equal(url, "https://hooks.slack.com");
        assert.deepEqual(payload, { text: "greetings" });
        assert.deepEqual(options, {});
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify("ok"),
        );
      } catch (err) {
        console.error(err);
        assert.fail("Failed to send the webhook");
      }
    });
  });

  describe("failure", () => {
    it("requires that a webhook is provided in inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {},
      };
      try {
        await new Webhook().post(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "No webhook was provided to post to");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("returns the failures from a webhook trigger", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns("drinks: coffee");
      const response = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {},
        {},
        { status: 400 },
      );
      mocks.axios.post.resolves(Promise.reject(response));
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "Request failed with status code 400");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
      assert.equal(mocks.axios.post.getCalls().length, 1);
      const [url, payload, options] = mocks.axios.post.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(payload, { drinks: "coffee" });
      assert.deepEqual(options, {});
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
      const response = new AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        {},
        {},
        { status: 400 },
      );
      mocks.axios.post.resolves(Promise.reject(response));
      try {
        await send(mocks.core);
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "Request failed with status code 400");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
      assert.equal(mocks.axios.post.getCalls().length, 1);
      const [url, payload, options] = mocks.axios.post.getCall(0).args;
      assert.equal(url, "https://hooks.slack.com");
      assert.deepEqual(payload, { textt: "oops" });
      assert.deepEqual(options, {});
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
    });
  });

  describe("proxies", () => {
    it("requires a webhook is included in the inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {},
      };
      try {
        new Webhook().proxies(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "No webhook was provided to proxy to");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("skips proxying an http webhook url altogether", async () => {
      mocks.core.getInput.withArgs("webhook").returns("http://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const request = webhook.proxies(config);
      assert.isUndefined(request);
    });

    it("sets up the proxy agent for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const { httpsAgent, proxy: proxying } = webhook.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.isNotFalse(proxying);
    });

    it("sets up the agent without proxy for http proxies", async () => {
      const proxy = "http://example.com";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      const config = new Config(mocks.core);
      const webhook = new Webhook();
      const { httpsAgent, proxy: proxying } = webhook.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.isFalse(proxying);
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
        webhook.proxies(config);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "Failed to configure the HTTPS proxy");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails to configure proxies with an unknown url protocol", async () => {
      const proxy = "ssh://";
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      try {
        const config = new Config(mocks.core);
        const webhook = new Webhook();
        webhook.proxies(config);
        assert.fail("An unknown URL protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "Failed to configure the HTTPS proxy");
          assert.include(err.cause.message, "Unsupported URL protocol");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });

  describe("retries", () => {
    it("uses a default of five retries in requests", async () => {
      const webhook = new Webhook();
      const result = webhook.retries();
      assert.equal(result.retries, 5);
    });

    it('does not attempt retries when "0" is set', async () => {
      const webhook = new Webhook();
      const result = webhook.retries("0");
      assert.equal(result.retries, 0);
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

    it('attempts a " rapid" burst of "12" retries in seconds', async () => {
      const webhook = new Webhook();
      const result = webhook.retries(" rapid");
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

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
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
