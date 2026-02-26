# Wallet Checker

## Overview

`/delegation/wallet-checker` is a read-only diagnostics page for one wallet.
It checks delegations, delegation managers, and consolidation relationships.

## Location in the Site

- Route: `/delegation/wallet-checker`
- App navigation: `Tools -> NFT Delegation -> Wallet Checker`
- Profile identity panel link: `/delegation/wallet-checker?address=<primary-wallet>`

## Entry Points

- Open `Wallet Checker` from the Delegation menu.
- Open `/delegation/wallet-checker` directly.
- Open deep links such as `/delegation/wallet-checker?address=<wallet-or-ens>`.

## What It Shows

- `Delegations`: rows with `From`, `To`, `Collection`, `Use Case`, `Tokens`, and `Expiry`.
- `Active Minting Delegation for The Memes`: shown only when an active matching delegation exists.
- `Delegation Managers`: manager rows (`From`, `To`, `Collection`).
- `Consolidations`: directional consolidation pairs.
- `Active Consolidation`: shown only when a resolved multi-wallet consolidation set is found.
- `Incomplete Consolidation`: shown only when reverse-direction consolidation is missing.

## User Journey

1. Enter a `0x...` address or `.eth` ENS in `Wallet Address`.
2. Select `Check` (or press Enter).
3. While reads are running, the button shows `Checking...`.
4. Review results in `Delegations`, `Delegation Managers`, and `Consolidations`.
5. If `Incomplete Consolidation` appears, follow each recommended reverse-direction action.
6. Select `Clear` before checking a different wallet.

## Common Scenarios

- Verify delegation rows and expiry values for a wallet.
- Confirm whether The Memes minting delegation is active.
- Check delegation-manager coverage.
- Detect incomplete consolidation and follow recommended reverse-direction actions.

## Edge Cases

- Invalid input shows `Invalid address`.
- If `?address=<wallet-or-ens>` is present, an initial check starts
  automatically after resolution to a valid address.
- Successful `.eth` resolution rewrites `?address=` to the resolved `0x...` address.
- ENS resolution blocks submit while address resolution is still loading.
- While a check is in progress, `Check` and `Enter` do not start another request.
- After results load, the input is disabled until `Clear` is selected.
- `Clear` resets input/results and removes the `address` query param.
- Consolidation output can include directional pairs until reciprocal
  consolidation is completed.
- API read failures show `No delegations found`, `No delegation managers found`,
  and/or `No consolidations found` instead of a dedicated error panel.

## Failure and Recovery

- If results are empty, confirm wallet/ENS input and rerun `Check`.
- If the input is disabled after a previous run, select `Clear`, enter a new
  wallet, then run `Check`.
- If a deep-linked value cannot resolve to a valid address, correct the value
  and retry.
- If incomplete-consolidation recommendations appear, register missing reverse
  consolidation direction(s) and rerun checker.

## Limitations / Notes

- Wallet Checker is diagnostic only and does not submit writes.
- ENS/display labels depend on resolver/API availability.
- ENS input support is `.eth` names.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
