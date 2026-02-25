# xTDH Network Overview

## Overview

`/xtdh` is a network-wide dashboard for live xTDH metrics and ecosystem-wide
recipient allocation views.

## Location in the Site

- Route: `/xtdh`
- Sidebar path: `Network -> xTDH`
- Query parameters:
  - `xtdh_received_sort=xtdh|xtdh_rate`
  - `xtdh_received_dir=asc|desc`
  - `xtdh_received_contract=<contract>`
  - `xtdh_received_tokens_sort=xtdh|xtdh_rate`
  - `xtdh_received_tokens_dir=asc|desc`
  - `xtdh_token_contrib_sort=xtdh|xtdh_rate`
  - `xtdh_token_contrib_dir=asc|desc`
  - `xtdh_token_contrib_group=grant|grantor`

## Entry Points

- Open `/xtdh` directly.
- Open the `xTDH` link in the Network sidebar.
- Open links from xTDH metric cards and docs routes that summarize received
  xTDH behavior.

## User Journey

1. Open `/xtdh`.
2. Review global metrics:
   - `Multiplier`
   - `xTDH Rate`
   - `Granted`
3. In `xTDH Collections`, search for a collection and sort by `xTDH` or
   `xTDH Rate`.
4. Open a collection to view token-level allocations.
5. Open a token to review contributor rows for grants and grantors.
6. Use breadcrumbs in the token view to return to collections.

## Common Scenarios

- Use `/xtdh` for a cross-identity snapshot of active xTDH flow.
- Open a link directly to a token list using
  `xtdh_received_contract=<contract>`.
- Switch contributor grouping between `grant` and `grantor` to check different
  attribution views.

## Edge Cases

- The route does not require an identity and always renders ecosystem-wide results.
- Sorting defaults are applied when params are missing or malformed:
  - collections and tokens: `xtdh`, descending
  - contributors: `xtdh`, descending, grouped by `grant`
- Empty ecosystem data states show “No collections found”.
- `Load More` appears only when additional pages are available.
- If contract metadata is missing, collection cards still render fallback identities
  and value rows where possible.

## Failure and Recovery

- If global stats fail to load, users see:
  - `Unable to load xTDH stats`
  - `Retry` button
- If collection, token, or contributor queries fail, each surface has inline retry
  controls.

## Limitations / Notes

- `/xtdh` is read-only; grant creation is available only on profile routes.
- Global cards and allocation lists reflect backend-calculated totals and can
  fluctuate over time.

## Related Pages

- [Network Index](README.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [Network Stats and Health](feature-health-and-network-stats.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
