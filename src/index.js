const core = require('@actions/core');
const slackSend = require('./slack-send');

slackSend(core);
