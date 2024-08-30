import path from "node:path";
import { assert } from "chai";
import Config from "./config.js";
import { mocks } from "./index.spec.js";
import send from "./send.js";

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
      mocks.core.getBooleanInput.withArgs("errors").returns(true);
      mocks.core.getInput.withArgs("method").returns("chat.postMessage");
      mocks.core.getInput.withArgs("payload").returns('"hello": "world"');
      mocks.core.getInput.withArgs("proxy").returns("https://example.com");
      mocks.core.getInput.withArgs("retries").returns("0");
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      const config = new Config(mocks.core);
      assert.equal(config.inputs.errors, true);
      assert.equal(config.inputs.method, "chat.postMessage");
      assert.equal(config.inputs.payload, '"hello": "world"');
      assert.equal(config.inputs.proxy, "https://example.com");
      assert.equal(config.inputs.retries, config.Retries.ZERO);
      assert.equal(config.inputs.token, "xoxb-example");
    });
  });

  describe("payload", () => {
    describe("success", () => {
      it("wraps incomplete payload in braces for valid JSON", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput.withArgs("payload").returns(`
        "message": "LGTM!",
        "channel": "C0123456789",
        "blocks": [
          {
            "type": "section",
            "text": {
              "text": "LGTM! :+1:"
            }
          }
        ]
      `);
        const config = new Config(mocks.core);
        const expected = {
          message: "LGTM!",
          channel: "C0123456789",
          blocks: [
            {
              type: "section",
              text: {
                text: "LGTM! :+1:",
              },
            },
          ],
        };
        assert.deepEqual(config.content, expected);
      });

      it("accepts and parses complete json as payload input", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput.withArgs("payload").returns(`{
          "message": "this is wrapped",
          "channel": "C0123456789"
        }
      `);
        const config = new Config(mocks.core);
        const expected = {
          message: "this is wrapped",
          channel: "C0123456789",
        };
        assert.deepEqual(config.content, expected);
      });

      it("parses JSON from a known file without replacements", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput
          .withArgs("payload-file-path")
          .returns("example.json");
        mocks.fs.readFileSync
          .withArgs(path.resolve("example.json"), "utf-8")
          .returns(`{
            "message": "drink water",
            "channel": "C6H12O6H2O2"
          }`);
        const config = new Config(mocks.core);
        const expected = {
          message: "drink water",
          channel: "C6H12O6H2O2",
        };
        assert.deepEqual(config.content, expected);
      });

      it("replaces templated variables in the payload file", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput
          .withArgs("payload-file-path")
          .returns("example.json");
        mocks.core.getBooleanInput
          .withArgs("payload-file-path-parsed")
          .returns(true);
        mocks.fs.readFileSync
          .withArgs(path.resolve("example.json"), "utf-8")
          .returns(`{
          "text": "running job #\${{ env.MOCK_JOB }} on: \${{ github.apiUrl }}"
        }`);
        process.env.MOCK_JOB = "12";
        const config = new Config(mocks.core);
        process.env.MOCK_JOB = undefined;
        const expected = {
          text: "running job #12 on: https://api.github.com",
        };
        assert.deepEqual(config.content, expected);
      });

      it("flattens nested payloads if a delimiter is provided", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput.withArgs("payload-delimiter").returns("_");
        mocks.core.getInput.withArgs("payload").returns(`
          "apples": "tree",
          "bananas": {
            "truthiness": true
          }
        `);
        const config = new Config(mocks.core);
        const expected = {
          apples: "tree",
          bananas_truthiness: "true",
        };
        assert.deepEqual(config.content, expected);
      });
    });

    describe("failure", () => {
      it("errors if both a payload and file path are provided", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput.withArgs("payload").returns(`"message"="hello"`);
        mocks.core.getInput
          .withArgs("payload-file-path")
          .returns("example.json");
        try {
          await send(mocks.core);
          assert.fail("Failed to throw for invalid input");
        } catch {
          assert.include(
            mocks.core.setFailed.lastCall.firstArg,
            "Invalid input! Just the payload or payload file path is required.",
          );
        }
      });

      it("fails if the provided input payload is invalid JSON", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput.withArgs("payload").returns("{");
        try {
          await send(mocks.core);
          assert.fail("Failed to throw for invalid JSON");
        } catch {
          assert.include(
            mocks.core.setFailed.lastCall.firstArg.toString(),
            "Invalid input! Failed to parse the JSON content of the payload",
          );
        }
      });

      it("fails to parse a file path that does not exist", async () => {
        mocks.core.getInput
          .withArgs("webhook")
          .returns("https://hooks.slack.com");
        mocks.core.getInput
          .withArgs("payload-file-path")
          .returns("unknown.json");
        try {
          await send(mocks.core);
          assert.fail("Failed to throw for nonexistent files");
        } catch {
          assert.include(
            mocks.core.setFailed.lastCall.firstArg.toString(),
            "Invalid input! Failed to parse the JSON content of the payload file",
          );
        }
      });
    });
  });

  describe("retries", () => {
    it("warns if an invalid retries option is provided", async () => {
      mocks.axios.post.returns(Promise.resolve("LGTM"));
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("retries").returns("FOREVER");
      await send(mocks.core);
      assert.isTrue(
        mocks.core.warning.calledWith(
          'Invalid input! An unknown "retries" value was used: FOREVER',
        ),
      );
    });
  });

  describe("secrets", async () => {
    it("treats the provided token as a secret", async () => {
      mocks.core.getInput.withArgs("token").returns("xoxb-example");
      try {
        await send(mocks.core);
      } catch {
        assert.isTrue(mocks.core.setSecret.withArgs("xoxb-example").called);
      }
    });

    it("treats the provided webhook as a secret", async () => {
      mocks.core.getInput.withArgs("webhook").returns("https://slack.com");
      try {
        await send(mocks.core);
      } catch {
        assert.isTrue(
          mocks.core.setSecret.withArgs("https://slack.com").called,
        );
      }
    });
  });
});
