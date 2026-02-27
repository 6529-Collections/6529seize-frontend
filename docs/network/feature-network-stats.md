# Network Stats

Parent: [Network Index](README.md)

## Overview

`/network/health/network-tdh` shows global TDH history in a fixed 10-row view.
It includes summary values, checkpoint estimates, and four TDH charts.

## Location in the Site

- Route: `/network/health/network-tdh`
- Sidebar path: `Network -> Metrics -> Network Stats`
- Linked from `/network/health` through the `Network TDH` card.
- Linked from `/network/tdh` through `View Network Stats`.
- Linked from `/network/tdh/historic-boosts` through `Network Stats`.
- Linked from `/network/definitions` through `Network Stats`.

## Entry Points

- Open `Network -> Metrics -> Network Stats` in the sidebar.
- Open the `Network TDH` card on `/network/health`.
- Open `View Network Stats` on `/network/tdh`.
- Open `Network Stats` on `/network/tdh/historic-boosts`.
- Open `Network Stats` on `/network/definitions`.

## What You See

- `Network Stats` heading (always visible).
- Summary table with `Network TDH`, `Daily Change`, and `Daily % Change`.
- Checkpoint table with 3 rows for next `250,000,000` TDH checkpoints.
- `Total TDH` bar chart.
- `Net TDH Daily Change` bar chart.
- `Created TDH Daily Change` bar chart.
- `Destroyed TDH Change` bar chart.
- Every chart has boosted, unboosted, and unweighted series.

## Route Behavior

- No query params, filters, sorting, pagination, or group-scope controls.
- One request per load: `/api/tdh_global_history?page_size=10&page=1`.
- Response rows are reversed client-side so charts render oldest to newest.
- Browser title context is `Stats | Network` (`Stats` metadata title).
- No route-level skeleton, spinner, retry button, or inline error banner.
- Tables and charts render only when at least one history row is returned.

## Access and Permissions

- Same route behavior for signed-in and signed-out users.
- No wallet action, write action, or permission-gated control on this page.

## Edge Cases

- Empty API response: header only.
- Request failure/non-OK response: header only (no visible error message).
- `Network TDH` and `Daily Change` can show `-` when latest values are `0` or invalid.
- `Daily % Change` can display `NaN%` or `Infinity%`.
- Checkpoint estimates can display `In,fin,ity` when daily change is `0`.
- Checkpoint estimates can become negative when daily change is negative.

## Failure and Recovery

- Refresh `/network/health/network-tdh` to send a new request.
- Reopen from sidebar or from the `Network TDH` card on `/network/health`.
- Reopen from `/network/tdh`, `/network/tdh/historic-boosts`, or `/network/definitions`.
- If the route stays header-only, retry later (upstream history may be empty or unavailable).

## Limitations

- Fixed to the latest 10 rows.
- No date-range selector.
- No historical pagination.

## Cross-Route Behavior

- Sharing `/network/health/network-tdh` always opens the same fixed view.
- `/network/health`, `/network/tdh`, `/network/tdh/historic-boosts`, and
  `/network/definitions` all link to this route.
- `Levels` is a separate route and does not inherit any state from this page.

## Related Pages

- [Network Index](README.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Definitions](feature-network-definitions.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
