# Wave Leaderboard Sort and Group Filters

## Overview

Wave leaderboard headers let users:
- reorder drops with `Sort` (`Current Vote`, `Projected Vote`, `Hot`, `Newest`)
- filter to one curation group when groups exist

Controls switch between tabs and dropdowns based on available width. In
URL-synced curation layouts, the selected group is stored in
`curated_by_group`.

## Location in the Site

- Wave `Leaderboard` tab header above leaderboard results on `/waves/{waveId}`.
- Legacy wave links (`/waves?wave={waveId}`) normalize to `/waves/{waveId}`.

## Entry Points

- Open `/waves/{waveId}` and select `Leaderboard`.
- Use `Sort` to change ordering.
- If curation groups are available, use `Group` to filter submissions.
- Open `/waves/{waveId}?curated_by_group={groupId}` to pre-apply a group filter.

## User Journey

1. Open a wave with a `Leaderboard` tab.
2. Use `Sort` to reorder the leaderboard.
3. (Optional) Use `Group` to narrow results to one curation group.
4. In URL-synced curation layouts, group changes update/remove
   `curated_by_group` without full-page navigation.
5. Switch between sorts or groups to compare results.
6. If controls do not fit, scroll the controls row horizontally.

## Common Scenarios

- Sort options include: `Current Vote`, `Projected Vote`, `Hot`, `Newest`.
- `Sort` and `Group` render as tabs when there is enough space, and as dropdowns
  when space is tight.
- Group filtering includes `All submissions` plus each available curation group.
- In URL-synced curation layouts, clearing group filter removes
  `curated_by_group` and returns to `All submissions`.
- If `curated_by_group` no longer maps to a valid group, the filter falls back
  to `All submissions`.

## Edge Cases

- Sort and group combinations can legitimately produce empty leaderboards.
- If a wave has no curation groups, only the `Sort` control is shown.
- While curation groups are still loading, URL-provided group IDs can be held
  temporarily until group data resolves.
- Legacy links like `/waves?wave={waveId}&curated_by_group={groupId}` normalize
  to `/waves/{waveId}?curated_by_group={groupId}`.

## Failure and Recovery

- Switching sort or group options triggers a fresh leaderboard load.
- If a load fails, users can retry by reselecting the option or refreshing the page.
- If controls cannot fit as tabs, the header falls back to dropdown controls and
  horizontal overflow.
- If a URL-provided group cannot be resolved, filter state recovers to
  `All submissions`.

## Limitations / Notes

- Sorting and filtering only change the leaderboard presentation; they do not
  change votes or wave configuration.
- Sort mode is stored as a local per-wave preference and is not encoded in the URL.
- URL persistence applies only to group filter via `curated_by_group` in layouts
  that wire this behavior.
- Group names and membership are determined by current curation-group
  configuration.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](feature-gallery-cards.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
