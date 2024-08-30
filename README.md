# Slack Send GitHub Action

[![codecov](https://codecov.io/gh/slackapi/slack-github-action/graph/badge.svg?token=OZNX7FHN78)](https://codecov.io/gh/slackapi/slack-github-action)

Send data into Slack with a Slack [API method][methods] like [`chat.postMessage`][chat.postMessage]
and [`files.uploadV2`][files.uploadV2], or uses webhooks to [start workflows](#technique-1-slack-workflow-builder) in Workflow Builder and
[post messages](#technique-3-slack-incoming-webhook) with this GitHub Action!

## Sending Variables

You can send GitHub-specific data related to GitHub Action workflow events using
[GitHub Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
and
[Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
that GitHub Actions provides.

For examples on how to leverage this in your workflows, check out the
[example workflows we have](https://github.com/slackapi/slack-github-action/tree/main/example-workflows).

## How to Send Data to Slack

This package has three different techniques to send data to Slack:

1. Send data to Slack's Workflow Builder (requires a paid Slack instance).
2. Send data to a Slack API method using a secret token with specified scopes.
3. Send data via a Slack Incoming Webhook URL (use an existing custom app or
   create a new one).

The recommended way to use this action is with Slack's Workflow Builder (if
you're on a paid Slack plan).

### Technique 1: Slack Workflow Builder

> ❗️ This approach requires a paid Slack plan; it also doesn't support any text
> formatting

This technique sends data into Slack via a webhook URL created using [Slack's Workflow builder](https://slack.com/features/workflow-automation) . Follow [these steps to create a Slack workflow using webhooks][create-webhook]. The Slack workflow webhook URL will be in the form `https://hooks.slack.com/workflows/....`.

As part of the [workflow setup](https://slack.com/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks#workflow-setup),
you will need to define expected variables in the payload the webhook will receive (described in the "Create custom variables" section of the docs). If these variables are missing in the payload, an error is returned.

To match the webhook input format expected by Workflow Builder, the payload will be flattened and stringified (all nested keys are moved to the top level) before being sent. The default delimiter used to flatten payloads is a period (".") but should be changed to an underscore ("\_") using the `payload-delimiter` parameter if you're using nested payloads as input values in your own workflows.

#### Setup

- [Create a Slack workflow webhook][create-webhook].
- Copy the webhook URL (`https://hooks.slack.com/workflows/....`) and
  [add it as a secret in your repo settings][repo-secret] named
  `SLACK_WEBHOOK_URL`.
- Add a step to your GitHub action to send data to your Webhook.
- Configure your Slack workflow to use variables from the incoming payload from
  the GitHub Action. You can select where you want to post the data and how you
  want to format it in Slack's workflow builder interface.

#### Usage

Add this Action as a [step][job-step] to your project's GitHub Action Workflow
file:

```yaml
- name: Send GitHub Action trigger data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
```

or

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    # This data can be any valid JSON from a previous step in the GitHub Action
    payload: |
      "key": "value",
      "foo": "bar"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
```

or

> If the `payload` is provided it will take preference over `payload-file-path`

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-file-path: "./payload-slack-content.json"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
```

> To send the payload file JSON as is, without replacing templated values with
> `github.context` or `github.env`, set `payload-file-path-parsed` to `false`.
> Default: `true`.

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-file-path: "./payload-slack-content.json"
    payload-file-path-parsed: false
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Technique 2: Slack API token

A bot token or user token or [token of some other kind][tokens] can be used to
call one of many [Slack API methods][methods]! This includes [`chat.postMessage`][chat.postMessage]
and the official `@slack/web-api` implemention of [`files.uploadV2`][files.uploadV2]

By creating a new Slack app or using an existing one, this approach allows your
GitHub Actions job to post a message in a Slack channel or direct message by
utilizing the [chat.postMessage](https://api.slack.com/methods/chat.postMessage)
API method. Using this approach you can instantly post a message without setting
up Slack workflows.

#### Setup

- [Create a Slack App][apps] for your workspace (alternatively use an existing
  app you have already created and installed).
- Add the [`chat:write`](https://api.slack.com/scopes/chat:write) bot scope
  under **OAuth & Permissions**.
- Install the app to your workspace.
- Copy the app's Bot Token from the **OAuth & Permissions** page and
  [add it as a secret in your repo settings][repo-secret] named
  `SLACK_BOT_TOKEN`.
- Invite the bot user into the channel you wish to post messages to
  (`/invite @bot_user_name`).

#### Usage

Add this Action as a [step][job-step] to your project's GitHub Action Workflow
file:

```yaml
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "channel": "C0123456789",
      "text": "howdy <@channel>!"
```

Posting payloads with nested JSON, like block messages with block kit, works as
the API call hopes:

```yaml
- name: Post to a Slack channel
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "channel": "C0123456789",
      "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
          }
        }
      ]
```

#### File uploads

Calling web API methods with `@slack/web-api` makes uploading files just another API call, but with all of the advantages of `files.uploadV2`:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v2
  with:
    method: files.uploadV2
    payload: |
      "channel_id": "C0123456789",
      "initial_comment": "the results are in!",
      "file": "results.out",
      "filename": "results-${{ github.sha }}.out"
```

Using JSON payload for constructing a message is also available:

#### Update the message

If you would like to notify the real-time updates on a build status, you can
modify the message your build job posted in the subsequent steps. In order to do
this, the steps after the first message posting can have
`update_ts: ${{ steps.slack.outputs.ts }}` in their settings. With this, the
step updates the already posted channel message instead of posting a new one.

```yaml
- name: Initiate the deployment launch sequence
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "channel": "C0123456789",
      "text": "Deployment started (In Progress)",
      "attachments": [
        {
          "pretext": "Deployment started",
          "color": "dbab09",
          "fields": [
            {
              "title": "Status",
              "short": true,
              "value": "In Progress"
            }
          ]
        }
      ]
- name: Countdown
  run: sleep 10
- uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.update
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "ts": "${{ steps.slack.outputs.ts }}",
      "text": "Deployment finished (Completed)",
      "attachments": [
        {
          "pretext": "Deployment finished",
          "color": "28a745",
          "fields": [
            {
              "title": "Status",
              "short": true,
              "value": "Completed"
            }
          ]
        }
      ]
```

Please note that **the message update step does not accept a channel name.** Set
a channel ID for the steps for the actions that update messages.

#### Reply to a message

If you want to post a message as a threaded reply, you can populate the `payload` with a `thread_ts` field. This field should equal the `ts` value of the parent message of the thread. If you want to reply to a message previously posted by this Action, you can use the `ts` output provided as the `thread_ts` of a consequent threaded reply, e.g. `"thread_ts": "${{ steps.deployment_message.outputs.ts }}"`.

```yaml
- id: deployment_message
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "channel": "C0123456789",
      "text": "Deployment started (In Progress)"
- uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      "channel": "C0123456789",
      "thread_ts": "${{ steps.deployment_message.outputs.ts }}",
      "text": "Deployment finished (Completed)"
```

Please note that **reply to a message does not accept a channel name.** Set a channel ID for the actions that reply to messages in thread.

### Technique 3: Slack Incoming Webhook

This approach allows your GitHub Actions job to post a message to a Slack
channel or direct message by utilizing
[Incoming Webhooks](https://api.slack.com/messaging/webhooks).

Incoming Webhooks conform to the same rules and functionality as any of Slack's
other messaging APIs. You can make your posted messages as simple as a single
line of text, or make them really useful with
[interactive components](https://api.slack.com/messaging/interactivity). To make
the message more expressive and useful use
[Block Kit](https://api.slack.com/block-kit) to build and test visual
components.

#### Setup

- [Create a Slack App][apps] for your workspace (alternatively use an existing
  app you have already created and installed).
- Add the [`incoming-webhook`](https://api.slack.com/scopes/incoming-webhook)
  bot scope under **OAuth & Permissions**.
- Install the app to your workspace (you will select a channel to notify).
- Activate and create a new webhook under **Incoming Webhooks**.
- Copy the Webhook URL from the Webhook you just generated
  [add it as a secret in your repo settings][repo-secret] named
  `SLACK_WEBHOOK_URL`.

#### Usage

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    # For posting a rich message using Block Kit
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
          }
        }
      ]
```

### HTTPS Proxy

If you need to use a proxy to connect with Slack, you can use the `HTTPS_PROXY`
(or `https_proxy`) environment variable. In this example we use the Slack App
technique, but configuring a proxy works the same way for all of them:

```yaml
- name: Post to a Slack channel via a proxy
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    # Set the HTTPS_PROXY environment variable to whatever your policy requires
    proxy: "http://proxy.example.org:8080"
    payload: |
      "channel": "C0123456789",
      "message": "This message was sent through a proxy"
```

## Contributing

All contributions are encouraged! Check out the [CONTRIBUTING](.github/contributing.md) guide to learn more.

## License

See [LICENSE](LICENSE).

[apps]: https://api.slack.com/apps
[chat.postMessage]: https://api.slack.com/methods/chat.postMessage
[create-webhook]: https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks
[files.uploadV2]: https://slack.dev/node-slack-sdk/web-api/#upload-a-file
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[methods]: https://api.slack.com/methods
[repo-secret]: https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository
[tokens]: https://api.slack.com/concepts/token-types
[wfb-triggers]: https://api.slack.com/automation/triggers/webhook
