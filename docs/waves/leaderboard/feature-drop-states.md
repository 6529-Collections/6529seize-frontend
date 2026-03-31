# Wave Leaderboard Drop States

## Overview

Wave leaderboard surfaces switch between loading, populated, and empty states.
State output depends on wave type, view mode, and current filter context.

This page covers:
- full `Leaderboard` tab states (list, grid, and memes gallery)
- compact right-sidebar `Leaderboard` states for rank waves

## Location in the Site

- Wave thread routes: `/waves/{waveId}` and `/messages?wave={waveId}`.
- Full `Leaderboard` tab in the main thread content area.
- Right-sidebar `Leaderboard` tab on rank waves while voting is still active.

## Entry Points

- Open a rank wave and select `Leaderboard`.
- Open the right sidebar and select `Leaderboard`.
- Switch view mode (`List`, `Grid`, or memes gallery view).
- Open a new wave, or apply filters that return no matching drops.

## User Journey

1. Open leaderboard content.
2. First-page loading state appears while leaderboard data is pending.
3. If drops are returned, entries render and pagination continues.
4. If no drops are returned, the view resolves to a wave-specific empty state.

## Common Scenarios

- List first load shows `Loading drops...`.
- Grid first load shows skeleton cards.
- Memes gallery first load shows `Loading drops...` while first media results
  are pending.
- Standard list empty state shows `No drops to show`.
- Curation list empty state shows `No curated drops yet`.
- Memes list empty state shows `No artwork submissions yet`.
- Grid and gallery empty state shows `No drops to show`.
- Sidebar compact leaderboard shows `No drops have been made yet in this wave`
  after loading completes with zero rows.
- List and sidebar pagination auto-loads on scroll and shows a thin loading bar.
- Grid and gallery pagination uses `Load more drops` and `Loading more...`.

## Edge Cases

- Gallery can be empty even when list rows exist if none of those drops include
  media.
- Sort, curation-group, and curation price filters can produce valid empty
  states.
- Curation empty state can show restriction guidance (including the Level 10
  helper link) instead of drop-entry actions.
- Empty-state drop actions can be hidden or disabled when the viewer is not
  eligible to submit.
- After voting ends, `Leaderboard` is removed from available tabs.

## Failure and Recovery

- If the first successful response contains no drops, the UI resolves to empty
  messaging instead of keeping a loading spinner.
- If first-page requests fail repeatedly, full leaderboard views can stay in a
  loading presentation and the sidebar list can stay blank until a later retry.
- If pagination fails, already rendered entries remain visible and users can
  retry with scroll/load-more actions.
- Reloading the thread restarts loading and attempts a fresh fetch.

## Limitations / Notes

- Empty-state copy and actions vary by wave type and entry eligibility.
- Loading/empty decisions are made from leaderboard response readiness, then
  per-view filtering (for example gallery media filtering) is applied.
- Full leaderboard and sidebar use the same leaderboard data source, but active
  sort/filter context can differ by surface.
- Detailed drop-entry gating ownership lives in
  `feature-drop-entry-and-eligibility.md`.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Waves Index](../README.md)
- [Wave Leaderboard Drop Entry and Eligibility](feature-drop-entry-and-eligibility.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Wave Right Sidebar Leaderboard](../sidebars/feature-right-sidebar-leaderboard.md)
- [Pagination Controls](../../shared/feature-pagination-controls.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
