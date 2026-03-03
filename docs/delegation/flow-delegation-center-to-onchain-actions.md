# Delegation Center to Onchain Actions

## Overview

Use this flow to go from Delegation Center to a confirmed onchain write, then
verify the result in Wallet Checker.

## Location in the Site

- `/delegation/delegation-center`
- `/delegation/register-delegation`
- `/delegation/register-consolidation`
- `/delegation/register-sub-delegation`
- `/delegation/assign-primary-address`
- `/delegation/any-collection`
- `/delegation/the-memes`
- `/delegation/meme-lab`
- `/delegation/6529-gradient`
- `/delegation/wallet-checker`

## Entry Points

- Sidebar: `Tools -> NFT Delegation -> Delegation Center`
- Direct URLs to write or collection routes
- Profile consolidated-addresses panel links:
  - `/delegation/wallet-checker?address=<primary-wallet>`
  - `/delegation/delegation-center` (shown when consolidation state affects the
    viewing wallet)

## Before You Start

- Connect a wallet before write or collection actions.
- Use the chain required by the delegation contract.
- For `/delegation/assign-primary-address`, the wallet needs a consolidation key
  with more than one wallet.

## User Journey

1. Open `/delegation/delegation-center`.
2. Pick an action path:
   - center cards:
     - `Delegation` -> `/delegation/register-delegation`
     - `Consolidation` -> `/delegation/register-consolidation`
     - `Delegation Manager` -> `/delegation/register-sub-delegation`
   - collection cards:
     - `/delegation/any-collection`
     - `/delegation/the-memes`
     - `/delegation/meme-lab`
     - `/delegation/6529-gradient`
   - `assign-primary-address`:
     - open `/delegation/assign-primary-address` directly, or
     - open manager action from incoming `Delegation Managers` rows on
       `Any Collection` or `The Memes`
3. If disconnected, wallet connect opens first. Navigation continues only after
   a successful connect.
4. Complete your action:
   - write forms on `register-*` or `assign-primary-address`
   - collection actions: `Edit`, `Revoke`, `Batch Revoke`, manager actions,
     `Lock Wallet`, and `Lock/Unlock Use Case`
5. Submit and confirm in wallet.
6. Track write feedback in toasts:
   - `Confirm in your wallet...`
   - `Transaction submitted...` with a `view` explorer link
   - `Transaction Successful!`
7. Verify results in `/delegation/wallet-checker`:
   - check delegations and delegation managers
   - confirm consolidation status or incomplete-direction recommendations

## Common Scenarios

- Register delegation with optional expiry/token constraints.
- Register consolidation, then assign primary address.
- Use sub-delegation incoming-row selection to execute manager-driven actions
  for an original delegator.
- Use manager `Assign Primary Address` from incoming rows on `Any Collection`
  or `The Memes`.
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
- Collection route reads poll every 10 seconds.
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
