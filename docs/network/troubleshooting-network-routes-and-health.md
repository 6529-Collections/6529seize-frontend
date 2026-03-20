# Network Routes and Health Troubleshooting

## Overview

Use this page when a Network route is empty, unexpectedly scoped, or missing
metrics.

## Location in the Site

- Primary route family: `/network/*`
- Leaderboards and feeds: `/network`, `/network/nerd/{focus?}`,
  `/network/activity`
- Metrics and references: `/network/health`, `/network/health/network-tdh`,
  `/network/tdh`, `/network/tdh/historic-boosts`, `/network/definitions`,
  `/network/levels`, `/network/xtdh`
- Utility route: `/network/prenodes`
- Related live dashboard: `/xtdh`

## Entry Points

- Sidebar: `Network -> Identities`, `Network -> Activity`, `Network -> TDH`,
  `Network -> xTDH` (`/xtdh`)
- Sidebar metrics subsection: `Network -> Metrics -> Health`,
  `Network -> Metrics -> Definitions`, `Network -> Metrics -> Levels`,
  `Network -> Metrics -> Network Stats`
- Direct reference route: `/network/xtdh`
- `/network` header button: `Nerd view` opens `/network/nerd/*`

## Fast Recovery Flow

1. Reopen the failing route from sidebar navigation.
2. If the issue is on `/network` or `/network/activity`, clear or change active
   group scope on `/network`.
3. Refresh the failing route.
4. If `/xtdh` fails, use its `Retry` button, then refresh if needed.
5. If the route is still empty or header-only, retry later (upstream API may be
   unavailable).

## Route Checks

- `/network` shows wrong rows/sort/page:
  this route normalizes invalid `page`, `sort-by`, and `sort-direction` values.
  If results still look wrong, clear active group scope.
- `/network/activity` looks unexpectedly scoped:
  this route can inherit active group scope from `/network` state.
- `/network/activity` opens a Not Found page:
  initial server-side activity fetch failed. Reopen from `Network -> Activity`
  and refresh.
- `/network/health` shows `Failed to load metrics. Please try again later.`:
  refresh the route. There is no inline retry button on this page.
- `/network/health/network-tdh` shows only heading content:
  TDH history data is empty or unavailable. Refresh or retry later.
- `/network/prenodes` shows only title and UTC note:
  prenodes payload is empty or failed. Refresh or retry later.
- `/xtdh` shows `Unable to load xTDH stats`:
  use `Retry`. If it keeps failing, refresh the route.

## Edge Cases

- `/network/nerd/{focus?}` reads only the first focus segment.
- Unknown focus values fall back to `Cards Collected`.
- Extra segments after `/network/nerd/{focus}` are ignored.
- `group` in URL initializes Network scope on first route mount only.
  Later URL-only edits do not re-apply scope unless you reload or change scope
  in the UI.
- `/network/levels`, `/network/definitions`, `/network/tdh`, and
  `/network/xtdh` are reference pages, not live health dashboards.

## Limitations / Notes

- Live API-dependent routes include `/network`, `/network/activity`,
  `/network/health`, `/network/health/network-tdh`, `/network/prenodes`,
  and `/xtdh`.
- Retry controls are route-specific.
  `/xtdh` has inline retry for top stats; most Network routes recover by refresh
  or reopen.
- `/network/groups` troubleshooting is owned by Groups docs.

## Related Pages

- [Network Index](README.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Stats](feature-network-stats.md)
- [Prenodes Status](feature-prenodes-status.md)
- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [Groups Troubleshooting](../groups/troubleshooting-groups-list-and-create-actions.md)
