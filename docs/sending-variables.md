# Sending variables

There are different [techniques to send data](/tools/slack-github-action/sending-techniques) into Slack and whichever one is chosen will require a certain set of customized inputs, as described later.

You can provide data to send to Slack from this GitHub Action and either source:

- The default event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) with a [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) matching the GitHub event.
- A custom payload with optional [variables](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables) provided in the GitHub Action step.

These input options are valid for all techniques, but some techniques require specific constraints with certain requirements for valid inputs.

Additional [configurations](/tools/slack-github-action/additional-configurations) and other details are also available for more customizations to the provided payload.