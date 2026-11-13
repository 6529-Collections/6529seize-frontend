# Wave Leaderboard Results Timeline

## What This Covers

Multi-result leaderboard waves show an expandable timeline header, formerly
called Decision Timeline. It summarizes the next valid result or season-transition message and can open
into a horizontal result strip.

## Where Users See It

- Routes: `/waves/{waveId}` and `/messages/{waveId}`.
- Only when the wave still has an available `Leaderboard` tab.
- At the top of leaderboard content, above sticky sort and filter controls.
- Same behavior on desktop and mobile.

## Header States

- `Results timeline` appears when at least one future result remains after
  pause filtering.
- `Announcement history` appears when no future valid result remains.
- Status text can be:
  - local short date/time for the next valid result
  - `Congrats to last SZN winners!` and `Next SZN starts: <date>` when the wave
    is in a pause, or when the next pause starts before any remaining result
  - `No upcoming events` when no valid future result is available

## Expand and Review

1. Open `Leaderboard`.
2. Tap/click the timeline header row to expand or collapse.
3. In expanded view, review result points:
   - `Next` badge on the next upcoming result.
   - `Completed` badge on past results.
4. Use `Show earlier` or `Show later` when present.
5. Some labels include counts (for example `Show 6 earlier`).
6. Infinite rolling timelines can show `Show later` without a count.

## Scrolling and Loading

- On expand, the strip auto-scrolls near the next result when it is loaded.
- If the next result is outside the initial future window, future points
  auto-load in short bursts until found or capped.
- After `Show earlier` or `Show later`, the strip scrolls toward the newly
  loaded edge.

## Edge Behavior

- Results inside configured pause windows are excluded from both rendering and
  next-result selection.
- If no result points exist, expand still opens and shows an empty strip.
- Expanded state is local UI state and resets when the leaderboard unmounts
  (refresh, tab switch, or wave switch).
- Single-result waves do not render this timeline:
  - non-curation waves show matching submission and voting status sections
  - before each phase starts, its status says `Submissions open in` or
    `Voting opens in`; during a timed phase it says `Submissions close in` or
    `Voting closes in`, followed by a countdown
  - ended phases say `Submissions closed` or `Voting closed`; known dates appear
    inline beside the status in the viewer's locale, including the year
  - manually ended decisions show `Submissions closed` even if submissions
    originally had no end date or a later scheduled deadline
  - open-ended phases say `Submissions open` or `Voting open`, with `No end date`
  - when a future winner announcement is scheduled, `Next winners announced in`
    shows a live countdown and local calendar date beside those phase cards
  - the announcement countdown follows the result schedule, excluding pauses,
    and disappears when no future announcement remains; perpetual rankings with
    no scheduled winners do not show it
  - status, countdown, and date share a compact line; groups wrap onto additional
    rows only when there is not enough horizontal space
  - curation waves show no timing card in this slot

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Sort and Price Filters](feature-sort-and-group-filters.md)
- [Wave Winners Tab](feature-winners-tab.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
