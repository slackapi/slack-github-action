import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { LogLevel } from "@slack/logger";
import Logger from "../src/logger.js";
import { mocks } from "./index.spec.js";

describe("logger", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("level", () => {
    [
      ["debug", true],
      ["info", false],
    ].forEach(([label, isDebug]) => {
      it(label, () => {
        mocks.core.isDebug.returns(isDebug);
        const { logger } = new Logger(mocks.core);
        assert.strictEqual(logger.getLevel(), LogLevel[label.toUpperCase()]);
      });
    });
  });
});
