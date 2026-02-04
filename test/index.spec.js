import { mock } from "node:test";
import webapi from "@slack/web-api";
import axios, { AxiosError } from "axios";

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
   * Lookup tables for input values.
   */
  inputs = {};
  booleanInputs = {};

  /**
   * Setup mocked dependencies and configure default input arguments for all
   * tests.
   *
   * @see {@link ../action.yml}
   */
  constructor() {
    this.axios = {
      post: mock.fn((..._args) => {
        if (this.axios.post._promise !== undefined) {
          return this.axios.post._promise;
        }
        throw new Error(
          "Test error: axios.post was called but no promise was configured. " +
            "Set mocks.axios.post._promise = Promise.resolve(...) or Promise.reject(...)",
        );
      }),
    };
    axios.post = this.axios.post;
    this.calls = mock.fn((..._args) => {
      if (this.calls._resolvesWith !== undefined) {
        return Promise.resolve(this.calls._resolvesWith);
      }
      if (this.calls._rejectsWith !== undefined) {
        return Promise.reject(this.calls._rejectsWith);
      }
      throw new Error(
        "Test error: apiCall was called but no promise was configured. " +
          "Set mocks.calls._resolvesWith = {...} or mocks.calls._rejectsWith = {...}",
      );
    });
    webapi.WebClient.prototype.apiCall = this.calls;
    this.core = {
      debug: mock.fn(),
      error: mock.fn(),
      getInput: mock.fn((key) => this.inputs[key] ?? ""),
      getBooleanInput: mock.fn((key) => this.booleanInputs[key] ?? false),
      info: mock.fn(),
      isDebug: mock.fn(() => this._isDebug ?? false),
      setFailed: mock.fn(),
      setOutput: mock.fn(),
      setSecret: mock.fn(),
      warning: mock.fn(),
    };
  }

  /**
   * Testing interface that removes internal state from existing mocks.
   */
  reset() {
    // Clear lookup tables
    this.inputs = {};
    this.booleanInputs = {};

    // Reset axios mock
    this.axios.post.mock.resetCalls();
    this.axios.post._promise = undefined;

    // Reset apiCall mock
    this.calls.mock.resetCalls();
    this.calls._resolvesWith = undefined;
    this.calls._rejectsWith = undefined;

    // Reset core mocks
    for (const fn of Object.values(this.core)) {
      fn.mock?.resetCalls();
    }
    this._isDebug = false;

    // Reset webapi
    this.webapi = {};

    // Clear environment variables
    process.env.SLACK_TOKEN = "";
    process.env.SLACK_WEBHOOK_URL = "";
  }
}

export const mocks = new Mock();
