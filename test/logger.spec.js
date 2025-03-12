import core from "@actions/core";
import { LogLevel } from "@slack/logger";
import { assert } from "chai";
import Logger from "../src/logger.js";
import { mocks } from "./index.spec.js";

describe("logger", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("level", () => {
    it("debug", () => {
      mocks.core.isDebug = () => true;
      const { logger } = new Logger(core);
      const actual = logger.getLevel();
      const expected = LogLevel.DEBUG;
      assert.equal(actual, expected);
    });

    it("info", () => {
      mocks.core.isDebug = () => false;
      const { logger } = new Logger(core);
      const actual = logger.getLevel();
      const expected = LogLevel.INFO;
      assert.equal(actual, expected);
    });
  });
});
