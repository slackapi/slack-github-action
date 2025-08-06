---
sidebar_label: Overview
---

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
  uses: slackapi/slack-github-action@v2.1.1
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
  uses: slackapi/slack-github-action@v2.1.1
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
  uses: slackapi/slack-github-action@v2.1.1
  with:
    payload-file-path: "./artifacts.json"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

## Example workflows

* [**Format generated files**](/tools/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/format-generated-files): Message outputs from prior steps.
* [**Post release announcements**](/tools/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/post-release-announcements): Share releases to a channel.
* [**Update a channel topic**](/tools/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/update-a-channel-topic): Highlight the current build status.