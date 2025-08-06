---
sidebar_label: Overview
---

# Sending data as a message with a Slack incoming webhook URL

This technique uses this Action to post a message to a channel or direct message with [incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks) and a Slack app.

Incoming webhooks follow the same [formatting](https://docs.slack.dev/apis/) patterns as other Slack messaging APIs. Posted messages can be as short as a single line of text, include additional interactivity with [interactive components](https://docs.slack.dev/messaging/creating-interactive-messages), or be formatted with [Block Kit](https://docs.slack.dev/block-kit/) to build visual components.

## Setup

Gather a Slack incoming webhook URL:

1. [Create a Slack app](https://api.slack.com/apps/new) for your workspace or use an existing app.
2. Add the [`incoming-webhook`](https://docs.slack.dev/reference/scopes/incoming-webhook) bot scope under **OAuth & Permissions** page on [app settings](https://api.slack.com/apps).
3. Install the app to your workspace and select a channel to notify from the **Install App** page.
4. Create additional webhooks from the **Incoming Webhooks** page.
5. Add the generated incoming webhook URL as [a repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `SLACK_WEBHOOK_URL`.
6. [Add this Action as a step](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps) to your GitHub workflow and provide an input payload to send as a message.

The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/services/T0123456789/B1001010101/7IsoQTrixdUtE971O1xQTm4T
```

## Usage

Add the collected webhook from above to a GitHub workflow and configure the step using [`mrkdwn`](https://docs.slack.dev/messaging/formatting-message-text) formatting values for a message or [Block Kit](https://docs.slack.dev/block-kit/) blocks:

```yaml
- name: Post a message in a channel
  uses: slackapi/slack-github-action@v2.1.1
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: incoming-webhook
    payload: |
      text: "*GitHub Action build result*: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
      blocks:
        - type: "section"
          text:
            type: "mrkdwn"
            text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
```

## Example workflows

* [**Post an inline text message**](/tools/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-inline-text-message)
* [**Post an inline block message**](/tools/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-inline-block-message)
* [**Post blocks found in a file**](/tools/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-blocks-found-in-file)