# Wave Leaderboards

## Overview

Use this area for rank-wave leaderboard tasks: submission entry, ranking views,
decision timing, winners, and vote management.

This area covers:
- Thread routes: `/waves/{waveId}` and `/messages?wave={waveId}`.
- `Leaderboard` before voting ends.
- `Sales` in curation waves.
- `Winners` after the first decision time passes.
- `My Votes` in memes and curation waves.
- Wave-level `Voters` plus non-chat single-drop `Top voters`.
- Curation-group URL sync with `curated_by_group={groupId}`.
- Curation-only ETH price filtering and `Price` sort.
- Curation submit entry from leaderboard actions (`Drop Art` / empty-state
  `Drop`) into `Drop Artwork` modal flow.

## Features

### Start Here

- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md):
  who can submit, where `Drop` appears, and restriction messages.
- [Wave Leaderboard Drop States](feature-drop-states.md): loading, populated,
  and empty leaderboard behavior.
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md):
  sort options, group and price filtering, and URL/local-state behavior.
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md): memes `Grid view`
  cards, media badges, and vote entry points.

### Decision and Outcome Views

- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md): collapsed
  header, pause messaging, and expandable decision history.
- [Wave Sales Tab](feature-sales-tab.md): curation-wave sale-link cards,
  loading/empty states, and paging through older decision rounds.
- [Wave Winners Tab](feature-winners-tab.md): when winners appear and how
  main-thread and right-sidebar winners render in single-decision vs
  multi-decision waves.
- [Wave My Votes Tab](feature-my-votes-tab.md): voted-drop list, inline vote
  edits, select-all controls, and bulk reset behavior.
- [Wave Top Voters Lists](feature-top-voters-lists.md): wave-level and
  drop-level voter rankings.

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
- [Drop Actions Index](../drop-actions/README.md)
- [Sidebars Index](../sidebars/README.md)
