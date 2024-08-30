# Slack Send

> the GitHub Action for sending data to Slack

[![codecov](https://codecov.io/gh/slackapi/slack-github-action/graph/badge.svg?token=OZNX7FHN78)](https://codecov.io/gh/slackapi/slack-github-action)

Send data into Slack with a Slack [API method](#technique-2-slack-api-method)
like [`chat.postMessage`][chat.postMessage] and
[`files.uploadV2`][files.uploadV2], or use webhooks to
[start workflows](#technique-1-slack-workflow-builder) in Workflow Builder and
[post messages](#technique-3-slack-incoming-webhook) with webhooks using this
GitHub Action!

## Sending data

Different ways to send data share overlapping styles of gathering the data to be
sent, intersecting between the `payload` and `payload-file-path` inputs and the
`method` and `webook` techniques.

Either payload input option can be used with either technique, with both YAML
and JSON formats being accepted.

**Examples**

```yaml
- name: Post a message to a channel using a token
  uses: slackapi/slack-github-action@v2-development
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      text: "Actions happen at <https://github.com/${{ github.repository }}>"
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
```

```yaml
- name: Start a Slack workflow using a webhook URL
  uses: slackapi/slack-github-action@v2-development
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload-file-path: ./build-artifacts.json
```

If neither payload input option is provided, the
[GitHub context][github-context] is used which has details specific to the
repository and run of the workflow.

The final payload content doesn't have to be fixed either, with
[additional configurations](#additional-configurations) available for
customization.

### Example workflows

For examples on how to leverage this in your workflows, check out the
[example workflows we have][examples] available.

## Sending techniques

This Action offers three different techniques to send data to Slack:

1. Send data with a webhook to start a worflow in Workflow Builder.
2. Send data using a Slack API method and a secret token with required scopes.
3. Send data as a message with a Slack Incoming Webhook URL.

### Technique 1: Slack Workflow Builder

> ❗️ This technique requires [a Slack paid plan][plans] to use Workflow Builder.

This technique sends data to Slack using a webhook to start a workflow created
using the [Slack Workflow Builder][wfb]. Follow
[these steps to create a Slack workflow using webhooks][wfb-create].

#### Setup

Starting in Slack, some prerequisite preparations are necessary:

1. [Create a Slack workflow][wfb-create] that starts with a webhook.
2. Copy the webhook URL and [add it as a repository secret][repo-secret] called
   `SLACK_WEBHOOK_URL`.
3. Add a step to your GitHub Action to send data to your webhook.
4. Configure your Slack workflow to use the incoming payload variables from the
   the GitHub Action. You can then adjust the steps of the workflow to use these
   values in creative and clever ways.

Note: The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/triggers/T0123456789/3141592653589/c6e6c0d868b3054ca0f4611a5dbadaf
```

#### Usage

Add this Action as a [step][job-step] to your project's GitHub Action workflow
file with the configurations you want.

##### Sending values from the GitHub default context

In the example below, no payload input values are being provided so values from
the [GitHub context][github-context] specific to the job are used:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload-delimiter: "_"
```

While also using `payload-delimiter` the payload is flattened and stringified to
match the webhook input format expected by Workflow Builder.

##### Providing parsed payload information as strings

Provided input values for payload information are sent to the webhook URL after
parsing the workflow:

```yaml
- name: Send custom JSON data to Slack workflow
  uses: slackapi/slack-github-action@v2-development
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      status: "${{ job.status }}"
      option: "false"
```

### Technique 2: Slack API method

A bot token or user token or [token of some other kind][tokens] can be used to
call one of many [Slack API methods][methods]! This includes
[`chat.postMessage`][chat.postMessage] and the official `@slack/web-api`
implemention of [`files.uploadV2`][files.uploadV2].

Setting up a workflow with this technique allows you to instantly interact with
the Slack API methods without setting up a Slack workflow.

#### Setup

The exact [API method][methods] used will change the required [scopes][scopes],
but setup should be similar for all methods:

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

##### Uploading a file

Calling web API methods with [`@slack/web-api`][slack-web-api] makes uploading
files just another API call, but with all of the advantages of
[`files.uploadV2`][files.uploadV2]:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v2
  with:
    method: files.uploadV2
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      initial_comment: "the results are in!"
      file: "results.out"
      filename: "results-${{ github.sha }}.out"
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
      ts: ${{ steps.slack.outputs.ts }}
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
      thread_ts: ${{ steps.deployment_message.outputs.ts }}
      text: "Deployment finished! :rocket:"
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

### Parsing templated variables

Additional [variables][github-variables] provided by Github can be used to
replace templated variables in the `payload-file-path` file using the option
to parse payloads with the `payload-file-path-parsed` option:

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2-development
  with:
    payload-file-path: "./payload-slack-content.json"
    payload-file-path-parsed: true
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
```

This replaces variables templated with as `${{ github.repository }}` with the
values found in the action context.

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
[examples]: https://github.com/slackapi/slack-github-action/tree/main/example-workflows
[files.uploadV2]: https://slack.dev/node-slack-sdk/web-api/#upload-a-file
[github-context]: https://docs.github.com/en/actions/learn-github-actions/contexts
[github-variables]: https://docs.github.com/en/actions/learn-github-actions/variables
[incoming-webhook]: https://api.slack.com/messaging/webhooks
[incoming-webhook-scope]: https://api.slack.com/scopes/incoming-webhook
[interactivity]: https://api.slack.com/messaging/interactivity
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[methods]: https://api.slack.com/methods
[mrkdwn]: https://api.slack.com/reference/surfaces/formatting
[plans]: https://slack.com/pricing
[repo-secret]: https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#creating-encrypted-secrets-for-a-repository
[scopes]: https://api.slack.com/scopes
[slack-web-api]: https://slack.dev/node-slack-sdk/web-api
[tokens]: https://api.slack.com/concepts/token-types
[wfb]: https://slack.com/features/workflow-automation
[wfb-create]: https://slack.com/intl/en-ca/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks
