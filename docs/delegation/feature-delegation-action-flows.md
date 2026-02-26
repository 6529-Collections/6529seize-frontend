# Delegation Action Routes and Collection Management

## Overview

Delegation action routes handle write operations (register, update, revoke,
locks) and collection-scoped delegation management inside `/delegation/*`.

## Location in the Site

- Action routes:
  - `/delegation/register-delegation`
  - `/delegation/register-consolidation`
  - `/delegation/register-sub-delegation`
  - `/delegation/assign-primary-address`
- Collection management routes:
  - `/delegation/any-collection`
  - `/delegation/the-memes`
  - `/delegation/meme-lab`
  - `/delegation/6529-gradient`

## Entry Points

- Use delegation-center action buttons.
- Open action URLs directly.
- On collection routes, use outgoing row controls (`Edit`, `Revoke`) and bulk
  controls (`Batch Revoke`).
- On incoming sub-delegation rows, select one delegator and launch manager
  actions (`Register Delegation`, `Register Delegation Manager`,
  `Register Consolidation`, `Assign Primary Address`, `Revoke`).

## Action Form Behavior

- `register-delegation` requires:
  - `Collection`
  - `Use Case`
  - `Delegate Address`
  Optional controls:
  - `Expiry Date` (`Never` or selected date)
  - `Tokens` (`All` or selected token ID)
- `register-consolidation` requires `Collection` and `Consolidating With`.
- `register-sub-delegation` requires `Collection` and `Delegate Manager`.
- `assign-primary-address` requires a connected profile plus a consolidation key
  with more than one wallet, then selecting a wallet option for primary
  assignment.
- Forms block self-targeting (`cannot delegate to your own wallet`).

## Collection Management Behavior

- Shows separate `Outgoing` and `Incoming` accordions for:
  - Delegations
  - Consolidations
  - Delegation Managers (sub-delegation)
- Outgoing rows support:
  - single revoke
  - edit/update
  - batch revoke (minimum 2 selected, maximum 5 selected)
- Consolidation rows label each relationship as `consolidation active` or
  `consolidation incomplete`.
- Locks support wallet-level and use-case-level lock/unlock actions, with notes
  when `All Collections` global lock state blocks a scoped collection route.

## Feedback and Transaction States

- Submit actions first show `Confirm in your wallet...`.
- After submission, toast updates to pending confirmation with an explorer
  `view` link.
- After confirmation, toast updates to success with the same link.
- Validation failures render inline as an `Errors` list in the form.

## Edge Cases

- `Assign Primary Address` in manager-driven sub-delegation actions appears only
  on `Any Collection` and `The Memes`.
- Wrong-network write attempts show a toast requesting switch to configured
  chain (`Ethereum Mainnet` or `Sepolia Network`).
- Global lock state can block collection-specific lock controls until unlocked
  from `Any Collection`.

## Failure and Recovery

- If submit does not proceed, resolve listed form errors (collection/use
  case/address/date/token).
- If wallet/provider rejects or simulation fails, review toast error details and
  retry with corrected input/state.
- If lock/revoke/update actions fail due chain mismatch, switch network and
  retry from the same route.
- If primary-address assignment does not show actionable form, complete
  consolidation first.

## Limitations / Notes

- Delegation writes are onchain and depend on wallet signature plus transaction
  confirmation.
- Collection management views are account-specific and depend on connected
  wallet context.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center Layout and Section Navigation](feature-delegation-center-layout-and-section-navigation.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Routes and Action States](troubleshooting-delegation-routes-and-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
