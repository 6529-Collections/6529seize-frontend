# NextGen Mint and Distribution Plan

Parent: [NextGen Index](README.md)

## Overview

Use these collection routes to mint and review distribution data:

- Mint route: `/nextgen/collection/{collection}/mint`
- Distribution-plan route:
  `/nextgen/collection/{collection}/distribution-plan`

## Location in the Site

- NextGen featured and collection surfaces can link into these routes.
- Both routes resolve the collection first; invalid collection slugs return
  not-found.

## Entry Points

- Use countdown CTAs: `MINT` or `BURN TO MINT`.
- Use the `Distribution Plan` link shown when allowlist is `UPCOMING`/`LIVE` or
  when public phase is not `COMPLETE`.
- Open either route directly.

## User Journey

1. Open `/mint`.
2. Wait for on-chain reads (`burnAmount`, `getPrice`); mint controls render
   after both reads succeed.
3. Review phase tags, countdown, mint counts, `Mint Cost`, and `Sales Model`.
4. Choose `Mint For` or `Burn and Mint For` (connected wallet plus eligible
   delegations).
5. Run one flow:
   - Standard flow: set `Mint To`, choose `Mint Count`, submit `Mint`.
   - External burn flow: review burn details, pick a burn token, submit
     `Burn to Mint`.
6. If needed, connect wallet or switch to the configured NextGen network.
7. Track status text: `Submitting`, `Confirm in your wallet`, transaction
   status (`Submitted`/`Successful`/`Failed`), and minted token links.
8. Open `/distribution-plan` to review phase cards, optional PDF, and
   allowlist rows.
9. Apply phase filter and wallet search together, then paginate results (100
   rows per page).

## Route Behavior

- Public phase `LIVE` always uses the standard mint widget.
- Outside public phase `LIVE`, mint widget type comes from merkle config.
- Missing merkle data on mint route shows `Allowlist Not Found`.
- External-burn mints use `burnOrSwapExternalToMint`; standard mints use
  `mint`.
- Distribution-plan route fetches phases and allowlist rows client-side.
- `Distribution Plan` link visibility is timing-based, but direct route access
  still works.

## Common Scenarios

- Standard mint button states:
  `Connect Wallet`, `Switch to <network>`, `Mint`, `Processing...`.
- Burn-to-mint button states:
  `Connect Wallet`, `Switch to <network>`, `Burn to Mint`,
  `Burn to Mint - fetching proofs`, `Burn to Mint - no proofs found`,
  `Burn Not Active`, `Processing...`.
- Standard mint shows wallet usage:
  `Wallet Mints Allowlist` or `Wallet Mints Public Phase`.
- Burn token selector shows loading/availability in the placeholder
  (`fetching...`, `<n> available`).
- Distribution-plan table supports phase filter + wallet search in one query.

## Edge Cases

- Allowlist-live mint with no proof returns `Not in Allowlist`.
- Burn flow can have `0 available` tokens after ownership/range/prefix filters.
- Burn flow `Mint To` is fixed to the selected burn address.
- Burn flow shows `Burn Not Active` when burn status is disabled.
- Distribution-plan table has no dedicated empty/error message row.

## Failure and Recovery

- Mint write failures appear in the status panel.
- If mint errors show `Not in Allowlist`, verify selected address and phase.
- If button shows `Switch to <network>`, switch chain and retry.
- If burn button shows `- no proofs found`, choose another eligible token or
  burn address.
- Refresh `/mint` to re-read proofs, mint counts, and contract values.
- On `/distribution-plan`, clear filters, return to page 1, and refresh.

## Limitations / Notes

- Minting requires a connected wallet and the configured NextGen chain.
- Burn-to-mint submits one selected burn token per transaction.
- Distribution-plan pagination renders only when results exceed 100 rows.
- Distribution-plan PDF renders only when a collection PDF is configured.

## Related Pages

- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Admin Console Access and Actions](feature-nextgen-admin-console.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
