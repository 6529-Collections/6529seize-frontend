# Wave Discovery

## Overview

Use this subarea for finding waves from `/discover` before opening a thread.

## Route Coverage

- Discovery route: `/discover`
- Card destination (non-DM waves): `/waves/{waveId}`
- Card destination (direct-message waves): `/messages?wave={waveId}`

## Query Coverage

- `identity={selectedIdentity}` is the only discovery filter persisted in URL state.
- `selectedIdentity` can be a handle or wallet value from `By Identity`.
- Wave-name search is local UI state and is not written to the URL.

## Ownership

- Owns discover section browsing (`Latest`, `Most Followed`, and related
  sections).
- Owns discover search mode (`Search waves` and `By Identity`).
- Owns section expand/collapse (`Show all` and `Show less`) and expanded-list
  paging behavior.
- Owns discover-card routing behavior from `/discover` into wave and DM
  threads.
- Does not own thread tabs or in-thread behavior after route entry.
- Does not own wave/direct-message creation form behavior.

## Features

- [Wave Discover Sections and Search](feature-discover-sections-and-search.md):
  section mode, search mode, identity query behavior, and result paging.
- [Wave Discover Cards](feature-discover-cards.md): full-card navigation,
  profile/follow controls, and wave/DM route destinations.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): canonical
  end-to-end wave navigation and interaction flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Leaderboards Index](../leaderboard/README.md)
- [Wave and Direct Message Creation Index](../create/README.md)
- [Navigation Index](../../navigation/README.md)
- [Profile Navigation Flow](../../profiles/navigation/flow-navigation.md)
