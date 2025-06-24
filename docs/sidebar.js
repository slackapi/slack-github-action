/**
 * this script sets the slack github action docs sidebar 
 * 
 * sidebar values take the form of "slack-github-action/path-within-docs/"
 * in other words - full path but remove "docs"
 *
 * for info on syntax see https://docusaurus.io/docs/sidebar
 *
 * this file is copied into slackapi.gibhub.io/slack-github-action/sidebar.js 
 * it is then called in slackapi.github.io/sidebars.js
 */

export default [
  {
    type: 'doc',
    id: 'slack-github-action/slack-github-action',
    label: 'Slack GitHub Action',
    className: 'sidebar-title',
  },
  { type: 'html', value: '<hr>' },
  'slack-github-action/sending-variables',
  {
    type: 'category',
    label: 'Sending techniques',
    collapsed: false,
    link: {
      type: 'doc',
      id: 'slack-github-action/sending-techniques/sending-techniques',
    },
    items: [
      'slack-github-action/sending-techniques/sending-techniques',
      {
        type: 'category',
        label: 'Sending data via a webhook to start a Slack workflow',
        link: {
          type: 'doc',
          id: 'slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/sending-data-webhook-slack-workflow',
        },
        items: [
          'slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/sending-data-webhook-slack-workflow',
          'slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/format-generated-files',
          'slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/post-release-announcements',
          'slack-github-action/sending-techniques/sending-data-webhook-slack-workflow/update-a-channel-topic',
        ],
      },
      {
        type: 'category',
        label: 'Sending data using a Slack API method',
        link: {
          type: 'doc',
          id: 'slack-github-action/sending-techniques/sending-data-slack-api-method/sending-data-slack-api-method',
        },
        items: [
          'slack-github-action/sending-techniques/sending-data-slack-api-method/sending-data-slack-api-method',
          'slack-github-action/sending-techniques/sending-data-slack-api-method/direct-message-author',
          'slack-github-action/sending-techniques/sending-data-slack-api-method/invite-usergroup-to-channel',
        ],
      },
      {
        type: 'category',
        label: 'Sending data as a message with a Slack incoming webhook URL',
        link: {
          type: 'doc',
          id: 'slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/sending-data-slack-incoming-webhook',
        },
        items: [
          'slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/sending-data-slack-incoming-webhook',
          'slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-inline-text-message',
          'slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-inline-block-message',
          'slack-github-action/sending-techniques/sending-data-slack-incoming-webhook/post-blocks-found-in-file',
        ],
      },
    ],
  },
  'slack-github-action/additional-configurations',
]