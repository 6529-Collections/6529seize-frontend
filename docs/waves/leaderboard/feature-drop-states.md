# Wave Leaderboard Drop States

## Overview

Wave leaderboard views transition between loading, populated, and empty-result
states based on leaderboard data availability. Empty leaderboards now resolve
to explicit no-drop states instead of staying in a loading state.

## Location in the Site

- Wave `Leaderboard` tab list view
- Wave `Leaderboard` grid/gallery views
- Small leaderboard summaries that reuse leaderboard drop data

## Entry Points

- Open a wave and switch to `Leaderboard`.
- Change leaderboard view mode between list, grid, and gallery.
- Open leaderboard contexts for new or inactive waves with no drops.

## User Journey

1. Open leaderboard content.
2. Initial loading UI appears while the first leaderboard response is pending.
3. If drops are returned, leaderboard entries render and continue paging.
4. If no drops are returned, loading ends and an empty state is shown.

## Common Scenarios

- Default leaderboard list shows wave-specific empty messaging and optional
  create-drop actions when entry is allowed.
- Curation leaderboards can show `No curated drops yet` with curation-specific
  eligibility guidance.
- Memes leaderboards can show `No artwork submissions yet`.
- Grid and gallery views show `No drops to show` when no matching leaderboard
  drops are available.
- Small leaderboard surfaces show `No drops have been made yet in this wave`
  when empty.
- Populated leaderboards continue loading additional pages as users scroll or
  request more.

## Edge Cases

- Gallery view can be empty when leaderboard drops exist but none have media.
- Sort modes and curation filters can produce valid empty states.
- `My realtime vote` style filtering can produce an empty display even when raw
  leaderboard rows exist.
- Empty-state `Drop` controls can be hidden or disabled when the current user is
  not eligible to submit.

## Failure and Recovery

- If the first leaderboard response contains no drops, the UI resolves to empty
  state messaging (not an indefinite loader).
- If pagination fetches fail, already rendered drops remain visible and users
  can retry by scrolling or using available load controls.
- Reloading the page re-enters loading, then resolves again to populated or
  empty state.

## Limitations / Notes

- Empty-state copy and actions vary by wave category (for example default,
  curation, or memes-specific states).
- Loading/empty decisions are based on leaderboard response readiness, then
  view-level filtering is applied.

## Related Pages

- [Waves Index](../README.md)
- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md)
- [Wave Content Tabs](../discovery/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Pagination Controls](../../shared/feature-pagination-controls.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
