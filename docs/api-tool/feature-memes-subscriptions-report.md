# Memes Subscriptions Report

## Overview

The `Memes Subscriptions Report` page gives a network-wide view of upcoming and
redeemed subscription counts for The Memes cards.

## Data Sources

- Upcoming counts are fetched from `subscriptions/upcoming-memes-counts`.
- Redeemed counts are fetched from `subscriptions/redeemed-memes-counts`.
- Redeemed-table pagination uses `page_size=20`.

## Location in the Site

- Route: `/tools/subscriptions-report`
- Navigation path: `Tools -> The Memes Tools -> Memes Subscriptions`
- Related open-data route: `/open-data/meme-subscriptions`

## Entry Points

- Open `Tools -> The Memes Tools -> Memes Subscriptions` from sidebar
  navigation.
- Open `/tools/subscriptions-report` directly.
- Open `My Subscriptions` from this page to jump to your profile subscriptions
  tab when available.
- Open `Learn More` to read the related subscriptions explainer at
  `/about/subscriptions`.

## User Journey

1. Open `/tools/subscriptions-report`.
2. Wait for loading states to finish in `Upcoming Drops` and `Past Drops`.
3. Review `Upcoming Drops` to see upcoming card-level subscription totals.
4. Expand the upcoming table when needed to view rows beyond the default
   preview.
5. Review `Past Drops` to compare redeemed counts, card imagery, metadata, and
   token detail links.
6. Use pagination to move through older redeemed-drop rows when available.
7. Use `My Subscriptions` when shown to jump to your profile subscriptions tab.
8. Use `Learn More` for broader subscription background context.

## Common Scenarios

- Check demand for the next set of upcoming The Memes cards.
- Compare upcoming totals with recently redeemed totals.
- Open a specific redeemed card from the table to inspect `/the-memes/{token_id}`.
- Jump to your own subscriptions controls from `My Subscriptions` when signed
  in.

## Edge Cases

- `Upcoming Drops` initially shows up to 10 rows; `Show More` expands to the
  full list.
- Each upcoming row includes season plus mint date (for example `SZN 14 / Wed,
  Oct 15, 2025`).
- Upcoming rows can include future seasons when needed to satisfy the requested
  row count.
- `My Subscriptions` is hidden when no profile is connected.
- On iOS outside the US, `My Subscriptions` is also hidden.
- `Past Drops` pagination controls appear only when redeemed-drop total count
  exceeds 20 rows.
- Changing redeemed pages updates the redeemed table for the selected page
  without a route transition.
- Empty datasets render `No Subscriptions Found`.

## Failure and Recovery

- While data is loading, each section shows a spinner or loading copy.
- If subscriptions requests fail, the page can fall back to empty-state
  messaging such as `No Subscriptions Found`; refresh and retry.
- If redeemed-page loading fails after pagination, retry by refreshing the route
  and re-requesting the target page.

## Limitations / Notes

- This page is informational and does not let users edit subscription settings.
- `Past Drops` pagination uses fixed-size pages.
- Counts are aggregate totals, not wallet-specific subscription details.
- `My Subscriptions` is a shortcut only; wallet-level management remains on the
  profile subscriptions route.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Profile Subscriptions Tab](../profiles/tabs/feature-subscriptions-tab.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
