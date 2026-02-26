# Home Header and Mission Block

## Overview

The top of `/` presents the homepage identity layer: brand label, primary
headline, a mission section, and a desktop shortcut to network health.

## Location in the Site

- Route: `/`
- Health shortcut target: `/network/health` (desktop/tablet widths only)

## Entry Points

- Open `/` directly.
- Use any in-app Home link that routes to `/`.

## User Journey

1. Open `/`.
2. The header shows the brand label `6529` and the headline
   `Building a decentralized network state`.
3. On medium-and-up widths, a fixed heart icon appears in the top-right corner.
4. The mission block appears below latest-drop with:
   - Heading: `6529 is a network society`
   - Supporting body copy
   - A mission quote card
5. Selecting the heart icon opens `/network/health`.

## Common Scenarios

- Desktop/tablet visit:
  - The health shortcut is visible and stays fixed near the top-right.
- Mobile visit:
  - The health shortcut is hidden.
- Reader scans mission context before continuing to discovery sections below.

## Edge Cases

- The health shortcut does not render on small-width layouts.
- The header area does not include a primary CTA button other than the health
  shortcut.

## Failure and Recovery

- If the health shortcut is not visible, confirm viewport width is at least the
  medium breakpoint, or open `/network/health` directly.
- If header copy looks stale, refresh `/`.

## Limitations / Notes

- This surface is informational; core actions are in sections below (latest
  drop, coming up, boosted drops, and most active waves).

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Network Health Dashboard](../network/feature-health-dashboard.md)
- [Docs Home](../README.md)
