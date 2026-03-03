# Wave Outcome Lists

## Overview

Outcome info appears in two user-facing surfaces:

- `Outcome` tab cards in the active wave thread
- rank-level outcome summaries in leaderboard and winners rows/cards

This page owns both so users can map configured outcomes to per-rank results.

## Location in the Site

- `Outcome` tab on `/waves/{waveId}` and `/messages?wave={waveId}` when that tab
  is available.
- Curation waves do not show the `Outcome` tab.
- Ranked surfaces that can show outcome summaries:
  - right-sidebar `Leaderboard` rows
  - leaderboard compact rows (top-three and standard)
  - compact winners cards
  - winners podium cards
  - full winners rows with an `Outcome:` line

## Entry Points

- Open a wave where `Outcome` is available and select `Outcome`.
- Open a ranked row/card that shows `Outcome` or `Outcome:`.
- Expand an outcome card and use `View X more` when present.

## User Journey

1. Open `Outcome`.
2. The tab shows `Loading outcomes...` while the first outcomes request is in
   flight.
3. If the request succeeds:
   - one collapsible card renders per configured outcome (`Manual`, `Rep`,
     `NIC`)
   - each card is collapsed by default
4. Expand a card to view winner rows (up to three rows initially).
5. Open cards show `Loading winners...` while winner rows are still loading.
6. If more rows exist, use `View X more`:
   - first click reveals already loaded hidden rows
   - if another server page exists, the card also fetches more rows and shows
     `Loading...`
7. If no outcomes exist for the wave, the tab shows `No outcomes to show.`.
8. If a card has no winners, it shows `No winners yet`.
9. Rank-summary rendering depends on surface:
   - leaderboard compact rows show a pulse placeholder while loading
   - compact winners rows show nothing until rewards resolve
10. When rewards exist:
   - compact leaderboard/winners controls show `Outcome` and open a tooltip
   - full winners rows show an inline `Outcome:` line (no tooltip)
11. When rewards do not exist for that rank, no outcome control/line is shown.

## Common Scenarios

- `Rep` cards show `Category` when `rep_category` exists.
- `Rep` and `NIC` cards keep total-pool values visible while winner rows load.
- Manual winner rows show `-` when the returned winner amount is `0`.
- Outcome cards continue loading while scrolling and show `Loading more outcomes...`.
- Ranked rows/cards with rewards show outcome details; rows/cards with no rewards
  omit outcome controls.

## Edge Cases

- If the wave-level outcomes request fails before cards render, the tab shows
  the request error text.
- If a later distribution fetch fails in an expanded card, that card shows a red
  inline error and other cards remain usable.
- If rank-reward lookup is delayed, the row/card stays usable while outcome data
  is pending.
- If rank data is missing for a lookup response, no outcome control is shown for
  that row/card.

## Failure and Recovery

- If `Outcome` fails to load, reopen the tab or reload the current wave route.
- If a `View X more` fetch fails, retry `View X more` after network recovery.
- If rank-reward summary is missing after load, refresh to trigger a new reward
  request.

## Limitations / Notes

- `Outcome` does not support manual sorting or filtering.
- `View X more` is the only pagination control for outcome rows.
- `View X more` counts are based on server totals.
- Outcome summaries are read-only; they do not open winner rows or replace
  drop-level navigation.
- Outcome summary presentation differs by surface (tooltip vs inline `Outcome:`).

## Related Pages

- [Wave Content Tabs](chat/feature-content-tabs.md)
- [Wave Right Sidebar Leaderboard](sidebars/feature-right-sidebar-leaderboard.md)
- [Wave Leaderboard Drop States](leaderboard/feature-drop-states.md)
- [Wave Leaderboards Index](leaderboard/README.md)
- [Wave Winners Tab](leaderboard/feature-winners-tab.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
- [Waves Index](README.md)
- [Docs Home](../README.md)
