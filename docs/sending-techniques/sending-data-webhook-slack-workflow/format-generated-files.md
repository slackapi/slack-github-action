# Example workflow: format generated files

This workflow converts build outputs from earlier GitHub Action steps into a Slack message.

This example uses data from a payload file to [send a message](https://tools.slack.dev/deno-slack-sdk/reference/slack-functions/send_message) to a hardcoded channel.

## Files

### Payload file being sent 

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.data.json
```

### GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.gha.yml
```

### Slack app manifest

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.manifest.json
```

### Slack webhook trigger

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_1_Slack_Workflow_Builder/builds.trigger.json
```
