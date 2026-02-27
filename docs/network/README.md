# Network

Network docs cover network scoring, leaderboards, health, and TDH/xTDH
reference routes.

## Overview

- Main route family: `/network`, `/network/activity`, `/network/nerd/{focus?}`,
  `/network/health`, `/network/health/network-tdh`, `/network/tdh`,
  `/network/tdh/historic-boosts`, `/network/definitions`, and
  `/network/levels`.
- Adjacent reference routes owned here: `/network/xtdh`, `/xtdh`, and
  `/network/prenodes`.
- Group scope behavior: `/network` owns scope controls; `/network/activity`
  has no scope controls but can consume active group scope.
- `/network/groups` behavior is owned by the Groups docs area. This area owns
  the handoff into network-scoped views.

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

### TDH and xTDH Rules

- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)

## Flows

- [Network Group Scope Flow](flow-network-group-scope.md)

## Troubleshooting

- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)

## Stubs

- None.

## Related Areas

- [Docs Home](../README.md)
- [Groups Index](../groups/README.md)
- [Groups List, Create, and Network Scope Flow](../groups/flow-groups-list-create-and-network-scope.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Profiles Index](../profiles/README.md)
- [NFT Activity Feed](../realtime/feature-authenticated-live-updates.md)
