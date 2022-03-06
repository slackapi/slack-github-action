const { assert } = require('chai');
const sinon = require('sinon');
const core = require('@actions/core');
const github = require('@actions/github');
const rewiremock = require('rewiremock/node');

const ChatStub = {
  postMessage: sinon.spy(),
};
/* eslint-disable-next-line global-require */
rewiremock(() => require('@slack/web-api')).with({
  WebClient: class {
    constructor(token) {
      this.token = token;
      this.chat = ChatStub;
    }
  },
});
const AxiosMock = {
  post: sinon.stub().resolves(),
};
/* eslint-disable-next-line global-require */
rewiremock(() => require('axios')).with(AxiosMock);
rewiremock.enable();
const slackSend = require('../src/slack-send');

rewiremock.disable();

const ORIG_TOKEN_VAR = process.env.SLACK_BOT_TOKEN;
const ORIG_WEBHOOK_VAR = process.env.SLACK_WEBHOOK_URL;

describe('slack-send', () => {
  const fakeCore = sinon.stub(core);
  const fakeGithub = sinon.stub(github);
  beforeEach(() => {
    sinon.reset();
  });
  after(() => {
    process.env.SLACK_BOT_TOKEN = ORIG_TOKEN_VAR;
    process.env.SLACK_WEBHOOK_URL = ORIG_WEBHOOK_VAR;
  });

  it('should set an error if no webhook URL or token is provided', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_WEBHOOK_URL;
    await slackSend(fakeCore);
    assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'Need to provide at least one botToken or webhook', 'Error set specifying what env vars need to be set.');
  });

  describe('using a bot token', () => {
    beforeEach(() => {
      process.env.SLACK_BOT_TOKEN = 'xoxb-xxxxx';
      delete process.env.SLACK_WEBHOOK_URL;
    });
    describe('happy path', () => {
      it('should send a message using the postMessage API', async () => {
        fakeCore.getInput.withArgs('slack-message').returns('who let the dogs out?');
        fakeCore.getInput.withArgs('channel-id').returns('C123456');
        await slackSend(fakeCore);
        assert.equal(fakeCore.setOutput.lastCall.firstArg, 'time', 'Output name set to time');
        assert(fakeCore.setOutput.lastCall.lastArg.length > 0, 'Time output a non-zero-length string');
        const chatArgs = ChatStub.postMessage.lastCall.firstArg;
        assert.equal(chatArgs.channel, 'C123456', 'Correct channel provided to postMessage');
        assert.equal(chatArgs.text, 'who let the dogs out?', 'Correct message provided to postMessage');
      });

      it('should accept a payload-file-path and use it\'s content in the message', async () => {
        // Prepare
        fakeCore.getInput.withArgs('channel-id').returns('C123456');
        fakeCore.getInput.withArgs('payload-file-path').returns('./test/resources/valid-payload.json');
        fakeGithub.context.actor = 'user123';

        // Run
        await slackSend(fakeCore);

        // Assert
        assert.equal(fakeCore.setOutput.lastCall.firstArg, 'time', 'Output name set to time');
        assert(fakeCore.setOutput.lastCall.lastArg.length > 0, 'Time output a non-zero-length string');
        const chatArgs = ChatStub.postMessage.lastCall.firstArg;
        assert.equal(chatArgs.channel, 'C123456', 'Correct channel provided to postMessage');
        assert.equal(chatArgs.text, '', 'Correct message provided to postMessage');
        assert.equal(chatArgs.bonny, 'clyde', 'Correct message provided to postMessage');
        assert.equal(chatArgs.oliver, 'benji', 'Correct message provided to postMessage');
        assert.equal(chatArgs.actor, 'user123', 'Correct message provided to postMessage');
      });
    });
    describe('sad path', () => {
      it('should set an error if payload cannot be JSON parsed', async () => {
        fakeCore.getInput.withArgs('payload').returns('{not-valid-json');
        await slackSend(fakeCore);
        assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'Need to provide valid JSON', 'Error set specifying JSON was invalid.');
      });

      it('should fail if an invalid payload-file-path is provided', async () => {
        // Prepare
        fakeCore.getInput.withArgs('channel-id').returns('C123456');
        fakeCore.getInput.withArgs('payload-file-path').returns('non-existing-path.json');

        // Run
        await slackSend(fakeCore);

        // Assert
        assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'The payload-file-path may be incorrect. Failed to load the file: non-existing-path.json', 'Error set specifying JSON was invalid.');
      });

      it('should fail if a valid payload-file-path with an invalid JSON is provided', async () => {
        // Prepare
        fakeCore.getInput.withArgs('channel-id').returns('C123456');
        fakeCore.getInput.withArgs('payload-file-path').returns('./test/resources/invalid-payload.json');

        // Run
        await slackSend(fakeCore);

        // Assert
        assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'Need to provide valid JSON payload', 'Error set specifying JSON was invalid.');
      });

      it('should fail if Channel ID is missing', async () => {
        // Run
        await slackSend(fakeCore);

        // Assert
        assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'Channel ID is required to run this action. An empty one has been provided', 'Error set specifying JSON was invalid.');
      });

      it('should fail if payload is missing or empty', async () => {
        // Prepare
        fakeCore.getInput.withArgs('channel-id').returns('C123456');

        // Run
        await slackSend(fakeCore);

        // Assert
        assert.include(fakeCore.setFailed.lastCall.firstArg.message, 'Missing message content, please input a valid payload or message to send. No Message has been send.', 'Error set specifying JSON was invalid.');
      });
    });
  });

  describe('using a webhook URL', () => {
    beforeEach(() => {
      process.env.SLACK_WEBHOOK_URL = 'https://someurl';
      delete process.env.SLACK_BOT_TOKEN;
    });
    describe('happy path', () => {
      const payload = {
        batman: 'robin',
        thor: 'loki',
      };
      beforeEach(() => {
        fakeCore.getInput.withArgs('payload').returns(JSON.stringify(payload));
      });
      it('should post the payload to the webhook URL', async () => {
        await slackSend(fakeCore);
        assert(AxiosMock.post.calledWith('https://someurl', payload));
      });
    });
    describe('sad path', () => {
      it('should set an error if the POST to the webhook fails without a response', async () => {
        AxiosMock.post.rejects(new Error('boom'));
        await slackSend(fakeCore);
        assert.include(fakeCore.setFailed.lastCall.firstArg, 'boom', 'Error set to whatever axios reports as error.');
      });
    });
  });
});
