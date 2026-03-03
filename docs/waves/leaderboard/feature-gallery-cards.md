# Wave Leaderboard Gallery Cards

## Overview

In memes waves, leaderboard `Grid view` renders media-first cards.
This page covers what each card shows, when cards appear, and how voting entry
works from the card.

## Location in the Site

- `/waves/{waveId}` and `/messages?wave={waveId}` when `Leaderboard` is available.
- `Leaderboard` tab with `Grid view` selected on memes waves.
- Card order and membership follow active `Sort` and optional `Group` filter context.

## Entry Points

- Open a memes wave that has `Leaderboard`.
- Select `Leaderboard`.
- Select `Grid view`.
- Use `Load more drops` when pagination is available.

## Availability Rules

- Gallery includes only drops where the first part has at least one media item.
- Text-only drops are excluded here; use `List view` to see them.
- Each card uses the first media item from the first drop part.
- Curation actions are not shown in gallery cards.

## User Journey

1. Open `Leaderboard` and switch to `Grid view`.
2. Review each card:
   - media surface
   - media format badge (with tooltip label)
   - optional title
   - optional author handle link
   - optional rank/winner badge
3. Review vote summary:
   - current vote total
   - projected vote total only when current and projected values are both numeric and different
   - rater count
   - optional `Your votes` with wave credit label when viewer rating context exists
4. Select card media to open drop detail, or select `Vote` when the action is available.
5. Select `Load more drops` to fetch the next page.

## Common Scenarios

- Non-image media with additional `preview_image` metadata shows a static image preview.
- Non-image media without preview metadata renders native media output in-card
  (video, audio, or interactive content).
- Known MIME values show tooltip labels like `Image - PNG`, `Video - MP4`, and
  `Interactive - GLB`.
- Unknown or missing MIME values still show a badge tooltip as `Unknown`.
- On non-touch devices, sort changes briefly highlight card media to signal reordering.

## Edge Cases

- Missing title or author handle: the missing field is omitted, other fields still render.
- Missing rank metadata: rank/winner badge is omitted.
- If projected vote equals current vote, projected vote indicator is hidden.
- Gallery can show `No drops to show` even when list view has entries, if none of
  the current results include media.
- `Vote` is hidden when voting UI is not available for the current viewer/drop state.

## Failure and Recovery

- Initial fetch shows `Loading drops...` until at least one media-qualified card can render.
- If no media-qualified cards are available, gallery shows `No drops to show`.
- If vote submit fails, the voting surface stays open and shows error feedback;
  users can retry from the same card action.
- If loading or pagination stalls, refresh the thread to request fresh leaderboard data.

## Limitations / Notes

- Scope is memes leaderboard `Grid view` card behavior only.
- Non-memes `Grid` and `Content only` views are separate surfaces.
- Sort/group control behavior is owned by `feature-sort-and-group-filters.md`.
- Cross-view loading and empty-state ownership is in `feature-drop-states.md`.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Drop Actions: Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
