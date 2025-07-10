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

When testing locally, ensure at least linting and unit tests pass by running `npm test`.
Additionally, sending a PR is highly recommended with every change as there are several GitHub
Actions jobs that execute what are effectively integration tests for this GitHub Action.

#### Checks on PRs

Actions that run the integration tests on PRs from a fork will require approval before running.
These checks use stored secrets so the changes should be reviewed before approving the workflow to
avoid accidently leaking tokens!

### Releasing

1. Check the status of this project's GitHub [Milestone](https://github.com/slackapi/slack-github-action/milestones) to be released for issues that should be shipped with the release.
   - If all issues have been closed, continue with the release.
   - If issues are still open, discuss with the team about whether the open issues should be moved to a future release or if the release should be held off until the issues are resolved.
   - Take a look at all issues under the Milestone to make sure that the type of issues included aligns with the Milestone name based on [semantic versioning](https://semver.org/). If the issues do not align with the naming of the Milestone (ex: if the issues are all bug fixes, but the Milestone is labeled as a minor release), then you can tweak the Milestone name to reflect the correct versioning.
2. Checkout a branch for the release:

```sh
$ git checkout -b v1.2.3
```

3. Update the version in `package.json` and `package-lock.json` and examples:

```sh
$ npm version <major|minor|patch> --no-git-tag-version
```

4. Run all tests with the latest dependencies to make sure tests pass:

```sh
$ npm ci
$ npm test
```

5. Commit the changes on your release branch and open a pull request with relevant labels:

```sh
$ git commit -m "chore(release): tag version 1.2.3"
$ git push -u origin v1.2.3
```

6. After merging these changes into `main` create a new [release](https://github.com/slackapi/slack-github-action/releases/new) with a new tag - `v1.2.3` - on publish. Include relevant changes in the release notes!
7. Rebuild [documentation](#docs) with the latest versions.
8. Once released, make sure to close the relevant GitHub Milestone for the version you released.

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

*  `bug`: A confirmed bug report. A bug is considered confirmed when reproduction steps have been
   documented and the issue has been reproduced.
*  `enhancement`: A feature request for something this package might not already do.
*  `docs`: An issue that is purely about documentation work.
*  `tests`: An issue that is purely about testing work.
*  `needs feedback`: An issue that may have claimed to be a bug but was not reproducible, or was otherwise missing some information.
*  `discussion`: An issue that is purely meant to hold a discussion. Typically the maintainers are looking for feedback in this issues.
*  `question`: An issue that is like a support request because the user's usage was not correct.
*  `semver:major|minor|patch`: Metadata about how resolving this issue would affect the version number.
*  `security`: An issue that has special consideration for security reasons.
*  `good first contribution`: An issue that has a well-defined relatively-small scope, with clear expectations. It helps when the testing approach is also known.
*  `duplicate`: An issue that is functionally the same as another issue. Apply this only if you've linked the other issue by number.

**Triage** is the process of taking new issues that aren't yet "seen" and marking them with a basic
level of information with labels. An issue should have **one** of the following labels applied:
`bug`, `enhancement`, `question`, `needs feedback`, `docs`, `tests`, or `discussion`.

Issues are closed when a resolution has been reached. If for any reason a closed issue seems
relevant once again, reopening is great and better than creating a duplicate issue.

## Docs

This repo contains two types of docs files:

* markdown files
* sidebar.json

The private repo containing the tools.slack.dev site pulls these in at build time.

Maintainers need to use the `run workflow` button associated with the `deploy` workflow in that private repo to update the docs with changes from here.

### Markdown Files

The markdown files here are secretly mdx files in disguise.

If you'd like to add images to pages, add the image files to the same folder the md file is in.

We appreciate markdown edits from anyone!!!

### Sidebar

`_sidebar.json` sets the slack github action docs sidebar

sidebar values take the form of "slack-github-action/path-within-docs/"

or, in other words - full path but remove "docs":
path: slack-github-action/docs/sending-variables.md
value: slack-github-action/sending-variables

for info on syntax see https://docusaurus.io/docs/sidebar

this file is copied into slackapi.github.io/slack-github-action/sidebar.js it is then called in slackapi.github.io/sidebars.js

## Everything else

When in doubt, find the other maintainers and ask.
