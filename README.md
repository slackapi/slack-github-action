# Slack Send GitHub Action

> the GitHub Action for sending data to Slack

[![codecov](https://codecov.io/gh/slackapi/slack-github-action/graph/badge.svg?token=OZNX7FHN78)](https://codecov.io/gh/slackapi/slack-github-action)

## Example workflows

For examples on how to leverage this Action in workflows, check out
[example workflows we have][examples] available.

## Sending variables

There are different [techniques to send data](#sending-techniques) into Slack
and whichever one is chosen will require a certain set of customized inputs, as
described later.

You can provide data to send to Slack from this GitHub Action and either source:

- The default event [context][event-context] with a [payload][event-payload]
  matching the GitHub event.
- A custom payload with optional [variables][variables] provided in the GitHub
  Action step.

These input options are valid for all techniques, but some techniques require
specific constraints with certain requirements for valid inputs.

Additional [configurations](#additional-configurations) and other details are
also available for more customizations to the provided payload.

## Sending techniques

This Action offers three different techniques to send data to Slack:

1. [**Technique 1**](#technique-1-slack-workflow-builder): Send data with a
   webhook to start a workflow in [Workflow Builder][wfb].
2. [**Technique 2**](#technique-2-slack-api-method): Send data using
   [a Slack API method][methods] and a secret token with required scopes.
3. [**Technique 3**](#technique-3-slack-incoming-webhook): Send data as a
   message with a Slack [incoming webhook][incoming-webhook] URL.

### Technique 1: Slack Workflow Builder

> :memo: This technique requires [a Slack paid plan][plans] to use Workflow
> Builder.

This technique sends data to Slack using a webhook to start a workflow created
using Slack [Workflow Builder][wfb].

#### Setup

Start in Slack to create a Slack workflow:

1. [Create a Slack workflow][wfb-create] that starts from a webhook.
2. Copy the webhook URL and [add it as a repository secret][repo-secret] called
   `SLACK_WEBHOOK_URL`.
3. Add this Action as a step to your GitHub workflow and set the input payload
   to send.
4. Configure your Slack workflow to use the payload variables sent from the
   GitHub Action. You can then update the steps of the Slack workflow to use
   these values in creative and clever ways.

The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/triggers/T0123456789/3141592653589/c6e6c0d868b3054ca0f4611a5dbadaf
```

#### Usage

Add this Action as a [step][job-step] to your project's GitHub Action workflow
file with the configurations you want.

##### Sending values from the default GitHub event context

In the example below, the default GitHub event [context][event-context] and
event [payload][event-payload] associated with the job that started the GitHub
workflow are sent to the provided webhook URL:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

Accessing variables sent to [Workflow Builder][wfb] with a webhook require that
the payload variables are flattened with stringified values. Nested variables in
the provided payload can be both flattened and also stringified with the
`payload-delimiter` option or changed with other
[configurations](#additional-configurations) to match this format expected from
Workflow Builder.

##### Providing parsed payload information as strings

Provided input values for payload information are sent to the webhook URL after
the job is started:

```yaml
- name: Send custom JSON data to Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
    payload: |
      status: "${{ job.status }}"
      option: "false"
```

### Technique 2: Slack API method

A bot token or user token or [token of some other kind][tokens] can be used to
call one of [the Slack API methods][methods] with this technique.

This includes the [`chat.postMessage`][chat.postMessage] method for posting
messages or [uploading a file][files.upload] with the convenience of the
`@slack/web-api` implementation for the [`files.uploadV2`][files.uploadV2]
method.

#### Setup

The exact [Slack API method][methods] used will require setting various sets of
[scopes][scopes], but setup should be similar for all methods:

- [Create a Slack App][apps] for your workspace or use an existing one.
- Add the [`chat:write`][chat:write] bot scope under the **OAuth & Permissions**
  page.
- Install the app to your workspace using the **Install App** page.
- Copy the app's Bot Token from the **OAuth & Permissions** page and
  [add it as a secret in your repo settings][repo-secret] named
  `SLACK_BOT_TOKEN`.
- Invite the bot user into the channel you wish to post messages to
  (`/invite @bot_user_name`).

#### Usage

Choosing inputs for these steps is left as an exercise for the actioneer, but
these snippets might be helpful when starting.

##### Posting a message with text

An introductory call to the `chat.postMessage` method can be done by
[adding this step][job-step] to a job in your workflow:

```yaml
- name: Post to a Slack channel
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "howdy <@channel>!"
```

##### Posting a message with blocks

More detailed messages with nested JSON, like block messages made with block
kit, work as the API call might hope:

```yaml
- name: Post to a Slack channel
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
      blocks:
        - type: "section"
          text:
            type: "mrkdwn"
            text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
```

##### Updating a message

Following up on a message after it's posted, such as updates for a build status,
can be done by chaining multiple steps together using outputs from past steps as
inputs to current ones:

```yaml
- name: Initiate the deployment launch sequence
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
      attachments:
        - color: "dbab09"
          fields:
            - title: "Status"
              short: true
              value: "In Progress"
- name: Countdown until launch
  run: sleep 10
- name: Update the original message with success
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.update
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      ts: "${{ steps.slack.outputs.ts }}"
      text: "Deployment finished! :rocket:"
      attachments:
        - color: "28a745"
          fields:
            - title: "Status"
              short: true
              value: "Completed"
```

##### Replying to a message

Posting threaded replies to a message from a past job can be done by including
the `thread_ts` attribute of the **parent** message in the `payload`:

```yaml
- name: Initiate a deployment
  uses: slackapi/slack-github-action@v2-development
  id: deployment_message
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
- name: Conclude the deployment
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      thread_ts: "${{ steps.deployment_message.outputs.ts }}"
      text: "Deployment finished! :rocket:"
```

##### Uploading a file

Calling web API methods with [`@slack/web-api`][slack-web-api] makes uploading
files just another API call, but with all of the advantages of
[`files.uploadV2`][files.uploadV2]:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v2-development
  with:
    method: files.uploadV2
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      initial_comment: "the results are in!"
      file: "results.out"
      filename: "results-${{ github.sha }}.out"
```

### Technique 3: Slack incoming webhook

This technique uses GitHub Actions to post messages to a channel or direct
message using [incoming webhooks][incoming-webhook] from a Slack app.

Incoming Webhooks conform to the same rules and functionality as any of Slack's
other messaging APIs. You can make your posted messages as simple as a single
line of text, or make them really useful with
[interactive components][interactivity]. To make the message more expressive and
useful use [Block Kit][block-kit] to build and test visual components.

#### Setup

A similar approach to [Technique 1](#technique-1-slack-workflow-builder) is
taken to create apps and setup the workflow, but webhooks are gathered from a
different source:

- [Create a Slack App][apps] for your workspace (alternatively use an existing
  app you have already created and installed).
- Add the [`incoming-webhook`][incoming-webhook-scope] bot scope under **OAuth &
  Permissions**.
- Install the app to your workspace (you will select a channel to notify).
- Activate and create a new webhook under **Incoming Webhooks**.
- Copy the Webhook URL from the Webhook you just generated
  [add it as a secret in your repo settings][repo-secret] named
  `SLACK_WEBHOOK_URL`.

#### Usage

Add the collected webhook from above to a workflow and configure the job using
[`mrkdwn`][mrkdwn] formatting values for a message or [Block Kit][block-kit]
blocks:

```yaml
- name: Send custom JSON data to Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: incoming-webhook
    payload: |
      text: "*GitHub Action build result*: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
      blocks:
        - type: "section"
          text:
            type: "mrkdwn"
            text: "GitHub Action build result: ${{ job.status }}\n${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
```

## Additional configurations

Not all of the above settings serve every customization of a workflow, so these
options might be useful.

### Flattening nested payloads

Variables and data provided in the payload might contain nested fields that need
to be flattened before being sent with a
[webhook trigger](#technique-1-slack-workflow-builder) to match the expected
input format of [Workflow Builder][wfb].

The `payload-delimiter` option will flatten the input payload using the provided
delimiter and will also make values stringified:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

### Parsing templated variables

Additional variables provided in the Github event [context][event-context] and
event [payload][event-payload] can be used to replace templated variables in the
input payload with the `payload-templated` option:

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-file-path: "./payload-slack-content.json"
    payload-templated: true
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

This replaces variables templated as `${{ github.payload.repository.html_url }}`
with the values found in the Action context.

### HTTPS proxy

If you need to use a proxy to connect with Slack, you can use the `HTTPS_PROXY`
or `https_proxy` environment variable. In this example we use the Slack App
technique, but configuring a proxy works the same way for all of them:

```yaml
- name: Post to a Slack channel via a proxy
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    proxy: "http://proxy.example.org:8080" # Change this to a custom value
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      message: "This message was sent through a proxy"
```

## License

This project is licensed under the [MIT license](LICENSE).

## Contributing

All contributions are encouraged! Check out the
[contributor's guide][contributing] to learn more.

[apps]: https://api.slack.com/apps
[block-kit]: https://api.slack.com/surfaces/messages#complex_layouts
[chat.postMessage]: https://api.slack.com/methods/chat.postMessage
[chat:write]: https://api.slack.com/scopes/chat:write
[contributing]: .github/contributing.md
[event-context]: https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6
[event-payload]: https://docs.github.com/en/webhooks/webhook-events-and-payloads
[examples]: https://github.com/slackapi/slack-github-action/tree/main/example-workflows
[files.upload]: https://api.slack.com/messaging/files#upload
[files.uploadV2]: https://slack.dev/node-slack-sdk/web-api/#upload-a-file
[github-variables]: https://docs.github.com/en/actions/learn-github-actions/variables
[incoming-webhook]: https://api.slack.com/messaging/webhooks
[incoming-webhook-scope]: https://api.slack.com/scopes/incoming-webhook
[interactivity]: https://api.slack.com/messaging/interactivity
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[methods]: https://api.slack.com/methods
[mrkdwn]: https://api.slack.com/reference/surfaces/formatting
[plans]: https://slack.com/pricing
[repo-secret]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository
[scopes]: https://api.slack.com/scopes
[slack-web-api]: https://slack.dev/node-slack-sdk/web-api
[tokens]: https://api.slack.com/concepts/token-types
[variables]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables
[wfb]: https://slack.com/features/workflow-automation
[wfb-create]: https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks
