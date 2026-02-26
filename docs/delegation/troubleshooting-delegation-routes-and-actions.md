# Delegation Routes and Action States

## Overview

Use this page to diagnose delegation routing issues, validation failures,
wallet/network blockers, and checker result confusion.

## Location in the Site

- `/delegation/*` section routes
- Action forms (`register-*`, `assign-primary-address`)
- Collection management routes
- `/delegation/wallet-checker`

## Entry Points

- A section route shows unexpected content or `404 | PAGE NOT FOUND`.
- An action form does not submit.
- Transaction toasts show errors or request network switch.
- Wallet Checker results look empty or inconsistent.

## User Journey

1. Confirm route first (`/delegation/<section>`).
2. Confirm wallet prerequisites (connected wallet, expected account, expected
   network).
3. Confirm form requirements for the specific action.
4. Retry action and verify outcome in Wallet Checker where applicable.

## Common Scenarios

- HTML-backed section (`Delegation FAQs`, `Wallet Architecture`,
  `Consolidation Use Cases`) shows `404 | PAGE NOT FOUND`: backing content path
  did not resolve.
- `Assign Primary Address` does not show actionable form: wallet does not
  currently have a qualifying consolidation key.
- Submit keeps failing with inline `Errors`: required fields are missing or
  invalid.
- Batch revoke stays disabled: fewer than two outgoing rows selected.
- Lock controls show blocking `*` note on a scoped collection route: global
  `Any Collection` lock state is overriding local actionability.

## Edge Cases

- `address` query state is intentionally cleared when leaving checker/assign
  routes.
- `collection` and `use_case` query state is intentionally cleared when leaving
  register-delegation route.
- Collection write actions can appear available but still fail until wallet
  chain matches delegation contract chain.

## Failure and Recovery

- For route fallback errors, return to `/delegation/delegation-center` and
  re-enter the target section.
- For network mismatch errors, switch wallet chain and resubmit.
- For rejected/failed transactions, review toast error text and retry after
  correcting wallet/input state.
- For empty checker output, validate address/ENS input and rerun `Check`.
- For incomplete consolidations, register missing reverse consolidations then
  rerun checker.

## Limitations / Notes

- HTML-backed delegation sections depend on external content availability.
- Some checker/API failures surface as empty result states rather than dedicated
  error panels.

## Related Pages

- [Delegation Index](README.md)
- [Delegation Center to Onchain Actions](flow-delegation-center-to-onchain-actions.md)
- [Delegation Action Routes and Collection Management](feature-delegation-action-flows.md)
- [Wallet Checker](feature-wallet-checker.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
