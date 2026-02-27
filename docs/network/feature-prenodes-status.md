# Prenodes Status

Parent: [Network Index](README.md)

## Overview

`/network/prenodes` lists registered prenodes, their sync health, and quick
links to each node's oracle view.

## Location in the Site

- Route: `/network/prenodes`
- Navigation: direct route (no primary sidebar entry)

## Entry Points

- Open `/network/prenodes` directly.
- Open a saved bookmark or shared link to `/network/prenodes`.

## User Journey

1. Open `/network/prenodes`.
2. Review prenode cards with domain/IP, location, register date, and last
   update time.
3. Check status rows for `Ping Status`, `TDH Status`, and `TDH Block Status`.
4. Open a prenode card to jump to that node's `/oracle` route.
5. Use pagination when multiple pages are available.

## Common Scenarios

- Check which prenodes are healthy before debugging oracle mismatches.
- Open a node directly in `/oracle/address/{wallet}` when a primary wallet is
  connected.
- Open `/oracle/tdh/total` when no connected wallet is available.

## Edge Cases

- Missing city/country renders location as `Unknown`.
- `orange` ping status shows a warning icon; TDH statuses stay unknown.
- When no rows are returned, the route shows header text without prenode cards.

## Failure and Recovery

- The page has no inline error banner for upstream fetch failures.
- If data is missing, refresh `/network/prenodes` and retry later.

## Limitations / Notes

- Results are read-only and sourced from `api.6529.io` prenode data.
- Page size is fixed to `20`.
- All displayed timestamps are UTC.

## Related Pages

- [Network Index](README.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Troubleshooting](troubleshooting-network-routes-and-health.md)
