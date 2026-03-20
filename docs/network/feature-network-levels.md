# Network Levels

Parent: [Network Index](README.md)

## Overview

`/network/levels` is the reference page for Level thresholds.
It maps combined `TDH + Rep` to Levels and shows the full threshold table.
The current table covers Level `0` through `100` (max threshold `25,000,000`).

## Location in the Site

- Route: `/network/levels`
- Sidebar path: `Network -> Metrics -> Levels`
- Linked from:
  `/network/tdh` (`View Levels`),
  `/network/tdh/historic-boosts` (`Levels`),
  `/network/definitions` (`Levels`)

## Entry Points

- Open `Network -> Metrics -> Levels` from the sidebar.
- Open `/network/levels` directly.
- Click `View Levels` on `/network/tdh`.
- Click `Levels` in the bottom links on `/network/tdh/historic-boosts`.
- Click `Levels` in the bottom links on `/network/definitions`.
- Click an interactive `Level` badge where available; it opens
  `/network/levels` in a new tab.

## What You See

- A `TDH + Rep` progression chart across Levels.
- Summary bullets that define how Levels work.
- A full table with `Level` and `TDH + Rep` thresholds.
- A sticky table header on scroll.

## User Journey

1. Open `/network/levels`.
2. Review the summary bullets for how Levels are defined.
3. Review the `TDH + Rep` progression chart for trend and scale.
4. Hover chart points to inspect exact threshold tooltips.
5. Use the table for exact thresholds by Level (`0` through `100`).

## Common Scenarios

- Confirm the minimum `TDH + Rep` threshold for a target Level.
- Compare nearby Level jumps before setting progression targets.
- Verify Level requirements referenced in other routes.

## Route Behavior

- No query params, filters, sorting, or pagination.
- Thresholds are static app data (no route-level API request).
- No route-level loading, empty, or retry state.
- Content is the same for signed-in and signed-out users.
- The chart uses a logarithmic y-axis to handle wide threshold ranges.
- If reduced motion is enabled in OS/browser settings, chart animation is
  disabled.

## Edge Cases

- On touch or no-hover devices, chart tooltip access can be limited.
- On narrow screens, the table scrolls horizontally.
- If a `Level` indicator is rendered as plain text in a surface, it will not
  open this route.

## Failure and Recovery

- If navigation fails, reopen from sidebar navigation or open
  `/network/levels` directly.
- If a `Level` badge did not open a new tab as expected, open
  `/network/levels` directly.

## Limitations / Notes

- The page is reference-only and does not calculate wallet-specific progression.
- Threshold changes require an app deploy with an updated Level table.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
