import fs from "node:fs";
import path from "node:path";
import github from "@actions/github";
import { flatten } from "flat";
import yaml from "js-yaml";
import markup from "markup-js";
import Config from "./config.js";
import SlackError from "./errors.js";

/**
 * The parsed payload provided to the action and passed to the preferred method
 * of sending a payload.
 */
export default class Content {
  /**
   * Gather content from the provided payload or payload file path with parsings.
   * @param {Config} config
   * @returns {this} - An instance of this Content class.
   */
  get(config) {
    switch (true) {
      case !!config.inputs.payload && !!config.inputs.payloadFilePath:
        throw new SlackError(
          config.core,
          "Invalid input! Just the payload or payload file path is required.",
        );
      case !!config.inputs.payload:
        this.values = this.getContentPayload(config);
        break;
      case !!config.inputs.payloadFilePath:
        this.values = this.getContentPayloadFilePath(config);
        break;
      default:
        config.core.debug(
          "Missing payload so gathering inputs from action context.",
        );
        this.values = github.context;
        break;
    }
    if (config.inputs.payloadDelimiter) {
      this.values = flatten(this.values, {
        delimiter: config.inputs.payloadDelimiter,
      });
      for (const key of Object.keys(this.values)) {
        this.values[key] = `${this.values[key]}`;
      }
    }
    return this;
  }

  /**
   * Format request content from payload values for use in the request.
   * @param {Config} config
   * @throws if the input payload or payload file path is invalid JSON.
   * @returns {Content} - the parsed JSON payload to use in requests.
   */
  getContentPayload(config) {
    const errors = [];
    if (!config.inputs.payload) {
      throw new SlackError(
        config.core,
        "Invalid input! No payload content was provided",
      );
    }
    try {
      const input = this.templatize(config, config.inputs.payload);
      const content = /** @type {Content} */ (
        yaml.load(input, {
          schema: yaml.JSON_SCHEMA,
        })
      );
      return /** @type {Content} */ (content);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error);
      }
    }
    try {
      const trimmed = config.inputs.payload.trim();
      if (
        !config.inputs.payload.startsWith("{") &&
        !config.inputs.payload.endsWith("}")
      ) {
        config.core.debug(
          "Wrapping input payload in braces to create valid JSON",
        );
        const comma = trimmed.replace(/,$/, ""); // remove trailing comma
        const wrap = `{${comma}}`;
        return JSON.parse(wrap);
      }
      return JSON.parse(trimmed);
    } catch (/** @type {any} */ error) {
      errors.unshift(error);
      throw new SlackError(
        config.core,
        "Invalid input! Failed to parse contents of the provided payload",
        {
          cause: { values: errors },
        },
      );
    }
  }

  /**
   * Format request content from the payload file path for use in the request.
   * @param {Config} config
   * @throws if the input payload or payload file path is invalid JSON.
   * @returns {Content} - the parsed JSON payload to use in requests.
   */
  getContentPayloadFilePath(config) {
    if (!config.inputs.payloadFilePath) {
      throw new SlackError(
        config.core,
        "Invalid input! No payload found for content",
      );
    }
    try {
      const input = fs.readFileSync(
        path.resolve(config.inputs.payloadFilePath),
        "utf-8",
      );
      const content = this.templatize(config, input);
      if (
        config.inputs.payloadFilePath.endsWith("yaml") ||
        config.inputs.payloadFilePath.endsWith("yml")
      ) {
        const load = yaml.load(content, {
          schema: yaml.JSON_SCHEMA,
        });
        return /** @type {Content} */ (load);
      }
      if (config.inputs.payloadFilePath.endsWith("json")) {
        return JSON.parse(content);
      }
      throw new SlackError(
        config.core,
        `Invalid input! Failed to parse file extension ${config.inputs.payloadFilePath}`,
      );
    } catch (/** @type {any} */ error) {
      throw new SlackError(
        config.core,
        "Invalid input! Failed to parse contents of the provided payload file",
        {
          cause: { values: [error] },
        },
      );
    }
  }

  /**
   * Replace templated variables in the provided content if requested.
   * @param {Config} config
   * @param {string} input - The initial value of the content.
   * @returns {string} Content with templatized variables replaced.
   */
  templatize(config, input) {
    if (!config.inputs.payloadTemplated) {
      return input;
    }
    const template = input.replace(/\$\{\{/g, "{{"); // swap ${{ for {{
    const context = {
      env: process.env,
      github: github.context,
    };
    return markup.up(template, context);
  }
}
