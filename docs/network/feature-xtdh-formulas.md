# xTDH Rules and Distribution Formula

## Overview

`/network/xtdh` explains how xTDH is produced, how grants distribute it, and how
grants are consumed over time.

## Location in the Site

- Route: `/network/xtdh`
- Sidebar path: `Network -> xTDH`

## Entry Points

- Open `/network/xtdh` directly.
- Open `Network -> xTDH` from the sidebar.
- Open xTDH links from profile routes for context.

## User Journey

1. Open `/network/xtdh`.
2. Confirm what xTDH tracks:
   - xTDH produced from held eligible NFTs.
   - xTDH received through grants on held tokens.
   - xTDH already given away through active or pending grants.
3. Read production, received, granted, and delta formula sections.
4. Use the example section to sanity check expected outcomes.
5. Use the conservation section to confirm whether xTDH was retained or returned.

## Common Scenarios

- Compute daily production from base TDH:
  - `produced_xTDH_today = (TDH gained today) × xTDH_coefficient`
- Estimate per-token grant impact:
  - `grant_amount_per_token = rate / denominator`
  - full collection grants use total supply as the denominator
  - partial token grants use selected token count as the denominator
- Derive daily wallet delta:
  - `xtdh_rate = produced_today - granted_out_today + received_today`
  - `xtdh_total = xtdh_total_previous + xtdh_rate`
- Validate lifecycle behavior:
  - a token receives grant reward only while it is held during an active grant
  - grant start and ownership timing can delay first reward until an ownership
    window is active

## Edge Cases

- Grant contribution can skip or reduce daily accrual when ownership changes inside a
  grant cycle.
- Ownership inside the same consolidation group does not reset the grant window.
- Cross-group transfers are treated as a new holder context.
- If a token is sold, xTDH gained from that token returns to the grantor by rule.
- `Never expires` is a grant creation UI option; it does not alter formula shape.
- Coefficient can change over time; new values affect future production.

## Failure and Recovery

- This route is informational and does not submit or mutate state.
- If page content is unavailable, users can continue with:
  - `/xtdh` for live network overview
  - `/network/tdh` for current TDH rule context.

## Limitations / Notes

- This page is rule documentation; it does not replace API contract pages or grant
  action flows.
- Formula text and coefficient values are user-visible content from the route.

## Related Pages

- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [xTDH Profile Tab](../profiles/tabs/feature-xtdh-tab.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Definitions](feature-network-definitions.md)
