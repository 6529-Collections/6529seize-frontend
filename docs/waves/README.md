# Waves

## Overview

Use this area when users need to:

- find waves from list surfaces
- open a wave thread or direct-message thread
- create a wave
- post, vote, react, and manage drops
- recover from route, tab, or posting failures

In-scope routes:

- List and discovery routes: `/discover`, `/waves`, `/messages`.
- Thread routes: `/waves/{waveId}`, `/messages?wave={waveId}`.
- Wave creation route (app mode): `/waves/create`.
- Desktop create-modal URL state: `?create=wave`.

Thread query behavior:

- `drop={dropId}` opens the drop overlay.
- `serialNo={n}` targets a drop in chat.
- `divider={n}` sets the unread divider with serial targeting.

Legacy and ownership notes:

- Legacy wave links: `/waves?wave={waveId}` normalize to `/waves/{waveId}`.
- Legacy profile alias: `/{user}/waves` redirects to `/{user}`.
- `/messages/create` is owned by the Navigation docs area.

## Features

- [Discovery](discovery/README.md): find and open waves from discover and list
  surfaces, including `My Votes`.
- [Create](create/README.md): wave creation entry points and step behavior.
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
- [Outcomes](feature-outcome-lists.md): outcome cards, winner rows, and
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
