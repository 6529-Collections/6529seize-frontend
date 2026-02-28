# Waves

## Overview

Use this area when users need to find waves, open a wave thread, post or
interact with drops, and recover from wave-route failures.

## Route Coverage

- Discovery and list routes: `/discover`, `/waves`, `/messages`.
- Thread routes: `/waves/{waveId}`, `/messages?wave={waveId}`.
- Wave creation route: `/waves/create`.
- Legacy wave links: `/waves?wave={waveId}` normalize to `/waves/{waveId}`.
- Legacy profile wave alias: `/{user}/waves` redirects to `/{user}`.
- Direct-message creation route `/messages/create` is owned by the Navigation
  docs area.

## Features

- [Discovery](discovery/README.md): find and open waves from discover/list
  surfaces, including `My Votes`.
- [Create](create/README.md): wave creation entry points and create-step
  behavior.
- [Chat](chat/README.md): timeline scroll, serial jumps, unread controls, and
  typing state.
- [Composer](composer/README.md): compose/edit drops with markdown, mentions,
  emoji, uploads, and metadata submissions.
- [Drop Actions](drop-actions/README.md): vote, react, open/copy links, curation,
  and media actions.
- [Header](header/README.md): wave header controls, picture editing, and mobile
  chat/gallery toggle.
- [Sidebars](sidebars/README.md): wave/direct-message list navigation and
  right-sidebar controls.
- [Link Previews](link-previews/README.md): external/social/web3 preview-card
  rendering in thread content.
- [Leaderboard](leaderboard/README.md): leaderboard states, filters, timeline,
  and top-voter views.
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
