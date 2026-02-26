# Network Stats

Parent: [Network Index](README.md)

## Overview

`Network Stats` is the detailed network TDH and community stats route linked
from the Health dashboard.

## Location in the Site

- Route: `/network/health/network-tdh`
- Sidebar path: `Network -> Metrics -> Network Stats`

## Entry Points

- Open `Network -> Metrics -> Network Stats` in the sidebar.
- Open `Network Stats` CTA buttons from `/network/tdh`,
  `/network/tdh/historic-boosts`, or `/network/definitions`.
- On Health, open the `Network TDH` card.

## Known Behavior

- The page hosts the Community Stats surface used for detailed network TDH and
  related stats.
- The Health dashboard `Network TDH` card links to this route.
- CTA buttons labeled `Network Stats` across Network pages resolve to this
  route.

## Sections and Metrics

- The route renders the `Network Stats` overview from the shared `CommunityStats`
  component.
- Network TDH summary table: total, daily change, and daily percentage change from
  `total_boosted_tdh` history.
- Estimated TDH checkpoint table from the latest `total_boosted_tdh` based on
  `250_000_000` increments.
- `Total TDH` bar chart.
- `Net TDH Daily Change` bar chart.
- `Created TDH Daily Change` bar chart.
- `Destroyed TDH Change` bar chart.

## Metric Sources

- The summary table reads `total_boosted_tdh`, `net_boosted_tdh`, and derived
  percentage values from the same `tdh_global_history` payload.
- Each chart always renders three series: the boosted value, the base/total value,
  and the raw value.
- The checkpoint table is driven by `total_boosted_tdh` and extrapolated using the
  current rate (`net_boosted_tdh`).

## Route State and Data Source

- This route has no query params, filters, or sorting controls.
- The request is fixed to `page=1` and `page_size=10` against
  `/api/tdh_global_history`.
- The API payload is reversed client-side so charts and labels render oldest
  sample first.
- There is no visible pagination or "load more" behavior on this route.

## Empty/Failure Behavior

- If the API returns no rows, the page shows only the title/header and no
  summary or chart sections.
- The UI does not expose a dedicated empty-state or inline retry control for this
  dataset.

## Cross-Route Behavior

- `/network/health` links directly to this route from the `Network TDH` card.
- `/network/tdh`, `/network/tdh/historic-boosts`, and
  `/network/definitions` all link to `/network/health/network-tdh` via
  `Network Stats` CTAs.
- Route state is static; sharing the deep link always opens the same fixed view.
- `Levels` is a separate route and does not receive route-level filter state from this
  page.


## Related Pages

- [Network Index](README.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Definitions](feature-network-definitions.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
