---
sidebar_label: Overview
---

# Sending techniques

This GitHub Action offers three different techniques to send data to Slack:

* [Send data with a webhook to start a workflow in Workflow Builder](/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow).
* [Send data using a Slack API method and a secret token with required scopes](/slack-github-action/sending-techniques/sending-data-slack-api-method/).
* [Send data as a message with a Slack incoming webhook URL](/slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/). 

## Expected outputs

Each technique above [outputs values](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs) that can be used as inputs in following steps of a GitHub workflow.

The following outputs are returned with each of the techniques:

| Output | Type  | Description|
|---|---|---|
|`time` | `number` | The Unix [epoch time](https://en.wikipedia.org/wiki/Unix_time) that the step completed.
| `ok` | `boolean` | If the request completed with success.
| `response` | `string` | The [response](https://docs.slack.dev/apis/web-api/#responses) from the request as stringified JSON.

While these outputs are returned with certain Slack API methods:

| Output | Type  | Description|
|---|---|---|
|`channel_id` | `string` | The [channel ID](https://docs.slack.dev/reference/objects/conversation-object) included in the response.
| `ts`| `string` | The [timestamp](https://docs.slack.dev/messaging/retrieving-messages#individual_messages) of the Slack event or message.
| `thread_ts` | `string` | The [timestamp](https://docs.slack.dev/messaging/retrieving-messages#individual_messages) of a parent Slack message with [threaded replies](https://docs.slack.dev/messaging/retrieving-messages#pulling_threads).

## Example responses

The following snippet shows how multiple steps can be chained together to create a Slack channel before posting a message:

```yaml
- name: Create a new Slack channel for recent changes
  id: conversation
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: conversations.create
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      name: pull-request-review-${{ github.sha }}
- name: Send the pull request link into the Slack channel
  if: ${{ steps.conversation.outputs.ok }}
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ steps.conversation.outputs.channel_id }}
      text: "A PR was created <!date^${{ steps.conversation.outputs.time }}^{date_num} at {time_secs}|just now>: ${{ github.event.pull_request.html_url }}"
```
