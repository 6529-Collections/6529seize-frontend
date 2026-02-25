# Health and Network Stats

Parent: [Network Index](README.md)

## Overview

`Health` provides a dashboard-style activity overview. `Network Stats` provides
the dedicated network TDH/community stats route.

## Location in the Site

- Health route: `/network/health`
- Network Stats route: `/network/health/network-tdh`
- Sidebar path: `Network -> Metrics -> Health` and
  `Network -> Metrics -> Network Stats`

## Entry Points

- Open `Network -> Metrics -> Health` in the sidebar.
- Open `Network -> Metrics -> Network Stats` in the sidebar.
- Open `Network Stats` CTA buttons from `/network/tdh`,
  `/network/tdh/historic-boosts`, or `/network/definitions`.
- On `Health`, open the `Network TDH` card link.

## Known Behavior

- `Health` displays network activity cards across daily and weekly time windows.
- While health data is loading, skeleton placeholders are shown.
- If health metrics fail to load, the page shows:
  `Failed to load metrics. Please try again later.`
- `Health` includes a `Network TDH` card that links to
  `/network/health/network-tdh`.
- `/network/health/network-tdh` hosts the community stats surface used for
  detailed network TDH/stat views.

## Not Yet Documented

- TODO: Document each health metric card meaning and interpretation guidance.
- TODO: Document filters, empty states, and pagination behavior on
  `/network/health/network-tdh`.
- TODO: Document cross-page behavior between `Health`, `Network Stats`, and
  `Levels`.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Definitions](feature-network-definitions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
