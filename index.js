const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
const flatten = require('flat');
const axios = require('axios');

try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    let payload = core.getInput('payload');

    if (botToken === undefined && webhookUrl === undefined) {
        throw 'Need to provide at least one botToken or webhookUrl'
    }

    if (typeof botToken !== 'undefined' && botToken.length > 0) {
        const message = core.getInput('slack-message');
        const channelId = core.getInput('channel-id');
        const web = new WebClient(botToken);

        if(channelId.length > 0 && message.length > 0) {
            // post message
            web.chat.postMessage({text: message, channel: channelId});
        } else {
            console.log('missing either channel-id or slack-message! Did not send a message via chat.postMessage with botToken');
        }
    } 
    
    if (typeof webhookUrl !== 'undefined' && webhookUrl.length > 0) {

        if (payload.length < 1) {
            // No Payload was passed in
            console.log('no custom payload was passed in, using default payload that triggered the GitHub Action')
            // Get the JSON webhook payload for the event that triggered the workflow
            payload = github.context.payload;
        } else {
            try {
                // confirm it is valid json
                payload = JSON.parse(payload);
            } catch (e) {
                // passed in payload wasn't valid json
                console.error("passed in payload was invalid JSON")
                throw 'Need to provide valid JSON payload'
            }
        }

        // flatten JSON payload (no nested attributes)
        const flatPayload = flatten(payload);

        // workflow builder requires values to be strings
        // iterate over every value and convert it to string
        Object.keys(flatPayload).forEach((key) => {
            flatPayload[key] = '' + flatPayload[key];
        })

        axios.post(webhookUrl, flatPayload).then(response => {
            // Successful post!
        }).catch(err => {
            console.log("axios post failed, double check the payload being sent includes the keys Slack expects")
            console.log(payload)
            console.log(err)
            throw err
        })
    }

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);

} catch (error) {
    core.setFailed(error.message);
}
