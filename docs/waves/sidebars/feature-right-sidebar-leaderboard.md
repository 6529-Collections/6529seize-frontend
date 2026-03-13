# Wave Right Sidebar Leaderboard

## Overview

The right sidebar `Leaderboard` tab shows a compact, scrollable list of ranked
drops for a rank wave. It is optimized for quick scanning and jump-to-drop
navigation without leaving the current wave.

## Location in the Site

- Right sidebar on rank-wave routes like `/waves/{waveId}` and
  `/messages?wave={waveId}`.
- `Leaderboard` tab in the right sidebar tab row (only while voting is active).
- Inline and overlay sidebar variants.

## Entry Points

- Open a rank wave and open the right sidebar.
- Select `Leaderboard` from the sidebar tabs.

## User Journey

1. Open a rank wave with the right sidebar visible.
2. Select `Leaderboard` in the sidebar tabs.
3. Review the list of ranked drops:
   - top-three rows are highlighted with winner styling
   - each row shows a media preview and the first drop text
   - media rows include a compact format badge when file media metadata is available
   - author handle and score details appear below the preview
4. Click a row to open that drop in the main wave view.
5. Scroll to load more rows when available.

## Common Scenarios

- The list loads and progressively adds rows as you scroll.
- If a drop includes a preview image, the sidebar list uses it as the media
  thumbnail; otherwise it shows the drop’s first media attachment when available.
- Standard rows include an inline vote action; top-three highlight rows omit the
  inline vote control.
- Outcome rewards appear as an `Outcome` badge that opens a tooltip with NIC, Rep,
  or manual outcomes when available.

## Edge Cases

- If no drops exist, the tab shows `No drops have been made yet in this wave`.
- Drops with no media and no preview image show only the text snippet and
  metadata.
- If preview image metadata exists, the original media is not shown in the
  compact preview.
- Format badges inherit the same media-type labeling used by leaderboard gallery cards.

## Failure and Recovery

- If leaderboard data fails to load or stalls, the list may remain empty or
  partially filled; re-opening the tab or reloading the wave retries the fetch.
- If pagination fails mid-scroll, already loaded rows remain visible and
  additional rows can be fetched after a retry.

## Limitations / Notes

- The `Leaderboard` tab is hidden after voting completes.
- The sidebar list is a compact summary; open the full leaderboard or drop
  detail to see full media interactions and metadata.

## Related Pages

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Docs Home](../../README.md)
