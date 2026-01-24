import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import core from "@actions/core";
import { LogLevel } from "@slack/logger";
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
      assert.strictEqual(actual, expected);
    });

    it("info", () => {
      mocks.core.isDebug = () => false;
      const { logger } = new Logger(core);
      const actual = logger.getLevel();
      const expected = LogLevel.INFO;
      assert.strictEqual(actual, expected);
    });
  });
});
