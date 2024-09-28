# Local runs

For a simple development experience, a local version of this action can be used
in experiments:

```sh
$ npm run local  # Test techniques
```

**Requirements**:

- An installation of [nektos/act](https://github.com/nektos/act)
- A running instance of [Docker](https://www.docker.com)

## Setting up an app

The saved `local.yml` workflow uses `webhook` and `method` for a combination of
features, and expects the values found in `manifest.json`.

These values aren't required if the methods used change, but others might be if
different API methods are called!

### Installing with the CLI

Quick setup for the saved workflow can be achieved using the provided manifest
and these [Slack CLI](https://api.slack.com/automation/cli) commands:

```sh
$ slack install
$ vim .env
export SLACK_CHANNEL_ID=C0123456789  # Invite the bot to this channel!
```

Find and store the bot token:

```sh
$ open https://api.slack.com/apps/A0123456789/oauth
vim .env
export SLACK_BOT_TOKEN=xoxb-0123456789-example-0000000001
```

Create the webhook trigger for use in Workflow Builder:

```sh
$ slack trigger create --trigger-def triggers/webhook.json
$ vim .env
export SLACK_WEBHOOK_TRIGGER=https://hooks.slack.com/triggers/T0123456789/...
```

Gather and save an incoming webhook for a workspace:

```sh
$ open https://api.slack.com/apps/A0123456789/incoming-webhooks
$ vim .env
export SLACK_INCOMING_WEBHOOK=https://hooks.slack.com/services/T0123456789/...
```

Once variables are set for new app, start the workflow with the same command:

```sh
$ npm run local  # Test techniques
```

## Configuring values

### Changing secrets

To use `${{ secrets.* }}` in the workflow, move `.env.example` to `.env` and
update any variables.

### Mocking event payloads

Different event payloads can be mocked directly with changes to the `event.json`
file.

Reference: https://docs.github.com/en/webhooks/webhook-events-and-payloads

## Updating the workflow

The `local.yml` file contains the workflow used for testing. Updates to these
steps can be made to test various functionalities.

## Running an experiment

Run the workflow using `act` with the `npm run local` script. The above settings
will be used to simulate an actual workflow run:

```sh
$ npm run local
...
[Local run/run] 🏁  Job succeeded
```
