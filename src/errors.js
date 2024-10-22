import core from "@actions/core";

/**
 * SlackError is a custom error wrapper for known errors of Slack GitHub Action.
 */
export default class SlackError extends Error {
  /**
   * @param {core} core - GitHub Actions core utilities.
   * @param {any} error - The error message to throw.
   * @param {boolean} fails - if the exit should be forced.
   */
  constructor(core, error, fails = true) {
    if (error instanceof Error) {
      super(error.message);
    } else {
      super(error);
    }
    this.name = "SlackError";
    if (fails) {
      core.setFailed(error);
    }
  }
}
