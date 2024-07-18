import fs from "node:fs";
import path from "node:path";
import core from "@actions/core";
import github from "@actions/github";
import webapi from "@slack/web-api";
import axios from "axios";
import flatten from "flat";
import markup from "markup-js";
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
   * @typedef Content - The provided and parsed payload object.
   * @type {Record<string, any>}
   */

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
    switch (true) {
      case !!this.inputs.payload && !!this.inputs.payloadFilePath:
        throw new SlackError(
          core,
          "Invalid input! Just the payload or payload file path is required.",
        );
      case !!this.inputs.payload:
        this.content = this.getContentPayload(core);
        break;
      case !!this.inputs.payloadFilePath:
        this.content = this.getContentPayloadFilePath(core);
        break;
      default:
        core.debug("Missing payload so gathering inputs from action context.");
        this.content = github.context;
        break;
    }
    if (this.inputs.payloadDelimiter) {
      this.content = flatten(this.content, {
        delimiter: this.inputs.payloadDelimiter,
      });
      for (const key of Object.keys(this.content)) {
        this.content[key] = `${this.content[key]}`;
      }
    }
    core.debug(`Parsed request content: ${JSON.stringify(this.content)}`);
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
    core.debug(`Gathered action inputs: ${JSON.stringify(this.inputs)}`);
  }

  /**
   * Format request content from payload values for use in the request.
   * @param {core} core - GitHub Actions core utilities.
   * @throws if the input payload or payload file path is invalid JSON.
   * @returns {Content} - the parsed JSON payload to use in requests.
   */
  getContentPayload(core) {
    if (!this.inputs.payload) {
      throw new SlackError(core, "Invalid input! No payload content found");
    }
    try {
      const trimmed = this.inputs.payload.trim();
      if (
        !this.inputs.payload.startsWith("{") &&
        !this.inputs.payload.endsWith("}")
      ) {
        core.debug("Wrapping input payload in braces to create valid JSON");
        const comma = trimmed.replace(/,$/, ""); // remove trailing comma
        const wrap = `{${comma}}`;
        return JSON.parse(wrap);
      }
      return JSON.parse(trimmed);
    } catch (error) {
      if (error instanceof Error) {
        core.error(error);
      }
      throw new SlackError(
        core,
        "Invalid input! Failed to parse the JSON content of the payload",
      );
    }
  }

  /**
   * Format request content from the payload file path for use in the request.
   * @param {core} core - GitHub Actions core utilities.
   * @throws if the input payload or payload file path is invalid JSON.
   * @returns {Content} - the parsed JSON payload to use in requests.
   */
  getContentPayloadFilePath(core) {
    if (!this.inputs.payloadFilePath) {
      throw new SlackError(core, "Invalid input! No payload found for content");
    }
    try {
      const content = fs.readFileSync(
        path.resolve(this.inputs.payloadFilePath),
        "utf-8",
      );
      if (!this.inputs.payloadFilePathParsed) {
        return JSON.parse(content);
      }
      const template = content.replace(/\$\{\{/g, "{{"); // swap ${{ for {{
      const context = {
        env: process.env,
        github: github.context,
      };
      return JSON.parse(markup.up(template, context));
    } catch (error) {
      if (error instanceof Error) {
        core.error(error);
      }
      throw new SlackError(
        core,
        "Invalid input! Failed to parse the JSON content of the payload file",
      );
    }
  }
}
