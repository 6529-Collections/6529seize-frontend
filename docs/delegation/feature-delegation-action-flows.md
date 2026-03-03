# Delegation Write Action Routes

## Overview

Write action routes under `/delegation/*` create or update delegation state onchain.
Use this page for required inputs, query prefills, manager-launched variants,
and submit/recovery behavior.

## Location in the Site

- `/delegation/register-delegation`
- `/delegation/register-consolidation`
- `/delegation/register-sub-delegation`
- `/delegation/assign-primary-address`

## Entry Points

- From `/delegation/delegation-center` action cards:
  - `Delegation` -> `/delegation/register-delegation`
  - `Consolidation` -> `/delegation/register-consolidation`
  - `Delegation Manager` -> `/delegation/register-sub-delegation`
- Open write routes directly by URL.
- Open prefilled links such as
  `/delegation/register-delegation?collection=<contract>&use_case=<id>`.
- From collection routes (`/delegation/any-collection`, `/delegation/the-memes`,
  `/delegation/meme-lab`, `/delegation/6529-gradient`), open incoming
  `Delegation Managers`, select one delegator, then launch manager actions.
- `assign-primary-address` has no Delegation Center action card. Open it by URL
  or from manager actions on supported collection routes.

## Route Requirements

- `register-delegation`
  - Required: `Collection`, `Use Case`, `Delegate Address`
  - Optional: `Expiry Date` (`Never` or `Select Date`)
  - Optional: `Tokens` (`All` or `Select Token ID`)
- `register-consolidation`
  - Required: `Collection`, `Consolidating With`
- `register-sub-delegation`
  - Required: `Collection`, `Delegate Manager`
- `assign-primary-address`
  - Required: connected profile
  - Required: consolidation key with more than one wallet
  - Required: choose `Primary Address` from consolidation wallets
  - If profile is missing, route shows `Connect Wallet to continue`
  - If consolidation is missing, route shows
    `You must have a consolidation to assign a Primary Address`

## Query Parameter Behavior

- `register-delegation` accepts:
  - `collection=<contract>` to preselect `Collection`
  - `use_case=<id>` to preselect `Use Case`
- `assign-primary-address` accepts:
  - `address=<wallet>` to preselect `Primary Address` only when the wallet is
    inside the resolved consolidation key
  - If missing or not found in that key, no address is preselected

## Delegation Manager Variants

- Manager-launched actions are available from incoming `Delegation Managers`
  rows after selecting one original delegator.
- Forms launched this way show `Original Delegator` as fixed read-only input.
- On scoped collection routes (`the-memes`, `meme-lab`, `6529-gradient`),
  `Collection` is restricted to that route collection.
- `Assign Primary Address` manager action is shown only on
  `Any Collection` and `The Memes`.

## Feedback and Transaction States

- Submit starts with `Confirm in your wallet...`.
- After wallet approval, toast shows `Transaction submitted...` with a `view`
  explorer link.
- After confirmation, toast updates to `Transaction Successful!`.
- Missing or invalid form inputs show inline under `Errors`.
- Chain mismatch can surface as `Switch to Ethereum Mainnet` or
  `Switch to Sepolia Network`.

## Failure and Recovery

- If submit does not proceed, fix every item under `Errors` and resubmit.
- If chain mismatch appears, switch wallet chain and submit again.
- If the wallet can submit but simulation fails due lock state, unlock the
  affected collection or use case from collection management and retry.
- If `assign-primary-address` is blocked by consolidation requirements,
  register consolidation first, then reopen the route.

## Limitations / Notes

- These routes submit onchain writes and need wallet confirmation.
- Final success state depends on transaction confirmation timing.
- Collection tables, lock controls, edit, and revoke flows are documented in
  [Delegation Collection Management](feature-delegation-collection-management.md).

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Delegation Collection Management](feature-delegation-collection-management.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Actions Troubleshooting](troubleshooting-delegation-routes-and-actions.md)
- [Wallet Checker](feature-wallet-checker.md)
