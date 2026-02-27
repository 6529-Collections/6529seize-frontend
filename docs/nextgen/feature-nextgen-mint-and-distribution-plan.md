# NextGen Mint and Distribution Plan

Parent: [NextGen Index](README.md)

## Overview

NextGen collection mint routes support standard minting, burn-to-mint flows,
and allowlist-distribution inspection.

## Location in the Site

- Collection mint route: `/nextgen/collection/{collection}/mint`
- Collection distribution-plan route:
  `/nextgen/collection/{collection}/distribution-plan`

## Entry Points

- Use mint CTA controls shown in NextGen collection countdown sections.
- Use `Distribution Plan` links shown on active/upcoming sale states.
- Open mint or distribution routes directly.

## User Journey

1. Open `/mint` for a collection.
2. Review phase tags, mint counts, mint cost, and sales model.
3. Choose `Mint For` (connected wallet or delegated wallet).
4. Complete one flow:
   - Standard mint: set `Mint To`, choose mint count, submit `Mint`.
   - Burn-to-mint: choose a burn token, then submit `Burn to Mint`.
5. Confirm wallet/network requirements and sign the transaction.
6. Review transaction status feedback and refreshed mint counts.
7. Open `/distribution-plan` to review phases, optional PDF, and allowlist table.
8. Filter allowlist by phase, search wallets, and paginate results.

## Common Scenarios

- Public phase uses the standard mint widget.
- Allowlist phase shows available spots and proof data.
- Mint button text changes to match prerequisites (`Connect Wallet`, `Switch to
  <network>`, `Mint`, `Burn to Mint`, `Processing...`).
- Burn-to-mint route lists only burn-eligible tokens for the selected address.

## Edge Cases

- Missing allowlist data shows `Allowlist Not Found`.
- Burn flow with no eligible owned tokens keeps token selection empty and blocks
  submission.
- Distribution-plan route can still be opened directly even when link controls
  are not currently shown.

## Failure and Recovery

- If proofs are unavailable, mint errors surface (for example `Not in
  Allowlist`).
- Contract-write failures are shown in the mint status panel.
- Refreshing the route retries proof reads and mint-count reads.

## Limitations / Notes

- Minting requires a connected wallet and the configured NextGen chain.
- Burn-to-mint processes one selected burn token per submission.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Admin Console Access and Actions](feature-nextgen-admin-console.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
