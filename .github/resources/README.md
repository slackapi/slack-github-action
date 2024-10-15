# Resources during testing and development

For a quick development experience and fast testing setup, the app needed with
this action is configured using the [app manifest][manifest] and can be used in
experiments with the [Slack CLI][cli].

Start by gathering credentials of an application equipped for action:

```sh
$ slack install
$ slack trigger create  # SLACK_WEBHOOK_TRIGGER
$ slack deploy          # SLACK_BOT_TOKEN and SLACK_INCOMING_WEBHOOK
```

Where these are stored will depend on the configurations to run and will follow
in the next sections.

Also be sure to add the new bot to a channel for posting messages or errors
happen.

## Running the workflows

Both setups share the same starting test suite to make sure the similar examples
as in the `README.md` are correct, but changes while testing are encouraged!

The app uses the values stored in `.slack` and can also be adjusted for changing
scopes or workflows.

### Testing in CI

Run the workflow as a complete CI check for the changes upstream.

**Requirements**:

- The credentials collected above
- Access to secrets for the repo

The saved `test.yml` include common workflows from the `README.md` and other
code checks including linting and tests.

Add gathered credentials and [secrets to save][secrets] to the repository being
tested. Required values include:

- `SLACK_BOT_TOKEN`: xoxb-01010101-example
- `SLACK_CHANNEL_ID`: C0123456789
- `SLACK_INCOMING_WEBHOOK`: https://hooks.slack.com/services/T0123456789/...
- `SLACK_WEBHOOK_TRIGGER`: https://hooks.slack.com/triggers/T0123456789/...

### Experimenting for development

Run the workflow to post messages without pushing changes upstream.

**Requirements**:

- The credentials collected above
- An installation of [`nektos/act`](https://github.com/nektos/act)
- A running instance of [Docker](https://www.docker.com)

The saved `develop.yml` workflows use the same `webhook` and `method` examples
but skip tests that happen during upstream checks:

```sh
$ cp .env.example .env  # Create credentials
$ vim .env              # Update credentials
$ cat .env              # Reveal credentials
export SLACK_BOT_TOKEN=xoxb-01010101-example
export SLACK_CHANNEL_ID=C0123456789
export SLACK_INCOMING_WEBHOOK=https://hooks.slack.com/services/T0123456789/B0123456789/abcdefghijklmnopqrstuvwxyz
export SLACK_WEBHOOK_TRIGGER=https://hooks.slack.com/triggers/T0123456789/00000000000/abcdefghijklmnopqrstuvwxyz
```

Environment variables and credentials should be set in the created `.env` file
for use in workflows and actions.

Once credentials are configured and workflows updated, the following command
runs the workflow using `act` and the above settings:

```sh
$ npm run dev  # Test techniques
...
[Local run/run] 🏁  Job succeeded
```

## Configuring different things

### Updating the workflow

The `develop.yml` file contains the workflow used for testing. Updates to these
steps can be made to test various functionalities and edge cases.

The same applies to test workflows in the `test.yml` file! However, some hope of
keeping examples in the `README.md` similar to the tests could be neat.

### Changing secrets

To use `${{ secrets.* }}` in the workflow, add more environment variable values
to the `.env` file or update the secrets saved to the repository.

### Mocking event payloads

Different event payloads can be mocked in development with changes to the values
of the `.github/resources/.actions/event.json` file.

Reference: https://docs.github.com/en/webhooks/webhook-events-and-payloads

[cli]: https://api.slack.com/automation/cli/commands
[manifest]: https://api.slack.com/concepts/manifests
[secrets]: https://github.com/slackapi/slack-github-action/settings/secrets/actions
