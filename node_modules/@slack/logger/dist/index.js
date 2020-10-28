"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Severity levels for log entries
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
/**
 * Default logger which logs to stdout and stderr
 */
class ConsoleLogger {
    constructor() {
        this.level = LogLevel.INFO;
        this.name = '';
    }
    getLevel() {
        return this.level;
    }
    /**
     * Sets the instance's log level so that only messages which are equal or more severe are output to the console.
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Set the instance's name, which will appear on each log line before the message.
     */
    setName(name) {
        this.name = name;
    }
    /**
     * Log a debug message
     */
    debug(...msg) {
        if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.DEBUG, this.level)) {
            console.debug(ConsoleLogger.labels.get(LogLevel.DEBUG), this.name, ...msg);
        }
    }
    /**
     * Log an info message
     */
    info(...msg) {
        if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.INFO, this.level)) {
            console.info(ConsoleLogger.labels.get(LogLevel.INFO), this.name, ...msg);
        }
    }
    /**
     * Log a warning message
     */
    warn(...msg) {
        if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.WARN, this.level)) {
            console.warn(ConsoleLogger.labels.get(LogLevel.WARN), this.name, ...msg);
        }
    }
    /**
     * Log an error message
     */
    error(...msg) {
        if (ConsoleLogger.isMoreOrEqualSevere(LogLevel.ERROR, this.level)) {
            console.error(ConsoleLogger.labels.get(LogLevel.ERROR), this.name, ...msg);
        }
    }
    /**
     * Helper to compare two log levels and determine if a is equal or more severe than b
     */
    static isMoreOrEqualSevere(a, b) {
        return ConsoleLogger.severity[a] >= ConsoleLogger.severity[b];
    }
}
/** Map of labels for each log level */
ConsoleLogger.labels = (() => {
    const entries = Object.entries(LogLevel);
    const map = entries.map(([key, value]) => {
        return [value, `[${key}] `];
    });
    return new Map(map);
})();
/** Map of severity as comparable numbers for each log level */
ConsoleLogger.severity = {
    [LogLevel.ERROR]: 400,
    [LogLevel.WARN]: 300,
    [LogLevel.INFO]: 200,
    [LogLevel.DEBUG]: 100,
};
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=index.js.map