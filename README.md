# Slack GitHub Action

Send data into Slack using this GitHub Action! This package has two different techniques to send data to Slack:

1) Send data to Slack's Workflow Builder (requires a paid Slack instance).
2) Send data via a Slack app to post to a specific channel (use an existing custom app or create a new one).

The recommended way to use this action is with Slack's Workflow Builder (if you're on a paid Slack plan). 

## Slack Workflow Builder Route

Sending data to [Slack's Workflow builder](https://slack.com/intl/en-ca/features/workflow-automation) is the recommended way to use this action. This action will send data into Slack via a webhook URL. Follow [these steps to create a Slack workflow using webhooks](https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks). The Slack workflow webhook url will be in the form of `https://hooks.slack.com/workflows/....`. The payload sent by this GitHub action will be flattened (all nested keys moved top level) and stringified since Slack's workflow builder only supports top level string values in payloads. 

You need to define expected variables in the payload the webhook will receive. If these variables are missing in the payload, an error is returned. 

### Setup

* [Create a Slack workflow webhook](https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks)
* Copy the webhook URL (`https://hooks.slack.com/workflows/....`) and [add it as a secret in your repo settings](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) named `SLACK_WEBHOOK_URL`.
* Add a step to your GitHub action to send data to your Webhook
* Configure your Slack workflow to use variables from the incoming payload from the GitHub Action. You can select where you want to post the data and how you want to format it in Slack's worflow builder interface. 

### Usage

```
- name: Send GitHub Action trigger data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.14.0
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

or

```
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.14.0
  with:
    payload: "{\"key\":\"value\",\"foo\":\"bar\"}" # This data can be any valid JSON from a previous step in the GitHub Action
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Slack App Route

This route allows 

## Setup

* [Create a slack app]() for your workspace (alternatively use an existing app you have already created and installed)
  * Add the `chat.write` scope under **OAuth & Permissions**
* Install the app to your workspace

### Usage

```
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v1.14.0
  with:
    channel-id: 'CHANNEL_ID'  # Slack channel id to post message
    slack-message: 'posting from a github action!'
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Contributing

See [CONTRIBUTING](.github/contributing.md).

## License

See [LICENSNE](LICENSE).