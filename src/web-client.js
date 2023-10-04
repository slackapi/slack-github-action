const { WebClient } = require('@slack/web-api');
const { HttpsProxyAgent } = require('https-proxy-agent');

/**
 *
 * @param {string} botToken token used to authenticate as the Slack Bot user
 * @param {string?} httpsProxy (optional) URL for the proxy to use for HTTPS requests
 * @returns { WebClient } a WebClient configured with the bot token and proxy agent (if needed)
 */
function createWebClient(botToken, httpsProxy) {
  if (httpsProxy) {
    const httpsProxyAgent = new HttpsProxyAgent(httpsProxy);
    return new WebClient(botToken, { agent: httpsProxyAgent });
  }
  return new WebClient(botToken);
}

module.exports = {
  createWebClient,
};
