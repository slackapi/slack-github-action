# Docs

This repo contains two types of docs files:

* markdown files
* sidebar.json

The private repo containing the tools.slack.dev site 
pulls these in at build time.

Maintainers need to use the `run workflow` button 
associated with the `deploy` workflow in that private repo 
to update the docs with changes from here. 

## markdown files

The markdown files here are secretly mdx files in disguise.

If you'd like to add images to pages, 
add the image files to the same folder the md file is in.

We appreciate markdown edits from anyone!!! 

## `sidebar.json`

`_sidebar.json` sets the slack github action docs sidebar 

sidebar values take the form of "slack-github-action/path-within-docs/"

or, in other words - full path but remove "docs"

for info on syntax see https://docusaurus.io/docs/sidebar

this file is copied into slackapi.gibhub.io/slack-github-action/sidebar.js 
it is then called in slackapi.github.io/sidebars.js