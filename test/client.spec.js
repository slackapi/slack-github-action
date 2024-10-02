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
    it("requires a token is provided in inputs", async () => {
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Missing input! Either a token or webhook is required to take action.",
        );
      }
    });

    it("requires a method is provided in inputs", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example-001");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for missing input");
      } catch {
        assert.include(
          mocks.core.setFailed.lastCall.firstArg,
          "Missing input! A method must be decided to use the token provided.",
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
});
