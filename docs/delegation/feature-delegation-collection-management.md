# Delegation Collection Management

## Overview

`/delegation/<collection>` routes let a connected wallet review and manage
delegations for one collection scope.

## Location in the Site

- `/delegation/any-collection`
- `/delegation/the-memes`
- `/delegation/meme-lab`
- `/delegation/6529-gradient`
- Delegation Center entry: `Manage by Collection` cards on
  `/delegation/delegation-center`

## Entry Points

- Open a `Manage by Collection` card from Delegation Center.
- Open a collection route directly.
- In `Delegation Managers -> Incoming`, select one delegator checkbox to enable
  manager actions.

## User Journey

1. Open a collection route.
2. Review sections:
   - `Delegations`
   - `Consolidations`
   - `Use A Delegation Manager (For Delegations or Consolidations)`
   - `Locks`
3. Use outgoing row actions (`Edit`, `Revoke`) or `Batch Revoke` where offered.
4. Use manager actions for the selected incoming manager row.
5. Use `Lock Wallet` / `Unlock Wallet` or a use-case lock action.
6. Confirm wallet transaction and wait for success toast.

## Common Scenarios

- Check outgoing and incoming rows by use-case header (`#<id> - <display>`).
- Review row details:
  - wallet label (ENS + address when ENS resolves)
  - token scope (`all tokens` or `token ID`)
  - expiry (`active - non-expiring`, `active - expires YYYY-MM-DD`, `expired`)
- For consolidations, check status:
  - `consolidation active`
  - `consolidation incomplete` with tooltip (`Incoming consolidation missing` or
    `Outgoing consolidation missing`)
- Revoke multiple stale outgoing rows at once with `Batch Revoke`.
- Use manager actions for a selected original delegator:
  - `Register Delegation`
  - `Register Delegation Manager`
  - `Register Consolidation`
  - `Assign Primary Address` (only on `Any Collection` and `The Memes`)
  - `Revoke`
- Manager actions open inline forms on the same route.

## Edge Cases

- Accordions auto-open sides with loaded rows; empty sections stay collapsed.
- While reads are unresolved, tables show `Fetching incoming ...` /
  `Fetching outgoing ...`.
- Empty tables show `No incoming ... found` / `No outgoing ... found`.
- Outgoing-row checkboxes and `Batch Revoke` show only when that outgoing table
  has at least 2 rows.
- `Batch Revoke` stays disabled until at least 2 rows are selected.
- `Batch Revoke` selection cap is 5 rows; extra checkboxes disable at max.
- Manager action buttons render only when incoming manager rows exist and stay
  disabled until one delegator is selected.
- `Lock/Unlock Use Case` excludes use case `#1`.
- If current collection wallet is locked, use-case controls are disabled until
  wallet unlock.
- On scoped routes, global `Any Collection` wallet lock blocks local lock
  controls and shows `*` notes linked to `/delegation/any-collection`.
- On scoped routes, if a use case is globally locked in `Any Collection`, local
  lock/unlock is replaced by an `Unlock use case in All Collections` note.

## Feedback and Transaction States

- Actions start with `Confirm in your wallet...`.
- After submit, toast shows `Transaction submitted...` with a `view` explorer
  link.
- After confirmation, toast shows `Transaction Successful!`.
- Chain mismatch shows `Switch to Ethereum Mainnet` or
  `Switch to Sepolia Network`.

## Failure and Recovery

- If tables remain on `Fetching ...`, connect wallet and reload the same route.
- If manager actions stay disabled, select one incoming manager row first.
- If `Batch Revoke` is disabled, select at least 2 outgoing rows.
- If lock controls show `*` notes, unlock from `/delegation/any-collection`
  first.
- If a write fails, use toast error text, fix wallet/network/input state, and
  retry.

## Limitations / Notes

- Data is wallet/account specific.
- Reads poll every 10 seconds; updates are not pushed in real time.
- Field-level write form requirements are documented in
  [Delegation Write Action Routes](feature-delegation-action-flows.md).

## Related Pages

- [Delegation Index](README.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
