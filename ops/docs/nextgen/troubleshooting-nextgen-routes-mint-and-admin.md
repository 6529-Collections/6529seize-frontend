# NextGen Routes, Mint, and Admin Troubleshooting

## Overview

Use this page when NextGen collection routes, mint/distribution routes, or
admin-console behavior does not match what you expect.

## Location in the Site

- Collection root route: `/nextgen/collection/{collection}`
- Collection view route:
  `/nextgen/collection/{collection}/{overview|about|provenance|top-trait-sets}`
- Collection subroutes: `/nextgen/collection/{collection}/{art|trait-sets|mint|distribution-plan}`
- Admin route: `/nextgen/manager`
- Admin focus query: `/nextgen/manager?focus={global|collection|artist}`

## Quick Triage

1. Confirm the exact URL and collection slug.
2. For mint/admin issues, connect wallet and switch to the configured NextGen chain.
3. Refresh once to rerun route fetches and on-chain reads.
4. Remove stale query params and retry:
   - `/art`: `traits`, `sort`, `sort_direction`, `show_normalised`,
     `show_trait_count`, `listed`
   - `/nextgen/manager`: `focus`
5. Retry with a known-good collection slug and wallet role.

## Route Resolution Problems

### Common Symptoms

- Collection pages return not-found.
- A collection route opens `Overview` instead of the segment you entered.
- `/art` or `/trait-sets` looks empty.

### Why It Happens

- Invalid collection slugs return Next.js not-found on collection root and on
  `/art`, `/trait-sets`, `/mint`, and `/distribution-plan`.
- Unsupported collection view segments on the collection view route resolve to
  `Overview`.
- Numeric collection paths (for example `/nextgen/collection/1/mint`) are
  rewritten to canonical slug paths.
- `/art` can look empty when restrictive URL filters are active.
- `/trait-sets` can look empty when trait mode or wallet search is too
  restrictive.

### Recovery

- Open the collection from `/nextgen` or `/nextgen/collections` to confirm the
  canonical slug path.
- Clear active `/art` filters or `/trait-sets` wallet filters, then reload.
- Remove stale query params and retry the route.

## Mint and Distribution Problems

### Common Symptoms

- Mint panel never appears on `/mint`.
- Mint button is disabled without a clear inline explanation.
- Button text shows `Switch to <network>`, `Burn Not Active`, or
  `Burn to Mint - no proofs found`.
- Standard mint shows `Not in Allowlist`.
- Burn-token selector stays on `fetching...` or `0 available`.
- `/mint` shows `Allowlist Not Found`.
- `/distribution-plan` table looks empty.

### Why It Happens

- Mint content renders only after both `burnAmount` and `getPrice` reads
  succeed.
- Public phase `LIVE` always uses the standard mint widget.
- Outside public `LIVE`, mint widget type is driven by merkle config.
- Missing merkle payload for non-public flow shows `Allowlist Not Found`.
- Standard mint disables when supply is exhausted, phase is inactive, spots are
  exhausted, or proof/mint-count reads are still in flight.
- Burn flow also requires active burn status, an eligible burn token, and a
  valid burn proof.
- Distribution-plan filters (phase and wallet search) can reduce results to
  zero.

### Recovery

- Reconnect wallet, switch to the NextGen chain, then retry.
- Verify active phase and remaining spots for the selected `Mint For` address.
- In burn flow, switch burn address or token when proofs are missing.
- Refresh `/mint` to refetch proofs, per-address mint counts, and contract
  reads.
- On `/distribution-plan`, set phase to `All Phases`, clear wallet search,
  return to page 1, then refresh.

## Admin Console Problems

### Common Symptoms

- `/nextgen/manager` only shows wallet connect UI.
- Actions are missing after wallet connects.
- `Artist` section shows an artist-only restriction message.
- Page shell loads but right panel is blank.
- Open action form closes after changing tabs.

### Why It Happens

- Disconnected wallets only get the connect-wallet state.
- Action visibility is role-gated by global, function, and collection admin
  checks.
- Artist focus requires a wallet that matches a configured collection artist.
- `focus` supports only `global`, `collection`, and `artist`; other values can
  leave the right panel empty.
- Changing focus resets active form state.

### Recovery

- Use only `focus=global`, `focus=collection`, or `focus=artist`.
- Switch to a wallet that has required permissions for the target action.
- If the right panel is blank, clear `focus` (or set a supported value) and
  reload.
- Reconnect wallet if the page remains in a stale connect state.

## Limitations / Notes

- Mint/admin actions depend on wallet access, permissions, and client-side
  JavaScript.
- Mint and distribution routes expose limited inline retry controls; refresh is
  the primary retry path.
- Distribution-plan table does not render a dedicated inline empty/error row.

## Related Pages

- [NextGen Index](README.md)
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Admin Console Access and Actions](feature-nextgen-admin-console.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
