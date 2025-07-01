import path from "node:path";
import core from "@actions/core";
import { assert } from "chai";
import { YAMLException } from "js-yaml";
import Config from "../src/config.js";
import Content from "../src/content.js";
import SlackError from "../src/errors.js";
import send from "../src/send.js";
import { mocks } from "./index.spec.js";

/**
 * Confirm values from the action input or environment variables are gathered
 */
describe("content", () => {
  beforeEach(() => {
    mocks.reset();
    mocks.core.getInput.withArgs("method").returns("chat.postMessage");
    mocks.core.getInput.withArgs("token").returns("xoxb-example");
  });

  describe("flatten", () => {
    it("flattens nested payloads provided with delimiter", async () => {
      mocks.core.getInput.withArgs("payload").returns(`
        "apples": "tree",
        "bananas": {
          "truthiness": true
        }
      `);
      mocks.core.getInput.withArgs("payload-delimiter").returns("_");
      const config = new Config(mocks.core);
      const expected = {
        apples: "tree",
        bananas_truthiness: "true",
      };
      assert.deepEqual(config.content.values, expected);
    });
  });

  describe("get", () => {
    it("errors if both a payload and file path are provided", async () => {
      mocks.core.getInput.withArgs("payload").returns(`"message"="hello"`);
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for invalid input");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Just the payload or payload file path is required.",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });

  describe("payload", async () => {
    it("parses complete YAML from the input payload", async () => {
      mocks.core.getInput.withArgs("payload").returns(`
          message: "this is wrapped"
          channel: "C0123456789"
      `);
      const config = new Config(mocks.core);
      const expected = {
        message: "this is wrapped",
        channel: "C0123456789",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("parses complete JSON from the input payload", async () => {
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

    it("templatizes variables requires configuration", async () => {
      mocks.core.getInput.withArgs("payload").returns(`{
          "message": "this matches an existing variable: \${{ github.apiUrl }}",
          "channel": "C0123456789"
        }
      `);
      const config = new Config(mocks.core);
      // biome-ignore-start lint/suspicious/noTemplateCurlyInString: GitHub Action YAML variable syntax
      const expected = {
        message: "this matches an existing variable: ${{ github.apiUrl }}",
        channel: "C0123456789",
      };
      // biome-ignore-end lint/suspicious/noTemplateCurlyInString: https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#using-contexts-to-access-variable-values
      assert.deepEqual(config.content.values, expected);
    });

    it("templatizes variables with matching variables", async () => {
      mocks.core.getInput.withArgs("payload").returns(`
          channel: C0123456789
          reply_broadcast: false
          message: Served \${{ env.NUMBER }} items
          blocks:
            - type: section
              text:
                type: mrkdwn
                text: "Served \${{ env.NUMBER }} items on: \${{ env.DETAILS }}"
            - type: divider
            - type: section
              block_id: selector
              text:
                type: mrkdwn
                text: Send feedback
              accessory:
                action_id: response
                type: multi_static_select
                placeholder:
                  type: plain_text
                  text: Select URL
                options:
                - text:
                    type: plain_text
                    text: "\${{ github.apiUrl }}"
                  value: api
                - text:
                    type: plain_text
                    text: "\${{ github.serverUrl }}"
                  value: server
                - text:
                    type: plain_text
                    text: "\${{ github.graphqlUrl }}"
                  value: graphql
        `);
      mocks.core.getBooleanInput.withArgs("payload-templated").returns(true);
      process.env.DETAILS = `
-fri
-sat
-sun`;
      process.env.NUMBER = 12;
      const config = new Config(mocks.core);
      process.env.DETAILS = undefined;
      process.env.NUMBER = undefined;
      const expected = {
        channel: "C0123456789",
        reply_broadcast: false,
        message: "Served 12 items",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Served 12 items on: \n-fri\n-sat\n-sun",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            block_id: "selector",
            text: {
              type: "mrkdwn",
              text: "Send feedback",
            },
            accessory: {
              action_id: "response",
              type: "multi_static_select",
              placeholder: {
                type: "plain_text",
                text: "Select URL",
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "https://api.github.com",
                  },
                  value: "api",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "https://github.com",
                  },
                  value: "server",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "https://api.github.com/graphql",
                  },
                  value: "graphql",
                },
              ],
            },
          },
        ],
      };
      assert.deepEqual(config.content.values, expected);
    });

    /**
     * @see {@link https://github.com/slackapi/slack-github-action/issues/203}
     */
    it("templatizes variables with missing variables", async () => {
      // biome-ignore-start lint/suspicious/noTemplateCurlyInString: GitHub Action YAML variable syntax
      mocks.core.getInput
        .withArgs("payload")
        .returns("message: What makes ${{ env.TREASURE }} a secret");
      // biome-ignore-end lint/suspicious/noTemplateCurlyInString: https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#using-contexts-to-access-variable-values
      mocks.core.getBooleanInput.withArgs("payload-templated").returns(true);
      const config = new Config(mocks.core);
      const expected = {
        message: "What makes ??? a secret",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("trims last comma JSON with the input payload", async () => {
      mocks.core.getInput.withArgs("payload").returns(`
        "message": "LGTM!",
        "channel": "C0123456789",
      `);
      const config = new Config(mocks.core);
      const expected = {
        message: "LGTM!",
        channel: "C0123456789",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("wraps incomplete JSON from the input payload", async () => {
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

    it("fails if no payload content is provided in input", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {
          payloadFilePath: "unknown.json",
        },
      };
      try {
        new Content().getContentPayload(config);
        assert.fail("Failed to throw for missing payload content");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! No payload content was provided",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails if invalid JSON exists in the input payload", async () => {
      mocks.core.getInput.withArgs("payload").returns("{");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for invalid JSON");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Failed to parse contents of the provided payload",
          );
          assert.isDefined(err.cause?.values);
          assert.equal(err.cause.values.length, 2);
          const [jsonError, yamlError] = err.cause.values;
          assert.isTrue(jsonError instanceof SyntaxError);
          assert.isTrue(yamlError instanceof YAMLException);
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });

  describe("payload file", async () => {
    it("parses complete YAML from the input payload file", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.yaml");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.yaml"), "utf-8")
        .returns(`
            message: "drink water"
            channel: "C6H12O6H2O2"
          `);
      const config = new Config(mocks.core);
      const expected = {
        message: "drink water",
        channel: "C6H12O6H2O2",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("parses complete YML from the input payload file", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.yml");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.yml"), "utf-8")
        .returns(`
            message: "drink coffee"
            channel: "C0FFEEEEEEEE"
          `);
      const config = new Config(mocks.core);
      const expected = {
        message: "drink coffee",
        channel: "C0FFEEEEEEEE",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("parses complete JSON from the input payload file", async () => {
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

    it("templatizes variables requires configuration", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.json"), "utf-8")
        .returns(`{
          "message": "this matches an existing variable: \${{ github.apiUrl }}",
          "channel": "C0123456789"
        }
      `);
      const config = new Config(mocks.core);
      // biome-ignore-start lint/suspicious/noTemplateCurlyInString: GitHub Action YAML variable syntax
      const expected = {
        message: "this matches an existing variable: ${{ github.apiUrl }}",
        channel: "C0123456789",
      };
      // biome-ignore-end lint/suspicious/noTemplateCurlyInString: https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#using-contexts-to-access-variable-values
      assert.deepEqual(config.content.values, expected);
    });

    it("templatizes variables with matching variables", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.json"), "utf-8")
        .returns(`{
            "channel": "C0123456789",
            "reply_broadcast": false,
            "message": "Served \${{ env.NUMBER }} items",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "Served \${{ env.NUMBER }} items on: \${{ env.DETAILS }}"
                }
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "block_id": "selector",
                "text": {
                  "type": "mrkdwn",
                  "text": "Send feedback"
                },
                "accessory": {
                  "action_id": "response",
                  "type": "multi_static_select",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select URL"
                  },
                  "options": [
                    {
                      "text": {
                        "type": "plain_text",
                        "text": "\${{ github.apiUrl }}"
                      },
                      "value": "api"
                    },
                    {
                      "text": {
                        "type": "plain_text",
                        "text": "\${{ github.serverUrl }}"
                      },
                      "value": "server"
                    },
                    {
                      "text": {
                        "type": "plain_text",
                        "text": "\${{ github.graphqlUrl }}"
                      },
                      "value": "graphql"
                    }
                  ]
                }
              }
            ]
          }`);
      mocks.core.getBooleanInput.withArgs("payload-templated").returns(true);
      process.env.DETAILS = `
-fri
-sat
-sun`;
      process.env.NUMBER = 12;
      const config = new Config(mocks.core);
      process.env.DETAILS = undefined;
      process.env.NUMBER = undefined;
      const expected = {
        channel: "C0123456789",
        reply_broadcast: false,
        message: "Served 12 items",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Served 12 items on: \n-fri\n-sat\n-sun",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            block_id: "selector",
            text: {
              type: "mrkdwn",
              text: "Send feedback",
            },
            accessory: {
              action_id: "response",
              type: "multi_static_select",
              placeholder: {
                type: "plain_text",
                text: "Select URL",
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "https://api.github.com",
                  },
                  value: "api",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "https://github.com",
                  },
                  value: "server",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "https://api.github.com/graphql",
                  },
                  value: "graphql",
                },
              ],
            },
          },
        ],
      };
      assert.deepEqual(config.content.values, expected);
    });

    /**
     * @see {@link https://github.com/slackapi/slack-github-action/issues/203}
     */
    it("templatizes variables with missing variables", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.json"), "utf-8")
        .returns(`{
            "message": "What makes $\{\{ env.TREASURE }} a secret"
          }`);
      mocks.core.getBooleanInput.withArgs("payload-templated").returns(true);
      const config = new Config(mocks.core);
      const expected = {
        message: "What makes ??? a secret",
      };
      assert.deepEqual(config.content.values, expected);
    });

    it("fails if no payload file is provided in the input", async () => {
      /**
       * @type {Config}
       */
      const config = {
        core: core,
        inputs: {
          payload: "LGTM",
        },
      };
      try {
        new Content().getContentPayloadFilePath(config);
        assert.fail("Failed to throw for the wrong payload type");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! No payload found for content",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails to parse a file path that does not exist", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("unknown.json");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for nonexistent files");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Failed to parse contents of the provided payload file",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails to parse a file with an unknown extension", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("unknown.md");
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for an unknown extension");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Failed to parse contents of the provided payload file",
          );
          assert.isDefined(err.cause?.values);
          assert.equal(err.cause.values.length, 1);
          assert.include(
            err.cause.values[0].message,
            "Invalid input! Failed to parse file extension unknown.md",
          );
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails if invalid JSON exists in the input payload", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.json");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.json"), "utf-8")
        .returns(`{
            "message": "a truncated file without an end`);
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for invalid JSON");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Failed to parse contents of the provided payload file",
          );
          assert.isDefined(err.cause?.values);
          assert.equal(err.cause.values.length, 1);
          assert.isTrue(err.cause.values[0] instanceof SyntaxError);
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });

    it("fails if invalid YAML exists in the input payload", async () => {
      mocks.core.getInput.withArgs("payload-file-path").returns("example.yaml");
      mocks.fs.readFileSync
        .withArgs(path.resolve("example.yaml"), "utf-8")
        .returns(`- "message": "assigned": "values"`);
      try {
        await send(mocks.core);
        assert.fail("Failed to throw for invalid YAML");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.include(
            err.message,
            "Invalid input! Failed to parse contents of the provided payload file",
          );
          assert.isDefined(err.cause?.values);
          assert.equal(err.cause.values.length, 1);
          assert.isTrue(err.cause.values[0] instanceof YAMLException);
        } else {
          assert.fail("Failed to throw a SlackError", err);
        }
      }
    });
  });
});
