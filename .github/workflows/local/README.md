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
features, which expects the following scopes:

- `chat:write`
- `files:write`
- `reactions:write`

These scopes aren't required if the methods used change, but others might be if
different API methods are called!

This app will have useful variables that can be configured as values in this
next section.

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
