import fs from "node:fs";
import webapi from "@slack/web-api";
import axios, { AxiosError } from "axios";
import sinon from "sinon";

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
   * @typedef Errors - A collection of mocked errors to use in tests.
   * @prop {Object.<string, AxiosError>} axios - The mocked axios errors.
   */

  /**
   * The mocked errors.
   * @type {Errors}
   */
  errors = {
    axios: {
      network_failed: new AxiosError("network_failed"),
    },
  };

  /**
   * Setup stubbed dependencies and configure default input arguments for all
   * tests.
   *
   * @see {@link ../action.yml}
   */
  constructor() {
    this.sandbox = sinon.createSandbox();
    this.axios = this.sandbox.stub(axios);
    this.calls = this.sandbox.stub(webapi.WebClient.prototype, "apiCall");
    this.core = {
      debug: this.sandbox.stub(),
      error: this.sandbox.stub(),
      getInput: this.sandbox.stub(),
      getBooleanInput: this.sandbox.stub(),
      info: this.sandbox.stub(),
      isDebug: this.sandbox.stub(),
      setFailed: this.sandbox.stub(),
      setOutput: this.sandbox.stub(),
      setSecret: this.sandbox.stub(),
      warning: this.sandbox.stub(),
    };
    this.fs = this.sandbox.stub(fs);
    this.webapi = {
      WebClient: function () {
        this.apiCall = () => ({
          ok: true,
        });
      },
    };
    this.core.getInput.withArgs("errors").returns("false");
    this.core.getInput.withArgs("retries").returns("5");
  }

  /**
   * Testing interface that removes internal state from existing stubs.
   */
  reset() {
    this.sandbox.reset();
    this.axios.post.resetHistory();
    this.calls.resetHistory();
    this.core.debug.reset();
    this.core.error.reset();
    this.core.getInput.reset();
    this.core.getBooleanInput.reset();
    this.core.info.reset();
    this.core.isDebug.reset();
    this.core.setFailed.reset();
    this.core.setOutput.reset();
    this.core.setSecret.reset();
    this.core.warning.reset();
    this.webapi = {
      WebClient: function () {
        this.apiCall = () => ({
          ok: true,
        });
      },
    };
    this.core.getInput.withArgs("errors").returns("false");
    this.core.getInput.withArgs("retries").returns("5");
    process.env.SLACK_TOKEN = "";
    process.env.SLACK_WEBHOOK_URL = "";
  }
}

export const mocks = new Mock();
