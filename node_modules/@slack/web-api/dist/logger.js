"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
const logger_1 = require("@slack/logger");
var logger_2 = require("@slack/logger");
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_2.LogLevel; } });
let instanceCount = 0;
/**
 * INTERNAL interface for getting or creating a named Logger.
 */
function getLogger(name, level, existingLogger) {
    // Get a unique ID for the logger.
    const instanceId = instanceCount;
    instanceCount += 1;
    // Set up the logger.
    const logger = (() => {
        if (existingLogger !== undefined) {
            return existingLogger;
        }
        return new logger_1.ConsoleLogger();
    })();
    logger.setName(`web-api:${name}:${instanceId}`);
    if (level !== undefined) {
        logger.setLevel(level);
    }
    return logger;
}
exports.getLogger = getLogger;
//# sourceMappingURL=logger.js.map