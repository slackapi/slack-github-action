# Sending data via a webhook to start a Slack workflow

:::info[This technique requires [a Slack paid plan](https://slack.com/pricing) to use Workflow Builder.]
:::

This technique sends data to Slack using a webhook to start a workflow created using Slack [Workflow Builder](https://slack.com/features/workflow-automation).

## Setup

Start in Slack to create a Slack workflow:

1. [Create a Slack workflow](https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack) that starts from a webhook.
2. Copy the webhook URL and [add it as a repository secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) called `SLACK_WEBHOOK_URL`.
3. [Add this Action as a step](https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps) to your GitHub workflow and provide an input payload to send to the webhook.
4. Configure your Slack workflow to use the payload variables sent from the GitHub Action. You can then update the steps of the Slack workflow to use these values in creative and clever ways.

The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/triggers/T0123456789/3141592653589/c6e6c0d868b3054ca0f4611a5dbadaf
```

## Usage

Update the input payloads sent from this GitHub Action to your Slack workflow using the following options:

### Sending values from the default GitHub event context

In the example below, the default GitHub event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) and event [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) associated with the job that started the GitHub workflow are sent to the provided webhook URL:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v3.0.3
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

Accessing variables sent to [Workflow Builder](https://slack.com/features/workflow-automation) with a webhook require that the payload variables are flattened with stringified values. Nested variables in the provided payload can be both flattened and also stringified with the `payload-delimiter` option or changed with other [configurations](/tools/slack-github-action/additional-configurations) to match this format expected from Workflow Builder.

### Providing parsed payload information as strings

Provided input values for payload information are sent to the webhook URL after the job is started:

```yaml
- name: Send custom event details to a Slack workflow
  uses: slackapi/slack-github-action@v3.0.3
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
    payload: |
      status: "${{ job.status }}"
      option: "false"
```

### Gathering details of the payload from a saved file

Input values for the payload to be sent can also be provided in a file, either in JSON or YAML format:

```yaml
- name: Send a saved artifact to a Slack workflow
  uses: slackapi/slack-github-action@v3.0.3
  with:
    payload-file-path: "./artifacts.json"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

### Flattening nested payloads

Variables and data provided in the payload might contain nested fields that need to be flattened before being sent with a [webhook trigger](/tools/slack-github-action/sending-data-webhook-slack-workflow) to match the expected input format of [Workflow Builder](https://slack.com/features/workflow-automation).

The `payload-delimiter` option will flatten the input payload using the provided delimiter and will also make values stringified:

```yaml
- name: Flatten the default GitHub payload
  uses: slackapi/slack-github-action@v3.0.3
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

Reference to the flattening implementation is available for exploration from within the [`flat`](https://www.npmjs.com/package/flat) package.


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
<summary><strong>Format generated files</strong></summary>

This workflow converts build outputs from earlier GitHub Action steps into a Slack message.

This example uses data from a payload file to [send a message](/tools/deno-slack-sdk/reference/slack-functions/send_message/) to a hardcoded channel.

Payload file being sent

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.data.json
```

GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.gha.yml
```

Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.manifest.json
```

Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.trigger.json
```

</details>

<details>
<summary><strong>Post release announcements</strong></summary>

This workflow allows you to select a channel to post news about the most recent release to.

This example uses [Slack functions](/tools/deno-slack-sdk/guides/creating-slack-functions/) and inline inputs to do the following:

1. Open a form to select a channel.
2. Send a message to the selected channel.
3. React with a `:tada:` emoji.

GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.gha.yml
```

Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.manifest.json
```

Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.trigger.json
```

</details>

<details>
<summary><strong>Update a channel topic</strong></summary>

This workflow shows the latest commit status in the header of a channel.

This example uses the default GitHub event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) and [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) to [update a channel topic](/tools/deno-slack-sdk/reference/slack-functions/update_channel_topic/).

GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.gha.yml
```

Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.manifest.json
```

Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.trigger.json
```

</details>