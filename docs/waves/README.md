# Waves

## Overview

Use this area when users need to:

- browse waves and direct-message conversations
- open a thread from lists or shared links
- create a wave or direct-message thread
- post, vote, react, and manage drops
- recover from route, tab, link-target, or posting failures

In-scope routes:

- List and discovery routes: `/discover`, `/waves`, `/messages`.
- Wave thread route: `/waves/{waveId}`.
- Direct-message thread route: `/messages?wave={waveId}` (no `/messages/{waveId}` route).
- App create routes: `/waves/create`, `/messages/create`.
- Web create-modal URL states for wave creation: `/discover?create=wave` or `/waves?create=wave`.
- Web create-modal URL states for direct-message creation: `/discover?create=dm`, `/waves?create=dm`, or `/messages?create=dm`.

Thread query behavior:

- `drop={dropId}` opens a single-drop overlay in the current thread context.
- `serialNo={n}` targets a chat drop during initial thread setup.
- `divider={n}` sets unread-divider position only when `serialNo` is also present.
- After jump setup, the app clears both `serialNo` and `divider` from the URL.

Access constraints:

- Wave and direct-message creation requires a connected profile.
- In web, create actions use `?create=wave` or `?create=dm`.
- In app, create actions use `/waves/create` or `/messages/create`.

Legacy and ownership notes:

- Legacy wave links: `/waves?wave={waveId}` redirect to `/waves/{waveId}` and keep other query values.
- Legacy profile alias: `/{user}/waves` redirects to `/{user}`.
- Route-shell behavior (header/back) for `/waves/create` and `/messages/create` is owned by Navigation docs.
- Wave and direct-message creation form behavior is owned by Waves Create docs.

## Features

- [Discovery](discovery/README.md): find and open waves from discover and list
  surfaces, including `My Votes`.
- [Create](create/README.md): wave and direct-message creation entry points and
  form/step behavior.
- [Chat](chat/README.md): timeline scroll, serial jumps, unread controls, and
  typing state.
- [Composer](composer/README.md): compose and edit drops with markdown,
  mentions, emoji, uploads, and metadata submissions.
- [Drop Actions](drop-actions/README.md): vote, react, open/copy links,
  curation, and media actions.
- [Header](header/README.md): header controls, picture editing, and mobile
  chat/gallery toggle.
- [Sidebars](sidebars/README.md): wave/direct-message list navigation and
  right-sidebar controls.
- [Link Previews](link-previews/README.md): external/social/web3 preview-card
  rendering in thread content.
- [Leaderboard](leaderboard/README.md): leaderboard states, filters, timeline,
  winners-tab behavior, and top-voter views.
- [Memes](memes/README.md): memes submission flow and submission-state behavior.
- [Outcome Lists](feature-outcome-lists.md): outcome cards, winner rows, and
  distribution loading states.

## Flows

- [Wave Participation Flow](flow-wave-participation.md): end-to-end journey from
  wave discovery to in-thread actions and shared links.

## Troubleshooting

- [Wave Troubleshooting](troubleshooting-wave-navigation-and-posting.md):
  route, tab, posting, and drop-link recovery guidance.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Profiles Index](../profiles/README.md)
- [Media Index](../media/README.md)
- [Shared Index](../shared/README.md)
