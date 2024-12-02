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
3. [Add this Action as a step][job-step] to your GitHub workflow and provide an
   input payload to send to the webhook.
4. Configure your Slack workflow to use the payload variables sent from the
   GitHub Action. You can then update the steps of the Slack workflow to use
   these values in creative and clever ways.

The webhook URL will resemble something like so:

```txt
https://hooks.slack.com/triggers/T0123456789/3141592653589/c6e6c0d868b3054ca0f4611a5dbadaf
```

#### Usage

Update the input payloads sent from this GitHub Action to your Slack workflow
using the following options:

##### Sending values from the default GitHub event context

In the example below, the default GitHub event [context][event-context] and
event [payload][event-payload] associated with the job that started the GitHub
workflow are sent to the provided webhook URL:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2.0.0
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
- name: Send custom event details to a Slack workflow
  uses: slackapi/slack-github-action@v2.0.0
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
    payload: |
      status: "${{ job.status }}"
      option: "false"
```

##### Gathering details of the payload from a saved file

Input values for the payload to be sent can also be provided in a file, either
in JSON or YAML format:

```yaml
- name: Send a saved artifact to a Slack workflow
  uses: slackapi/slack-github-action@v2.0.0
  with:
    payload-file-path: "./artifacts.json"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

### Technique 2: Slack API method

A bot token or user token or [token of some other kind][tokens] must be used to
call one of [the Slack API methods][methods] with this technique.

#### Setup

Different Slack API [methods][methods] require different [scopes][scopes], but
setup should be similar for all methods:

1. [Create a Slack app][apps-new] for your workspace or use an existing app.
2. Depending on the Slack API [method][methods] you wish to call, add the
   required **scopes** to your app under the **OAuth & Permissions** page on
   [app settings][apps].
3. Install the app to your workspace using the **Install App** page.
4. Once your app is installed to a workspace, a new [token][tokens] with your
   app's specified scopes will be minted for that workspace. It is worth noting
   that tokens are only valid for a single workspace! Find the token on the
   **OAuth & Permissions** page.
5. Add the token as [a repository secret][repo-secret] called `SLACK_BOT_TOKEN`
   or something similar and memorable.
6. [Add this Action as a step][job-step] to your GitHub workflow and provide an
   input payload to send to the method.

Methods that require an app configuration token should gather this token from
the [app configuration token][config-tokens] settings instead of from a specific
app since this token is associated with the workspace.

#### Usage

Choosing inputs for these steps is left as an exercise for the actioneer since
each of the Slack API methods requires certain values and specific parameters,
but these snippets might be helpful when starting.

##### Posting a message with text

Posting a message with the [`chat.postMessage`][chat.postMessage] method can be
achieved by adding this step to a job in your GitHub workflow and inviting the
bot associated with your app to the channel for posting:

```yaml
- name: Post to a Slack channel
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "howdy <@channel>!"
```

##### Posting a message with blocks

More complex message layouts, such as messages made with [Block Kit][block-kit]
blocks, can also be sent with one of the Slack API methods:

```yaml
- name: Post to a Slack channel
  uses: slackapi/slack-github-action@v2.0.0
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

Updating a message after it's posted can be done with the
[`chat.update`][chat.update] method and chaining multiple steps together using
outputs from past steps as inputs to current ones:

```yaml
- name: Initiate the deployment launch sequence
  id: slack
  uses: slackapi/slack-github-action@v2.0.0
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
  uses: slackapi/slack-github-action@v2.0.0
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

Posting [threaded replies to a message][messaging-threads] from a past job can
be done by including the `thread_ts` attribute of the parent message in the
`payload`:

```yaml
- name: Initiate a deployment
  uses: slackapi/slack-github-action@v2.0.0
  id: deployment_message
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "Deployment started :eyes:"
- name: Conclude the deployment
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      thread_ts: "${{ steps.deployment_message.outputs.ts }}"
      text: "Deployment finished! :rocket:"
```

##### Uploading a file

Calling [a Slack API method][methods] with [`@slack/web-api`][slack-web-api]
makes [uploading a file][files.upload] just another API call with all of the
convenience of the [`files.uploadV2`][files.uploadV2] method:

