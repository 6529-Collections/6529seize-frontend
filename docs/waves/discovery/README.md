# Wave Discovery (Legacy Route Removed)

## Overview

The dedicated wave discovery route (`/discover`) has been removed.

Use current wave entry points instead:

- home wave cards on `/`
- waves list and thread routes on `/waves` and `/waves/{waveId}`
- direct-message thread routes on `/messages` and `/messages?wave={waveId}`

## Route Coverage

- Legacy route removed: `/discover`
- Current wave entry routes: `/`, `/waves`, `/waves/{waveId}`
- Current direct-message entry routes: `/messages`, `/messages?wave={waveId}`

## Query Coverage

- Legacy discover filter state (`identity=...`) is no longer active because the
  `/discover` route is removed.
- Current wave/direct-message route query behavior is documented in
  [Waves Index](../README.md).

## Ownership

- This subarea now tracks legacy discover-route behavior and replacement
  navigation paths.
- Active wave discovery behavior is documented in Home and Waves area pages.

## Features

- [Wave Discover Sections and Search (Legacy Route Removed)](feature-discover-sections-and-search.md)
- [Wave Discover Cards (Legacy Route Removed)](feature-discover-cards.md)

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): canonical
  end-to-end wave navigation and interaction flow.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery guidance.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Wave Chat Index](../chat/README.md)
- [Wave Leaderboards Index](../leaderboard/README.md)
- [Wave and Direct Message Creation Index](../create/README.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Navigation Index](../../navigation/README.md)
