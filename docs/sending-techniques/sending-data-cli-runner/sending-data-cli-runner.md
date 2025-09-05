---
sidebar_label: Overview
---

# Run Slack CLI commands in GitHub Actions workflows 

This technique uses the Slack CLI in GitHub Actions to run commands through workflows.

Setting up a CI/CD pipeline [requires](https://docs.slack.dev/tools/slack-cli/guides/authorizing-the-slack-cli/#ci-cd) authorization using a service token. [Service tokens](https://docs.slack.dev/tools/slack-cli/guides/authorizing-the-slack-cli/#obtain-token) are long-lived, non-rotatable user tokens that don’t expire.

## Setup

1. Add your service token as a [repository secret](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets#creating-secrets-for-a-repository). Settings > Security > Secrets and variables > Actions and click the "New repository secret" button.

  Name: SLACK_SERVICE_TOKEN
  
  Secret: the xoxp- service token   

2. Add this workflow to your repository. GitHub Actions workflow files must be stored in the .github/workflows directory

```yaml
name: Slack CLI Command Runner
on:
  workflow_dispatch:
    inputs:
      command:
        description: 'Slack CLI command to run'
        type: string
        default: ""
        required: true
      verbose:
        description: 'Verbose flag'
        type: boolean
        default: false
        required: false
      cli_version:
        description: 'CLI version'
        type: string
        default: "latest"
        required: false
      app_id: 
        description: "App ID"
        type: string
        default: ""
        required: false

jobs:
  run-slack-cli:
    uses: slackapi/slack-github-action/.github/workflows/cli-runner.yml@main
    with:
      command: ${{ github.event.inputs.command }}
      verbose: ${{ github.event.inputs.verbose == 'true' || github.run_attempt > 1 }}
      cli_version: ${{ github.event.inputs.cli_version }}
      app_id: ${{ github.event.inputs.app_id }}
    secrets: inherit
```

3. Go to [Actions tab](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow#configuring-a-workflow-to-run-manually) in your GitHub repository.
4. Select the "Slack CLI Command Runner" workflow and click "Run workflow."
5. Enter your desired command without the 'slack' prefix (e.g., version).
6. Click "Run workflow" to execute the command.

## Usage

Instead of manual dispatch, you can configure your workflow to run automatically on specific GitHub events. Note that commands must be hardcoded
when using automatic triggers. The following examples show different trigger options:

#### On Pull Request:
```yaml
name: Slack CLI Command Runner
on:
  pull_request:
    branches: [ main ]

jobs:
  run-slack-cli:
    uses: slackapi/slack-github-action/.github/workflows/cli-runner.yml@main
    with:
      command: ${{ github.event.inputs.command }}
      verbose: ${{ github.event.inputs.verbose == 'true' || github.run_attempt > 1 }}
      cli_version: ${{ github.event.inputs.cli_version }}
      app_id: ${{ github.event.inputs.app_id }}
    secrets: inherit
```

#### On Push to Main:
```yaml
name: Slack CLI Command Runner
on:
  push:
    branches: [ main ]

jobs:
  run-slack-cli:
    uses: slackapi/slack-github-action/.github/workflows/cli-runner.yml@main
    with:
      command: ${{ github.event.inputs.command }}
      verbose: ${{ github.event.inputs.verbose == 'true' || github.run_attempt > 1 }}
      cli_version: ${{ github.event.inputs.cli_version }}
      app_id: ${{ github.event.inputs.app_id }}
    secrets: inherit
```
