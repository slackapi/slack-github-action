import { LogLevel } from "@slack/logger";

/**
 * The Logger class creates a Logger to output debug messages and errors.
 *
 * @see {@link https://tools.slack.dev/node-slack-sdk/web-api/#logging}
 */
export default class Logger {
  /**
   * The logger for outputs.
   * @type {import("@slack/logger").Logger}
   */
  logger;

  /**
   * Shared utilities specific to the GitHub action workflow.
   * @param {import("@actions/core")} core - GitHub Actions core utilities.
   */
  constructor(core) {
    this.logger = {
      debug: core.debug,
      info: core.info,
      warn: core.warning,
      error: core.error,
      getLevel: () => {
        return core.isDebug() ? LogLevel.DEBUG : LogLevel.INFO;
      },
      setLevel: (_level) => {},
      setName: (_name) => {},
    };
  }
}
