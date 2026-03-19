# xTDH Rules and Distribution Formula

Parent: [Network Index](README.md)

## Overview

`/network/xtdh` is a static rules page. It explains how xTDH is produced,
received from grants, granted out, and added to your total.

## Location in the Site

- Route: `/network/xtdh`
- This rules reference is not in the current web/app sidebar route list.

## Entry Points

- Open `/network/xtdh` directly.
- Follow a direct link from related xTDH docs or troubleshooting pages.

## What Users Read on This Page

1. A short xTDH intro with a `TDH` link to `/network/tdh`.
2. Produced xTDH rules and formula.
3. Received xTDH grant rules, including denominator behavior.
4. Ownership timing rules for when grant accrual starts.
5. Granted-out xTDH rules for future production.
6. Daily rate and total formulas plus a worked example.
7. Conservation rule: produced xTDH is reassigned, not lost.

## Key Formulas Shown

- Produced xTDH:
  `produced_xTDH_today = (TDH gained today) × xTDH_coefficient`
- Per-token grant amount:
  `grant_amount_per_token = rate / denominator`
- Daily rate:
  `xtdh_rate = produced_today - granted_out_today + received_today`
- Running total:
  `xtdh_total = xtdh_total_previous + xtdh_rate`

## Rules That Affect Outcomes

- Full collection grant: denominator is collection total supply.
- Partial grant: denominator is selected token count.
- First grant increment requires both windows to pass:
  - at least 24h since grant start
  - at least 24h since token acquisition
- Transfers inside the same consolidation group keep the ownership window.
- Cross-group transfers reset holder context.
- Selling a granted token sends that token's granted xTDH flow back to grantor.
- Already pinned xTDH cannot be granted; only future production can be granted.
- `xTDH_coefficient` is shown as `0.1` on this page and can change later.

## Page Behavior and States

- Static reference route with no API calls.
- No filters, sorting, or query params.
- No route-level submit actions.
- No wallet gating; same content for signed-in and signed-out users.
- No route-specific loading, empty, or retry states.

## Failure and Recovery

- If `/network/xtdh` fails, reopen the URL directly.
- For TDH baseline rules, open `/network/tdh`.
- For live network-wide xTDH data, open `/xtdh`.

## Limitations

- This page is reference-only.
- It does not show live stats.
- It does not create or edit grants.
- Use `/xtdh` and profile xTDH routes for live balances and grant actions.

## Related Pages

- [Network Index](README.md)
- [xTDH Network Overview](feature-xtdh-network-overview.md)
- [xTDH Profile Tab](../profiles/tabs/feature-xtdh-tab.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
