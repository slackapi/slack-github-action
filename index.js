const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
const flatten = require('flat');
const axios = require('axios');

const SLACK_WEBHOOK_TYPES = {
    WORKFLOW_TRIGGER: 'WORKFLOW_TRIGGER',
    INCOMING_WEBHOOK: 'INCOMING_WEBHOOK'
}

try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    let webhookType = SLACK_WEBHOOK_TYPES.WORKFLOW_TRIGGER;

    if(process.env.SLACK_WEBHOOK_TYPE) {
        // The default type is for Workflow Builder triggers. If you want to use this action for Incoming Webhooks, use the corresponding type instead.
        webhookType = process.env.SLACK_WEBHOOK_TYPE.toUpperCase()
    }

    let payload = core.getInput('payload');

    if (botToken === undefined && webhookUrl === undefined) {
        throw 'Need to provide at least one botToken or webhookUrl'
    }

    if (payload) {
        try {
            // confirm it is valid json
            payload = JSON.parse(payload);
        } catch (e) {
            // passed in payload wasn't valid json
            console.error("passed in payload was invalid JSON")
            throw 'Need to provide valid JSON payload'
        }
    }

    if (typeof botToken !== 'undefined' && botToken.length > 0) {
        const message = core.getInput('slack-message');
        const channelIds = core.getInput('channel-id');
        const web = new WebClient(botToken);


        if (channelIds.length > 0 && (message.length > 0 || payload)) {
            // post message
            channelIds.split(",").map(channelId => web.chat.postMessage({ channel: channelId, text: message, ...(payload || {}) }));

        } else {
            console.log('missing either channel-id, slack-message or payload! Did not send a message via chat.postMessage with botToken');
        }
    }

    if (typeof webhookUrl !== 'undefined' && webhookUrl.length > 0) {

        if (!payload) {
            // No Payload was passed in
            console.log('no custom payload was passed in, using default payload that triggered the GitHub Action')
            // Get the JSON webhook payload for the event that triggered the workflow
            payload = github.context.payload;
        }

        if (webhookType === SLACK_WEBHOOK_TYPES.WORKFLOW_TRIGGER) {
            // flatten JSON payload (no nested attributes)
            const flatPayload = flatten(payload);

            // workflow builder requires values to be strings
            // iterate over every value and convert it to string
            Object.keys(flatPayload).forEach((key) => {
                flatPayload[key] = '' + flatPayload[key];
            })

            payload = flatPayload;
        }

        axios.post(webhookUrl, payload).then(response => {
            // Successful post!
        }).catch(err => {
            console.log("axios post failed, double check the payload being sent includes the keys Slack expects")
            console.log(payload);
            // console.log(err);

            if (err.response) {
                core.setFailed(err.response.data);
            }

            core.setFailed(err.message);
        })
    }

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);

} catch (error) {
    core.setFailed(error);
}
