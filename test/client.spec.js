import { assert } from "chai";
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

  describe("failure", () => {
    /**
     * FIXME: this is calling the actual API to cause an invalid_auth error!
     *
     * It should be stubbing this or mocking something similar.
     *
     * @see {@link https://github.com/slackapi/slack-github-action/blob/5d1fb07d3c4f410b8d278134c714edff31264beb/test/web-client-test.js#L6-L17}
     */
    it("calls the method with the provided token and content", async () => {
      try {
        mocks.core.getInput.withArgs("method").returns("chat.postMessage");
        mocks.core.getInput.withArgs("token").returns("xoxb-example");
        mocks.core.getInput
          .withArgs("payload")
          .returns(`"text": "hello", "channel": "C0123456789"`);
        await send(mocks.core);
      } catch (error) {
        console.error(error);
      }
    });
  });
});
