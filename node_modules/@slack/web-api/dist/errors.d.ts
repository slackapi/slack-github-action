/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import { AxiosResponse } from 'axios';
import { WebAPICallResult } from './WebClient';
/**
 * All errors produced by this package adhere to this interface
 */
export interface CodedError extends NodeJS.ErrnoException {
    code: ErrorCode;
}
/**
 * A dictionary of codes for errors produced by this package
 */
export declare enum ErrorCode {
    RequestError = "slack_webapi_request_error",
    HTTPError = "slack_webapi_http_error",
    PlatformError = "slack_webapi_platform_error",
    RateLimitedError = "slack_webapi_rate_limited_error"
}
export declare type WebAPICallError = WebAPIPlatformError | WebAPIRequestError | WebAPIHTTPError | WebAPIRateLimitedError;
export interface WebAPIPlatformError extends CodedError {
    code: ErrorCode.PlatformError;
    data: WebAPICallResult & {
        error: string;
    };
}
export interface WebAPIRequestError extends CodedError {
    code: ErrorCode.RequestError;
    original: Error;
}
export interface WebAPIHTTPError extends CodedError {
    code: ErrorCode.HTTPError;
    statusCode: number;
    statusMessage: string;
    headers: IncomingHttpHeaders;
    body?: any;
}
export interface WebAPIRateLimitedError extends CodedError {
    code: ErrorCode.RateLimitedError;
    retryAfter: number;
}
/**
 * A factory to create WebAPIRequestError objects
 * @param original - original error
 */
export declare function requestErrorWithOriginal(original: Error): WebAPIRequestError;
/**
 * A factory to create WebAPIHTTPError objects
 * @param response - original error
 */
export declare function httpErrorFromResponse(response: AxiosResponse): WebAPIHTTPError;
/**
 * A factory to create WebAPIPlatformError objects
 * @param result - Web API call result
 */
export declare function platformErrorFromResult(result: WebAPICallResult & {
    error: string;
}): WebAPIPlatformError;
/**
 * A factory to create WebAPIRateLimitedError objects
 * @param retrySec - Number of seconds that the request can be retried in
 */
export declare function rateLimitedErrorWithDelay(retrySec: number): WebAPIRateLimitedError;
//# sourceMappingURL=errors.d.ts.map