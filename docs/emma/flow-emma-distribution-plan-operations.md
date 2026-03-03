# EMMA Distribution Plan Operations Flow

## Overview

Use this flow to move a plan from EMMA sign-in to `Review` in
`/emma/plans/{planId}`.

This page owns cross-step behavior: step progression, `Run analysis` gating,
active-run blocking, and failed-run recovery.

## Location in the Site

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- In-plan progress: right sidebar timeline
- Step order: `Create Plan` -> `Create Snapshots` -> `Create Custom Snapshot`
  -> `Create Phases` -> `Build Phases` -> `Map Delegations` -> `Review`

## Entry Points

1. Open `Tools -> EMMA`, connect a valid wallet, then use `Sign In with Web3`.
2. Open or create a plan in `/emma/plans`.
3. Open `/emma/plans/{planId}` directly if you already have access.

## End-to-End Flow

1. Open `/emma`, connect wallet, then use `Sign In with Web3`.
2. EMMA routes to `/emma/plans`.
3. Create or open a plan to enter `/emma/plans/{planId}`.
4. The plan route starts in `Create Plan` loading state while EMMA fetches the
   plan. If loading fails, EMMA routes back to `/emma`.
5. `Create Snapshots`:
   - Add one or more snapshots.
   - Each snapshot starts a download job.
   - While any snapshot download is active (`PENDING` / `CLAIMED`), progression
     controls are hidden.
   - After downloads settle, `Run analysis` appears when snapshot operations are
     not run. `Next` appears when at least one snapshot exists and no run is
     required.
6. `Create Custom Snapshot`:
   - `Skip` appears when no custom snapshots exist.
   - `Next` appears after at least one custom snapshot exists.
7. `Create Phases`:
   - Add at least one phase.
   - `Next` moves to `Build Phases`.
8. `Build Phases`:
   - Configure groups phase-by-phase (`<phase name> - X/Y`).
   - `Run analysis` appears when selected-phase spot operations are not run.
   - `Next` appears only after the phase has groups and no run is required.
   - On the last phase, `Next` auto-runs pending operations (if any), then
     moves to `Map Delegations`.
9. `Map Delegations`:
   - If no delegation contract exists, use `Add contract`.
   - If a contract exists, the step is read-only for that value.
   - `Run analysis` appears while any operation is not run.
   - After all operations are run: `Skip` goes to `Review` when no contract is
     mapped, and `Next` goes to `Review` when a contract is mapped.
10. In every non-`Create Plan` step, `Download operations` exports
    `operations.json`.

## Step Navigation Rules

- Steps do not have separate URLs; they are in-page state under
  `/emma/plans/{planId}`.
- Completed sidebar steps are clickable, except `Create Plan`.
- Current and upcoming sidebar steps are not clickable.

## Run Lifecycle and Blocking

- `Run analysis` and last-phase auto-run both send a run request for the plan.
- While active run status is `CLAIMED` or `PENDING`, EMMA blocks the plan UI
  with a fullscreen loader.
- The same loader can appear during plan-fetch refresh states.
- During active run states, EMMA polls `/allowlists/{planId}` every 2 seconds.
- When run state leaves active statuses, EMMA refreshes plan state and restores
  normal step controls.

## Failure and Recovery

- On `FAILED` run status, EMMA shows `Distribution plan building failed` with
  backend reason text and a `Run Analysis` retry action in the warning bar.
- Retry from the warning bar, then wait for the blocking loader to clear.
- API auth failures show `Unauthorized`; sign in again and reopen the plan.
- Other request failures show `Something went wrong, try again`.

## Limitations / Notes

- User-visible run states are `CLAIMED`, `PENDING`, and `FAILED`.
- Successful runs do not show a separate success banner; controls return to
  normal step behavior in place.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
