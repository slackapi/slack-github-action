import core from "@actions/core";
import webapi from "@slack/web-api";
import axios from "axios";
import Content from "./content.js";
import SlackError from "./errors.js";

/**
 * Options and settings set as inputs to this action.
 *
 * @see {@link ../action.yml}
 */
export default class Config {
  /**
   * Options of retries for failed requests.
   * @readonly
   * @enum {string} The option for retries.
   */
  Retries = {
    /** No retries, just hope that things go alright.
     * @readonly
     */
    ZERO: "0",
    /**
     * Five retries in five minutes.
     * @readonly
     */
    FIVE: "5",
    /**
     * Ten retries in about thirty minutes.
     * @readonly
     */
    TEN: "10",
    /**
     * A burst of retries to keep things running fast.
     * @readonly
     */
    RAPID: "RAPID",
  };

  /**
   * @typedef Inputs - Values provided to this job.
   * @property {boolean} errors - If the job should exit after errors or succeed.
   * @property {string?} method - The Slack API method to call.
   * @property {string?} payload - Request contents from the provided input.
   * @property {string?} payloadDelimiter - Seperators of nested attributes.
   * @property {string?} payloadFilePath - Location of a JSON request payload.
   * @property {boolean} payloadFilePathParsed - If templated values are replaced.
   * @property {string?} proxy - An optional proxied connection for requests.
   * @property {Retries} retries - The retries method to use for failed requests.
   * @property {string?} token - The authentication value used with the Slack API.
   * @property {string?} webhook - A location for posting request payloads.
   */

  /**
   * @type {Inputs} - The actual action input values.
   */
  inputs;

  /**
   * @type {import("axios").AxiosStatic} - The axios client.
   */
  axios;

  /**
   * @type {Content} - The parsed payload data to send.
   */
  content;

  /**
   * Shared utilities specific to the GitHub action workflow.
   * @type {import("@actions/core")}
   */
  core;

  /**
   * @type {import("@slack/web-api")} - Slack API client.
   */
  webapi;

  /**
   * Gather values from the job inputs and use defaults or error for the missing
   * ones.
   *
   * The content of the payload is also parsed, proxies set, and a shared "core"
   * kept for later use.
   *
   * @constructor
   * @param {core} core - GitHub Actions core utilities.
   */
  constructor(core) {
    this.axios = axios;
    this.core = core;
    this.webapi = webapi;
    this.inputs = {
      errors: core.getBooleanInput("errors"),
      method: core.getInput("method"),
      payload: core.getInput("payload"),
      payloadDelimiter: core.getInput("payload-delimiter"),
      payloadFilePath: core.getInput("payload-file-path"),
      payloadFilePathParsed:
        core.getBooleanInput("payload-file-path-parsed") || false,
      proxy:
        core.getInput("proxy") ||
        process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        null,
      retries: core.getInput("retries") || this.Retries.FIVE,
      token: core.getInput("token") || process.env.SLACK_TOKEN || null,
      webhook:
        core.getInput("webhook") || process.env.SLACK_WEBHOOK_URL || null,
    };
    this.validate();
    core.debug(`Gathered action inputs: ${JSON.stringify(this.inputs)}`);
    this.content = new Content(this);
    core.debug(`Parsed request content: ${JSON.stringify(this.content)}`);
  }

  /**
   * Confirm the configurations are correct enough to continue.
   */
  validate() {
    switch (this.inputs.retries) {
      case this.Retries.ZERO:
      case this.Retries.FIVE:
      case this.Retries.TEN:
      case this.Retries.RAPID:
        break;
      default:
        core.warning(
          `Invalid input! An unknown "retries" value was used: ${this.inputs.retries}`,
        );
    }
    switch (true) {
      case !!this.inputs.token && !!this.inputs.webhook:
        core.debug(
          "Setting the provided token and webhook as secret variables.",
        );
        core.setSecret(this.inputs.token);
        core.setSecret(this.inputs.webhook);
        throw new SlackError(
          core,
          "Invalid input! Either the token or webhook is required - not both.",
        );
      case !!this.inputs.token:
        core.debug("Setting the provided token as a secret variable.");
        core.setSecret(this.inputs.token);
        if (!this.inputs.method) {
          throw new SlackError(
            core,
            "Missing input! A method must be decided to use the token provided.",
          );
        }
        break;
      case !!this.inputs.webhook:
        core.debug("Setting the provided webhook as a secret variable.");
        core.setSecret(this.inputs.webhook);
        break;
      default:
        throw new SlackError(
          core,
          "Missing input! Either a token or webhook is required to take action.",
        );
    }
  }
}
