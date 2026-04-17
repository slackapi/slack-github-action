# Sending data using a Slack API method

A bot token or user token or [token of some other kind](/authentication/tokens) must be used to call one of [the Slack API methods](/reference/methods) with this technique.

## Setup

Different [Slack API methods](/reference/methods) require different [scopes](/reference/scopes), but setup should be similar for all methods:

1. [Create a Slack app](https://api.slack.com/apps/new) for your workspace or use an existing app.
2. Depending on the Slack API [method](/reference/methods) you wish to call, add the required **scopes** to your app under the **OAuth & Permissions** page on [app settings](https://api.slack.com/apps).
3. Install the app to your workspace using the **Install App** page.
4. Once your app is installed to a workspace, a new [token](/authentication/tokens) with your app's specified scopes will be minted for that workspace. It is worth noting that tokens are only valid for a single workspace! Find the token on the **OAuth & Permissions** page.
5. Add the token as [a repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `SLACK_BOT_TOKEN` or something similar and memorable.
6. [Add this Action as a step](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps) to your GitHub workflow and provide an input payload to send to the method.

Methods that require an app configuration token should gather this token from the [app configuration token](/app-manifests/configuring-apps-with-app-manifests#config-tokens) settings instead of from a specific app since this token is associated with the workspace.

## Usage

Choosing inputs for these steps is left as an exercise for the actioneer since each of the Slack API methods requires certain values and specific parameters, but these snippets might be helpful when starting.

### Posting a message with text

Posting a message with the [`chat.postMessage`](/reference/methods/chat.postMessage) method can be achieved by adding this step to a job in your GitHub workflow and inviting the bot associated with your app to the channel for posting:

```yaml
- name: Post text to a Slack channel
  uses: slackapi/slack-github-action@v3.0.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "howdy <!channel>!"
```

### Posting a message with blocks

More complex message layouts, such as messages made with [Block Kit](/block-kit/) blocks, can also be sent with one of the Slack API methods:

```yaml
- name: Post blocks to a Slack channel
  uses: slackapi/slack-github-action@v3.0.1
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

Updating a message after it's posted can be done with the [`chat.update`](/reference/methods/chat.update) method and chaining multiple steps together using outputs from past steps as inputs to current ones:

```yaml
- name: Initiate the deployment launch sequence
  id: launch_sequence
  uses: slackapi/slack-github-action@v3.0.1
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
  uses: slackapi/slack-github-action@v3.0.1
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

Posting [threaded replies to a message](/messaging/#threading) from a past job can be done by including the `thread_ts` attribute of the parent message in the `payload`:

```yaml
- name: Initiate a deployment
  uses: slackapi/slack-github-action@v3.0.1
  id: deployment_message
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
- name: Conclude the deployment
  uses: slackapi/slack-github-action@v3.0.1
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      thread_ts: "${{ steps.deployment_message.outputs.ts }}"
      text: "Deployment finished! :rocket:"
```

### Uploading a file

Calling [a Slack API method](/reference/methods) with [`@slack/web-api`](/tools/node-slack-sdk/web-api/) makes [uploading a file](/messaging/working-with-files#uploading_files) just another API call with all of the convenience of the [`files.uploadV2`](/tools/node-slack-sdk/web-api/#upload-a-file) method:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v3.0.1
  with:
    method: files.uploadV2
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel_id: ${{ secrets.SLACK_CHANNEL_ID }}
      initial_comment: "the results are in!"
      file: "./path/to/results.out"
      filename: "results-${{ github.sha }}.out"
```

## Expected outputs

The technique, like all Slack Github Action techniques, [outputs values](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs) that can be used as inputs in following steps of a GitHub workflow.

The following outputs are returned with each of the techniques:

| Output | Type  | Description|
|---|---|---|
|`time` | `number` | The Unix [epoch time](https://en.wikipedia.org/wiki/Unix_time) that the step completed.
| `ok` | `boolean` | If the request completed with success.
| `response` | `string` | The [response](/apis/web-api/#responses) from the request as stringified JSON.

While these outputs are returned with certain Slack API methods:

| Output | Type  | Description|
|---|---|---|
|`channel_id` | `string` | The [channel ID](/reference/objects/conversation-object) included in the response.
| `ts`| `string` | The [timestamp](/messaging/retrieving-messages#individual_messages) of the Slack event or message.
| `thread_ts` | `string` | The [timestamp](/messaging/retrieving-messages#individual_messages) of a parent Slack message with [threaded replies](/messaging/retrieving-messages#pulling_threads).

## Example workflows

<details>
<summary><strong>Direct message the author</strong></summary>

This workflow sends a direct message to the user that pushed the most recent commits. It does so by grabbing the email of the pusher.

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_2_Slack_API_Method/author.yml
```

</details>

<details>
<summary><strong>Invite a usergroup to channel</strong></summary>

This workflow creates a channel after a bug is reported and add members of a usergroup by chaining multiple Slack API method calls together.


```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_2_Slack_API_Method/invite.yml
```

</details>
