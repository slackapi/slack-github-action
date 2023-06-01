const { assert } = require('chai');
const sinon = require('sinon');
const rewiremock = require('rewiremock/node');

/* eslint-disable-next-line global-require */
rewiremock(() => require('@slack/web-api')).with({
  WebClient: class {
    constructor(token, options) {
      this.token = token;
      this.options = options || {};
    }
  },
});
rewiremock.enable();
const { createWebClient } = require('../src/web-client');

rewiremock.disable();

describe('web-client', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should create WebClient with an https proxy agent if given a proxy URL', async () => {
    const web = createWebClient('xoxb-xxxxx', 'http://test.proxy:8080/');
    assert.equal(typeof web.options.agent, 'object');
  });

  it('should create WebClient with default settings if not given a proxy URL', async () => {
    const web = createWebClient('xoxb-xxxxx');
    assert.equal(web.options.agent, undefined);
  });
});
