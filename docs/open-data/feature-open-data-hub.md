# Open Data Hub

Parent: [Open Data Index](README.md)

## Overview

The `/open-data` hub is a card-based entry page for community data exports.

## Location in the Site

- Route: `/open-data`
- Sidebar path: `Tools -> Open Data`

## Entry Points

- Open the `Open Data` destination in the sidebar.
- Open `/open-data` directly.
- Follow any shared link pointing to `/open-data`.

## User Journey

1. Open `/open-data`.
2. Review the card list:
   - Network Metrics
   - Meme Subscriptions (hidden on iOS unless region is `US`)
   - Rememes
   - Team
   - Royalties
3. Select the card to open the matching export list page.

## Common Scenarios

- Open a specific dataset page quickly from one place.
- Find all available current open-data routes without searching.
- Access data from mobile and desktop through the same card list.

## Edge Cases

- On iOS outside the `US`, the `Meme Subscriptions` card is not shown.
- The visible card set changes for users on iOS where regional restrictions apply.
- A direct visit to `/open-data/network-metrics` takes users to the consolidated
  metric exports page.

## Failure and Recovery

- If sidebar navigation is unavailable, open `/open-data` directly and use the
  cards.
- If a target route fails after navigation, return to `/open-data` and pick a
  different dataset route.

## Limitations / Notes

- The cards are direct links only; this page does not include search, filtering, or
  per-route sorting.
- The list reflects the routes shipped in the current release.

## Related Pages

- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Network Index](../network/README.md)
