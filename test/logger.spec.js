import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { LogLevel } from "@slack/logger";
import Logger from "../src/logger.js";
import { mocks } from "./index.spec.js";

describe("logger", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("level", () => {
    it("debug", () => {
      mocks._isDebug = true;
      const { logger } = new Logger(mocks.core);
      const actual = logger.getLevel();
      const expected = LogLevel.DEBUG;
      assert.strictEqual(actual, expected);
    });

    it("info", () => {
      mocks._isDebug = false;
      const { logger } = new Logger(mocks.core);
      const actual = logger.getLevel();
      const expected = LogLevel.INFO;
      assert.strictEqual(actual, expected);
    });
  });
});
