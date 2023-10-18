# Local runs

For a simple development experience, a local copy of this action can be used in experiments.

**Requirements**:

- An installation of [nektos/act](https://github.com/nektos/act)

## Configuring secrets

To use `${{ secrets.* }}` in the workflow, move `.env.example` to `.env` and update any variables.

## Mocking event payloads

Different event payloads can be mocked directly with changes to the `event.json` file.

Reference: https://docs.github.com/en/webhooks/webhook-events-and-payloads

## Updating the workflow

The `local.yml` file contains the workflow used for testing. Updates to these steps can be made to test various functionalities.

## Running an experiment

Run the workflow using `npm run local`. The above configurations will be used to simulate an actual workflow run.
