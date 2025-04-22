import core from "@actions/core";
import send from "./send.js";

/**
 * Invoke the Slack GitHub Action job from this file but export actual logic
 * from the send.js file for testing purposes.
 */
try {
  await send(core);
} catch (error) {
  if (error instanceof Error) {
    core.error(error.message);
    /** @type {import('./errors.js').Cause} */
    const causes = /** @type {any} */ (error.cause);
    if (causes?.values) {
      for (const cause of causes.values) {
        core.info(`${cause.stack}`);
      }
    } else {
      core.info(`${error.stack}`);
    }
  } else {
    core.error(`${error}`);
  }
  throw error;
}
