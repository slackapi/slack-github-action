# Sending data as a message with a Slack incoming webhook URL

This technique uses this Action to post a message to a channel or direct message with [incoming webhooks](/messaging/sending-messages-using-incoming-webhooks) and a Slack app.

Incoming webhooks follow the same [formatting](/apis/) patterns as other Slack messaging APIs. Posted messages can be as short as a single line of text, include additional interactivity with [interactive components](/messaging/creating-interactive-messages), or be formatted with [Block Kit](/block-kit/) to build visual components.

## Setup

Gather a Slack incoming webhook URL:

1. [Create a Slack app](https://api.slack.com/apps/new) for your workspace or use an existing app.
2. Add the [`incoming-webhook`](/reference/scopes/incoming-webhook) bot scope under **OAuth & Permissions** page on [app settings](https://api.slack.com/apps).
3. Install the app to your workspace and select a channel to notify from the **Install App** page.
4. Create additional webhooks from the **Incoming Webhooks** page.
5. Add the generated incoming webhook URL as [a repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `SLACK_WEBHOOK_URL`.
6. [Add this Action as a step](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps) to your GitHub workflow and provide an input payload to send as a message.

The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/services/T0123456789/B1001010101/7IsoQTrixdUtE971O1xQTm4T
```

## Usage

Add the collected webhook from above to a GitHub workflow and configure the step using [`mrkdwn`](/messaging/formatting-message-text) formatting values for a message or [Block Kit](/block-kit/) blocks:

```yaml
- name: Post a message in a channel
  uses: slackapi/slack-github-action@v3.0.4
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

## Expected outputs

The technique, like all Slack Github Action techniques, [outputs values](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs) that can be used as inputs in following steps of a GitHub workflow.

The following outputs are returned with each of the techniques:

| Output | Type  | Description|
|---|---|---|
|`time` | `number` | The Unix [epoch time](https://en.wikipedia.org/wiki/Unix_time) that the step completed.
| `ok` | `boolean` | If the request completed with success.
| `response` | `string` | The [response](/apis/web-api/#responses) from the request as stringified JSON.

## Example workflows

<details>
<summary><strong>Post an inline text message</strong></summary>

This workflow uses incoming webhooks to post a plain text message.

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_3_Slack_Incoming_Webhook/text.yml
```

</details>

<details>
<summary><strong>Post an inline block message</strong></summary>

This workflow uses incoming webhooks to post a message with Block Kit.

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_3_Slack_Incoming_Webhook/blocks.yml
```

</details>

<details>
<summary><strong>Post blocks found in a file</strong></summary>

This workflow uses file data when posting to an incoming webhook. It links to the GitHub Actions job in progress.

Payload file being sent

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_3_Slack_Incoming_Webhook/saved.data.json
```

### Workflow 

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_3_Slack_Incoming_Webhook/saved.gha.yml
```

</details>