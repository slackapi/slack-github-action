/**
 * Appends the app metadata into the User-Agent value
 * @param appMetadata.name - name of tool to be counted in instrumentation
 * @param appMetadata.version - version of tool to be counted in instrumentation
 */
export declare function addAppMetadata({ name, version }: {
    name: string;
    version: string;
}): void;
/**
 * Returns the current User-Agent value for instrumentation
 */
export declare function getUserAgent(): string;
//# sourceMappingURL=instrument.d.ts.map