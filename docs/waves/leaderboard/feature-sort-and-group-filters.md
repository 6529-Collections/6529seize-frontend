# Wave Leaderboard Sort and Group Filters

## Overview

Wave leaderboards let users reorder drops with sort controls and, when curation
groups exist, filter the leaderboard to a single group.

## Location in the Site

- Wave `Leaderboard` tab header above leaderboard results.
- Wave detail routes where a `Leaderboard` tab is available (`/waves/{waveId}`,
  `/messages?wave={waveId}`).

## Entry Points

- Open a wave and select the `Leaderboard` tab.
- Use the sort tabs or `Sort` dropdown to change ordering.
- If curation groups are available, use the `Group` tabs or dropdown to filter.

## User Journey

1. Open a wave with a `Leaderboard` tab.
2. Review the header controls above the leaderboard results.
3. Select a sort option to reorder the current leaderboard view.
4. (Optional) Select a group filter to show only submissions in that group.
5. Switch between sorts or groups to compare ordering.

## Common Scenarios

- Sort options appear in this order: `Current Vote`, `Projected Vote`, `Hot`,
  `Newest`.
- `Current Vote` orders drops by the current vote ranking for the wave.
- `Projected Vote` orders drops by the leaderboard's projected vote data.
- `Hot` surfaces drops that are trending within the wave.
- `Newest` orders drops by the most recent submissions.
- `All submissions` resets the group filter to the full leaderboard.
- On narrow layouts, sort and group controls may collapse into dropdowns labeled
  `Sort` and `Group`.
- On narrow layouts, control labels stay on one line so the full option text remains
  readable without wrapping.

## Edge Cases

- Sort and group combinations can legitimately produce empty leaderboards.
- If a wave has no curation groups, the group filter does not appear.
- Waves with many groups may show a long list in the `Group` dropdown.
- On very small screens, all sort and group labels remain visible in a single line
  using the same spacing as the page controls.

## Failure and Recovery

- Switching sort or group options triggers a fresh leaderboard load.
- If a load fails, users can retry by reselecting the option or refreshing the page.
- Returning to the leaderboard later retries the data load automatically.

## Limitations / Notes

- Sorting and filtering only change the leaderboard presentation; they do not
  change votes or wave configuration.
- Sort labels describe ordering, not guaranteed ranking formulas.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
