# Wave Discovery

## Overview

Use this subarea for the dedicated wave discovery route and its shared card
surfaces.

- Dedicated discovery route: `/discover`
- Related wave entry points still exist on `/`, `/waves`, and
  `/messages?wave={waveId}`

## Route Coverage

- Active discovery route: `/discover`
- Current wave entry routes: `/`, `/waves`, `/waves/{waveId}`
- Current direct-message entry routes: `/messages`, `/messages?wave={waveId}`

## Query Coverage

- `/discover` does not expose route-level discovery filters.
- The route requests wave-discovery data with backend filtering; current wave
  and direct-message query behavior stays documented in
  [Waves Index](../README.md).

## Ownership

- This subarea owns `/discover` route behavior and discovery-card specifics.
- Home-owned discovery summaries stay documented in Home pages.

## Features

- [Wave Discover Route and Navigation](feature-discover-sections-and-search.md)
- [Wave Discover Cards](feature-discover-cards.md)

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
