"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
/**
 * Build a Promise that will resolve after the specified number of milliseconds.
 * @param ms milliseconds to wait
 * @param value value for eventual resolution
 */
function delay(ms, value) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), ms);
    });
}
exports.delay = delay;
//# sourceMappingURL=helpers.js.map