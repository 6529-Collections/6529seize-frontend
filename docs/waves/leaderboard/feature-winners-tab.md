# Wave Winners Tab

## Overview

The `Winners` tab shows announced winning drops for a wave after the first
decision time is reached.
Single-decision waves show a podium plus winner rows.
Multi-decision waves show winner groups in a dated timeline.

## Location in the Site

- Rank-wave thread routes: `/waves/{waveId}`
- Rank-wave direct-message routes: `/messages?wave={waveId}`
- Desktop and mobile wave tab layouts when `Winners` is available

## Entry Points

- Open a rank wave and switch to `Winners` once the tab appears.
- Open a direct-message wave and switch to `Winners`.
- From right-sidebar rank-wave tabs, switch to `Winners` without leaving the
  current route.

## User Journey

1. Open a rank wave.
2. After first decision time passes, select `Winners`.
3. Review winners in the active layout:
   - Single decision: podium (top placements) plus winner rows.
   - Multi decision: timeline groups ordered newest-first by decision time.
4. Click a winner row/card to open the drop in the current wave context.
5. Close the drop and continue browsing winners without leaving the route.

## Common Scenarios

- `Leaderboard` is hidden after voting ends, while `Winners` remains available.
- Memes waves render media-rich winner cards with traits and vote context.
- Non-memes waves render compact winner rows with rank, vote totals, voter
  counts, and outcome summaries.
- Winner rows can show your own vote context when you have voted on that drop.

## Edge Cases

- `Winners` does not appear before first decision time.
- If no winners are announced yet, the tab shows a no-winners empty state.
- Single-decision podium can render fewer than three winners when only some
  places are available.
- On touch devices, winner-card actions route through the touch action sheet
  instead of hover controls.

## Failure and Recovery

- While decisions are loading, winners surfaces show loading placeholders.
- If decision data is unavailable, the winners tab can resolve to empty-state
  messaging; refresh the wave and retry.
- If opening a winner drop fails, close the drop panel and reopen another
  winner row from the same tab.

## Limitations / Notes

- `Winners` availability is controlled by wave timing and type.
- Tab selection is UI state and is not encoded in URL tab parameters.
- Winners are grouped by decision and sorted by decision timestamp in
  multi-decision views.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Content Tabs](../discovery/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
