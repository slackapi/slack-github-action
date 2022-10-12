# Maintainers Guide

This document describes tools, tasks and workflow that one needs to be familiar with in order to effectively maintain
this project. If you use this package within your own software as is but don't plan on modifying it, this guide is
**not** for you.

## Tools

All you need to work with this project is a supported version of [Node.js](https://nodejs.org/en/)
(see `package.json` field "engines") and npm (which is distributed with Node.js).

## Tasks

### Testing

When testing locally, ensure at least linting and unit tests pass by running `npm test`.
Additionally, sending a PR is highly recommended with every change as there are several GitHub
Actions jobs that execute what are effectively integration tests for this GitHub Action.

### Releasing

* Check the status of this project's GitHub Milestone to be released for issues that should be shipped with the release.
  -  If all issues have been closed, continue with the release.
  -  If issues are still open, discuss with the team about whether the open issues should be moved to a future release or if the release should be held off until the issues are resolved.
  -  Take a look at all issues under the Milestone to make sure that the type of issues included aligns with the Milestone name based on [semantic versioning](https://semver.org/). If the issues do not align with the naming of the Milestone (ex: if the issues are all bug fixes, but the Milestone is labeled as a minor release), then you can tweak the Milestone name to reflect the correct versioning.
* Update the version in `package.json`.
* Update all references to versions in the README and in the workflow files under `example-workflows/` to refer to the latest release.
* Run all tests using `npm test` to make sure the tests pass.
* Commit the changes on your `main` branch.
* Create a git tag for the new version. Should be in the format `v1.4.0`. `git tag v1.4.0`.
* Push changes up to GitHub `git push origin main --tags`.
* Create a GitHub Release based on the tag you just pushed up - this will trigger the publishing
  GitHub workflow.
* Once released, make sure to close the relevant GitHub Milestone for the version you released.

## Workflow

### Versioning and Tags

This project is versioned using [Semantic Versioning](http://semver.org/), particularly in the
[npm flavor](https://docs.npmjs.com/getting-started/semantic-versioning). Each release is tagged
using git.

### Fork

As a maintainer, the development you do will be almost entirely off of your forked version of this repository. The exception to this rule pertains to multiple collaborators working on the same feature, which is detailed in the **Branches** section below.

### Branches

`main` is where active development occurs.

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

## Everything else

When in doubt, find the other maintainers and ask.
