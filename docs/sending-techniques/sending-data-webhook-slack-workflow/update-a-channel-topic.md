# Example workflow: update a channel topic

This workflow shows the latest commit status in the header of a channel.

This example uses the default GitHub event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) and [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) to [update a channel topic](https://tools.slack.dev/deno-slack-sdk/reference/slack-functions/update_channel_topic).

## Related files

### GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.gha.yml
```

### Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.manifest.json
```

### Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/topic.trigger.json
```