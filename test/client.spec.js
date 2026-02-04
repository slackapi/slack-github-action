import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import webapi from "@slack/web-api";
import errors from "@slack/web-api/dist/errors.js";
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
        core: mocks.core,
        inputs: {
          token: "xoxb-example",
        },
      };
      try {
        await new Client().post(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("No API method was provided for use"));
        } else {
          assert.fail(err);
        }
      }
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
      mocks.inputs = {
        ...mocks.inputs,
        token: "xoxb-example-001",
      };
      try {
        await new Client().post(config);
        assert.fail("Failed to throw for missing input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("No token was provided to post with"));
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("api", async () => {
    it("uses arguments to send to a slack api method", async () => {
      const apis = mock.fn(() => Promise.resolve({ ok: true }));
      const constructorCalls = [];
      // Use a regular function as constructor since mock.fn() doesn't work with `new`
      mocks.webapi.WebClient = function (...args) {
        constructorCalls.push(args);
        this.apiCall = apis;
      };
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
      assert.equal(constructorCalls.length, 1);
      const [token, options] = constructorCalls[0];
      assert.equal(token, "xoxb-example-002");
      assert.deepEqual(options, {
        agent: undefined,
        allowAbsoluteUrls: false,
        logger: config.logger,
        retryConfig: webapi.retryPolicies.fiveRetriesInFiveMinutes,
        slackApiUrl: undefined,
      });
      assert.equal(apis.mock.callCount(), 1);
      const [method, args] = apis.mock.calls[0].arguments;
      assert.equal(method, "pins.add");
      assert.deepEqual(args, {
        channel: "CHANNELHERE",
        timestamp: "1234567890.000000",
      });
      assert.ok(
        mocks.core.setOutput.mock.calls.some(
          (c) => c.arguments[0] === "ok" && c.arguments[1] === true,
        ),
      );
    });

    it("uses arguments to send to a custom api method", async () => {
      const apis = mock.fn(() =>
        Promise.resolve({ done: true, response: "Infinite" }),
      );
      const constructorCalls = [];
      // Use a regular function as constructor since mock.fn() doesn't work with `new`
      mocks.webapi.WebClient = function (...args) {
        constructorCalls.push(args);
        this.apiCall = apis;
      };
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
      assert.equal(constructorCalls.length, 1);
      const [token, options] = constructorCalls[0];
      assert.equal(token, "ollamapassword");
      assert.deepEqual(options, {
        agent: undefined,
        allowAbsoluteUrls: false,
        logger: config.logger,
        retryConfig: webapi.retryPolicies.tenRetriesInAboutThirtyMinutes,
        slackApiUrl: "http://localhost:11434/api/",
      });
      assert.equal(apis.mock.callCount(), 1);
      const [method, args] = apis.mock.calls[0].arguments;
      assert.equal(method, "generate");
      assert.deepEqual(args, {
        model: "llama3.2",
        prompt: "How many sides does a circle have?",
        stream: false,
      });
      assert.ok(
        mocks.core.setOutput.mock.calls.some(
          (c) => c.arguments[0] === "ok" && c.arguments[1] === undefined,
        ),
      );
      assert.ok(
        mocks.core.setOutput.mock.calls.some(
          (c) =>
            c.arguments[0] === "response" &&
            c.arguments[1] ===
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
      const payload = JSON.stringify(args);
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload,
      };
      mocks.calls._resolvesWith = response;
      await send(mocks.core);
      assert.deepEqual(
        mocks.calls.mock.calls[0].arguments[0],
        "chat.postMessage",
      );
      assert.deepEqual(mocks.calls.mock.calls[0].arguments[1], args);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[0],
        "response",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify(response),
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[2].arguments[0],
        "channel_id",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[2].arguments[1],
        "C0123456789",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[3].arguments[0],
        "thread_ts",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[3].arguments[1],
        "1234567890.000001",
      );
      assert.equal(mocks.core.setOutput.mock.calls[4].arguments[0], "ts");
      assert.equal(
        mocks.core.setOutput.mock.calls[4].arguments[1],
        "1234567890.000002",
      );
      assert.equal(mocks.core.setOutput.mock.calls[5].arguments[0], "time");
      assert.equal(mocks.core.setOutput.mock.calls.length, 6);
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
      const payload = JSON.stringify(args);
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload,
      };
      mocks.calls._resolvesWith = response;
      await send(mocks.core);
      assert.deepEqual(
        mocks.calls.mock.calls[0].arguments[0],
        "chat.postMessage",
      );
      assert.deepEqual(mocks.calls.mock.calls[0].arguments[1], args);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[0],
        "response",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify(response),
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[2].arguments[0],
        "channel_id",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[2].arguments[1],
        "C0101010101",
      );
      assert.equal(mocks.core.setOutput.mock.calls[3].arguments[0], "time");
      assert.equal(mocks.core.setOutput.mock.calls.length, 4);
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
      const payload = JSON.stringify(args);
      mocks.inputs = {
        ...mocks.inputs,
        method: "files.uploadV2",
        token: "xoxp-example",
        payload,
      };
      mocks.calls._resolvesWith = response;
      await send(mocks.core);
      assert.deepEqual(mocks.calls.mock.calls[0].arguments[1], args);
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
      assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], true);
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[0],
        "response",
      );
      assert.equal(
        mocks.core.setOutput.mock.calls[1].arguments[1],
        JSON.stringify(response),
      );
      assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
      assert.equal(mocks.core.setOutput.mock.calls.length, 3);
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
      mocks.booleanInputs = {
        ...mocks.booleanInputs,
        errors: true,
      };
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: `"text": "hello"`,
      };
      mocks.calls._rejectsWith = errors.requestErrorWithOriginal(response, true);
      try {
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.ok(mocks.core.setFailed.mock.callCount() > 0);
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.deepEqual(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.calls.length, 3);
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
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: `"text": "hello"`,
      };
      mocks.calls._rejectsWith = errors.httpErrorFromResponse(response);
      try {
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.strictEqual(mocks.core.setFailed.mock.callCount(), 0);
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        response.body = response.data;
        response.data = undefined;
        assert.deepEqual(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.calls.length, 3);
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
      mocks.booleanInputs = {
        ...mocks.booleanInputs,
        errors: true,
      };
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: `"text": "hello"`,
      };
      mocks.calls._rejectsWith = errors.platformErrorFromResult(response);
      try {
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.ok(mocks.core.setFailed.mock.callCount() > 0);
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.deepEqual(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.calls.length, 3);
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
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: `"text": "hello"`,
      };
      mocks.calls._rejectsWith = errors.platformErrorFromResult(response);
      try {
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.strictEqual(mocks.core.setFailed.mock.callCount(), 0);
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.deepEqual(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.calls.length, 3);
      }
    });

    it("errors if rate limit responses are returned after retries", async () => {
      const response = {
        code: "slack_webapi_rate_limited_error",
        retryAfter: 12,
      };
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        token: "xoxb-example",
        payload: `"text": "hello"`,
      };
      mocks.calls._rejectsWith = errors.rateLimitedErrorWithDelay(12);
      try {
        await send(mocks.core);
        assert.fail("Expected an error but none was found");
      } catch (_err) {
        assert.strictEqual(mocks.core.setFailed.mock.callCount(), 0);
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[0], "ok");
        assert.equal(mocks.core.setOutput.mock.calls[0].arguments[1], false);
        assert.equal(
          mocks.core.setOutput.mock.calls[1].arguments[0],
          "response",
        );
        assert.deepEqual(
          mocks.core.setOutput.mock.calls[1].arguments[1],
          JSON.stringify(response),
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.calls.length, 3);
      }
    });
  });

  describe("proxies", () => {
    it("sets up the proxy agent for the provided https proxy", async () => {
      const proxy = "https://example.com";
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        proxy,
        token: "xoxb-example",
      };
      const config = new Config(mocks.core);
      const client = new Client();
      const { httpsAgent, proxy: proxying } = client.proxies(config);
      assert.deepEqual(httpsAgent.proxy, new URL(proxy));
      assert.notStrictEqual(proxying, false);
    });

    it("fails to configure proxies with an invalid proxied url", async () => {
      const proxy = "https://";
      mocks.inputs = {
        ...mocks.inputs,
        method: "chat.postMessage",
        proxy,
        token: "xoxb-example",
      };
      try {
        const config = new Config(mocks.core);
        const client = new Client();
        client.proxies(config);
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
