import assert from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import webapi from "@slack/web-api";
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
      mocks.inputs.set("token", "xoxb-example-001");
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
      const apis = mock.fn(async () => ({ ok: true }));
      const constructors = mock.method(mocks.webapi, "WebClient", function () {
        this.apiCall = apis;
      });
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
      assert.ok(constructors.mock.calls[0].target);
      assert.deepEqual(constructors.mock.calls[0].arguments, [
        "xoxb-example-002",
        {
          fetch: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.fiveRetriesInFiveMinutes,
          slackApiUrl: undefined,
        },
      ]);
      assert.equal(apis.mock.callCount(), 1);
      assert.deepEqual(apis.mock.calls[0].arguments, [
        "pins.add",
        {
          channel: "CHANNELHERE",
          timestamp: "1234567890.000000",
        },
      ]);
      assert.deepEqual(config.core.setOutput.mock.calls[0].arguments, [
        "ok",
        true,
      ]);
    });

    it("uses arguments to send to a custom api method", async () => {
      const apis = mock.fn(async () => ({ done: true, response: "Infinite" }));
      const constructors = mock.method(mocks.webapi, "WebClient", function () {
        this.apiCall = apis;
      });
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
      assert.ok(constructors.mock.calls[0].target);
      assert.deepEqual(constructors.mock.calls[0].arguments, [
        "ollamapassword",
        {
          fetch: undefined,
          allowAbsoluteUrls: false,
          logger: config.logger,
          retryConfig: webapi.retryPolicies.tenRetriesInAboutThirtyMinutes,
          slackApiUrl: "http://localhost:11434/api/",
        },
      ]);
      assert.equal(apis.mock.callCount(), 1);
      assert.deepEqual(apis.mock.calls[0].arguments, [
        "generate",
        {
          model: "llama3.2",
          prompt: "How many sides does a circle have?",
          stream: false,
        },
      ]);
      assert.deepEqual(config.core.setOutput.mock.calls[0].arguments, [
        "ok",
        undefined,
      ]);
      assert.deepEqual(config.core.setOutput.mock.calls[1].arguments, [
        "response",
        JSON.stringify({ done: true, response: "Infinite" }),
      ]);
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
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", JSON.stringify(args));
        mocks.calls.mock.mockImplementation(async () => response);
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 6);
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
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", JSON.stringify(args));
        mocks.calls.mock.mockImplementation(async () => response);
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 4);
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
        mocks.inputs.set("method", "files.uploadV2");
        mocks.inputs.set("token", "xoxp-example");
        mocks.inputs.set("payload", JSON.stringify(args));
        mocks.calls.mock.mockImplementation(async () => response);
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
      } catch (err) {
        console.error(err);
        assert.fail("Unexpected error when calling the method");
      }
    });
  });

  describe("failure", () => {
    it("errors when the request to the api cannot be sent correct", async () => {
      const response = new Error("Something bad happened!");
      try {
        mocks.inputs.clear();
        mocks.booleanInputs.set("errors", true);
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", `"text": "hello"`);
        mocks.calls.mock.mockImplementation(async () => {
          throw new webapi.WebAPIRequestError(response);
        });
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
      }
    });

    it("errors when the http portion of the request fails to send", async () => {
      const response = new webapi.WebAPIHTTPError(
        500,
        "Internal Server Error",
        {
          authorization: "none",
        },
        { ok: false, error: "unknown_http_method" },
      );
      try {
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", `"text": "hello"`);
        mocks.calls.mock.mockImplementation(async () => {
          throw response;
        });
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
        assert.equal(
          JSON.parse(mocks.core.setOutput.mock.calls[1].arguments[1])
            .statusCode,
          500,
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
      }
    });

    it("errors when the payload arguments are invalid for the api", async () => {
      const response = { ok: false, error: "missing_channel" };
      try {
        mocks.inputs.clear();
        mocks.booleanInputs.set("errors", true);
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", `"text": "hello"`);
        mocks.calls.mock.mockImplementation(async () => {
          throw new webapi.WebAPIPlatformError(response);
        });
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
      }
    });

    it("returns the api error and details without a exit failing", async () => {
      const response = { ok: false, error: "missing_channel" };
      try {
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", `"text": "hello"`);
        mocks.calls.mock.mockImplementation(async () => {
          throw new webapi.WebAPIPlatformError(response);
        });
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
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
      }
    });

    it("errors if rate limit responses are returned after retries", async () => {
      try {
        mocks.inputs.set("method", "chat.postMessage");
        mocks.inputs.set("token", "xoxb-example");
        mocks.inputs.set("payload", `"text": "hello"`);
        mocks.calls.mock.mockImplementation(async () => {
          throw new webapi.WebAPIRateLimitedError(12);
        });
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
        assert.equal(
          JSON.parse(mocks.core.setOutput.mock.calls[1].arguments[1])
            .retryAfter,
          12,
        );
        assert.equal(mocks.core.setOutput.mock.calls[2].arguments[0], "time");
        assert.equal(mocks.core.setOutput.mock.callCount(), 3);
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
      const client = new Client();
      const result = client.retries("0");
      assert.equal(result.retries, 0);
    });

    it('attempts a default amount of "5" retries', async () => {
      const client = new Client();
      const result = client.retries("5");
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
      const client = new Client();
      const result = client.retries("10");
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
      const client = new Client();
      const result = client.retries("rapid ");
      assert.equal(
        result.retries,
        webapi.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(result.factor, webapi.retryPolicies.rapidRetryPolicy.factor);
    });

    it('attempts a "RAPID" burst of "12" retries in seconds', async () => {
      const client = new Client();
      const result = client.retries("RAPID");
      assert.equal(
        result.retries,
        webapi.retryPolicies.rapidRetryPolicy.retries,
      );
      assert.equal(result.factor, webapi.retryPolicies.rapidRetryPolicy.factor);
    });
  });
});
