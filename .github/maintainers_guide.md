# Maintainers Guide

This document describes tools, tasks and workflow that one needs to be familiar with in order to effectively maintain
this project. If you use this package within your own software as is but don't plan on modifying it, this guide is
**not** for you.

## Tools

All you need to work with this project is a supported version of [Node.js](https://nodejs.org/en/)
(see `package.json` field "engines") and npm (which is distributed with Node.js).

## Tasks

### Developing

Iterate quickly by developing and testing all techniques of this action with a local version of this action using `npm run dev`.
Information on setting up and configuring mocked events can be found in [`.github/resources/README.md`](./resources/README.md).

### Testing

Expected behaviors are confirmed with both unit tests and integration tests. Our unit tests run fast without secrets, while integration tests use webhooks and tokens for sending data to Slack across various techniques.

#### Unit tests

Run the following scripts to confirm tests pass before opening a PR:

```sh
$ npm test       # Unit tests
$ npm run lint   # Lint and format
$ npm run check  # Typecheck
```

The `test.yml` workflow runs these scripts for pull requests and changes to the `main` branch.

#### Integration tests

The `integration.yml` workflow uses this action in interactions with Slack using secrets saved to the `staging` environment.

A PR from a forked branch will fail this workflow until a maintainer reviews the code and [dispatches](https://github.com/slackapi/slack-github-action/actions/workflows/integration.yml) a test run that points to the most recent commit using the following format:

```
pull/<NUMBER>/head
```

### Documentation

This repo contains two types of docs files:

- markdown files
- sidebar.json

The private repo containing the docs.slack.dev site pulls these in at build time.

Maintainers need to use the `run workflow` button associated with the `deploy` workflow in that private repo to update the docs with changes from here.

#### Markdown Files

The markdown files here are secretly mdx files in disguise.

If you'd like to add images to pages, add the image files to the same folder the md file is in.

We appreciate markdown edits from anyone!!!

#### Sidebar

`_sidebar.json` sets the slack github action docs sidebar

sidebar values take the form of "slack-github-action/path-within-docs/"

or, in other words - full path but remove "docs":
path: slack-github-action/docs/sending-variables.md
value: slack-github-action/sending-variables

for info on syntax see https://docusaurus.io/docs/sidebar

this file is copied into slackapi.github.io/slack-github-action/sidebar.js it is then called in slackapi.github.io/sidebars.js

### Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to track changes and automate releases.

Each changeset describes a change to the package and its [semver](https://semver.org/) impact, and a new changeset should be added when updating the package with some change that affects consumers:

```sh
npm run changeset
```

Updates to documentation, tests, or CI might not require new entries.

When a PR containing changesets is merged to `main`, a different PR is opened or updated using [changesets/action](https://github.com/changesets/action) which consumes the pending changesets, bumps the package version, and updates the `CHANGELOG` in preparation to release.

### Releases

New versions are published when the release PR created from changesets is merged and the publish workflow completes. Follow these steps to build confidence:

1. **Check GitHub Milestones**: Before merging the release PR please check the relevant [Milestones](https://github.com/slackapi/slack-github-action/milestones). If issues or pull requests are still open either decide to postpone the release or save those changes for a future update.

2. **Review the release PR**: Verify that the version bump matches expectations, `CHANGELOG` entries are clear, and CI checks pass. Use `npm install` to update versions in the `package-lock.json` file.

3. **Merge**: Merge the release PR. The release workflow will build the action, push a release branch, create a GitHub Release with the version tag, and update floating version tags.

4. **Update Milestones**: Close the relevant [Milestones](https://github.com/slackapi/slack-github-action/milestones) and rename these to match the released version. Open a new Milestone for the next version.

## Workflow

### Versioning and Tags

This project is versioned using [Semantic Versioning](http://semver.org/), particularly in the
[npm flavor](https://docs.npmjs.com/getting-started/semantic-versioning). Each release is tagged
using git.

### Fork

As a maintainer, the development you do will be almost entirely off of your forked version of this repository. The exception to this rule pertains to multiple collaborators working on the same feature, which is detailed in the **Branches** section below.

### Branches

`main` is where active development occurs.

`release/vX.Y.Z` has the packaged distribution of a particular version based from the changes on `main`. This is created using a workflow when new releases are published.

When developing, branches should be created off of your fork and not directly off of this repository. If working on a long-running feature and in collaboration with others, a corresponding branch of the same name is permitted. This makes collaboration on a single branch possible, as contributors working on the same feature cannot push commits to others' open Pull Requests.

After a major version increment, there also may be maintenance branches created specifically for supporting older major versions.

### Issue Management

Labels are used to run issues through an organized workflow. Here are the basic definitions:

- `bug`: A confirmed bug report. A bug is considered confirmed when reproduction steps have been documented and the issue has been reproduced.
- `enhancement`: A feature request for something this package might not already do.
- `docs`: An issue that is purely about documentation work.
- `tests`: An issue that is purely about testing work.
- `needs feedback`: An issue that may have claimed to be a bug but was not reproducible, or was otherwise missing some information.
- `discussion`: An issue that is purely meant to hold a discussion. Typically the maintainers are looking for feedback in this issues.
- `question`: An issue that is like a support request because the user's usage was not correct.
- `semver:major|minor|patch`: Metadata about how resolving this issue would affect the version number.
- `security`: An issue that has special consideration for security reasons.
- `good first contribution`: An issue that has a well-defined relatively-small scope, with clear expectations. It helps when the testing approach is also known.
- `duplicate`: An issue that is functionally the same as another issue. Apply this only if you've linked the other issue by number.

**Triage** is the process of taking new issues that aren't yet "seen" and marking them with a basic
level of information with labels. An issue should have **one** of the following labels applied:
`bug`, `enhancement`, `question`, `needs feedback`, `docs`, `tests`, or `discussion`.

Issues are closed when a resolution has been reached. If for any reason a closed issue seems
relevant once again, reopening is great and better than creating a duplicate issue.

## Everything else

When in doubt, find the other maintainers and ask.
