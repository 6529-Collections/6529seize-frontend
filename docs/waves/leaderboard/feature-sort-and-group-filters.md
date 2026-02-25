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
- Use the `Sort` dropdown to change ordering.
- If curation groups are available, use the desktop `Group` tabs or mobile `Group`
  dropdown to filter submissions.

## User Journey

1. Open a wave with a `Leaderboard` tab.
2. Review the header controls above the leaderboard results.
3. Use `Sort` to reorder the current leaderboard view.
4. (Optional) Use the `Group` control to narrow the leaderboard to one group.
5. Switch between sorts or groups to compare ordering and composition.

## Common Scenarios

- The `Sort` dropdown contains: `Current Vote`, `Projected Vote`, `Hot`, `Newest`.
- `Current Vote` orders drops by the current vote ranking for the wave.
- `Projected Vote` orders drops by the leaderboard's projected vote data.
- `Hot` surfaces drops that are trending within the wave.
- `Newest` orders drops by the most recent submissions.
- Sort control is rendered as a dropdown on both mobile and desktop.
- Group filtering includes `All submissions` plus each available curation group.
- On desktop (`md` and up), group filters render as inline tabs.
- On small screens (`< md`), group filters render as a `Group` dropdown.
- Group tabs show compact group styling and keep the active tab visually selected.
- On mobile, both controls remain in a compact row and keep readable labels.
- If a saved group filter no longer resolves to a valid curation group, the filter
  resets to `All submissions`.

## Edge Cases

- Sort and group combinations can legitimately produce empty leaderboards.
- If a wave has no curation groups, only the `Sort` dropdown is shown.
- Waves with many groups may show a longer list in the small-screen `Group`
  dropdown.
- On very small screens, controls remain single-row and avoid truncating their label
  text with a compact width.

## Failure and Recovery

- Switching sort or group options triggers a fresh leaderboard load.
- If a load fails, users can retry by reselecting the option or refreshing the page.
- Returning to the leaderboard later retries the data load automatically.

## Limitations / Notes

- Sorting and filtering only change the leaderboard presentation; they do not
  change votes or wave configuration.
- Sort labels describe ordering, not guaranteed ranking formulas.
- Group names and membership are determined by the curation-group configuration for the
  active wave.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
