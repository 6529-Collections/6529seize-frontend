# Network Definitions

Parent: [Network Index](README.md)

## Overview

The `Definitions` page is a glossary for network metrics used across profile
stats and network pages.

## Location in the Site

- Route: `/network/definitions`
- Sidebar path: `Network -> Metrics -> Definitions`

## Entry Points

- Open `/network/definitions` directly.
- Open `Network -> Metrics -> Definitions` from the sidebar.
- Follow metric-reference links from supporting content where available.

## User Journey

1. Open `/network/definitions`.
2. Review metric definitions (for example, card counts, set counts,
   purchase/sale totals, transfer counts, and TDH variants).
3. Use in-page navigation buttons to move to `TDH`, `TDH Historic Boosts`,
   `Network Stats`, or `Levels`.

## Common Scenarios

- Check what a metric label means before comparing addresses in profile stats.
- Distinguish `TDH (unweighted)`, `TDH (unboosted)`, and final `TDH`.
- Use the inline `TDH` link to jump from glossary terms to current boost rules.

## Edge Cases

- The glossary provides shared definitions and does not show wallet-specific
  computed values.
- Definitions are route-level reference text and remain the same for signed-in
  and signed-out browsing contexts.

## Failure and Recovery

- If users follow an outdated route reference and do not land on this page, use
  `Network -> Metrics -> Definitions` in the sidebar.
- If the `TDH` link fails to resolve due temporary route issues, users can open
  `/network/tdh` directly.

## Limitations / Notes

- Definitions describe terms only; they do not explain every downstream UI that
  consumes each metric.
- Some related routes (for example, `Levels`) are linked for navigation but are
  documented separately.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Profile Stats Tab](../profiles/tabs/feature-stats-tab.md)
