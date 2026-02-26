# EMMA Distribution Plan Operations Flow

## Overview

This flow covers EMMA access, opening a plan, and advancing plan steps that
execute `allowlist` operations.

## Location in the Site

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Plan progress context: right-side sidebar steps
- Steps: `Create Plan` -> `Create Snapshots` -> `Create Custom Snapshot` ->
  `Create Phases` -> `Build Phases` -> `Map Delegations` -> `Review`

## Entry Points

- Open `Tools -> EMMA`, connect wallet, and sign in.
- Open `/emma/plans`, then select a row or create a plan.
- Open `/emma/plans/{planId}` directly when already signed in.

## User Journey

1. Open `/emma`, connect wallet, then use `Sign In with Web3`.
2. EMMA routes to `/emma/plans`.
3. Create or open a plan to enter `/emma/plans/{planId}`.
4. Plan context loads operations, token pools, transfer pools, and phases.
5. Configure steps in order (snapshots, custom snapshots, phases, components,
   delegation mapping, review).
6. Non-create steps include `Download operations` for `operations.json` export.
7. In steps that require executed operations, progression is gated behind
   `Run analysis`.
8. `Run analysis` starts a run request for the current plan.
9. While run status is active (`CLAIMED` or `PENDING`), EMMA blocks the page
   with a fullscreen loader and polls `/allowlists/{planId}` every 2 seconds.
10. Once status leaves active states, EMMA refreshes plan state and resumes
    normal step controls.
11. If status is `FAILED`, EMMA shows `Distribution plan building failed` with
    backend reason and `Run Analysis` retry.

## Common Scenarios

- Create snapshots/custom snapshots, then run analysis before moving forward.
- Build phase components and run analysis until each phase step is run-complete.
- In `Map Delegations`, add contract and run analysis, or use `Skip` when no
  delegation mapping is needed and all operations are already run.
- Recover failed runs directly from the warning bar without leaving the plan.

## Edge Cases

- Build-phase completion can trigger run execution before moving into
  `Map Delegations` when pending operations still exist.
- Loader overlay appears for both active run status and plan fetch state, so
  interaction stays paused until state refresh completes.
- In `Map Delegations`, skipping without a contract moves directly to `Review`.

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
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
