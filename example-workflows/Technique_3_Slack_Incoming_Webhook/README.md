# Technique 3: Slack incoming webhook

This technique uses this Action to post a message to a channel or direct message
with [incoming webhooks][incoming-webhook] and a Slack app.

Incoming webhooks follow the same [formatting][formatting] patterns as other
Slack messaging APIs. Posted messages can be as short as a single line of text,
include additional interactivity with [interactive components][interactivity],
or be formatted with [Block Kit][block-kit] to build visual components.

## Setup

For details on how to setup this technique in GitHub Actions, read the [setup][setup] section of the docs.

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

[block-kit]: https://docs.slack.dev/messaging/#complex_layouts
[formatting]: https://docs.slack.dev/messaging/formatting-message-text/
[incoming-webhook]: https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/
[interactivity]: https://docs.slack.dev/messaging/creating-interactive-messages/
[setup]: https://docs.slack.dev/tools/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/