```yaml
- name: Share a file to that channel
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: files.uploadV2
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel_id: ${{ secrets.SLACK_CHANNEL_ID }}
      initial_comment: "the results are in!"
      file: "results.out"
      filename: "results-${{ github.sha }}.out"
```

### Technique 3: Slack incoming webhook

This technique uses this Action to post a message to a channel or direct message
with [incoming webhooks][incoming-webhook] and a Slack app.

Incoming webhooks follow the same [formatting][formatting] patterns as other
Slack messaging APIs. Posted messages can be as short as a single line of text,
include additional interactivity with [interactive components][interactivity],
or be formatted with [Block Kit][block-kit] to build visual components.

#### Setup

Gather a Slack incoming webhook URL:

1. [Create a Slack app][apps-new] for your workspace or use an existing app.
2. Add the [`incoming-webhook`][incoming-webhook-scope] bot scope under **OAuth
   & Permissions** page on [app settings][apps].
3. Install the app to your workspace and select a channel to notify from the
   **Install App** page.
4. Create additional webhooks from the **Incoming Webhooks** page.
5. Add the generated incoming webhook URL as [a repository secret][repo-secret]
   called `SLACK_WEBHOOK_URL`.
6. [Add this Action as a step][job-step] to your GitHub workflow and provide an
   input payload to send as a message.

#### Usage

Add the collected webhook from above to a GitHub workflow and configure the step
using [`mrkdwn`][mrkdwn] formatting values for a message or
[Block Kit][block-kit] blocks:

```yaml
- name: Post a message in a channel
  uses: slackapi/slack-github-action@v2.0.0
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

### Exiting with errors

Invalid API requests or unexpected webhook payloads cause a failing response
that can be used to fail the GitHub Actions step with the `errors` option.

The `errors` option defaults to `false` so failed requests do not cause the step
to fail. This result can still be gathered from the `ok` output.

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2.0.0
  with:
    errors: true
    method: chat.reverse
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      text: "palindrome"
```

Invalid inputs to the Action, such as not including a payload, will always cause
the GitHub step to fail.

### Flattening nested payloads

