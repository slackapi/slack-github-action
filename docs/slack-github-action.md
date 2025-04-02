# Slack Send GitHub Action

The GitHub Action for sending data to Slack.

## Sending variables 

There are different [techniques to send data](/slack-github-action/sending-techniques) into Slack and whichever one is chosen will require a certain set of customized inputs, as described later.

You can provide data to send to Slack from this GitHub Action and either source:

- The default event [context](https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L6) with a [payload](https://docs.github.com/en/webhooks/webhook-events-and-payloads) matching the GitHub event.
- A custom payload with optional [variables](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables) provided in the GitHub Action step.

These input options are valid for all techniques, but some techniques require specific constraints with certain requirements for valid inputs.

Additional [configurations](/slack-github-action/additional-configurations) and other details are also available for more customizations to the provided payload.

## Versioning

We recommend using the latest version of this GitHub Action for the most recent updates and fixes.

Migration guides are available in the [release notes](https://github.com/slackapi/slack-github-action/releases) with breaking changes noted between versions.

Changes required when upgrading from `@v1` to `@v2` are included in this [migration guide](https://github.com/slackapi/slack-github-action/releases/tag/v2.0.0).

## License

This project is licensed under the [MIT license](https://github.com/slackapi/slack-github-action/blob/main/LICENSE).

## Contributing

All contributions are encouraged! Check out the [contributor's guide](https://github.com/slackapi/slack-github-action/blob/main/.github/contributing.md) to learn more.