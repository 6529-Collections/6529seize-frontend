# Wave Composer

## Overview

This area documents drop composing and drop editing in wave and direct-message
threads.

Use this area when you need behavior for:

- text submission and storm posting
- metadata-only submissions
- user/wave mentions, NFT hashtag references, emoji, and markdown formatting
- curation URL-only submissions
- drag/paste image uploads in composer inputs

## Route Coverage

- Wave thread composer: `/waves/{waveId}`
- Direct-message thread composer: `/messages?wave={waveId}` (no
  `/messages/{waveId}` route)
- Legacy `/waves?wave={waveId}` links redirect to `/waves/{waveId}` before the
  composer loads.
- Composer availability and eligibility states are documented in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).
- Create-wave `Description` step uses a different editor stack and is owned by
  [Wave Creation Description Step](../create/feature-description-step.md).

## Features

### Submission and Content

- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Drop Composer Drag-and-Paste Image Uploads](feature-wave-drop-drag-paste-image-uploads.md)

### Mentions and Markdown

- [Wave Mentions](feature-wave-mentions.md)
- [Wave NFT Hashtag References](feature-nft-hashtag-references.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](feature-markdown-code-blocks.md)

### Curation and Edit Flows

- [Wave Curation URL Submissions](feature-curation-url-submissions.md)
- [Wave Drop Edit Mention Preservation](feature-edit-mention-preservation.md)

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): canonical end-to-end
  wave navigation and interaction flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Creation Index](../create/README.md)
- [Drop Actions Index](../drop-actions/README.md)
