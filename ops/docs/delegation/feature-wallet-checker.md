# Wallet Checker

## Overview

`/safe-collecting/wallet-checker` is a read-only diagnostics page for one wallet.
It checks delegations, delegation managers, and consolidation relationships.

## Location in the Site

- Route: `/safe-collecting/wallet-checker`
- App navigation: `About -> Safe Collecting -> Wallet Checker`
- Profile identity panel link: `/safe-collecting/wallet-checker?address=<primary-wallet>`

## Entry Points

- Open `Wallet Checker` from the Delegation menu.
- Open `/safe-collecting/wallet-checker` directly.
- Open deep links such as `/safe-collecting/wallet-checker?address=<wallet-or-ens>`.

## What It Shows

- `Delegations`: rows with `From`, `To`, `Collection`, `Use Case`, `Tokens`, and `Expiry`.
  A dated expiry shows the exact date, time and time zone in your local time.
- `Active Minting Delegation for The Memes`: shown when a matching active row is
  found for `The Memes` or `Any Collection` with use case `#2` (or `#1` fallback).
- `Delegation Managers`: manager rows (`From`, `To`, `Collection`).
- `Consolidations`: directional consolidation pairs for the checked wallet and
  for every wallet linked to it (up to 6 linked wallets, confirmed links
  first), so pairs between the other members of a group of up to 4 wallets
  are included. Repeated pair records are deduplicated using the newest block;
  if copies disagree in the same block, the unconfirmed copy is retained.
- `Active Consolidation`: shown only when a resolved multi-wallet consolidation set is found.
- `Incomplete Consolidation`: shown when a listed pair is missing its
  reverse direction and both wallets belong with the checked wallet (the checked
  wallet itself, its active consolidation, or a wallet it links to). A member's
  one-way link to an unrelated wallet stays in `Consolidations` but gets no
  recommended action: completing it would move that member out of the group,
  because the newest confirmed link wins.

## User Journey

1. Enter a `0x...` address or `.eth` ENS in `Wallet address or ENS name`.
2. Select `Check Wallet` (or press Enter).
3. While reads are running, the page shows `Checking delegation records...` and
   the button shows `Checking...`.
4. Review results in `Delegations`, `Delegation Managers`, and `Consolidations`.
5. If `Incomplete Consolidation` appears, follow each recommended reverse-direction action.
6. Select `Clear` before checking a different wallet.

## Common Scenarios

- Verify delegation rows and expiry values for a wallet.
- Confirm whether The Memes minting delegation is active.
- Check delegation-manager coverage.
- Detect incomplete consolidation and follow recommended reverse-direction actions.

## Edge Cases

- Invalid input shows `Enter a valid Ethereum address or ENS name.`.
- ENS input support is `.eth` names. Non-`.eth` name input is treated as invalid.
- If `?address=<wallet-or-ens>` is present, an initial check starts
  automatically after resolution to a valid address.
- Successful `.eth` resolution rewrites `?address=` to the resolved `0x...` address.
- ENS resolution blocks submit while address resolution is still loading.
- `Check Wallet` stays disabled while input is invalid or resolution is still
  loading.
- While a check is in progress, `Check Wallet` and `Enter` do not start another
  request.
- After results load, the input is disabled until `Clear` is selected.
- `Clear` resets input/results and removes the `address` query param.
- Consolidation output can include directional pairs until reciprocal
  consolidation is completed.
- API read failures show
  `Some delegation records could not be loaded. Try again in a moment.`.

## Failure and Recovery

- If a linked-wallet request fails, successfully loaded consolidation records
  remain visible. Treat them as partial results and retry; their presence does
  not prove that every link was checked.
- Recommendations wait until the separately loaded active-consolidation request
  settles.
- If results are empty, confirm wallet/ENS input and rerun `Check Wallet`.
- If the input is disabled after a previous run, select `Clear`, enter a new
  wallet, then run `Check Wallet`.
- If a deep-linked value cannot resolve to a valid address, correct the value
  and retry.
- If incomplete-consolidation recommendations appear, register missing reverse
  consolidation direction(s) and rerun checker.

## Limitations / Notes

- Wallet Checker is diagnostic only and does not submit writes.
- A pair absent in both directions produces no recommendation: the checker
  does not invent links between wallets.
- The six-linked-wallet cap can limit coverage for wallets with many stray
  links.
- Listed registrations and the backend's active counted consolidation are
  different. The checker does not activate four-wallet support.
- ENS/display labels depend on resolver/API availability.
- Consolidation output is directional and may look partial until reverse writes
  are completed.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)
