# Memes Subscriptions Report

## Overview

The `Memes Subscriptions Report` page gives a network-wide view of upcoming and
redeemed subscription counts for The Memes cards.

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

## User Journey

1. Open `/tools/subscriptions-report`.
2. Review `Upcoming Drops` to see upcoming card-level subscription totals.
3. Expand the upcoming table when needed to view rows beyond the default
   preview.
4. Review `Past Drops` to compare redeemed counts.
5. Use pagination to move through older redeemed-drop rows.

## Common Scenarios

- Check demand for the next set of upcoming The Memes cards.
- Compare upcoming totals with recently redeemed totals.
- Open a specific redeemed card from the table to inspect its details page.
- Jump to your own subscriptions controls from `My Subscriptions` when signed
  in.

## Edge Cases

- `Upcoming Drops` initially shows up to 10 rows; `Show More` expands to the
  full list.
- Each upcoming row includes season plus mint date (for example `SZN 14 / Wed,
  Oct 15, 2025`).
- Upcoming rows can include future seasons when needed to satisfy the requested
  row count.
- On iOS outside the US, the `My Subscriptions` shortcut is hidden.
- Empty datasets render `No Subscriptions Found`.

## Failure and Recovery

- While data is loading, each section shows a spinner or loading copy.
- If subscriptions data fails to load, the page can fall back to empty-state
  messaging; refresh to retry.
- If redeemed-page loading fails after pagination, retry by refreshing the
  route.

## Limitations / Notes

- This page is informational and does not let users edit subscription settings.
- `Past Drops` pagination uses fixed-size pages.
- Counts are aggregate totals, not wallet-specific subscription details.

## Related Pages

- [API Tool Index](README.md)
- [Block Finder](feature-block-finder.md)
- [Profile Subscriptions Tab](../profiles/feature-profile-subscriptions-tab.md)
- [Pagination Controls](../shared/feature-pagination-controls.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
