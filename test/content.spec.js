import path from "node:path";
import { assert } from "chai";
import Config from "../src/config.js";
import send from "../src/send.js";
import { mocks } from "./index.spec.js";

/**
 * Confirm values from the action input or environment variables are gathered
 */
describe("content", () => {
  afterEach(() => {
    mocks.reset();
  });

  describe("success", () => {
    it("wraps incomplete payload in braces for valid JSON", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
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
      assert.deepEqual(config.content.values, expected);
    });

    it("accepts and parses complete json as payload input", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
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
      assert.deepEqual(config.content.values, expected);
    });

    it("parses JSON from a known file without replacements", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
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
      assert.deepEqual(config.content.values, expected);
    });

    it("replaces templated variables in the payload file", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      mocks.core.getBooleanInput.withArgs("payload-templated").returns(true);
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
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
      assert.deepEqual(config.content.values, expected);
    });

    it("flattens nested payloads if a delimiter is provided", async () => {
      mocks.core.getInput.withArgs("payload-delimiter").returns("_");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
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
      assert.deepEqual(config.content.values, expected);
    });
  });

  describe("failure", () => {
    it("errors if both a payload and file path are provided", async () => {
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
      mocks.core.getInput.withArgs("payload").returns(`"message"="hello"`);
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
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
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
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
      mocks.core.getInput.withArgs("payload-file-path").returns("unknown.json");
      mocks.core.getInput
        .withArgs("webhook")
        .returns("https://hooks.slack.com");
      mocks.core.getInput.withArgs("webhook-type").returns("webhook-trigger");
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
