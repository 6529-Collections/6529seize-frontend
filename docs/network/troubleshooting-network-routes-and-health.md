# Network Routes and Health Troubleshooting

## Overview

Use this page for common failures in Network routes: leaderboards, metrics,
activity feeds, and rule/reference pages.

## Location in the Site

- Primary route family: `/network/*`
- Leaderboards and feeds: `/network`, `/network/nerd/{focus}`,
  `/network/activity`
- Metrics and references: `/network/health`, `/network/health/network-tdh`,
  `/network/tdh`, `/network/tdh/historic-boosts`, `/network/definitions`,
  `/network/levels`, `/network/xtdh`
- Utility route: `/network/prenodes`
- Related allocations dashboard: `/xtdh`

## Entry Points

- Open `/network` from `Network -> Identities` first.
- Open `/network/health` when checking metrics freshness.
- Open `/network/activity` for network-wide event feed checks.
- Open `/network/tdh` or `/network/xtdh` for rule reference checks.
- Open `/network/levels` and `/network/definitions` for static reference checks.

## User Journey

1. Reproduce the issue on its exact route.
2. Open `/network/health` and confirm metrics load.
3. Reopen the failing route from sidebar navigation (not only browser back).
4. If the issue is scope-related, clear group filter and retest.
5. If the issue is rule-interpretation, confirm on `/network/tdh` or
   `/network/xtdh`.

## Common Scenarios

- `/network` list looks wrong after scope changes:
  clear and reapply group filter from the filter panel.
- `/network/activity` looks unexpectedly scoped:
  this route can inherit active group scope from `/network` state.
- `/network/health` shows `Failed to load metrics. Please try again later.`:
  refresh the route to trigger a new fetch.
- `/network/health/network-tdh` shows no charts:
  upstream history payload may be empty; retry later.
- `/network/prenodes` shows only header text:
  upstream prenode feed may be empty or unavailable.
- `/xtdh` shows `Unable to load xTDH stats`:
  use its `Retry` button.

## Edge Cases

- `/network/nerd/*` treats unknown focus segments as `Cards Collected`.
- `/network` normalizes invalid `page`, `sort-by`, and `sort-direction` values.
- `/network/activity` does not expose inline filter/scope controls but can still
  use active group scope.
- `/network/prenodes` does not expose inline filter controls.
- `/network/levels` and `/network/definitions` are static references, not live
  metrics views.

## Failure and Recovery

- If a route fails, reopen from `Network` sidebar navigation.
- If `/network/activity` data is unexpectedly scoped, clear group scope on
  `/network`, then reopen `/network/activity`.
- If `/network/activity` looks stale or empty, refresh `/network/activity`
  directly.
- If `/network` leaderboard is empty, remove `group` scope and retry.
- If `/network/prenodes` is empty, retry later; no route-level retry control exists.

## Limitations / Notes

- Some routes rely on live APIs (`/network`, `/network/health`, `/xtdh`,
  `/network/prenodes`) while others are static references
  (`/network/definitions`, `/network/levels`, `/network/tdh`, `/network/xtdh`).
- Retry controls differ by route; some pages only support browser refresh.

## Related Pages

- [Network Index](README.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Stats](feature-network-stats.md)
- [Network Activity Feed](feature-network-activity-feed.md)
- [Prenodes Status](feature-prenodes-status.md)
