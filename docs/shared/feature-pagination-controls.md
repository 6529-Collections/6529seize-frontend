# Pagination Controls

Parent: [Shared Index](README.md)

## Overview

Shared pagination controls let users move through fixed-size result pages across
tables and list views.

## Location in the Site

- Any route that reuses the shared pagination component for multi-page data.
- Common examples include `/nft-activity`, `/tools/subscriptions-report`,
  profile stats/distribution activity lists, and wave leaderboard-related lists.

## Entry Points

- Open a paginated list with more results than one page can show.
- Use the left/right arrow controls, editable page number field, or the
  last-page number control.

## User Journey

1. Open a list/table with multiple pages of results.
2. Review the pagination row (previous arrow, page input, last-page number,
   next arrow).
3. Move one page at a time with previous/next.
4. Type a target page number and press `Enter` to jump.
5. Use the last-page number to jump to the final page.

## Common Scenarios

- Navigate forward from page 1 using `Next page`.
- Navigate backward from a later page using `Previous page`.
- Jump straight to the last page from large result sets.
- Use keyboard-only navigation: `Tab` to a control, then activate buttons with
  `Enter` or `Space`.

## Edge Cases

- Controls are hidden when total results do not exceed the page size.
- The page input accepts temporary free text while typing; no page request is
  sent until `Enter` is pressed.
- Entering an invalid or out-of-range value resets the input back to the
  current page.
- `Previous page` is disabled on the first page.
- `Next page` and `Go to last page` are disabled on the last page.

## Failure and Recovery

- Pagination controls only request page changes; loading/error presentation is
  handled by each owning feature.
- If a page request fails, users can retry using the same control flow after
  loading settles, or refresh the route when the feature requires full reload.
- Invalid manual page input does not show a dedicated error banner; the control
  recovers by snapping back to the current page value.

## Limitations / Notes

- There is no dedicated `Go to first page` control.
- Users cannot change page size from this control.
- Page-number jumps apply only on `Enter`; changing the input value alone does
  not navigate.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Memes Subscriptions Report](../api-tool/feature-memes-subscriptions-report.md)
- [Profile Stats Tab](../profiles/tabs/feature-stats-tab.md)
- [Wave Leaderboard Drop States](../waves/leaderboard/feature-drop-states.md)
