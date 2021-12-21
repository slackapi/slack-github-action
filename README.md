# Slack Send GitHub Action

Send data into Slack using this GitHub Action! This package has three different techniques to send data to Slack:

1) Send data to Slack's Workflow Builder (requires a paid Slack instance).
2) Send data via a Slack app to post to a specific channel (use an existing custom app or create a new one).
3) Send data via a Slack Incoming Webhook URL (use an existing custom app or create a new one).

The recommended way to use this action is with Slack's Workflow Builder (if you're on a paid Slack plan).

## Technique 1: Slack Workflow Builder

> ❗️ This approach requires a paid Slack plan

Sending data to [Slack's Workflow builder](https://slack.com/features/workflow-automation) is the recommended way to use this action. This action will send data into Slack via a webhook URL. Follow [these steps to create a Slack workflow using webhooks][create-webhook]. The Slack workflow webhook URL will be in the form `https://hooks.slack.com/workflows/....`. The payload sent by this GitHub action will be flattened (all nested keys moved to the top level) and stringified since Slack's workflow builder only supports top level string values in payloads.

As part of the [workflow setup](https://slack.com/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks#workflow-setup),
you will need to define expected variables in the payload the webhook will receive (described in the "Create custom variables" section of the docs). If these variables are missing in the payload, an error is returned.

### Setup

* [Create a Slack workflow webhook][create-webhook].
* Copy the webhook URL (`https://hooks.slack.com/workflows/....`) and [add it as a secret in your repo settings][repo-secret] named `SLACK_WEBHOOK_URL`.
* Add a step to your GitHub action to send data to your Webhook.
* Configure your Slack workflow to use variables from the incoming payload from the GitHub Action. You can select where you want to post the data and how you want to format it in Slack's worflow builder interface.

### Usage

Add this Action as a [step][job-step] to your project's GitHub Action Workflow file:

```
- name: Send GitHub Action trigger data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.16.0
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

or

```
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.16.0
  with:
    payload: "{\"key\":\"value\",\"foo\":\"bar\"}" # This data can be any valid JSON from a previous step in the GitHub Action
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Technique 2: Slack App

By creating a new Slack app or using an existing one, this approach allows your GitHub Actions job to post a message in a Slack channel or direct message by utilizing the [chat.postMessage](https://api.slack.com/methods/chat.postMessage) API method. Using this approach you can instantly post a message without setting up Slack workflows.

## Setup

* [Create a Slack App][apps] for your workspace (alternatively use an existing app you have already created and installed).
* Add the [`chat.write`](https://api.slack.com/scopes/chat:write) bot scope under **OAuth & Permissions**.
* Install the app to your workspace.
* Copy the app's Bot Token from the **OAuth & Permissions** page and [add it as a secret in your repo settings][repo-secret] named `SLACK_BOT_TOKEN`.
* Invite the bot user into the channel you wish to post messages to (`/invite @bot_user_name`).

### Usage

Add this Action as a [step][job-step] to your project's GitHub Action Workflow file:

```
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v1.16.0
  with:
    channel-id: 'CHANNEL_ID'  # Slack channel id or user id to post message. https://api.slack.com/methods/chat.postMessage#channels
    slack-message: 'posting from a github action!'
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Technique 3: Slack Incoming Webhook

This approach allows your GitHub Actions job to post a message to a Slack channel or direct message by utilizing [Incoming Webhooks](https://api.slack.com/messaging/webhooks).

Incoming Webhooks conform to the same rules and functionality as any of Slack's other messaging APIs. You can make your posted messages as simple as a single line of text, or make them really useful with [interactive components](https://api.slack.com/messaging/interactivity). To make the message more expressive and useful use [Block Kit](https://api.slack.com/block-kit) to build and test visual components.

## Setup

* [Create a Slack App][apps] for your workspace (alternatively use an existing app you have already created and installed).
* Add the [`incoming-webhook`](https://api.slack.com/scopes/incoming-webhook) bot scope under **OAuth & Permissions**.
* Install the app to your workspace (you will select a channel to notify).
* Activate and create a new webhook under **Incoming Webhooks**.
* Copy the Webhook URL from the Webhook you just generated [add it as a secret in your repo settings][repo-secret] named `SLACK_WEBHOOK_URL`.

### Usage

```
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.16.0
  with:
    payload: "{\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"You have a new request: \"}},{\"type\":\"section\",\"fields\":[{\"type\":\"mrkdwn\",\"text\":\"*Type:* Computer (laptop)\"},{\"type\":\"mrkdwn\",\"text\":\"*When:* Submitted Aut 10\"}]}]}"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

## Contributing

See [CONTRIBUTING](.github/contributing.md).

## License

See [LICENSE](LICENSE).

[create-webhook]: https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[repo-secret]: https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository
[apps]: https://api.slack.com/apps
