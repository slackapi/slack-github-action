# Example workflow: post release announcements

This workflow allows you to select a channel to post news about the most recent release to.

This example uses [Slack functions](https://tools.slack.dev/deno-slack-sdk/guides/creating-slack-functions) and inline inputs to do the
following:

1. Open a form to select a channel.
2. Send a message to the selected channel.
3. React with a `:tada:` emoji.

## Files

### GitHub Actions workflow 

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.gha.yml
```

#### Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.manifest.json
```

### Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/announcements.trigger.json
```