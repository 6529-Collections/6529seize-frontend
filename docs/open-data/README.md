# Open Data

Open Data docs cover dataset download routes under `/open-data/*`.

## Overview

- Hub route: `/open-data`.
- Dataset routes:
  `/open-data/network-metrics`, `/open-data/meme-subscriptions`,
  `/open-data/rememes`, `/open-data/team`, and `/open-data/royalties`.
- Entry paths:
  - Web sidebar (desktop and mobile web): `Tools -> Open Data -> Open Data`
  - Native app menu: `Tools -> Open Data`
  - Direct URL: `/open-data`
  - About-page links from `/about/minting` and `/about/data-decentralization`
- Web sidebar also includes direct links to each dataset route under
  `Tools -> Open Data`.
- Native app menu links only to `/open-data`; dataset routes are reached from
  hub cards or direct URLs.
- Visibility rule: on native iOS, the `Meme Subscriptions` hub card is shown
  only when cookie-country is `US`.
- On native iOS, `Meme Subscriptions` can be temporarily hidden while
  cookie-country is still loading.
- Direct fallback: `/open-data/meme-subscriptions` still opens when the hub card
  is hidden.
- Route behavior families:
  - API + pagination + loading/error banners: Network Metrics, Rememes, Royalties.
  - API + pagination without inline loading/error banners: Meme Subscriptions
    (heading-only while first request is loading or fails).
  - Static links table: Team.

## Features

- [Open Data Hub](feature-open-data-hub.md)
- [Consolidated Network Metrics Downloads](feature-network-metrics-downloads.md)
- [Meme Subscriptions](feature-meme-subscriptions.md)
- [Rememes Downloads](feature-rememes-uploads.md)
- [Team Downloads](feature-team-downloads.md)
- [Royalties Downloads](feature-royalties-uploads.md)

## Flows

- [Open Data Hub to Dataset Routes](flow-open-data-hub-to-download-routes.md)

## Troubleshooting

- [Open Data Routes and Download States](troubleshooting-open-data-routes-and-downloads.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Network Index](../network/README.md)
