# EMMA Map Delegations

## Overview

Use `Map Delegations` in `/emma/plans/{planId}` to optionally map one delegation
contract before `Review`.

## Location and Entry

- Route: `/emma/plans/{planId}`
- Step: `Map Delegations` in the right-side plan timeline
- This step has no dedicated URL segment. Open a plan, then move through steps.
- To revisit from `Review`, click completed `Map Delegations` in the sidebar.

## What the Step Shows

- If no delegation contract exists:
  - input `Contract to return registered Delegations`
  - `Add contract` submit button
- If a contract already exists:
  - `Delegations are done using contract <contract>`
  - no edit or replace action in this step
- Header action: `Download operations` (same as other non-`Create Plan` steps)

## Action Rules

- `Run analysis` shows when any plan operation is still not run.
- `Skip` shows only when all operations are run and no delegation contract is mapped.
- `Next` shows only when all operations are run and a delegation contract is mapped.
- `Skip` and `Next` both move to `Review`.

## Add Contract Behavior

1. Enter any non-empty value in `Contract to return registered Delegations`.
2. Click `Add contract`.
3. During submit, the button is disabled and shows a spinner.
4. EMMA lowercases the value before sending it.
5. On success, EMMA refreshes operations, clears the input, and switches to the
   read-only contract message.

## Failure and Recovery

- If `Add contract` fails, EMMA keeps this step open and shows an error toast.
- If run execution fails, the top warning bar shows
  `Distribution plan building failed`, backend reason text, and `Run Analysis`.
- If `Run analysis` keeps showing here, another operation in the plan is still
  unrun. Run analysis, wait for completion, then retry `Skip` or `Next`.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [Docs Home](../README.md)
