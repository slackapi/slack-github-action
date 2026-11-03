import fs from "node:fs";
import { mock } from "node:test";
import webapi from "@slack/web-api";
import webhook from "@slack/webhook";

/**
 * Hello experimenter! These tests are here to confirm that the happy paths keep
 * working and error cases are thrown.
 *
 * Tests are grouped with related related code using a file *.spec.js extension.
 * These test related functionalities of units but a full suite of integration
 * tests confirm correctness of the actual workflows in .github/workflows/*.yml.
 *
 * Actual tests begin in send.spec.js which has integration tests. Other modules
 * test the edges of this action.
 */

/**
 * The Mock class sets expected behaviors and test listeners for dependencies.
 */
export class Mock {
  /**
   * Setup stubbed dependencies and configure default input arguments for all
   * tests.
   *
   * @see {@link ../action.yml}
   */
  constructor() {
    this.reset();
  }

  /**
   * Testing interface that restores existing mocks and replaces these with new
   * mocks without internal state.
   *
   * Values returned from inputs and files are matched to the arguments of the
   * call using the "inputs", "booleanInputs", and "files" maps.
   */
  reset() {
    mock.reset();
    this.booleanInputs = new Map();
    this.files = new Map();
    this.inputs = new Map([
      ["errors", "false"],
      ["retries", "5"],
    ]);
    this.calls = mock.method(
      webapi.WebClient.prototype,
      "apiCall",
      () => undefined,
    );
    this.core = {
      debug: mock.fn(),
      error: mock.fn(),
      getInput: mock.fn((name) => this.inputs.get(name)),
      getBooleanInput: mock.fn((name) => this.booleanInputs.get(name)),
      info: mock.fn(),
      isDebug: mock.fn(),
      setFailed: mock.fn(),
      setOutput: mock.fn(),
      setSecret: mock.fn(),
      warning: mock.fn(),
    };
    this.fetch = mock.method(globalThis, "fetch", () => undefined);
    this.fs = {
      readFileSync: mock.method(fs, "readFileSync", (file, encoding) =>
        encoding === "utf-8" ? this.files.get(file) : undefined,
      ),
    };
    this.webapi = {
      WebClient: function () {
        this.apiCall = () => ({
          ok: true,
        });
      },
    };
    this.webhook = {
      incoming: mock.method(
        webhook.IncomingWebhook.prototype,
        "send",
        () => undefined,
      ),
      trigger: mock.method(
        webhook.WebhookTrigger.prototype,
        "send",
        () => undefined,
      ),
    };
    process.env.SLACK_TOKEN = "";
    process.env.SLACK_WEBHOOK_URL = "";
  }
}

export const mocks = new Mock();
