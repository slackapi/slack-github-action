import core from "@actions/core";
import webapi from "@slack/web-api";
import { assert } from "chai";
import Client from "../src/client.js";
import Config from "../src/config.js";
import send from "../src/send.js";
import { mocks } from "./index.spec.js";

describe("client", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("inputs", () => {
    it("requires a method is provided in inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {
          token: "xoxb-example",
        },
      };
      try {
        await new Client().post(config);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "No API method was provided for use",
        );
      }
    });

    it("requires a token is provided in inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {
          method: "chat.postMessage",
        },
      };
      mocks.core.getInput.withArgs("token").returns("xoxb-example-001");
      try {
        await new Client().post(config);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "No token was provided to post with",
        );
      }
    });
  });

  describe("success", () => {
    it("calls 'chat.postMessage' with the given token and content", async () => {
      try {
        const args = {
          channel: "C0123456789",
          text: "hello",
          thread_ts: "1234567890.000001",
        };
        const response = {
          ok: true,
          channel: "C0123456789",
          ts: "1234567890.000002",
          message: {
            thread_ts: "1234567890.000001",
          },
        };
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(JSON.stringify(args));
        mocks.api.resolves(response);
        await send(mocks.core);
        assert.deepEqual(mocks.api.getCall(0).firstArg, "chat.postMessage");
        assert.deepEqual(mocks.api.getCall(0).lastArg, args);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "channel_id");
        assert.equal(mocks.core.setOutput.getCall(2).lastArg, "C0123456789");
        assert.equal(mocks.core.setOutput.getCall(3).firstArg, "thread_ts");
        assert.equal(
          mocks.core.setOutput.getCall(3).lastArg,
          "1234567890.000001",
        );
        assert.equal(mocks.core.setOutput.getCall(4).firstArg, "ts");
        assert.equal(
          mocks.core.setOutput.getCall(4).lastArg,
          "1234567890.000002",
        );
        assert.equal(mocks.core.setOutput.getCall(5).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 6);
      } catch (error) {
        console.error(error);
        assert.fail("Unexpected error when calling the method");
      }
    });

    it("calls 'files.uploadV2' with the provided token and content", async () => {
      try {
        const args = {
          channel: "C0000000001",
          initial_comment: "the results are in!",
          file: "results.out",
          filename: "results-888888.out",
        };
        const response = {
          ok: true,
          files: [{ id: "F0000000001", created: 1234567890 }],
        };
        mocks.core.getInput.withArgs("method").returns("files.uploadV2");
        mocks.core.getInput.withArgs("token").returns("xoxp-example");
        mocks.core.getInput.withArgs("payload").returns(JSON.stringify(args));
        mocks.api.resolves(response);
        await send(mocks.core);
        assert.deepEqual(mocks.api.getCall(0).lastArg, args);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 3);
      } catch (error) {
        console.error(error);
        assert.fail("Unexpected error when calling the method");
      }
    });
  });

  describe("failure", () => {
    it("errors when the payload arguments are invalid for the api", async () => {
      const response = {
        ok: false,
        error: "missing_channel",
      };
      try {
        mocks.core.getInput.reset();
        mocks.core.getBooleanInput.withArgs("errors").returns(true);
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.api.resolves(response);
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (error) {
        assert.isTrue(mocks.core.setFailed.called);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.deepEqual(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 3);
      }
    });

    it("returns the api error and details without a exit failing", async () => {
      const response = {
        ok: false,
        error: "missing_channel",
      };
      try {
        mocks.core.getInput.reset();
        mocks.core.getBooleanInput.withArgs("errors").returns(false);
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.api.resolves(response);
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (error) {
        assert.isFalse(mocks.core.setFailed.called);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.deepEqual(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 3);
      }
    });
  });

  describe("proxies", () => {
    it("sets up the proxy agent for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      const client = new Client();
      const { httpsAgent, proxy: proxying } = client.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.isNotFalse(proxying);
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      try {
        const config = new Config(mocks.core);
        const client = new Client();
        client.proxies(config);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch {
        assert.include(
          mocks.core.warning.lastCall.firstArg,
          "Failed to configure the HTTPS proxy agent so using default configurations.",
        );
      }
    });
  });

  describe("retries", () => {
    it("uses a default of five retries in requests", async () => {
      const client = new Client();
      const result = client.retries();
      assert.equal(
        result.retries,
        webapi.retryPolicies.fiveRetriesInFiveMinutes.retries,
      );
    });

    it('does not attempt retries when "0" is set', async () => {
      const webhook = new Client();
      const result = webhook.retries("0");
      assert.equal(result.retries, 0);
    });

    it('attempts a default amount of "5" retries', async () => {
      const webhook = new Client();
      const result = webhook.retries("5");
      assert.equal(
        result.retries,
        webapi.retryPolicies.fiveRetriesInFiveMinutes.retries,
      );
      assert.equal(
        result.factor,
        webapi.retryPolicies.fiveRetriesInFiveMinutes.factor,
      );
    });

    it('attempts "10" retries in around "30" minutes', async () => {
      const webhook = new Client();
      const result = webhook.retries("10");
      assert.equal(
        result.retries,
        webapi.retryPolicies.tenRetriesInAboutThirtyMinutes.retries,
      );
      assert.equal(
        result.factor,
        webapi.retryPolicies.tenRetriesInAboutThirtyMinutes.factor,
      );
    });

    it('attempts a "rapid" burst of "12" retries in seconds', async () => {
      const webhook = new Client();
      const result = webhook.retries("RAPID");
      assert.equal(
        result.retries,
        webapi.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(result.factor, webapi.retryPolicies.rapidRetryPolicy.factor);
    });
  });
});
