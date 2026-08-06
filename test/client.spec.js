import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import webapi from "@slack/web-api";
import errors from "@slack/web-api/dist/errors.js";
import sinon from "sinon";
import Client from "../src/client.js";
import Config from "../src/config.js";
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
        core: mocks.core,
        inputs: {
          token: "xoxb-example",
        },
      };
      await assert.rejects(() => new Client().post(config), {
        message: "No API method was provided for use",
        name: "SlackError",
      });
    });

    it("requires a token is provided in inputs", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: mocks.core,
        inputs: {
          method: "chat.postMessage",
        },
      };
      mocks.core.getInput.withArgs("token").returns("xoxb-example-001");
      await assert.rejects(() => new Client().post(config), {
        message: "No token was provided to post with",
        name: "SlackError",
      });
    });
  });

  describe("api", () => {
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
        core: mocks.core,
        logger: new Logger(mocks.core).logger,
        inputs: {
          method: "pins.add",
          token: "xoxb-example-002",
        },
        webapi: mocks.webapi,
      };
      await new Client().post(config);
      assert.ok(constructors.calledWithNew());
      assert.ok(
        constructors.calledWith("xoxb-example-002", {
          agent: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.fiveRetriesInFiveMinutes,
          slackApiUrl: undefined,
        }),
      );
      assert.ok(apis.calledOnce);
      assert.ok(
        apis.calledWith("pins.add", {
          channel: "CHANNELHERE",
          timestamp: "1234567890.000000",
        }),
      );
      assert.ok(config.core.setOutput.calledWith("ok", true));
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
        core: mocks.core,
        logger: new Logger(mocks.core).logger,
        inputs: {
          api: "http://localhost:11434/api/",
          method: "generate",
          retries: "10",
          token: "ollamapassword",
        },
        webapi: mocks.webapi,
      };
      await new Client().post(config);
      assert.ok(constructors.calledWithNew());
      assert.ok(
        constructors.calledWith("ollamapassword", {
          agent: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.tenRetriesInAboutThirtyMinutes,
          slackApiUrl: "http://localhost:11434/api/",
        }),
      );
      assert.ok(apis.calledOnce);
      assert.ok(
        apis.calledWith("generate", {
          model: "llama3.2",
          prompt: "How many sides does a circle have?",
          stream: false,
        }),
      );
      assert.ok(config.core.setOutput.calledWith("ok", undefined));
      assert.ok(
        config.core.setOutput.calledWith(
          "response",
          JSON.stringify({ done: true, response: "Infinite" }),
        ),
      );
    });
  });

  describe("success", () => {
    it("calls 'chat.postMessage' with the given token and content", async () => {
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
    });

    it("calls 'conversations.create' with the given token and content", async () => {
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
    });

    it("calls 'files.uploadV2' with the provided token and content", async () => {
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
      mocks.core.getInput.reset();
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
      mocks.calls.rejects(errors.requestErrorWithOriginal(response, true));
      await assert.rejects(() => send(mocks.core));
      assert.ok(mocks.core.setFailed.called);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.deepEqual(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify(response),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.equal(mocks.core.setOutput.getCalls().length, 3);
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
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
      mocks.calls.rejects(errors.httpErrorFromResponse(response));
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.called, false);
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
      mocks.core.getInput.reset();
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
      mocks.calls.rejects(errors.platformErrorFromResult(response));
      await assert.rejects(() => send(mocks.core));
      assert.ok(mocks.core.setFailed.called);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.deepEqual(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify(response),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.equal(mocks.core.setOutput.getCalls().length, 3);
    });

    it("returns the api error and details without a exit failing", async () => {
      const response = {
        code: "slack_webapi_platform_error",
        data: {
          ok: false,
          error: "missing_channel",
        },
      };
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
      mocks.calls.rejects(errors.platformErrorFromResult(response));
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.called, false);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.deepEqual(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify(response),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.equal(mocks.core.setOutput.getCalls().length, 3);
    });

    it("errors if rate limit responses are returned after retries", async () => {
      const response = {
        code: "slack_webapi_rate_limited_error",
        retryAfter: 12,
      };
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      mocks.core.getInput.withArgs("payload").returns(`"text": "hello"`);
      mocks.calls.rejects(errors.rateLimitedErrorWithDelay(12));
      await send(mocks.core);
      assert.strictEqual(mocks.core.setFailed.called, false);
      assert.equal(mocks.core.setOutput.getCall(0).firstArg, "ok");
      assert.equal(mocks.core.setOutput.getCall(0).lastArg, false);
      assert.equal(mocks.core.setOutput.getCall(1).firstArg, "response");
      assert.deepEqual(
        mocks.core.setOutput.getCall(1).lastArg,
        JSON.stringify(response),
      );
      assert.equal(mocks.core.setOutput.getCall(2).firstArg, "time");
      assert.equal(mocks.core.setOutput.getCalls().length, 3);
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
      assert.notStrictEqual(proxying, false);
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("proxy").returns(proxy);
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      const client = new Client();
      assert.throws(() => client.proxies(config), {
        message: "Failed to configure the HTTPS proxy",
        name: "SlackError",
      });
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
