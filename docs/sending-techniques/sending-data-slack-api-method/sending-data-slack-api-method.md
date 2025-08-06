---
sidebar_label: Overview
---

# Sending data using a Slack API method

A bot token or user token or [token of some other kind](https://docs.slack.dev/authentication/tokens) must be used to call one of [the Slack API methods](https://docs.slack.dev/reference/methods) with this technique.

## Setup

Different [Slack API methods](https://docs.slack.dev/reference/methods) require different [scopes](https://docs.slack.dev/reference/scopes), but setup should be similar for all methods:

1. [Create a Slack app](https://api.slack.com/apps/new) for your workspace or use an existing app.
2. Depending on the Slack API [method](https://docs.slack.dev/reference/methods) you wish to call, add the required **scopes** to your app under the **OAuth & Permissions** page on [app settings](https://api.slack.com/apps).
3. Install the app to your workspace using the **Install App** page.
4. Once your app is installed to a workspace, a new [token](https://docs.slack.dev/authentication/tokens) with your app's specified scopes will be minted for that workspace. It is worth noting that tokens are only valid for a single workspace! Find the token on the **OAuth & Permissions** page.
5. Add the token as [a repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `SLACK_BOT_TOKEN` or something similar and memorable.
6. [Add this Action as a step](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps) to your GitHub workflow and provide an input payload to send to the method.

Methods that require an app configuration token should gather this token from the [app configuration token](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests#config-tokens) settings instead of from a specific app since this token is associated with the workspace.

## Usage

Choosing inputs for these steps is left as an exercise for the actioneer since each of the Slack API methods requires certain values and specific parameters, but these snippets might be helpful when starting.

### Posting a message with text

Posting a message with the [`chat.postMessage`](https://docs.slack.dev/reference/methods/chat.postMessage) method can be achieved by adding this step to a job in your GitHub workflow and inviting the bot associated with your app to the channel for posting:

```yaml
- name: Post text to a Slack channel
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "howdy <!channel>!"
```

### Posting a message with blocks

More complex message layouts, such as messages made with [Block Kit](https://docs.slack.dev/block-kit/) blocks, can also be sent with one of the Slack API methods:

```yaml
- name: Post blocks to a Slack channel
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
      blocks:
        - type: "section"
          text:
            type: "mrkdwn"
            text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
```

### Updating a message

Updating a message after it's posted can be done with the [`chat.update`](https://docs.slack.dev/reference/methods/chat.update) method and chaining multiple steps together using outputs from past steps as inputs to current ones:

```yaml
- name: Initiate the deployment launch sequence
  id: launch_sequence
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
      attachments:
        - color: "dbab09"
          fields:
            - title: "Status"
              short: true
              value: "In Progress"
- name: Countdown until launch
  run: sleep 10
- name: Update the original message with success
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.update
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      ts: "${{ steps.launch_sequence.outputs.ts }}"
      text: "Deployment finished! :rocket:"
      attachments:
        - color: "28a745"
          fields:
            - title: "Status"
              short: true
              value: "Completed"
```

### Replying to a message

Posting [threaded replies to a message](https://docs.slack.dev/messaging/#threading) from a past job can be done by including the `thread_ts` attribute of the parent message in the `payload`:

```yaml
- name: Initiate a deployment
  uses: slackapi/slack-github-action@v2.1.1
  id: deployment_message
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
- name: Conclude the deployment
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      thread_ts: "${{ steps.deployment_message.outputs.ts }}"
      text: "Deployment finished! :rocket:"
```

### Uploading a file

Calling [a Slack API method](https://docs.slack.dev/reference/methods) with [`@slack/web-api`](https://tools.slack.dev/node-slack-sdk/web-api) makes [uploading a file](https://docs.slack.dev/messaging/working-with-files#uploading_files) just another API call with all of the convenience of the [`files.uploadV2`](https://tools.slack.dev/node-slack-sdk/web-api/#upload-a-file) method:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: files.uploadV2
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel_id: ${{ secrets.SLACK_CHANNEL_ID }}
      initial_comment: "the results are in!"
      file: "./path/to/results.out"
      filename: "results-${{ github.sha }}.out"
```

## Example workflows

* [**Direct message the author**](/tools/slack-github-action/sending-techniques/sending-data-slack-api-method/direct-message-author): Write to the Slack user with a matching email.
* [**Invite a usergroup to channel**](/tools/slack-github-action/sending-techniques/sending-data-slack-api-method/invite-usergroup-to-channel): Create a channel and invite members.
