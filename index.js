const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
const flatten = require('flat');
const axios = require('axios');



try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');

    const botToken = process.env.SLACK_BOT_TOKEN;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    console.log('botToken', botToken)
    console.log('webhookUrl', webhookUrl)

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    console.log(`The event payload: ${JSON.stringify(payload, undefined, 2)}`);

    if (botToken) {
        const message = core.getInput('slack-message');
        const channelId = core.getInput('channel-id');
        console.log('message', message)
        console.log('channelId', channelId)

        const web = new WebClient(botToken);

        if(channelId === undefined) {
            console.log('no channel ID error')
            throw 'no channel Id supplied';
        }

        // post message
        web.chat.postMessage({text: message, channel: channelId})
    } else if (webhookUrl) {
        // send flat payload to webhookUrl
        const flatPayload = flatten(payload);

        // workflow builder requires values to be strings
        // iterate over every value and convert it to string
        Object.keys(flatPayload).forEach((key) => {
            flatPayload[key] = '' + flatPayload[key];
        })

        // console.log(flatPayload);
        // console.log(req.path);

        axios.post(webhookUrl, flatPayload)
    } else {
        console.log('should throw error');
        throw 'could not post';
    }

    

    console.log(`Hello ${nameToGreet}!`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);

    } catch (error) {
    core.setFailed(error.message);
}