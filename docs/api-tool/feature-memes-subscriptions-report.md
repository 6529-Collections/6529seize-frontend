# Memes Subscriptions Report

## Overview

`/tools/subscriptions-report` is a read-only aggregate report for The Memes
subscriptions.

- `Upcoming Drops`: subscription counts for upcoming cards.
- `Past Drops`: redeemed subscription counts by card.

## Location in the Site

- Route: `/tools/subscriptions-report`
- Web sidebar/search path (when visible):
  `Tools -> The Memes Tools -> Subscriptions Report`
- Native app drawer path:
  `Tools -> The Memes Tools -> Memes Subscriptions`
- Related open-data route: `/open-data/meme-subscriptions`

## Entry Points

- Open from `The Memes Tools`.
- Open `/tools/subscriptions-report` directly.
- Use header actions:
  - `My Subscriptions` -> `/{your-handle}/subscriptions` (when shown)
  - `Learn More` -> `/about/subscriptions`

## Page Flow

1. Open `/tools/subscriptions-report`.
2. Review header actions.
3. Wait for `Upcoming Drops` and `Past Drops` data.
4. Expand/collapse upcoming rows with `Show More` / `Show Less` when available.
5. Browse past rows (image, token link, season/date, count).
6. Use pagination for past rows when total redeemed count is above 20.

## Data and Labels

- Upcoming endpoint: `subscriptions/upcoming-memes-counts?card_count=<count>`
- Past endpoint: `subscriptions/redeemed-memes-counts?page_size=20&page=<page>`
- Upcoming labels use mint-calendar ordering and `SZN <number> / <date>`.
- Past rows link each token to `/the-memes/{token_id}`.

## Visibility and State Rules

- `My Subscriptions` is hidden when no profile is connected.
- On iOS, `My Subscriptions` is shown only when country is `US`.
- On iOS outside the US, this route is hidden from web sidebar/search.
- Native app drawer still lists `Memes Subscriptions`.
- `Show More` / `Show Less` appears only when upcoming rows are greater than 10.
- Past pagination appears only when redeemed total count is greater than 20.
- Empty sections render `No Subscriptions Found`.

## Failure and Recovery

- Initial load shows section loading copy:
  `Loading upcoming drops...` and `Loading past drops...`.
- No dedicated API-failure banner/toast is shown.
- If first-load requests fail before data renders, section output falls back to
  `No Subscriptions Found`.
- If a later pagination fetch fails, previously rendered past rows remain.
- Retry by changing page, reopening the route, or refreshing.

## Limitations / Notes

- This page does not edit subscriptions.
- Counts are aggregate totals, not wallet-specific allocations.
- Past rows use fixed page size `20`.
- `My Subscriptions` is a shortcut into profile subscriptions routes.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Meme Subscriptions Open Data](../open-data/feature-meme-subscriptions.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
