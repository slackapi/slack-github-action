import core from "@actions/core";
import webapi from "@slack/web-api";
import axios from "axios";
import Content from "./content.js";
import SlackError from "./errors.js";
import Logger from "./logger.js";

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
   * @property {string?} api - A custom API URL to send method requests to.
   * @property {boolean} errors - If the job should exit after errors or succeed.
   * @property {string?} method - The Slack API method to call.
   * @property {string?} payload - Request contents from the provided input.
   * @property {string?} payloadDelimiter - Seperators of nested attributes.
   * @property {string?} payloadFilePath - Location of a JSON request payload.
   * @property {boolean} payloadTemplated - If templated values are replaced.
   * @property {string?} proxy - An optional proxied connection for requests.
   * @property {Retries} retries - The retries method to use for failed requests.
   * @property {string?} token - The authentication value used with the Slack API.
   * @property {string?} webhook - A location for posting request payloads.
   * @property {string?} webhookType - Posting method to use with the webhook.
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
   * The logger of outputs.
   * @type {import("@slack/logger").Logger}
   */
  logger;

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
    this.logger = new Logger(core).logger;
    this.webapi = webapi;
    this.inputs = {
      api: core.getInput("api"),
      errors: core.getBooleanInput("errors"),
      method: core.getInput("method"),
      payload: core.getInput("payload"),
      payloadDelimiter: core.getInput("payload-delimiter"),
      payloadFilePath: core.getInput("payload-file-path"),
      payloadTemplated: core.getBooleanInput("payload-templated") || false,
      proxy:
        core.getInput("proxy") ||
        process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        null,
      retries: core.getInput("retries") || this.Retries.FIVE,
      token: core.getInput("token") || process.env.SLACK_TOKEN || null,
      webhook:
        core.getInput("webhook") || process.env.SLACK_WEBHOOK_URL || null,
      webhookType: core.getInput("webhook-type"),
    };
    this.mask();
    this.validate(core);
    core.debug(`Gathered action inputs: ${JSON.stringify(this.inputs)}`);
    this.content = new Content().get(this);
    core.debug(`Parsed request content: ${JSON.stringify(this.content)}`);
  }

  /**
   * Hide secret values provided in the inputs from appearing.
   */
  mask() {
    if (this.inputs.token) {
      core.debug("Setting the provided token as a secret variable.");
      core.setSecret(this.inputs.token);
    }
    if (this.inputs.webhook) {
      core.debug("Setting the provided webhook as a secret variable.");
      core.setSecret(this.inputs.webhook);
    }
  }

  /**
   * Confirm the configurations are correct enough to continue.
   * @param {core} core - GitHub Actions core utilities.
   */
  validate(core) {
    switch (this.inputs.retries.trim().toUpperCase()) {
      case this.Retries.ZERO:
      case this.Retries.FIVE:
      case this.Retries.TEN:
      case this.Retries.RAPID:
        break;
      default:
        throw new SlackError(
          core,
          `Invalid input! An unknown "retries" value was used: ${this.inputs.retries}`,
        );
    }
    switch (true) {
      case !!core.getInput("token") && !!core.getInput("webhook"):
        throw new SlackError(
          core,
          "Invalid input! Either the token or webhook is required - not both.",
        );
      case !!this.inputs.method:
        if (!this.inputs.token) {
          throw new SlackError(
            core,
            "Missing input! A token must be provided to use the method decided.",
          );
        }
        break;
      case !!this.inputs.webhook:
        if (!this.inputs.webhookType) {
          throw new SlackError(
            core,
            "Missing input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
          );
        }
        if (
          this.inputs.webhookType !== "incoming-webhook" &&
          this.inputs.webhookType !== "webhook-trigger"
        ) {
          throw new SlackError(
            core,
            "Invalid input! The webhook type must be 'incoming-webhook' or 'webhook-trigger'.",
          );
        }
        break;
      default:
        throw new SlackError(
          core,
          "Missing input! Either a method or webhook is required to take action.",
        );
    }
  }
}
