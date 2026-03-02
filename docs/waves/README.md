# Waves

## Overview

Use this area for wave and direct-message tasks:

- browse wave and conversation lists
- open threads from lists or shared links
- create waves or direct messages
- post, vote, react, and manage drops
- recover from route, tab, deep-link, or posting failures

## Route and Query Coverage

- Primary routes: `/discover`, `/waves`, `/waves/{waveId}`, and `/messages`.
- Direct-message threads use `/messages?wave={waveId}` (no
  `/messages/{waveId}` route).
- App create routes: `/waves/create` and `/messages/create`.
- Web create URL states use `?create=` on the current route:
  `/discover`, `/waves`, `/waves/{waveId}`, or `/messages`.
- `drop={dropId}` opens a single-drop overlay in the current thread context.
- If a URL contains both `drop` and `serialNo`, drop-open behavior applies
  first.
- Closing the drop overlay removes `drop` from the URL.
- `serialNo={n}` targets a chat drop during initial thread setup.
- `divider={n}` sets unread-divider position only when `serialNo` is present.
- After jump setup, the app removes both `serialNo` and `divider` from the
  URL.

## Access and Availability

- `/discover`, `/waves`, and `/messages` require an authenticated wallet.
- A profile handle is required before route content renders.
- When waves access is unavailable (for example proxy-restricted access), these
  routes show an unavailable state.
- Wave and direct-message creation requires an eligible connected profile.

## Legacy Routes and Ownership

- Legacy wave links: `/waves?wave={waveId}` redirect to `/waves/{waveId}` and
  keep other query values.
- Legacy profile alias: `/{user}/waves` redirects to `/{user}`.
- Route-shell behavior (header/back) for `/waves/create` and `/messages/create`
  is owned by Navigation docs.
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
  route, tab, posting, and deep-link recovery for `/waves/{waveId}` and
  `/messages?wave={waveId}` thread contexts.

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Navigation Index](../navigation/README.md)
- [Profiles Index](../profiles/README.md)
- [Media Index](../media/README.md)
- [Shared Index](../shared/README.md)
