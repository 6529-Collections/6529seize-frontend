# Memes Subscriptions Report

## Overview

`/tools/subscriptions-report` is a read-only report for aggregate The Memes
subscription counts.

- `Active Drop`: shown on mint days after the current card has redeemed data;
  compares projected subscriptions with actual redeemed subscriptions and keeps
  the card out of the other sections.
- `Upcoming Drops`: aggregate projected counts for upcoming cards.
- `Past Drops`: aggregate redeemed counts for minted cards.
- Header actions: `Manage` / `Connect to Subscribe` (same profile-subscription
  navigation as `/about/subscriptions`) and `Learn More`.

## Location in the Site

- Route: `/tools/subscriptions-report`
- Web sidebar/search path (when visible):
  `About -> Data & Developer Tools -> Subscriptions Report`
- Native app drawer path:
  `About -> Data & Developer Tools -> Subscriptions Report`
- Related open-data route: `/open-data/meme-subscriptions`

## Entry Points

- Open from `About -> Data & Developer Tools` (when visible in current nav).
- Open `/tools/subscriptions-report` directly (route always loads).
- Use header actions:
  - `Manage` -> authenticates and opens `/{your-handle}/subscriptions`
  - `Connect to Subscribe` -> starts wallet connection, then opens profile
    subscriptions after authentication
  - `Learn More` -> `/about/subscriptions`

## User Journey

1. Open `/tools/subscriptions-report`.
2. Wait for initial load to finish.
3. When present, review `Active Drop` for the current card thumbnail, link,
   season/date, projected subscriptions, and actual redeemed subscriptions.
4. Review `Upcoming Drops` and optionally expand with `Show More`.
5. Review `Past Drops` rows (thumbnail, token link, season/date, count).
6. Use past pagination when total redeemed count is above 10.
7. Use header actions (`Manage` / `Connect to Subscribe`, `Learn More`) as
   needed.

## Data and Rendering Rules

- Initial load fetches past page `1` first, then fetches upcoming counts.
- Upcoming endpoint: `subscriptions/upcoming-memes-counts?card_count=<count>`.
- Active projected endpoint:
  `subscriptions/memes/{token_id}/count`.
- Past endpoint: `subscriptions/redeemed-memes-counts?page_size=10&page=<page>`.
- Past page size is fixed at `10`.
- Upcoming labels use mint-calendar ordering and `SZN <number> / <date>`.
- Upcoming table shows first `5` rows until expanded.
- When today's card appears in the redeemed response on a mint day, that token
  is rendered only in `Active Drop`; it is filtered out of both upcoming and
  past tables.
- Past rows include image thumbnail and token link to `/the-memes/{token_id}`.

## Visibility and State Rules

- The route itself is not geo-blocked.
- On iOS outside the US, this route is hidden from web sidebar and search.
- Native app drawer uses the same `Subscriptions Report` label when visible.
- The profile-subscription action is hidden when subscription controls are
  geo/platform hidden.
- `Manage` appears when the connected authenticated profile can open profile
  subscriptions directly.
- `Connect to Subscribe` appears when a profile route is not available yet and
  starts the same connection/authentication handoff used on
  `/about/subscriptions`.
- `Show More` / `Show Less` appears only when upcoming rows are greater than 5.
- Past pagination appears only when redeemed total count is greater than 10.
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
- `Manage` / `Connect to Subscribe` is a shortcut into profile subscriptions
  routes and authentication.
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
