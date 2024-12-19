# Technique 2: Slack API method

A [token][tokens], such as a bot or user token, must be used to call one of
[the Slack API methods][methods] with this technique.

## Setup

For details on how to set up this technique in GitHub Actions, read the
[`README.md`][setup].

## Example workflows

1. [**Direct message the author**](#direct-message-the-author): Write to the
   Slack user with a matching email.
2. [**Invite a usergroup to channel**](#invite-a-usergroup-to-channel): Create a
   channel and invite members.

### Direct message the author

Send a direct message to the user that pushed the most recent commits.

This example uses the email of the pusher to find the user to send a message to.

**Related files**:

- [`author.yml`](./author.yml): GitHub Actions workflow.

### Invite a usergroup to channel

Create a channel after a bug is reported and add members of a usergroup.

This example chains multiple Slack API methods together to help fix bugs fast.

**Related files**:

- [`invite.yml`](./invite.yml): GitHub Actions workflow.

[methods]: https://api.slack.com/methods
[setup]: https://github.com/slackapi/slack-github-action?tab=readme-ov-file#technique-2-slack-api-method
[tokens]: https://api.slack.com/concepts/token-types
