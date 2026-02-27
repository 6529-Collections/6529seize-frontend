# Network Levels

Parent: [Network Index](README.md)

## Overview

`/network/levels` explains how Levels are derived from combined `TDH + Rep` and
shows the full threshold table.

## Location in the Site

- Route: `/network/levels`
- Sidebar path: `Network -> Metrics -> Levels`

## Entry Points

- Open `Network -> Metrics -> Levels` from the sidebar.
- Open `/network/levels` directly.
- Open `View Levels` from `/network/tdh`, `/network/tdh/historic-boosts`, or
  `/network/definitions`.

## User Journey

1. Open `/network/levels`.
2. Read the summary bullets describing Level behavior and cap.
3. Review the `TDH + Rep` progression chart.
4. Hover chart points to inspect a level threshold.
5. Use the table to look up exact threshold values by level.

## Common Scenarios

- Confirm the current threshold for a specific level.
- Compare nearby levels before setting a progression target.
- Cross-check Level references shown in Network and profile surfaces.

## Edge Cases

- The route has no filters, sort controls, pagination, or query params.
- Values are static reference content and are the same for all viewers.
- The chart uses a logarithmic y-axis to display wide threshold ranges.

## Failure and Recovery

- This route does not depend on live metrics APIs for its core content.
- If the page fails to load, reopen `/network/levels` from sidebar navigation.

## Limitations / Notes

- The page is reference-only and does not calculate wallet-specific progression.
- Threshold updates require a deployed table update.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