Variables and data provided in the payload might contain nested fields that need
to be flattened before being sent with a
[webhook trigger](#technique-1-slack-workflow-builder) to match the expected
input format of [Workflow Builder][wfb].

The `payload-delimiter` option will flatten the input payload using the provided
delimiter and will also make values stringified:

```yaml
- name: Send GitHub Action data to a Slack workflow
  uses: slackapi/slack-github-action@v2.0.0
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

Reference to the flattening implementation is available for exploration from
within the [`flat`][flat] package.

### Parsing templated variables

Additional variables provided in the Github event [context][event-context] and
event [payload][event-payload] can be used to replace templated variables in the
input payload with the `payload-templated` option:

```yaml
- name: Send custom JSON data to Slack workflow
  id: slack
  uses: slackapi/slack-github-action@v2.0.0
  with:
    payload-file-path: "./payload-slack-content.json"
    payload-templated: true
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

This replaces variables templated as `${{ github.payload.repository.html_url }}`
with the values found in the GitHub Action event [payload][event-payload].

### Proxying HTTPS requests

If you need to use a proxy to connect to Slack, you can use the `proxy` option.
In this example we use the technique that calls a Slack API method, but
configuring a proxy is the same for all techniques:

```yaml
- name: Post to a Slack channel via a proxy
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    proxy: "http://proxy.example.org:8080" # Change this to a custom value
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "This message was sent through a proxy"
```

The `proxy` option can also be provided with the `HTTPS_PROXY` or `https_proxy`
[environment variable][github-environment] from within the GitHub Actions step.

### Retrying failed requests

Sometimes outgoing requests fail due to [rate limits][rate-limits] or similar
[HTTP responses][retry-after] and can be retried later.

The `retries` option can be configured to the needs of your workflow with one of
these values:

- `0`: No retries, just hope that things go alright.
- `5`: Five retries in five minutes. **Default**.
- `10`: Ten retries in about thirty minutes.
- `RAPID`: A burst of retries to keep things running fast.

```yaml
- name: Attempt a burst of requests
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    retries: RAPID
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "status: all things are going good"
```

Behind the scenes, [automatic retries][retries] are handled with the
[`@slack/web-api`][slack-web-api] package for Slack API methods, and
[`axios-retry`][axios-retry] when sending with a webhook.

## Expected outputs

Each technique above [outputs values][github-outputs] that can be used as inputs
in following steps of a GitHub workflow.

The following outputs are returned with each of the techniques:

- `time`: `number`. The Unix [epoch time][epoch] that the step completed.
- `ok`: `boolean`. If the request completed with success.
- `response`: `string`. The [response][response] from the request as stringified
  JSON.

While these outputs are returned with certain Slack API methods:

- `channel_id`: `string`. The [channel ID][conversation] included in the
  response.
- `ts`: `string`. The [timestamp][messaging-timestamp] of the Slack event or
  message.
- `thread_ts`: `string`. The [timestamp][messaging-timestamp] of a parent Slack
  message with [threaded replies][messaging-parents].

### Example responses

The following snippet shows how multiple steps can be chained together to create
a Slack channel before posting a message:

```yaml
- name: Create a new Slack channel for recent changes
  id: conversation
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: conversations.create
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      name: pull-request-review-${{ github.sha }}
- name: Send the pull request link into the Slack channel
  if: ${{ steps.conversation.outputs.ok }}
  uses: slackapi/slack-github-action@v2.0.0
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ steps.conversation.outputs.channel_id }}
      text: "A PR was created <!date^${{ steps.conversation.outputs.time }}^{date_num} at {time_secs}|just now>: ${{ github.event.pull_request.html_url }}"
```

## License

This project is licensed under the [MIT license](LICENSE).

## Contributing

All contributions are encouraged! Check out the
[contributor's guide][contributing] to learn more.

[apps]: https://api.slack.com/apps
[apps-new]: https://api.slack.com/apps/new
[axios-retry]: https://www.npmjs.com/package/axios-retry
[block-kit]: https://api.slack.com/surfaces/messages#complex_layouts
[chat.postMessage]: https://api.slack.com/methods/chat.postMessage
[chat.update]: https://api.slack.com/methods/chat.update
[chat:write]: https://api.slack.com/scopes/chat:write
[config-tokens]: https://api.slack.com/reference/manifests#config-tokens
[contributing]: .github/contributing.md
[conversation]: https://api.slack.com/types/conversation
[epoch]: https://en.wikipedia.org/wiki/Unix_time
[event-context]: https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6
[event-payload]: https://docs.github.com/en/webhooks/webhook-events-and-payloads
[examples]: https://github.com/slackapi/slack-github-action/tree/main/example-workflows
[files.upload]: https://api.slack.com/messaging/files#upload
[files.uploadV2]: https://tools.slack.dev/node-slack-sdk/web-api/#upload-a-file
[flat]: https://www.npmjs.com/package/flat
[formatting]: https://api.slack.com/reference/surfaces/formatting
[github-environment]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables
[github-outputs]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/passing-information-between-jobs
[github-variables]: https://docs.github.com/en/actions/learn-github-actions/variables
[incoming-webhook]: https://api.slack.com/messaging/webhooks
[incoming-webhook-scope]: https://api.slack.com/scopes/incoming-webhook
[interactivity]: https://api.slack.com/messaging/interactivity
[job-step]: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#jobsjob_idsteps
[messaging-parents]: https://api.slack.com/messaging/retrieving#finding_threads
[messaging-threads]: https://api.slack.com/messaging/sending#threading
[messaging-timestamp]: https://api.slack.com/messaging/retrieving#individual_messages
[methods]: https://api.slack.com/methods
[mrkdwn]: https://api.slack.com/reference/surfaces/formatting
[plans]: https://slack.com/pricing
[rate-limits]: https://api.slack.com/apis/rate-limits
[repo-secret]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository
[response]: https://api.slack.com/web#responses
[retries]: https://tools.slack.dev/node-slack-sdk/web-api/#automatic-retries
[retry-after]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After
[scopes]: https://api.slack.com/scopes
[slack-web-api]: https://tools.slack.dev/node-slack-sdk/web-api
[tokens]: https://api.slack.com/concepts/token-types
[variables]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables
[wfb]: https://slack.com/features/workflow-automation
[wfb-create]: https://slack.com/help/articles/360041352714-Build-a-workflow--Create-a-workflow-that-starts-outside-of-Slack
