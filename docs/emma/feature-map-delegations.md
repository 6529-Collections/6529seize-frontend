# EMMA Map Delegations Step

## Overview

The `Map Delegations` step in an EMMA plan lets you add an optional delegation
contract so downstream phases can resolve delegated wallets during distribution.

## Location in the Site

- Route: `/emma/plans/{planId}`
- Context: `Map Delegations` step in the right-side step timeline

## Entry Points

- Open `Tools -> EMMA` and select an existing plan, or open `/emma/plans/{planId}`
  directly.
- Continue through plan setup to the `Map Delegations` step.

## User Journey

1. Open the `Map Delegations` step.
2. If no delegation mapping exists yet, enter `Contract to return registered
   Delegations` and click `Add contract`.
3. The tool posts `MAP_RESULTS_TO_DELEGATED_WALLETS` with
   `delegationContract: <lowercased input>`.
4. On successful post, operations reload and the form resets.
5. If mapped, the step shows `Delegations are done using contract <contract>`.
6. Navigation state:
   - `Run analysis` is shown while any operation is un-run.
   - `Next` is shown only after operations are run.
   - `Skip` is shown when no delegation contract exists yet.

## Common Scenarios

- Keep delegation mapping optional if your plan does not need delegated-wallet
  expansion; `Skip` moves directly to `Review`.
- Map delegation after adding operations in prior steps to avoid the extra
  `Run analysis` roundtrip.
- Use `Next` only when the operation is present and run-complete.

## Edge Cases

- The input accepts any non-empty string in this step; backend/API validation can
  still reject invalid contracts and surfaces error toasts.
- A delegated contract is displayed as read-only once added in this flow.
- The control uses `RUN` behavior from plan execution flow, so if any operation
  remains unrun the step remains in analysis-required mode.

## Failure and Recovery

- If posting the operation fails, the API returns an error toast and operation list
  is unchanged.
- If execution fails in this or earlier steps, users run analysis and rely on the
  returned warning/error reason before continuing.

## Related Pages

- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
