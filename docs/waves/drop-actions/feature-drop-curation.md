# Wave Drop Curation Actions

## Overview

Eligible users can tag a drop as curated or remove that tag.

The main curation button toggles between `Curate` and `Curated`. In touch
content-only leaderboard action sheets, the same toggle is labeled
`Curate drop` and `Uncurate drop`.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Leaderboard list cards
- Leaderboard compact grid cards
- Leaderboard content-only grid cards (inline overlay actions and touch
  long-press action sheet)
- Participation drop cards (ongoing and ended views)

Not shown on:

- Direct-message thread drops: `/messages?wave={waveId}`
- Leaderboard gallery cards (including memes gallery-style cards)

## Entry Points

- Open `/waves/{waveId}`.
- Go to leaderboard or participation content.
- On an eligible drop, select `Curate` (or `Curate drop` on touch
  content-only cards).
- Select `Curated` or `Uncurate drop` to remove curation.

## User Journey

1. Open `/waves/{waveId}` and find a drop on leaderboard or participation
   surfaces.
2. If the drop is curatable for your account, curation controls are shown.
3. Select `Curate`.
4. The drop switches to curated state (`Curated`).
5. Select `Curated` (or `Uncurate drop` in the touch action sheet) to remove
   curation.

## Common Scenarios

- Leaderboard list cards show curation next to voting actions.
- Compact leaderboard grid cards show curation in the footer action row.
- Content-only leaderboard grid cards show curation in the hover/tap action
  cluster; touch users can use long-press and choose `Curate drop`.
- Participation cards show curation near voting and reaction controls.

## Edge Cases

- If a drop is not curatable for your account, curation controls are not shown.
- Temporary drops (`temp-*`) cannot be curated.
- If wallet connection is missing when action runs, users see
  `Please connect your wallet to curate drops`.
- While a curate/uncurate request is pending, repeat taps are blocked for that
  action control.
- Standard chat drop menus do not include curation actions.

## Failure and Recovery

- If curate/uncurate fails, curation state returns to the previous value.
- Failures show an error toast with the failure reason.
- Retry by selecting the same curation action again.
- Successful changes refresh drop data so leaderboard and participation views
  resync.

## Limitations / Notes

- Curation is independent from voting; it does not submit a vote.
- Group-filter behavior (`curated_by_group`) is documented in leaderboard filter
  docs.
- Curation toggles are not available in gallery-card layouts.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Leaderboard Sort and Group Filters](../leaderboard/feature-sort-and-group-filters.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Docs Home](../../README.md)
