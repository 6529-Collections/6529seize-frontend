# Delegation Collection Management

## Overview

Collection routes under `/delegation/*` let you review existing relationships
and run management actions (edit, revoke, batch revoke, manager actions, and
lock controls).

## Location in the Site

- `/delegation/any-collection`
- `/delegation/the-memes`
- `/delegation/meme-lab`
- `/delegation/6529-gradient`

## Entry Points

- Open `Manage by Collection` cards from `/delegation/delegation-center`.
- Open collection routes directly.

## Collection View Behavior

- Each collection route shows:
  - `Delegations`
  - `Consolidations`
  - `Use A Delegation Manager (For Delegations or Consolidations)`
  - `Locks`
- Each section uses `Outgoing` and `Incoming` accordions.
- Rows group by use case (`#<id> - <display>`), then list wallet rows with:
  - wallet identity
  - token scope (`all tokens` or `token ID`)
  - expiry state (`active - non-expiring`, `active - expires <date>`, `expired`)
- Consolidation rows also show status:
  - `consolidation active`
  - `consolidation incomplete` (with tooltip that the reverse direction is
    missing)

## Row Actions

- Outgoing rows provide:
  - `Edit` (opens update form)
  - `Revoke` (single revoke)
- Batch revoke behavior:
  - appears when there are at least two outgoing rows
  - requires at least two selected rows to enable submit
  - max selected rows: `5`

## Delegation Manager Actions (From Incoming Delegation Managers)

- Select one incoming delegator row first.
- Then launch:
  - `Register Delegation`
  - `Register Delegation Manager`
  - `Register Consolidation`
  - `Assign Primary Address` (only on `Any Collection` and `The Memes`)
  - `Revoke`

## Lock Controls

- `Lock Wallet` / `Unlock Wallet` toggles collection-level incoming acceptance.
- Use-case dropdown supports lock/unlock per use case (except use case `#1`).
- Global `Any Collection` locks can block scoped collection lock controls.
- Scoped routes show `*` notes when unlock must be done first from
  `/delegation/any-collection`.

## Feedback and Transaction States

- Collection actions start with `Confirm in your wallet...`.
- On submission, toast shows `Transaction submitted...` with explorer `view`
  link while waiting.
- On confirmation, toast shows `Transaction Successful!`.
- If wallet chain does not match delegation chain, actions show a switch-network
  message (`Switch to Ethereum Mainnet` or `Switch to Sepolia Network`).

## Edge Cases

- Collection reads require a connected wallet; disconnected state can leave
  tables in `Fetching ...`.
- Manager action buttons are disabled until one incoming manager row is
  selected.
- Batch-selection checkboxes disable extra picks after 5 selected rows.

## Failure and Recovery

- If rows do not load, connect wallet and reload the same collection route.
- If action submission fails, read toast/error details and retry with corrected
  inputs.
- If chain switch is requested, switch wallet network and retry.
- If lock controls show `*` note, unlock from `Any Collection` first, then
  retry scoped lock changes.

## Limitations / Notes

- Collection data and lock states are account-specific.
- Reads and statuses refresh on polling, not instant push.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Write Action Routes](feature-delegation-action-flows.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
