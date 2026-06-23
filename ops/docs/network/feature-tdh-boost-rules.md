# TDH Boost Rules

Parent: [Network Index](README.md)

## Overview

`/network/tdh` is the source of truth for the current TDH formula and active
boosters.

## Location in the Site

- Route: `/network/tdh`
- Sidebar path (web): `Network -> TDH`
- Sidebar path (app): `Network -> TDH`
- Current rule anchor: `#tdh-1-4`
- Current rule heading: `TDH 1.4 (October 10, 2025 — present)`

## Entry Points

- Open `/network/tdh` directly.
- Open `Network -> TDH` in the sidebar.
- Open `TDH Version: 1.4` in profile `Collected -> Details -> Boost Breakdown`.
- Open `TDH` from `/network/definitions`.
- Open `TDH` from `/network/tdh/historic-boosts`.

## User Journey

1. Open `/network/tdh`.
2. Read `How TDH is computed`:
   unweighted days -> edition weighting -> boosters.
3. Review the active block `TDH 1.4 (October 10, 2025 — present)`.
4. Use bottom buttons to move to historic rules, definitions, stats, or levels.

## Page Behavior and States

- Static reference page: no filters, sorting, query params, or submit actions.
- Same content for signed-in and signed-out users (no wallet gating).
- No route-specific loading, empty, or retry state on this page.
- Navigation buttons shown on page:
  `View Historic Boosts`, `Definitions`, `View Network Stats`, `View Levels`.

## Current Rule Details (`TDH 1.4`)

- Baseline order:
  unweighted days -> edition weighting (`FirstGM 3,941 = 1.0`) -> boosters.
- Booster combination rule:
  higher of Category A or Category B, then add Category C.
- Category A:
  complete Meme Card set `1.60x`.
- Category A additional sets:
  `0.05 x (0.6529)^(n-1)` with no hard set-count cap.
- Category B:
  `SZN1` (`1.05x` complete set, or `1.01x` Genesis and `1.01x` Nakamoto),
  and `SZN2` through `SZN12` at `1.05x` each.
- Category C:
  `1.02x` per Gradient up to `5` Gradients.
- Calculation timing shown on page:
  daily snapshot at `00:00 UTC`.

## Edge Cases

- Category A and Category B do not stack together as separate tracks.
- Additional Category A set boosts are diminishing and uncapped.
- If `#tdh-1-4` is missing in a deep link, the page still opens and users can
  scroll to the `TDH 1.4` block.

## Failure and Recovery

- If `/network/tdh` fails, reopen from `Network -> TDH` or open the URL
  directly.
- If route buttons fail, open targets directly:
  `/network/tdh/historic-boosts`, `/network/definitions`,
  `/network/health/network-tdh`, `/network/levels`.

## Limitations / Notes

- This page documents current visible rules only.
- It is not a wallet-specific TDH calculator.
- Historic versions live on `/network/tdh/historic-boosts`.

## Related Pages

- [Network Index](README.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Stats](feature-network-stats.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
