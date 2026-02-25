# Wave Leaderboard Sort and Group Filters

## Overview

Wave leaderboards let users reorder drops with sort controls and, when curation
groups exist, filter the leaderboard to a single group.
The controls adapt to available width, choosing tabs when space allows and
fallback dropdown controls when the header is too tight.

## Location in the Site

- Wave `Leaderboard` tab header above leaderboard results.
- Wave detail routes where a `Leaderboard` tab is available (`/waves/{waveId}`,
  `/messages?wave={waveId}`).

## Entry Points

- Open a wave and select the `Leaderboard` tab.
- Use the `Sort` control to change ordering.
- If curation groups are available, use the `Group` control to filter submissions.
- If the control row is tighter than available width, use the horizontal control
  row to reach hidden controls.

## User Journey

1. Open a wave with a `Leaderboard` tab.
2. Review the header controls above the leaderboard results.
3. Use the `Sort` control (tabs or dropdown, depending on space) to reorder the
   current leaderboard view.
4. (Optional) Use the `Group` control to narrow the leaderboard to one group.
5. Switch between sorts or groups to compare ordering and composition.
6. If the control row does not fit your viewport, swipe/scroll horizontally within
   the control row to access controls not visible immediately.

## Common Scenarios

- Sort options include: `Current Vote`, `Projected Vote`, `Hot`, `Newest`.
- `Current Vote` orders drops by the current vote ranking for the wave.
- `Projected Vote` orders drops by the leaderboard's projected vote data.
- `Hot` surfaces drops that are trending within the wave.
- `Newest` orders drops by the most recent submissions.
- When width allows, `Sort` renders as inline tabs.
- When width is constrained, `Sort` renders as a dropdown.
- Group filtering includes `All submissions` plus each available curation group.
- Group controls render as tabs when there is room, and may render as dropdowns in
  tighter layouts.
- On a wide header row, both controls can be shown as tabs.
- On narrower layouts, the header chooses a fallback mode that keeps controls
  functional.
- On very narrow layouts, the control row scrolls horizontally so both sort and
  group controls remain reachable.
- If a saved group filter no longer resolves to a valid curation group, the filter
  resets to `All submissions`.

## Edge Cases

- Sort and group combinations can legitimately produce empty leaderboards.
- If a wave has no curation groups, only the `Sort` control is shown.
- Waves with many groups may show a longer dropdown list for group selection.
- Sort controls stay in use during browser resize because mode recalculates from the
  current control width.

## Failure and Recovery

- Switching sort or group options triggers a fresh leaderboard load.
- If a load fails, users can retry by reselecting the option or refreshing the page.
- If all tab layouts do not fit, the controls use dropdown mode and horizontal
  overflow to keep every control accessible.
- Returning to the leaderboard later retries the data load automatically.

## Limitations / Notes

- Sorting and filtering only change the leaderboard presentation; they do not
  change votes or wave configuration.
- Sort labels describe ordering, not guaranteed ranking formulas.
- Group names and membership are determined by the curation-group configuration for
  the active wave.
- The site does not persist sort/group mode in the URL; layout mode is determined
  by current viewport and component width.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
