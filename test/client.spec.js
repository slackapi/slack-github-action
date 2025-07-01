import core from "@actions/core";
import webapi from "@slack/web-api";
import errors from "@slack/web-api/dist/errors.js";
import { assert } from "chai";
import sinon from "sinon";
import Client from "../src/client.js";
import Config from "../src/config.js";
import SlackError from "../src/errors.js";
import Logger from "../src/logger.js";
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
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "No API method was provided for use");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
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
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "No token was provided to post with");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });

  describe("api", async () => {
    it("uses arguments to send to a slack api method", async () => {
      const apis = sinon.stub().resolves({ ok: true });
      const constructors = sinon
        .stub(mocks.webapi, "WebClient")
        .returns({ apiCall: apis });
      /**
       * @type {Config}
       */
      const config = {
        content: {
          values: {
            channel: "CHANNELHERE",
            timestamp: "1234567890.000000",
          },
        },
        core: core,
        logger: new Logger(core).logger,
        inputs: {
          method: "pins.add",
          token: "xoxb-example-002",
        },
        webapi: mocks.webapi,
      };
      await new Client().post(config);
      assert.isTrue(constructors.calledWithNew());
      assert.isTrue(
        constructors.calledWith("xoxb-example-002", {
          agent: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.fiveRetriesInFiveMinutes,
          slackApiUrl: undefined,
        }),
      );
      assert.isTrue(apis.calledOnce);
      assert.isTrue(
        apis.calledWith("pins.add", {
          channel: "CHANNELHERE",
          timestamp: "1234567890.000000",
        }),
      );
      assert.isTrue(config.core.setOutput.calledWith("ok", true));
    });

    it("uses arguments to send to a custom api method", async () => {
      const apis = sinon.stub().resolves({ done: true, response: "Infinite" });
      const constructors = sinon
        .stub(mocks.webapi, "WebClient")
        .returns({ apiCall: apis });
      /**
       * @type {Config}
       */
      const config = {
        content: {
          values: {
            model: "llama3.2",
            prompt: "How many sides does a circle have?",
            stream: false,
          },
        },
        core: core,
        logger: new Logger(core).logger,
        inputs: {
          api: "http://localhost:11434/api/",
          method: "generate",
          retries: "10",
          token: "ollamapassword",
        },
        webapi: mocks.webapi,
      };
      await new Client().post(config);
      assert.isTrue(constructors.calledWithNew());
      assert.isTrue(
        constructors.calledWith("ollamapassword", {
          agent: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.tenRetriesInAboutThirtyMinutes,
          slackApiUrl: "http://localhost:11434/api/",
        }),
      );
      assert.isTrue(apis.calledOnce);
      assert.isTrue(
        apis.calledWith("generate", {
          model: "llama3.2",
          prompt: "How many sides does a circle have?",
          stream: false,
        }),
      );
      assert.isTrue(config.core.setOutput.calledWith("ok", undefined));
      assert.isTrue(
        config.core.setOutput.calledWith(
          "response",
          JSON.stringify({ done: true, response: "Infinite" }),
        ),
      );
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
        mocks.calls.resolves(response);
        await send(mocks.core);
        assert.deepEqual(mocks.calls.getCall(0).firstArg, "chat.postMessage");
        assert.deepEqual(mocks.calls.getCall(0).lastArg, args);
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
      } catch (err) {
        console.error(err);
        assert.fail("Unexpected error when calling the method");
      }
    });

    it("calls 'conversations.create' with the given token and content", async () => {
      try {
        const args = {
          name: "pull-request-review-010101",
        };
        const response = {
          ok: true,
          channel: {
            id: "C0101010101",
            name: "pull-request-review-010101",
            is_channel: true,
            created: 1730425428,
          },
        };
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(JSON.stringify(args));
        mocks.calls.resolves(response);
        await send(mocks.core);
        assert.deepEqual(mocks.calls.getCall(0).firstArg, "chat.postMessage");
        assert.deepEqual(mocks.calls.getCall(0).lastArg, args);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "channel_id");
        assert.equal(mocks.core.setOutput.getCall(2).lastArg, "C0101010101");
        assert.equal(mocks.core.setOutput.getCall(3).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 4);
      } catch (err) {
        console.error(err);
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
        mocks.calls.resolves(response);
        await send(mocks.core);
        assert.deepEqual(mocks.calls.getCall(0).lastArg, args);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, true);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        assert.equal(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 3);
      } catch (err) {
        console.error(err);
        assert.fail("Unexpected error when calling the method");
      }
    });
  });

  describe("failure", () => {
    it("errors when the request to the api cannot be sent correct", async () => {
      /**
       * @type {webapi.WebAPICallError}
       */
      const response = {
        code: "slack_webapi_request_error",
        data: {
          error: "unexpected_request_failure",
          message: "Something bad happened!",
        },
      };
      try {
        mocks.core.getInput.reset();
        mocks.core.getBooleanInput.withArgs("errors").returns(true);
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.calls.rejects(errors.requestErrorWithOriginal(response, true));
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
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

    it("errors when the http portion of the request fails to send", async () => {
      /**
       * @type {import("axios").AxiosResponse}
       */
      const response = {
        code: "slack_webapi_http_error",
        headers: {
          authorization: "none",
        },
        data: {
          ok: false,
          error: "unknown_http_method",
        },
      };
      try {
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.calls.rejects(errors.httpErrorFromResponse(response));
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.isFalse(mocks.core.setFailed.called);
        assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
        assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
        assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
        response.body = response.data;
        response.data = undefined;
        assert.deepEqual(
          mocks.core.setOutput.getCall(1).lastArg,
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
        assert.equal(mocks.core.setOutput.getCalls().length, 3);
      }
    });

    it("errors when the payload arguments are invalid for the api", async () => {
      /**
       * @type {webapi.WebAPICallError}
       */
      const response = {
        code: "slack_webapi_platform_error",
        data: {
          ok: false,
          error: "missing_channel",
        },
      };
      try {
        mocks.core.getInput.reset();
        mocks.core.getBooleanInput.withArgs("errors").returns(true);
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.calls.rejects(errors.platformErrorFromResult(response));
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
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
        code: "slack_webapi_platform_error",
        data: {
          ok: false,
          error: "missing_channel",
        },
      };
      try {
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.calls.rejects(errors.platformErrorFromResult(response));
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
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

    it("errors if rate limit responses are returned after retries", async () => {
      const response = {
        code: "slack_webapi_rate_limited_error",
        retryAfter: 12,
      };
      try {
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
        mocks.calls.rejects(errors.rateLimitedErrorWithDelay(12));
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
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
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(err.message, "Failed to configure the HTTPS proxy");
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
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

    it('attempts a "rapid " burst of "12" retries in seconds', async () => {
      const webhook = new Client();
      const result = webhook.retries("rapid ");
      assert.equal(
        result.retries,
        webapi.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(result.factor, webapi.retryPolicies.rapidRetryPolicy.factor);
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
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
