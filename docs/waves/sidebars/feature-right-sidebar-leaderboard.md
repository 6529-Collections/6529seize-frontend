# Wave Right Sidebar Leaderboard

## Overview

The right-sidebar `Leaderboard` tab shows a compact ranked-drop list for rank
waves. It supports quick scan, inline vote actions on standard rows, and
drop-overlay open actions from each row.

## Location in the Site

- Right sidebar on `/waves/{waveId}` and `/messages?wave={waveId}`
- Rank-wave `Leaderboard` tab (shown while voting is active)
- Inline and overlay right-sidebar variants

## Entry Points

- Open a rank wave and open the right sidebar.
- Select `Leaderboard` in the tab row.

## User Journey

1. Open a rank wave with the right sidebar visible.
2. Select `Leaderboard`.
3. Review ranked rows:
   - top-three rows use winner styling
   - row content includes preview media/text plus author and score details
4. Select a row to open that drop in the overlay (`drop` query).
5. Close the overlay to return to the same wave and sidebar tab.
6. Scroll to fetch more rows when available.

## Common Scenarios

- Use the sidebar list to compare top drops without leaving the wave route.
- Standard rows include inline vote controls.
- Top-three rows prioritize winner display and do not show the inline vote
  control.
- Rows with outcome data show an `Outcome` badge with tooltip details.

## Edge Cases

- If no drops are available, the tab shows `No drops have been made yet in this wave`.
- Drops with no preview media still render text and metadata summaries.
- While a full drop overlay is open, the right sidebar is hidden.

## Failure and Recovery

- If leaderboard fetch fails or stalls, reopen the tab or reload the wave.
- If pagination fails mid-list, already loaded rows remain visible and you can
  retry by scrolling again.

## Limitations / Notes

- `Leaderboard` is hidden after voting completes.
- This sidebar list is a compact summary; use full leaderboard surfaces for
  broader filtering and views.

## Related Pages

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
