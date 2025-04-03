# Slack Send GitHub Action

> the GitHub Action for sending data to Slack

[![codecov](https://codecov.io/gh/slackapi/slack-github-action/graph/badge.svg?token=OZNX7FHN78)](https://codecov.io/gh/slackapi/slack-github-action)

Comprehensive documentation is available at [tools.slack.dev/slack-github-action](https://tools.slack.dev/slack-github-action).

Use this GitHub Action to:
* [Send data with a webhook to start a workflow in Workflow Builder](https://tools.slack.dev/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow).
* [Send data using a Slack API method and a secret token with required scopes](https://tools.slack.dev/slack-github-action/sending-techniques/sending-data-slack-api-method/).
* [Send data as a message with a Slack incoming webhook URL](https://tools.slack.dev/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/).

## Project details

### Versioning

We recommend using the latest version of this Action for the most recent updates
and fixes.

Migration guides are available in the [release notes][releases] with breaking
changes noted between versions.

Changes required when upgrading from `@v1` to `@v2` are included in this
[migration guide][v2.0.0].

### License

This project is licensed under the [MIT license](LICENSE).

### Contributing

All contributions are encouraged! Check out the
[contributor's guide][contributing] to learn more.

[apps]: https://api.slack.com/apps
[apps-new]: https://api.slack.com/apps/new
[axios-retry]: https://www.npmjs.com/package/axios-retry
[block-kit]: https://api.slack.com/surfaces/messages#complex_layouts
[chat.postMessage]: https://api.slack.com/methods/chat.postMessage
[chat.update]: https://api.slack.com/methods/chat.update
[chat:write]: https://api.slack.com/scopes/chat:write
[config-tokens]: https://api.slack.com/reference/manifests#config-tokens
[contributing]: .github/contributing.md
[conversation]: https://api.slack.com/types/conversation
[custom-api-url]: https://tools.slack.dev/node-slack-sdk/web-api/#custom-api-url
[epoch]: https://en.wikipedia.org/wiki/Unix_time
[event-context]: https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6
[event-payload]: https://docs.github.com/en/webhooks/webhook-events-and-payloads
[examples]: https://github.com/slackapi/slack-github-action/tree/main/example-workflows
[files.upload]: https://api.slack.com/messaging/files#upload
[files.uploadV2]: https://tools.slack.dev/node-slack-sdk/web-api/#upload-a-file
[flat]: https://www.npmjs.com/package/flat
[formatting]: https://api.slack.com/reference/surfaces/formatting
[github-environment]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables
[github-outputs]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs
[github-variables]: https://docs.github.com/en/actions/learn-github-actions/variables
[incoming-webhook]: https://api.slack.com/messaging/webhooks
[incoming-webhook-scope]: https://api.slack.com/scopes/incoming-webhook
[interactivity]: https://api.slack.com/messaging/interactivity
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[messaging-parents]: https://api.slack.com/messaging/retrieving#finding_threads
[messaging-threads]: https://api.slack.com/messaging/sending#threading
[messaging-timestamp]: https://api.slack.com/messaging/retrieving#individual_messages
[methods]: https://api.slack.com/methods
[mrkdwn]: https://api.slack.com/reference/surfaces/formatting
[plans]: https://slack.com/pricing
[rate-limits]: https://api.slack.com/apis/rate-limits
[releases]: https://github.com/slackapi/slack-github-action/releases
[repo-secret]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository
[response]: https://api.slack.com/web#responses
[retries]: https://tools.slack.dev/node-slack-sdk/web-api/#automatic-retries
[retry-after]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
[scopes]: https://api.slack.com/scopes
[slack-web-api]: https://tools.slack.dev/node-slack-sdk/web-api
[tokens]: https://api.slack.com/concepts/token-types
[v2.0.0]: https://github.com/slackapi/slack-github-action/releases/tag/v2.0.0
[variables]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables
[wfb]: https://slack.com/features/workflow-automation
[wfb-create]: https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack
