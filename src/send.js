import core from "@actions/core";
import Client from "./client.js";
import Config from "./config.js";
import SlackError from "./errors.js";
import Webhook from "./webhook.js";

/**
 * Orchestrate the action job happenings from inputs to logic to outputs.
 * @param {core} core - GitHub Actions core utilities.
 * @throws if an error happens but might not cause the job to fail.
 */
export default async function send(core) {
  const config = new Config(core);
  try {
    await post(config);
    config.core.setOutput("time", Math.floor(Date.now() / 1000));
  } catch (/** @type {any} */ error) {
    config.core.setOutput("time", Math.floor(Date.now() / 1000));
    if (config.inputs.errors) {
      core.setFailed(error);
      throw new SlackError(core, error);
    }
  }
}

/**
 * Perform the posting action of this workflow with configured settings.
 * @param {Config} config
 */
async function post(config) {
  switch (true) {
    case !!config.inputs.method:
      return await new Client().post(config);
    case !!config.inputs.webhook:
      return await new Webhook().post(config);
    default:
      throw new SlackError(config.core, "No technique given to post content");
  }
}
