# TDH Boost Rules

Parent: [Network Index](README.md)

## Overview

The `TDH` page explains how Total Days Held is calculated and which booster
rules are currently active.

## Location in the Site

- Route: `/network/tdh`
- Sidebar path: `Network -> TDH`
- Current rule card label: `TDH 1.4 (October 10, 2025 — present)`

## Entry Points

- Open `/network/tdh` directly.
- Open `Network -> TDH` in the sidebar.
- Open the `TDH Version: 1.4` link from a profile `Stats` tab `Boost Breakdown`
  section.
- Open the `TDH` button from `/network/definitions` or
  `/network/tdh/historic-boosts`.

## User Journey

1. Open `/network/tdh`.
2. Review the baseline formula: unweighted NFT-days, edition-size weighting,
   then boosters.
3. Review the current rule card (`TDH 1.4 (October 10, 2025 — present)`) and
   its Category A/B/C boosters.
4. Use cross-links to continue to `Historic Boosts`, `Definitions`,
   `Network Stats`, or `Levels`.

## Common Scenarios

- Confirm the current TDH version details before reviewing profile boost
  breakdowns.
- Confirm the active-version date range shown on the card heading before
  comparing with archived versions.
- Compare category behavior:
  - Category A: full-set and additional-set logic
  - Category B: SZN set boosters from SZN1 through SZN12
  - Category C: gradient booster cap
- Use the route as the canonical reference for current TDH rules.

## Edge Cases

- Category A and Category B are not stacked together as separate tracks; the
  higher of the two is applied, then Category C is added.
- Additional complete-set boosts use a diminishing formula and do not have a
  hard count cap.
- Calculations are described as daily snapshots at `00:00 UTC`.

## Failure and Recovery

- If users open the page from an outdated bookmark and the route cannot be
  resolved, the app shows route-level not-found/error behavior; users can
  recover from sidebar navigation.
- If users follow `#tdh-1-4` and the section anchor is unavailable, the page
  still loads at the top and users can scroll to `TDH 1.4`.

## Limitations / Notes

- The page documents rule definitions and examples, not a wallet-specific TDH
  result calculator.
- Cross-linked pages (`Network Stats`, `Levels`) are separate routes and can
  have their own loading or failure states.

## Related Pages

- [Network Index](README.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
- [Health and Network Stats](feature-health-and-network-stats.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Profile Stats Tab](../profiles/feature-profile-stats-tab.md)
