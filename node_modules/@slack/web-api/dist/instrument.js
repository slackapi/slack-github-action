"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAgent = exports.addAppMetadata = void 0;
const os = __importStar(require("os"));
const packageJson = require('../package.json'); // tslint:disable-line:no-require-imports no-var-requires
/**
 * Replaces occurrences of '/' with ':' in a string, since '/' is meaningful inside User-Agent strings as a separator.
 */
function replaceSlashes(s) {
    return s.replace('/', ':');
}
const baseUserAgent = `${replaceSlashes(packageJson.name)}/${packageJson.version} ` +
    `node/${process.version.replace('v', '')} ` +
    `${os.platform()}/${os.release()}`;
const appMetadata = {};
/**
 * Appends the app metadata into the User-Agent value
 * @param appMetadata.name - name of tool to be counted in instrumentation
 * @param appMetadata.version - version of tool to be counted in instrumentation
 */
function addAppMetadata({ name, version }) {
    appMetadata[replaceSlashes(name)] = version;
}
exports.addAppMetadata = addAppMetadata;
/**
 * Returns the current User-Agent value for instrumentation
 */
function getUserAgent() {
    const appIdentifier = Object.entries(appMetadata).map(([name, version]) => `${name}/${version}`).join(' ');
    // only prepend the appIdentifier when its not empty
    return ((appIdentifier.length > 0) ? `${appIdentifier} ` : '') + baseUserAgent;
}
exports.getUserAgent = getUserAgent;
//# sourceMappingURL=instrument.js.map