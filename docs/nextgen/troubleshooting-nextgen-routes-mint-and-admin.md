# NextGen Routes, Mint, and Admin Troubleshooting

## Overview

Use this page when NextGen collection routes, mint controls, distribution-plan
views, or admin-console access do not behave as expected.

## Location in the Site

- Collection routes: `/nextgen/collection/{collection}/*`
- Mint route: `/nextgen/collection/{collection}/mint`
- Distribution plan route:
  `/nextgen/collection/{collection}/distribution-plan`
- Admin route: `/nextgen/manager`

## Entry Points

- Collection route opens unexpected tab/content.
- `/art` or `/trait-sets` appears empty.
- Mint button stays disabled or shows proof/network errors.
- Admin route shows role-restriction messaging.

## User Journey

1. Confirm exact route and wallet/network state.
2. Verify collection slug and token filters/query params.
3. For mint issues, check phase status, wallet role (`Mint For`), and chain.
4. For admin issues, confirm connected wallet has required role for selected
   focus (`Global`, `Collection`, `Artist`).
5. Refresh and retry the same route/action after correcting inputs.

## Common Scenarios

- Collection view segment is unsupported:
  route falls back to `Overview`.
- Collection slug is invalid:
  route returns not-found.
- `/art` shows zero cards:
  active trait/listing filters are too restrictive.
- Mint button shows `Switch to ...`:
  connected wallet is on the wrong chain.
- Mint action returns allowlist error:
  selected wallet/proof has no eligible spots.
- Admin route shows role restriction text:
  connected wallet lacks required permissions.

## Edge Cases

- `Distribution Plan` link visibility depends on sale timing, but direct route
  access can still work.
- Burn-to-mint requires an eligible owned burn token; token selector can stay at
  `0 available`.
- Query-parameter-heavy `/art` URLs can restore restrictive filters after reload.

## Failure and Recovery

- Clear `/art` filters or listing constraints, then reload results.
- Reconnect wallet and switch to the configured NextGen network before minting.
- For admin actions, switch to a wallet with matching admin/artist role.
- Refresh the route to retry allowlist, proof, and mint-count reads.

## Limitations / Notes

- Some NextGen routes do not expose explicit inline retry controls.
- Mint/admin operations rely on wallet access and client-side JavaScript.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Admin Console Access and Actions](feature-nextgen-admin-console.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
