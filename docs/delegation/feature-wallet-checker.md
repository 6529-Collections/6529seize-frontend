# Wallet Checker

## Overview

`/delegation/wallet-checker` is a read-only diagnostics page for checking
delegations, delegation managers, and consolidation relationships for one
wallet.

## Location in the Site

- Route: `/delegation/wallet-checker`
- Sidebar entry: `Tools -> NFT Delegation -> Wallet Checker`

## Entry Points

- Open `Wallet Checker` from the delegation section menu.
- Open `/delegation/wallet-checker` directly.
- Open profile-level deep links such as
  `/delegation/wallet-checker?address=<wallet-or-ens>`.
- Paste a wallet address or ENS name and run `Check`.

## User Journey

1. Enter a wallet address or ENS in `Wallet Address`.
2. Select `Check`.
3. Review result sections:
   - `Delegations`
   - `Delegation Managers`
   - `Consolidations`
4. Use `Clear` to reset input and results.
5. Open `/delegation/wallet-checker?address=<wallet-or-ens>`, and a check starts automatically once that value is validated.

## Common Scenarios

- Verify whether a wallet has delegations and inspect collection/use-case/expiry
  fields.
- Confirm active minting delegation for The Memes in the dedicated summary row.
- Detect incomplete consolidations and follow recommended reverse-direction
  consolidation actions.

## Edge Cases

- Invalid input shows `Invalid address`.
- If `?address=<wallet-or-ens>` is present, Wallet Checker starts an initial
  check automatically after that value resolves to a valid address.
- ENS resolution blocks submit while address resolution is still loading.
- While a check is in progress, `Check` and `Enter` do not start another request.
- `Clear` resets the address input, clears cached query state, and empties all
  result sections.
- Consolidation output can include directional pairs until reciprocal
  consolidation is completed.
- Opening `Wallet Checker` with an address query parameter from other pages
  preserves that input without requiring a manual paste or `Check` click.

## Failure and Recovery

- If results are empty, confirm wallet input and rerun `Check`.
- If deep-linked address lookup cannot resolve to a valid `0x` address, fix the
  input value (or replace ENS with its resolved address) and rerun check.
- If API reads fail, checker falls back to empty result sets; retry after
  network/API recovery.
- If incomplete-consolidation recommendations appear, complete the missing
  consolidation direction and rerun checker.

## Limitations / Notes

- Wallet Checker is diagnostic only and does not submit writes.
- ENS/display labels depend on resolver/API availability.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
