# Open Data Hub

Parent: [Open Data Index](README.md)

## Overview

`/open-data` is the card-based hub for all Open Data dataset routes.

## Location in the Site

- Route: `/open-data`
- Sidebar path: `Tools -> Open Data`

## Entry Points

- Open `Tools -> Open Data -> Open Data` in the desktop sidebar.
- Open `Tools -> Open Data` in the mobile sidebar.
- Open `/open-data` directly.

## User Journey

1. Open `/open-data`.
2. Review the card list.
3. Open the route you need:
   - Network Metrics
   - Meme Subscriptions
   - Rememes
   - Team
   - Royalties
4. The selected card opens a dataset table route under `/open-data/*`.

## Visibility Rules

- `Meme Subscriptions` is shown unless both conditions are true:
  - The user is in the native iOS app.
  - Cookie-country is not `US`.
- If the card is hidden, direct navigation to `/open-data/meme-subscriptions`
  still works.

## Load, Error, and Empty States

- This hub page is static and does not show dataset loading, empty, or error
  states.
- Download-state behavior is handled on each dataset route.

## Limitations / Notes

- The hub has no search, filtering, or sorting controls.
- Cards are route links only.

## Related Route Behavior

- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Rememes Downloads](feature-rememes-uploads.md)
- [Team Downloads](feature-team-downloads.md)
- [Royalties Downloads](feature-royalties-uploads.md)

## Related Pages

- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)
- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
