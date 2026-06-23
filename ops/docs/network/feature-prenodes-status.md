# Prenodes Status

Parent: [Network Index](README.md)

## Overview

`/network/prenodes` is a read-only prenode health page backed by
`https://api.6529.io/oracle/prenodes`.
Each card links to that prenode's external Oracle view.

## Location in the Site

- Route: `/network/prenodes`
- Navigation: direct route only (no primary sidebar entry)

## Entry Points

- Open `/network/prenodes` directly.
- Open a saved bookmark or shared link to `/network/prenodes`.

## What You See

- `Prenodes Status` heading and `* All times are in UTC` helper text.
- One card per prenode with host label (domain, or IP when domain is missing),
  IP, and location.
- `Register Date` and `Last Update` on each card, shown as UTC datetime plus
  relative age.
- Status rows: `Ping Status`, `TDH Status`, and `TDH Block Status`.
- Pagination appears only when total rows are greater than `20`: previous/next
  arrows, page input, and last-page button.
- Page input applies only when you press `Enter`; invalid values reset to the
  current page number.

## Route Behavior

- One request on first load and each page change:
  `https://api.6529.io/oracle/prenodes?page=<page>&page_size=20`.
- Page size is fixed to `20`.
- Pagination state is local UI state (no query params).
- Changing page scrolls to top.
- Card links open in a new tab on the prenode host:
  `https://{domain-or-ip}/oracle/...`.
- If `connectedProfile.primary_wallet` exists, links go to
  `/oracle/address/{wallet}`.
- Without a connected primary wallet, links go to `/oracle/tdh/total`.

## Access and Permissions

- Same route behavior for signed-in and signed-out users.
- Wallet connection only changes the destination path of each external
  oracle link.
- No write actions on this route.

## Empty, Loading, and Error States

- The route has no inline loading spinner or skeleton while data loads.
- The route has no inline error banner or retry button.
- If no rows are returned, the route stays header-only (no cards, no
  pagination).
- If the upstream request fails, refresh `/network/prenodes` to retry.

## Edge Cases

- Missing city/country renders location as `Unknown`.
- `ping_status = green`: ping shows success; TDH and block use check/x from
  sync booleans.
- `ping_status = orange`: ping shows warning; TDH and block stay unknown.
- `ping_status = red` (or any non-green/non-orange value): ping shows error;
  TDH and block stay unknown.

## Limitations / Notes

- Results are read-only and sourced from the prenodes API.
- No inline filters, search, or sort controls.
- No query-param deep link for page number.
- Oracle destinations are external links and can vary by prenode domain/IP.

## Related Pages

- [Network Index](README.md)
- [Health Dashboard](feature-health-dashboard.md)
- [Network Troubleshooting](troubleshooting-network-routes-and-health.md)
