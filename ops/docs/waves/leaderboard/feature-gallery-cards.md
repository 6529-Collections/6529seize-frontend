# Wave Leaderboard Gallery Cards

## Overview

In memes waves, leaderboard `Grid view` renders media-first cards.
This page covers what each card shows, when cards appear, and how voting entry
works from the card.

## Location in the Site

- `/waves/{waveId}` and `/messages/{waveId}` when `Leaderboard` is available.
- `Leaderboard` tab with `Grid view` selected on memes waves.
- Card order follows the active `Sort`; gallery membership is limited to drops
  with media.

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
   - media format badge
   - title, or `Untitled drop` in the touchscreen native app when missing
   - optional author handle
   - optional rank/winner badge
3. Review vote summary:
   - current vote total
   - projected vote total only when current and projected values are both numeric and different
   - rater count
   - optional `Your votes` with wave credit label when viewer rating context exists
4. In the native app on a touchscreen, tap the card to open drop detail. In a
   browser, use the card's media or open control. Select `Vote` separately when
   the action is available.
5. Select `Load more drops` to fetch the next page.

## Common Scenarios

- Non-image media with additional `preview_image` metadata shows a static image preview.
- Browser cards without a provided preview use the corresponding media output
  (video, audio, or interactive content). Native-app touchscreen cards use
  non-interactive media previews; open the submission for media controls.
- In browsers, known media formats show tooltip labels like `Image - PNG`,
  `Video - MP4`, and `Interactive - GLB`. Unknown or missing formats show
  `Unknown`.
- In the touchscreen native app, media-format and additional-action-promise
  badges are informational, not separate tap or keyboard-focus actions.
- On narrow/mobile layouts, long titles wrap inside the card, author handles
  truncate, and vote/rater rows wrap instead of forcing horizontal overflow.
- Native-app touchscreen cards open from the title, author, media, or free card
  space, while explicit vote/rating action buttons stay independent. See
  [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md).
- Browser views, including mobile browsers, keep author handles as profile links
  and retain their media interactions.
- In the touchscreen native app, dragging vertically scrolls without opening
  the card. Press and hold opens the [touch action sheet](../drop-actions/feature-touch-drop-menu.md).
- On non-touch devices, sort changes briefly highlight card media to signal reordering.
- Grid cards do not show the `Largest vote` highlight. Use `List view` or open
  the drop detail for individual-vote highlights; the grid keeps its existing
  voter-count dropdown and voting controls.

## Edge Cases

- Missing title: touchscreen native-app cards show `Untitled drop`; browser
  cards omit the title. A missing author handle is omitted on both surfaces.
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
- Sort and price filter behavior is owned by `feature-sort-and-group-filters.md`.
- Cross-view loading and empty-state ownership is in `feature-drop-states.md`.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Sort and Price Filters](feature-sort-and-group-filters.md)
- [Wave Top Voters Lists](feature-top-voters-lists.md)
- [Wave Leaderboard Decision Timeline](feature-decision-timeline.md)
- [Drop Actions: Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Vote Slider](../drop-actions/feature-vote-slider.md)
- [Docs Home](../../README.md)
