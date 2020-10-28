import { Options } from 'p-retry';
/**
 * Options to create retry policies. Extends from https://github.com/tim-kos/node-retry.
 */
export interface RetryOptions extends Options {
}
/**
 * The default retry policy. Retry up to 10 times, over the span of about 30 minutes. It's not exact because
 * randomization has been added to prevent a stampeding herd problem (if all instances in your application are retrying
 * a request at the exact same intervals, they are more likely to cause failures for each other).
 */
export declare const tenRetriesInAboutThirtyMinutes: RetryOptions;
/**
 * Short & sweet, five retries in five minutes and then bail.
 */
export declare const fiveRetriesInFiveMinutes: RetryOptions;
/**
 * This policy is just to keep the tests running fast.
 */
export declare const rapidRetryPolicy: RetryOptions;
declare const policies: {
    tenRetriesInAboutThirtyMinutes: RetryOptions;
    fiveRetriesInFiveMinutes: RetryOptions;
    rapidRetryPolicy: RetryOptions;
};
export default policies;
//# sourceMappingURL=retry-policies.d.ts.map