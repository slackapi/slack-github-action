# Example workflow: manage collaborators

This workflow adds or removes an app collaborator using a manually triggered workflow.

This example combines the Slack API technique ([`users.lookupByEmail`](https://docs.slack.dev/reference/methods/users.lookupByEmail), [`chat.postMessage`](https://docs.slack.dev/reference/methods/chat.postMessage)) with the CLI technique ([`collaborators add`](https://docs.slack.dev/tools/slack-cli/reference/commands/slack_collaborators_add)/[`remove`](https://docs.slack.dev/tools/slack-cli/reference/commands/slack_collaborators_remove)) to look up a user by email, update collaborators, and post a confirmation message.

## Files

### GitHub Actions workflow

```js reference
https://github.com/slackapi/slack-github-action/blob/main/example-workflows/Technique_4_Slack_CLI_Command/collaborators.yml
```
