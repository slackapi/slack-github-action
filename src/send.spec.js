import { mocks } from "./index.spec.js";
import send from "./send.js";

/**
 * This is a collection of integration tests that make sure modules are doing
 * whatever's expected.
 *
 * Or at least that's planned...
 *
 * Edge cases for inputs are checked in separate modules including the config
 * specifications.
 */
describe("send", () => {
  afterEach(() => {
    mocks.reset();
  });

  it("exists and can be called", async () => {
    mocks.core.getInput.withArgs("webhook").returns("https://hooks.slack.com");
    mocks.core.getInput.withArgs("webhook-type").returns("incoming-webhook");
    mocks.core.getInput.withArgs("payload").returns('"text": "hello"');
    await send(mocks.core);
  });
});
