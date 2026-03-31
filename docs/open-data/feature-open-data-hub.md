# Open Data Hub

Parent: [Open Data Index](README.md)

## Overview

`/open-data` is the Open Data hub route.
It shows dataset cards only. File tables and download links are handled on
dataset routes.

## Location in the Site

- Route: `/open-data`
- Web sidebar path: `Tools -> Open Data -> Open Data`
- Native app menu path: `Tools -> Open Data`

## Entry Points

- Open `Tools -> Open Data -> Open Data` from the web sidebar.
- Open `Tools -> Open Data` from the native app menu.
- Open `/open-data` directly.
- Open the `/open-data` links from `/about/minting` and
  `/about/data-decentralization`.

## Cards and Route Outcomes

1. Open `/open-data`.
2. Pick a dataset card:
   - Network Metrics
   - Meme Subscriptions (conditional visibility)
   - Rememes
   - Team
   - Royalties
3. The selected card opens its dataset route under `/open-data/*`.

Web sidebar navigation also includes direct links to each dataset route.
Native app menu navigation links only to `/open-data`.

## Visibility Rules

- `Meme Subscriptions` is shown when either condition is true:
  - The user is not in the native iOS app.
  - Country check returns `US`.
- `Meme Subscriptions` is hidden on native iOS when cookie-country is not `US`.
- On native iOS, the card can be temporarily hidden while cookie-country is
  still loading.
- The iOS country rule affects the hub card only.
- Direct navigation to `/open-data/meme-subscriptions` still works when the
  card is hidden.

## States on the Hub

- The hub does not request dataset APIs.
- The hub does not show dataset loading, empty, or error banners.
- Download-state behavior is handled on each dataset route.

## Limitations

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
