/**
 * Severity levels for log entries
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
/**
 * Interface for objects where objects in this package's logs can be sent (can be used as `logger` option).
 */
export interface Logger {
    /**
     * Output debug message
     *
     * @param msg any data to log
     */
    debug(...msg: any[]): void;
    /**
     * Output info message
     *
     * @param msg any data to log
     */
    info(...msg: any[]): void;
    /**
     * Output warn message
     *
     * @param msg any data to log
     */
    warn(...msg: any[]): void;
    /**
     * Output error message
     *
     * @param msg any data to log
     */
    error(...msg: any[]): void;
    /**
     * This disables all logging below the given level, so that after a log.setLevel("warn") call log.warn("something")
     * or log.error("something") will output messages, but log.info("something") will not.
     *
     * @param level as a string, like 'error' (case-insensitive)
     */
    setLevel(level: LogLevel): void;
    /**
     * Return the current LogLevel.
     */
    getLevel(): LogLevel;
    /**
     * This allows the instance to be named so that they can easily be filtered when many loggers are sending output
     * to the same destination.
     *
     * @param name as a string, will be output with every log after the level
     */
    setName(name: string): void;
}
/**
 * Default logger which logs to stdout and stderr
 */
export declare class ConsoleLogger implements Logger {
    /** Setting for level */
    private level;
    /** Name */
    private name;
    /** Map of labels for each log level */
    private static labels;
    /** Map of severity as comparable numbers for each log level */
    private static severity;
    constructor();
    getLevel(): LogLevel;
    /**
     * Sets the instance's log level so that only messages which are equal or more severe are output to the console.
     */
    setLevel(level: LogLevel): void;
    /**
     * Set the instance's name, which will appear on each log line before the message.
     */
    setName(name: string): void;
    /**
     * Log a debug message
     */
    debug(...msg: any[]): void;
    /**
     * Log an info message
     */
    info(...msg: any[]): void;
    /**
     * Log a warning message
     */
    warn(...msg: any[]): void;
    /**
     * Log an error message
     */
    error(...msg: any[]): void;
    /**
     * Helper to compare two log levels and determine if a is equal or more severe than b
     */
    private static isMoreOrEqualSevere;
}
//# sourceMappingURL=index.d.ts.map