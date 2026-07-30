# TDH Historic Boosts

Parent: [Network Index](README.md)

## Overview

`/network/tdh/historic-boosts` documents archived TDH booster rules for
versions `1.3`, `1.2`, and `1.1`.
Current TDH rules are on `/network/tdh`.

## Location in the Site

- Route: `/network/tdh/historic-boosts`
- Page heading: `TDH — Historic Boosts`
- Browser title: `TDH Historic Boosts | Network`
- Sidebar: no direct item for this route

## Entry Points

- Open `/network/tdh/historic-boosts` directly.
- Select `View Historic Boosts` on `/network/tdh`.
- Select `TDH Historic Boosts` on `/network/definitions`.

## User Journey

1. Open `TDH — Historic Boosts`.
2. Compare the archived versions, effective periods, and Category A, B, and C
   summaries.
3. On tablet or desktop, use the details control at the end of a table row.
   On mobile, use `Show rules` on the version card.
4. Review the complete Category A, B, and C rules for any expanded version.
5. Expand more than one version when comparing rules.
6. Use `Explore Network references` to open current TDH, Definitions, Network
   TDH Stats, or Levels.

## Archived Rule Model

All archived versions use this combination model:

- Apply the higher of `Category A` or `Category B`.
- Then add `Category C`.
- `Category A` extra full sets: `1.02x` per additional full set (max `2`).
- `Category B` for `SZN1`: full set `1.05x`, or Genesis `1.01x` plus Nakamoto
  `1.01x`.
- `Category C`: `1.02x` per Gradient (max `3`).

## Version Differences

### TDH 1.3 (March 29, 2024 - October 9, 2025)

- `Category A` full Meme Card set: `1.55x`.
- `Category B` season range: `SZN2` through `SZN11` at `1.05x` each.
- Extra note shown on page:
  Category B is applied to total TDH, not only that season TDH.

### TDH 1.2 (December 30, 2023 - March 28, 2024)

- `Category A` full Meme Card set: `1.25x`.
- `Category B` season range: `SZN2` through `SZN5` at `1.05x` each.

### TDH 1.1 (July 14, 2023 - December 29, 2023)

- `Category A` full Meme Card set: `1.20x`.
- `Category B` season range: `SZN2` through `SZN4` at `1.05x` each.

## Route Behavior and States

- Static reference page:
  no API fetch, submit action, loading state, empty state, or retry button.
- No query params, sorting, filtering, or group-scope controls.
- Same content for signed-in and signed-out users.
- All three version sections are collapsed until opened.
- Tablet and desktop widths use a semantic comparison table. Category C is
  omitted from the compact tablet columns and remains available in the
  expanded rules.
- Mobile widths use stacked version cards with the same Category summaries.
- Detail controls are keyboard accessible, expose their expanded state, and
  have practical touch targets.

## Common Scenarios

- Compare archived multipliers with current rules on `/network/tdh`.
- Confirm version handoff dates between `TDH 1.3` and `TDH 1.4`.
- Check which season range each archived version supported.
- Expand multiple versions to compare complete-set multipliers or season
  coverage without losing the other open rule.

## Edge Cases

- Resizing between mobile and desktop keeps the expanded version state.
- Long localized dates can wrap on mobile without covering the rules control.
- The page has no wallet-gated, loading, empty, or API error state because the
  archive is static.

## Failure and Recovery

- If the route does not load, retry from `/network/tdh` or
  `/network/definitions`.
- If reference links fail, open targets directly:
  `/network/tdh`, `/network/definitions`, `/network/health/network-tdh`,
  `/network/levels`.

## Limitations / Notes

- This page is archival reference only; it does not drive current TDH scoring.
- Current scoring rules are documented on `/network/tdh`.
- This page is not a wallet-level TDH calculator.
- Versions are fixed in newest-to-oldest order and are not sortable.

## Related Pages

- [Network Index](README.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
