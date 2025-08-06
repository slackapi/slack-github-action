# Additional configurations

There are some additional, possibly useful, customization options for workflows.

## Exiting with errors

Invalid API requests or unexpected webhook payloads cause a failing response that can be used to fail the GitHub Actions step with the `errors` option.

The `errors` option defaults to `false` so failed requests do not cause the step to fail. This result can still be gathered from the `ok` output.

```yaml
- name: Attempt to call an unknown method
  uses: slackapi/slack-github-action@v2.1.1
  with:
    errors: true
    method: chat.reverse
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      text: "palindrome"
```

Invalid inputs to the GitHub Action, such as not including a payload, will always cause the GitHub step to fail.

## Flattening nested payloads

Variables and data provided in the payload might contain nested fields that need to be flattened before being sent with a [webhook trigger](/tools/slack-github-action/sending-techniques/sending-data-webhook-slack-workflow) to match the expected input format of [Workflow Builder](https://slack.com/features/workflow-automation).

The `payload-delimiter` option will flatten the input payload using the provided delimiter and will also make values stringified:

```yaml
- name: Flatten the default GitHub payload
  uses: slackapi/slack-github-action@v2.1.1
  with:
    payload-delimiter: "_"
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

Reference to the flattening implementation is available for exploration from within the [`flat`](https://www.npmjs.com/package/flat) package.

## Parsing templated variables

Additional variables provided in the GitHub event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) and event [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) can be used to replace templated variables in the input payload with the `payload-templated` option:

```yaml
- name: Send custom JSON data to Slack workflow
  uses: slackapi/slack-github-action@v2.1.1
  with:
    payload-file-path: "./payload-slack-content.json"
    payload-templated: true
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    webhook-type: webhook-trigger
```

This replaces variables templated as `${{ github.payload.repository.html_url }}` with the values found in the GitHub Action event [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads).

## Proxying HTTPS requests

If you need to use a proxy to connect to Slack, you can use the `proxy` option. In this example we use the technique that calls a Slack API method, but configuring a proxy is the same for all techniques:

```yaml
- name: Post to a Slack channel via a proxy
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    proxy: "http://proxy.example.org:8080" # Change this to a custom value
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "This message was sent through a proxy"
```

The `proxy` option can also be provided with the `HTTPS_PROXY` or `https_proxy` [environment variable](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables) from within the GitHub Actions step.

## Retrying failed requests

Sometimes outgoing requests fail due to [rate limits](https://docs.slack.dev/apis/web-api/rate-limits) or similar [HTTP responses](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) and can be retried later.

The `retries` option can be configured to the needs of your workflow with one of these values:

- `0`: No retries, just hope that things go alright.
- `5`: Five retries in five minutes. **Default**.
- `10`: Ten retries in about thirty minutes.
- `RAPID`: A burst of retries to keep things running fast.

```yaml
- name: Attempt a burst of requests
  uses: slackapi/slack-github-action@v2.1.1
  with:
    method: chat.postMessage
    retries: RAPID
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "status: all things are going good"
```

Behind the scenes, [automatic retries](https://tools.slack.dev/node-slack-sdk/web-api/#automatic-retries) are handled with the [`@slack/web-api`](https://tools.slack.dev/node-slack-sdk/web-api) package for Slack API methods, and [`axios-retry`](https://www.npmjs.com/package/axios-retry) when sending with a webhook.

## Sending to a custom API URL

In certain circumstances, such as testing the sent payload, a [custom API URL](https://tools.slack.dev/node-slack-sdk/web-api/#custom-api-url) can be used to change where `method` requests are sent:

```yaml
- name: Send to a custom API URL
  uses: slackapi/slack-github-action@v2.1.1
  with:
    api: http://localhost:8080
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
    payload: |
      channel: ${{ secrets.SLACK_CHANNEL_ID }}
      text: "What's happening on localhost?"
```

The default value of `api` is `https://slack.com/api/` for steps using `method`.
