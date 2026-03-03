# Wave Leaderboard Decision Timeline

## What This Covers

Multi-decision leaderboard waves show an expandable timeline header.  
It summarizes the next valid decision or season-transition message and can open
into a horizontal decision strip.

## Where Users See It

- Routes: `/waves/{waveId}` and `/messages?wave={waveId}`.
- Only when the wave still has an available `Leaderboard` tab.
- At the top of leaderboard content, above sticky sort and filter controls.
- Same behavior on desktop and mobile.

## Header States

- `Decision Timeline` appears when at least one future decision remains after
  pause filtering.
- `Announcement history` appears when no future valid decision remains.
- Status text can be:
  - local short date/time for the next valid decision
  - `Congrats to last SZN winners!` and `Next SZN starts: <date>` when the wave
    is in a pause, or when the next pause starts before any remaining decision
  - `No upcoming events` when no valid future decision is available

## Expand and Review

1. Open `Leaderboard`.
2. Tap/click the timeline header row to expand or collapse.
3. In expanded view, review decision points:
   - `Next` badge on the next upcoming decision.
   - `Completed` badge on past decisions.
4. Use `Show earlier` or `Show later` when present.
5. Some labels include counts (for example `Show 6 earlier`).
6. Infinite rolling timelines can show `Show later` without a count.

## Scrolling and Loading

- On expand, the strip auto-scrolls near the next decision when it is loaded.
- If the next decision is outside the initial future window, future points
  auto-load in short bursts until found or capped.
- After `Show earlier` or `Show later`, the strip scrolls toward the newly
  loaded edge.

## Edge Behavior

- Decisions inside configured pause windows are excluded from both rendering and
  next-decision selection.
- If no decision points exist, expand still opens and shows an empty strip.
- Expanded state is local UI state and resets when the leaderboard unmounts
  (refresh, tab switch, or wave switch).
- Single-decision waves do not render this timeline:
  - non-curation waves show compact dropping and voting phase cards
  - curation waves show no timing card in this slot

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Wave Winners Tab](feature-winners-tab.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
