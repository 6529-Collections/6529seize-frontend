# Memes Subscriptions Report

## Overview

`/tools/subscriptions-report` is a read-only report for aggregate The Memes
subscription counts.

- `Upcoming Drops`: aggregate counts for upcoming cards.
- `Past Drops`: aggregate redeemed counts for minted cards.
- Header actions: `My Subscriptions` (conditional) and `Learn More`.

## Location in the Site

- Route: `/tools/subscriptions-report`
- Web sidebar/search path (when visible):
  `Tools -> The Memes Tools -> Subscriptions Report`
- Native app drawer path:
  `Tools -> The Memes Tools -> Memes Subscriptions`
- Related open-data route: `/open-data/meme-subscriptions`

## Entry Points

- Open from `Tools -> The Memes Tools` (when visible in current nav).
- Open `/tools/subscriptions-report` directly (route always loads).
- Use header actions:
  - `My Subscriptions` -> `/{your-handle}/subscriptions` (when shown)
  - `Learn More` -> `/about/subscriptions`

## User Journey

1. Open `/tools/subscriptions-report`.
2. Wait for initial load to finish.
3. Review `Upcoming Drops` and optionally expand with `Show More`.
4. Review `Past Drops` rows (thumbnail, token link, season/date, count).
5. Use past pagination when total redeemed count is above 20.
6. Use header actions (`My Subscriptions`, `Learn More`) as needed.

## Data and Rendering Rules

- Initial load fetches past page `1` first, then fetches upcoming counts.
- Upcoming endpoint: `subscriptions/upcoming-memes-counts?card_count=<count>`.
- Past endpoint: `subscriptions/redeemed-memes-counts?page_size=20&page=<page>`.
- Past page size is fixed at `20`.
- Upcoming labels use mint-calendar ordering and `SZN <number> / <date>`.
- Upcoming table shows first `10` rows until expanded.
- Past rows include image thumbnail and token link to `/the-memes/{token_id}`.

## Visibility and State Rules

- The route itself is not geo-blocked.
- On iOS outside the US, this route is hidden from web sidebar and search.
- Native app drawer still lists `Memes Subscriptions`.
- `My Subscriptions` is hidden when no profile is connected.
- On iOS, `My Subscriptions` is shown only when country is `US`.
- `Show More` / `Show Less` appears only when upcoming rows are greater than 10.
- Past pagination appears only when redeemed total count is greater than 20.
- Empty sections render `No Subscriptions Found`.

## Loading, Failure, and Recovery

- Initial load shows section loading copy:
  `Loading upcoming drops...` and `Loading past drops...`.
- Section headers also show a spinner while loading.
- No dedicated API-failure banner/toast is shown.
- Initial data is committed only after both first-load requests succeed.
- If either first-load request fails before render, both sections can fall back
  to `No Subscriptions Found`.
- If a later pagination fetch fails, previously rendered past rows remain.
- Retry by reopening or refreshing the route.
- For pagination errors, switch page and retry.

## Limitations / Notes

- This page does not edit subscriptions.
- Counts are aggregate totals, not wallet-specific allocations.
- `My Subscriptions` is a shortcut into profile subscriptions routes.
- `/open-data/meme-subscriptions` is a dataset-download list, not this live
  aggregate report.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Meme Subscriptions Open Data](../open-data/feature-meme-subscriptions.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
