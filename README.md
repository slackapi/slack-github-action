# Slack GitHub Action

Send data into Slack using this GitHub Action! This package has two different techniques to send data to Slack:

1) Send data to Slack's Workflow Builder (requires a paid Slack instance).
2) Send data via a Slack app to post to a specific channel (use an existing custom app or create a new one).

The recommended way to use this action is with Slack's Workflow Builder (if your on a paid Slack plan). 

## Slack Workflow Builder Route

Sending data to [Slack's Workflow builder](https://slack.com/intl/en-ca/features/workflow-automation) is the recommended way to use this action. This action will flatten and stringify the json payload from GitHub and send it over to a Slack Workflow webhook URL. Follow [these steps to create a Slack workflow using webhooks](https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks). The Slack workflow webhook url will be in the form of `https://hooks.slack.com/workflows/....`. Add this workflow 

### Setup

* [Create a Slack workflow webhook](https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks)
* Copy the webhook URL (`https://hooks.slack.com/workflows/....`) and [add it as a secret in your repo settings](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository) named `SLACK_WEBHOOK_URL`.
* Add a step to your GitHub action to send data to your Webhook
* Configure your Slack workflow to use variables from the incoming payload from the GitHub Action. You can select where you want to post the data and how you want to format it in Slack's worflow builder interface. 

### Usage

```
- name: Send data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v1.4.0
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Slack App Route

### Usage

```
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v1.4.0
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