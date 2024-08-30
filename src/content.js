import fs from "node:fs";
import path from "node:path";
import github from "@actions/github";
import flatten from "flat";
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
   * @type {Record<string, any>}
   */
  values;

  /**
   * @param {Config} config
   */
  constructor(config) {
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
  }

  /**
   * Format request content from payload values for use in the request.
   * @param {Config} config - GitHub Actions core utilities.
   * @throws if the input payload or payload file path is invalid JSON.
   * @returns {Content} - the parsed JSON payload to use in requests.
   */
  getContentPayload(config) {
    if (!config.inputs.payload) {
      throw new SlackError(
        config.core,
        "Invalid input! No payload content found",
      );
    }
    try {
      const content = yaml.load(config.inputs.payload, {
        schema: yaml.JSON_SCHEMA,
      });
      return /** @type {Content} */ (content);
    } catch (error) {
      if (error instanceof Error) {
        config.core.debug("Failed to parse input payload as YAML");
        config.core.debug(error.message);
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
    } catch (error) {
      if (error instanceof Error) {
        config.core.error(error);
      }
      throw new SlackError(
        config.core,
        "Invalid input! Failed to parse the JSON content of the payload",
      );
    }
  }

  /**
   * Format request content from the payload file path for use in the request.
   * @param {Config} config - GitHub Actions core utilities.
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
      const content = fs.readFileSync(
        path.resolve(config.inputs.payloadFilePath),
        "utf-8",
      );
      if (!config.inputs.payloadFilePathParsed) {
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
          `Failed to parse file extension ${config.inputs.payloadFilePath}`,
        );
      }
      const template = content.replace(/\$\{\{/g, "{{"); // swap ${{ for {{
      const context = {
        env: process.env,
        github: github.context,
      };
      return JSON.parse(markup.up(template, context));
    } catch (error) {
      if (error instanceof Error) {
        config.core.error(error);
      }
      throw new SlackError(
        config.core,
        "Invalid input! Failed to parse the JSON content of the payload file",
      );
    }
  }
}
