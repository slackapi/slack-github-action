# Technique 3: Slack incoming webhook

This technique uses this Action to post a message to a channel or direct message
with [incoming webhooks][incoming-webhook] and a Slack app.

Incoming webhooks follow the same [formatting][formatting] patterns as other
Slack messaging APIs. Posted messages can be as short as a single line of text,
include additional interactivity with [interactive components][interactivity],
or be formatted with [Block Kit][block-kit] to build visual components.

## Setup

For details on how to setup this technique in GitHub Actions, read the
[`README.md`][setup].

## Example workflows

1. [Post an inline text message](#post-an-inline-text-message)
2. [Post an inline block message](#post-an-inline-block-message)
3. [Post blocks found in a file](#post-blocks-found-in-a-file)

### Post an inline text message

Write a line of text after a push event is received.

This example uses incoming webhooks to post a plain text message.

**Related files**:

- [`text.yml`](./text.yml): GitHub Actions workflow.

### Post an inline block message

Format a response to recent adventures.

This example uses incoming webhooks to post a message with Block Kit.

**Related files**:

- [`blocks.yml`](./blocks.yml): GitHub Actions workflow.

### Post blocks found in a file

Link to the GitHub Actions job in progress.

This example uses file data when posting to an incoming webhook.

**Related files**:

- [`saved.data.json`](./saved.data.json): Payload file being sent.
- [`saved.gha.yml`](./saved.gha.yml): GitHub Actions workflow.

[block-kit]: https://api.slack.com/surfaces/messages#complex_layouts
[formatting]: https://api.slack.com/reference/surfaces/formatting
[incoming-webhook]: https://api.slack.com/messaging/webhooks
[interactivity]: https://api.slack.com/messaging/interactivity
[setup]: https://github.com/slackapi/slack-github-action?tab=readme-ov-file#technique-3-slack-incoming-webhook
