# EMMA Distribution Plan Operations Flow

## Overview

The EMMA plan workspace at `/emma/plans/{planId}` runs every plan change as a set of
`allowlist` operations. After you configure a step, some actions require running
analysis so operation state is computed and persisted before continuing.

## Location in the Site

- Route: `/emma/plans/{planId}`
- Plan progress context: right-side sidebar steps.
- Steps: `Create Plan` → `Create Snapshots` → `Create Custom Snapshot` → `Create Phases` → `Build Phases` → `Map Delegations` → `Review`.

## Entry Points

- Open `Tools -> EMMA`, then choose an existing plan.
- Open `/emma/plans` and select any plan row.
- Open `/emma/plans/{planId}` directly.

## User Journey

1. Opening a plan loads its current operation state into the builder context.
2. Each step lets you define operations in that step (for example, adding snapshots,
   custom snapshots, phases, and delegation mapping).
3. When a step requires execution before you can safely continue, the UI shows
   `Run analysis` and the step gates progression.
4. Running analysis sends a run request for the plan and updates the active run state.
5. While the run is active (`CLAIMED` or `PENDING`), the UI shows a fullscreen
   blocking overlay with a spinner so interaction stays paused during execution.
6. The page polls `/allowlists/{planId}` every 2 seconds until run status leaves the
   active states.
7. If polling detects non-active status, the plan state refreshes and the overlay
   exits.
8. If the run fails, the page shows a failure warning with the backend error reason
   and a retry control.

## Common Scenarios

- Run analysis from an incomplete step to execute pending operations.
- Continue from `Build Phases` or `Map Delegations` only after run state is clear and
  required operations are marked as run.
- Retry failed analysis directly from the warning bar in the plan context.

## Edge Cases

- Runs remain `PENDING`/`CLAIMED` during execution, so progress can be resumed by
  polling even if the user navigates away briefly within the same plan page.
- The loader overlay also covers the page while global fetch state is active, so users
  can tell execution is still in progress.
- Operations are reloaded after a successful non-active run state, so step tables and
  navigation state reflect the latest run results.

## Failure and Recovery

- On `FAILED` status, users see a top-level warning with the specific backend error
  reason and a `Run Analysis` retry action.
- If a plan run fails and needs another pass, re-run analysis from the same control;
  once operations clear, progression resumes.
- The run endpoint can fail due to invalid operation state; users should inspect the
  visible warning reason and retry after addressing the underlying issue.

## Limitations / Notes

- EMMA only reports run states for operation execution (`CLAIMED`, `PENDING`, `FAILED`).
- When a run succeeds, there is no explicit success banner; control returns to normal
  step behavior and content updates in place.

## Related Pages

- [EMMA Index](README.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [Docs Home](../README.md)
