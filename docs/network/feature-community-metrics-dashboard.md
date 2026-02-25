# Community Metrics Dashboard

Parent: [Network Index](README.md)

## Overview

`/metrics` is a community-wide dashboard for activity and network-scoring metrics.
It compares current values against the immediate previous window for both 24-hour and
7-day periods, so users can quickly detect movement without changing filters.

## Location in the Site

- Route: `/metrics`
- Sidebar path: `Network -> Metrics`

## Entry Points

- Open `/metrics` directly.
- Open `Network -> Metrics` from the sidebar.

## User Journey

1. Open the page.
2. Wait for the card grid to load.
3. Review each metric card:
   - Left column: last 24 hours and "prev day".
   - Right column: last 7 days and "prev week".
   - Change chip with percentage delta and directional color.
4. Use the metric label to understand what to compare:
   - Drops Created
   - Distinct Droppers
   - Submissions
   - Distinct Voters
   - Votes
   - Main Stage TDH
   - Network TDH
   - Main Stage TDH %
   - Consolidations Formed

## Common Scenarios

- Check whether community activity increased or decreased over the last day/week.
- Compare a specific metric across windows (for example, `Votes` or `Distinct Droppers`)
  to understand trend direction.
- Use tooltip content (hover over large numbers) for exact values that are shown as
  compact `K`/`M` display text in the cards.

## Edge Cases

- If the previous period is empty but the current period has value, the change chip
  shows `+100.0%`.
- If both current and previous are zero, the change chip shows `N/A`.
- Invalid or negative values returned by the backend are treated as `0` for display.
- Large values are compacted in the card (`K`, `M`) while still preserving full values
  in hover tooltips.

## Failure and Recovery

- If the metrics data call fails, the page shows:
  `Failed to load metrics. Please try again later.`
- If data did not load as expected, users should refresh the route to retry.

## Limitations / Notes

- No filtering, search, or period selector is available on this page.
- Data reflects the backend snapshot returned at load time.

## Related Pages

- [Network Index](README.md)
- [Health and Network Stats](feature-health-and-network-stats.md)
- [Network Definitions](feature-network-definitions.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
