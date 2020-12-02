# Slack GitHub Action

Send data into Slack using this GitHub Action! This package has two different techniques to send data to Slack:

1) Send data to Slack's Workflow Builder (requires a paid Slack instance).
2) Send data via a Slack app to post to a specific channel (use an existing custom app or create a new one).

## Slack Workflow Builder Route

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