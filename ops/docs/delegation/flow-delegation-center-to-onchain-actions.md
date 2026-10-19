# Delegation Center to Onchain Actions

## Overview

Use this flow to go from Delegation Center to a confirmed onchain write, then
verify the result in Wallet Checker.

## Location in the Site

- `/safe-collecting`
- `/safe-collecting/register-delegation`
- `/safe-collecting/register-consolidation`
- `/safe-collecting/register-sub-delegation`
- `/safe-collecting/assign-primary-address`
- `/safe-collecting/any-collection`
- `/safe-collecting/the-memes`
- `/safe-collecting/meme-lab`
- `/safe-collecting/6529-gradient`
- `/safe-collecting/wallet-checker`

## Entry Points

- Sidebar: `About -> Safe Collecting -> Delegation Center`
- Direct URLs to write or collection routes
- Profile consolidated-addresses panel links:
  - `/safe-collecting/wallet-checker?address=<primary-wallet>`
  - `/safe-collecting` (shown when consolidation state affects the
    viewing wallet)

## Before You Start

- Connect a wallet before write or collection actions.
- Use the chain required by the delegation contract.
- For `/safe-collecting/assign-primary-address`, the wallet needs a consolidation key
  with more than one wallet.

## User Journey

1. Open `/safe-collecting`.
2. Pick an action path:
   - center cards:
     - `Register Delegation` -> `/safe-collecting/register-delegation`
     - `Register Consolidation` -> `/safe-collecting/register-consolidation`
     - `Register Delegation Manager` -> `/safe-collecting/register-sub-delegation`
   - collection cards:
     - `/safe-collecting/any-collection`
     - `/safe-collecting/the-memes`
     - `/safe-collecting/meme-lab`
     - `/safe-collecting/6529-gradient`
   - `assign-primary-address`:
     - open `/safe-collecting/assign-primary-address` directly, or
     - open manager action from incoming `Delegation Managers` rows on
       `Any Collection` or `The Memes`
3. If disconnected, wallet connect opens first. Navigation continues only after
   a successful connect.
4. Complete your action:
   - write forms on `register-*` or `assign-primary-address`
   - enter wallet targets as `0x...` or `.eth` where address input is shown
   - collection actions: `Edit`, `Revoke`, `Batch Revoke`, manager actions,
     `Lock Wallet`, and `Lock/Unlock Use Case`
5. Submit and confirm in wallet.
6. Track write feedback in toasts:
   - `Confirm in your wallet...`
   - `Transaction submitted...` with a `view` explorer link
   - `Transaction Successful!`
7. Verify results in `/safe-collecting/wallet-checker`:
   - check delegations and delegation managers
   - confirm consolidation status or incomplete-direction recommendations

## Common Scenarios

- Register delegation with optional expiry/token constraints.
- Register consolidation, then assign primary address.
- Use sub-delegation incoming-row selection to execute manager-driven actions
  for an original delegator.
- Use manager `Assign Primary Address` from incoming rows on `Any Collection`
  or `The Memes`.
- Use manager `Revoke` to remove a delegation for a selected original delegator
  by collection/use-case/address.
- Revoke stale outgoing delegations in batch (2-5 rows).

## Edge Cases

- Query params are route-scoped:
  - `address` is kept only on checker and assign-primary routes.
  - `collection` and `use_case` are kept only on register-delegation.
- Direct links can prefill:
  - `register-delegation?collection=<contract>&use_case=<id>`
  - `assign-primary-address?address=<wallet>` only when the wallet is part of
    the resolved consolidation key
- Manager action buttons use disabled styling and do not open forms until one
  incoming `Delegation Managers` row is selected.
- Unknown or nested delegation paths resolve through HTML fallback by final URL
  segment; missing HTML content renders `404 | PAGE NOT FOUND`.
- Scoped collection lock controls can be blocked until matching locks are
  cleared in `Any Collection`.

## Failure and Recovery

- Validation failures keep you on the form and show inline `Errors`.
- Wrong-network writes require a chain switch, then retry.
- Missing consolidation blocks primary-address assignment until consolidation
  exists.
- If manager actions do not open a form, select one incoming
  `Delegation Managers` row first.
- If collection tables stay on `Fetching incoming ...` or `Fetching outgoing
  ...`, connect wallet and reload the same route.

## Limitations / Notes

- Final state depends on onchain confirmation timing.
- Collection route reads load once, refresh when you return to the tab, and
  re-check for about 30 seconds after a confirmed write.
- Wallet Checker is read-only and never submits writes.
- Some checker/API failures surface as empty-result states (`No ... found`)
  instead of a dedicated error panel.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)
