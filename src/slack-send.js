const { promises: fs } = require('fs');
const path = require('path');
const github = require('@actions/github');
const flatten = require('flat');
const axios = require('axios');
const markup = require('markup-js');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { parseURL } = require('whatwg-url');
const { createWebClient } = require('./web-client');

const SLACK_WEBHOOK_TYPES = {
  WORKFLOW_TRIGGER: 'WORKFLOW_TRIGGER',
  INCOMING_WEBHOOK: 'INCOMING_WEBHOOK',
};

module.exports = async function slackSend(core) {
  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    let webhookType = SLACK_WEBHOOK_TYPES.WORKFLOW_TRIGGER;

    if (process.env.SLACK_WEBHOOK_TYPE) {
      // The default type is for Workflow Builder triggers. If you want to use this action for Incoming Webhooks, use
      // the corresponding type instead.
      webhookType = process.env.SLACK_WEBHOOK_TYPE.toUpperCase();
    }

    if ((botToken === undefined || botToken.length <= 0) && (webhookUrl === undefined || webhookUrl.length <= 0)) {
      throw new Error('Need to provide at least one botToken or webhookUrl');
    }

    let payload = core.getInput('payload');

    const payloadFilePath = core.getInput('payload-file-path');

    /** Option to replace templated context variables in the payload file JSON */
    const payloadFilePathParsed = core.getBooleanInput('payload-file-path-parsed');

    let webResponse;

    if (payloadFilePath && !payload) {
      try {
        payload = await fs.readFile(path.resolve(payloadFilePath), 'utf-8');
        if (payloadFilePathParsed) {
          const context = { github: github.context, env: process.env };
          const payloadString = payload.replaceAll('${{', '{{');
          payload = markup.up(payloadString, context);
        }
      } catch (error) {
        // passed in payload file path was invalid
        console.error(error);
        throw new Error(`The payload-file-path may be incorrect. Failed to load the file: ${payloadFilePath}`);
      }
    }

    if (payload) {
      try {
        // confirm it is valid json
        payload = JSON.parse(payload);
      } catch (e) {
        // passed in payload wasn't valid json
        console.error('passed in payload was invalid JSON');
        throw new Error('Need to provide valid JSON payload');
      }
    }

    if (typeof botToken !== 'undefined' && botToken.length > 0) {
      const message = core.getInput('slack-message') || '';
      const channelIds = core.getInput('channel-id') || '';
      const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
      const web = createWebClient(botToken, httpsProxy);

      if (channelIds.length <= 0) {
        console.log('Channel ID is required to run this action. An empty one has been provided');
        throw new Error('Channel ID is required to run this action. An empty one has been provided');
      }

      if (message.length > 0 || payload) {
        const ts = core.getInput('update-ts');
        await Promise.all(channelIds.split(',').map(async (channelId) => {
          if (ts) {
          // update message
            webResponse = await web.chat.update({ ts, channel: channelId.trim(), text: message, ...(payload || {}) });
          } else {
          // post message
            webResponse = await web.chat.postMessage({ channel: channelId.trim(), text: message, ...(payload || {}) });
          }
        }));
        // TODO: I suppose if multiple channels are provided, the output here will return only one of the messages'
        // data, not all of them...
        if (webResponse && webResponse.ok) {
          core.setOutput('ts', webResponse.ts);
          // return the thread_ts if it exists, if not return the ts
          const thread_ts = webResponse.thread_ts ? webResponse.thread_ts : webResponse.ts;
          core.setOutput('thread_ts', thread_ts);
          // return id of the channel from the response
          core.setOutput('channel_id', webResponse.channel);
        }
      } else {
        console.log('Missing slack-message or payload! Did not send a message via chat.postMessage with botToken', { channel: channelIds, text: message, ...(payload) });
        throw new Error('Missing message content, please input a valid payload or message to send. No Message has been send.');
      }
    } else if (typeof webhookUrl !== 'undefined' && webhookUrl.length > 0) {
      if (!payload) {
        // No Payload was passed in
        console.log('no custom payload was passed in, using default payload that triggered the GitHub Action');
        // Get the JSON webhook payload for the event that triggered the workflow
        payload = github.context.payload;
      }

      if (webhookType === SLACK_WEBHOOK_TYPES.WORKFLOW_TRIGGER) {
        // flatten JSON payload (no nested attributes)
        const flatPayload = flatten(payload);

        // workflow builder requires values to be strings
        // iterate over every value and convert it to string
        Object.keys(flatPayload).forEach((key) => {
          flatPayload[key] = `${flatPayload[key]}`;
        });

        payload = flatPayload;
      }

      const axiosOpts = {};
      try {
        if (parseURL(webhookUrl).scheme === 'https') {
          const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
          if (httpsProxy && parseURL(httpsProxy).scheme === 'http') {
            const httpsProxyAgent = new HttpsProxyAgent(httpsProxy);
            axiosOpts.httpsAgent = httpsProxyAgent;

            // Use configured tunnel above instead of default axios proxy setup from env vars
            axiosOpts.proxy = false;
          }
        }
      } catch (err) {
        console.log('failed to configure https proxy agent for http proxy. Using default axios configuration', err);
      }

      try {
        await axios.post(webhookUrl, payload, axiosOpts);
      } catch (err) {
        console.log('axios post failed, double check the payload being sent includes the keys Slack expects');
        if ('toJSON' in err) {
          console.error(JSON.stringify(err.toJSON()));
        }
        console.error(`Attempted to POST payload: ${JSON.stringify(payload)}`);

        if (err.response) {
          core.setFailed(err.response.data);
        } else {
          core.setFailed(err.message);
        }
        return;
      }
    }

    const time = (new Date()).toTimeString();
    core.setOutput('time', time);
  } catch (error) {
    core.setFailed(error);
  }
};
