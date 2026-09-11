# Network

Network docs cover network scoring, leaderboards, health, and TDH/xTDH
reference routes.

## Overview

- Main route family: `/network`, `/network/activity`, `/network/nerd/{focus?}`,
  `/network/health`, `/network/health/network-tdh`, `/network/tdh`,
  `/network/tdh/historic-boosts`, `/network/definitions`, and
  `/network/levels`.
- Adjacent xTDH routes owned here: `/network/xtdh` (rules reference) and
  `/xtdh` (live allocations dashboard).
- Utility route: `/network/prenodes`.
- Group scope behavior: `/network` owns scope controls; `/network/activity`
  has no scope controls but can consume active group scope.
- Saved groups can be searched, created, and applied inline from `/network`
  `Filter`; there is no standalone Network Groups page.

## Features

### Leaderboards and Activity

- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Network Nerd Leaderboard](feature-network-nerd-leaderboard.md)
- [Network Activity Feed](feature-network-activity-feed.md)

### Metrics and Reference

- [Health Dashboard](feature-health-dashboard.md)
- [Network Stats](feature-network-stats.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Levels](feature-network-levels.md)
- [Prenodes Status](feature-prenodes-status.md)

### TDH and xTDH

- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)

## Flows

- [Network Group Scope Flow](flow-network-group-scope.md)

## Troubleshooting

- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Wave Creation Group Access and Permissions](../waves/create/feature-groups-step.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Profiles Index](../profiles/README.md)
- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Authenticated Live Updates](../realtime/feature-authenticated-live-updates.md)
