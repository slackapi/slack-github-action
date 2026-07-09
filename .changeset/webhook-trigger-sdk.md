---
"@slack/slack-github-action": patch
---

Send `webhook-trigger` payloads through the [`@slack/webhook`](https://docs.slack.dev/tools/node-slack-sdk/webhook) package instead of a bespoke request, sharing its retry policies and returning the complete trigger response.
