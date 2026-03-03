# Memes Subscriptions Report

## Overview

`/tools/subscriptions-report` is a read-only view of aggregate The Memes
subscription counts.

- `Upcoming Drops`: counts for upcoming cards.
- `Past Drops`: counts for redeemed cards.

## Location in the Site

- Route: `/tools/subscriptions-report`
- Desktop sidebar/search path (when visible): `Tools -> The Memes Tools -> Subscriptions Report`
- Drawer path (mobile shell): `Tools -> The Memes Tools -> Memes Subscriptions`
- Related open-data route: `/open-data/meme-subscriptions`

## Entry Points

- Open the route from `The Memes Tools` navigation.
- Open `/tools/subscriptions-report` directly.
- Use `My Subscriptions` (when shown) to open `/{your-handle}/subscriptions`.
- Use `Learn More` to open `/about/subscriptions`.

## Page Flow

1. Open `/tools/subscriptions-report`.
2. Review header actions (`My Subscriptions`, `Learn More`).
3. Wait for `Upcoming Drops` to load, then review card rows and counts.
4. Use `Show More` or `Show Less` when upcoming rows are greater than 10.
5. Review `Past Drops` rows (image, token link, season/date, count).
6. Use pagination when redeemed totals are above 20.

## Data and Row Labels

- Upcoming API: `subscriptions/upcoming-memes-counts?card_count=<count>`.
- Past API: `subscriptions/redeemed-memes-counts?page_size=20&page=<page>`.
- Upcoming rows use mint-calendar order for `SZN <number> / <date>` labels.
- Past rows show an image, token link (`/the-memes/{token_id}`), season/date,
  and count.

## States and Visibility Rules

- `My Subscriptions` is hidden when no profile is connected.
- On iOS, `My Subscriptions` is shown only when country resolves to `US`.
- In desktop sidebar/search, the route is hidden on iOS outside the US.
- The mobile drawer still lists `Memes Subscriptions`.
- `Show More`/`Show Less` appears only when upcoming rows are greater than 10.
- `Past Drops` pagination appears only when redeemed count is greater than 20.
- Changing redeemed pages updates table data in place (no route transition).
- Empty sections render `No Subscriptions Found`.

## Failure and Recovery

- First load shows section-level spinner/copy (`Loading upcoming drops...`,
  `Loading past drops...`).
- No dedicated API-failure banner or toast is shown for this page.
- Initial or pagination fetch failures can fall back to
  `No Subscriptions Found`.
- Retry by changing page, reopening the route, or refreshing.

## Limitations / Notes

- The page is informational only and cannot edit subscriptions.
- Counts are aggregate totals, not wallet-specific allocations.
- `Past Drops` uses fixed-size pages of 20 rows.
- `My Subscriptions` is a shortcut; subscription management stays on profile
  subscriptions pages.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Meme Subscriptions Open Data](../open-data/feature-meme-subscriptions.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
