# EMMA Create Snapshots Status and Retry

## Overview

Use `Create Snapshots` in `/emma/plans/{planId}` to add collection snapshots
and track the background jobs that build holder data for the plan.

This step covers:

- searching for a collection before filling the snapshot form
- adding snapshot rows with contract, block, token, and consolidation inputs
- live status, stage, progress, and failure reporting for each snapshot job
- retrying failed or stalled snapshots
- gating `Run analysis` and `Next` until snapshot jobs are ready

## Location in the Site

- Route: `/emma/plans/{planId}`
- Plan step: `Create Snapshots`
- Surfaces: collection search, add-snapshot form, snapshots table, step footer

## Entry Points

- Open `Tools -> EMMA`, sign in, open a plan, then select `Create Snapshots`.
- Open an existing plan in `/emma/plans/{planId}` and stay on the snapshots
  step.
- Reopen a plan already in progress to continue monitoring snapshot jobs.

## User Journey

1. Open `Create Snapshots`.
2. Optionally use `Search NFT collection` to prefill the form.
   - For `The Memes by 6529`, EMMA opens a season picker before filling the
     contract and token IDs.
3. Enter or review:
   - `Name`
   - `Contract number`
   - `Block number`
   - optional `Token ID(s)` (`Empty for All tokens`)
   - optional `Consolidation block number`
4. Click `Add snapshot`.
5. EMMA adds a row to the snapshots table with:
   - name
   - status
   - contract number
   - block number
   - token IDs
   - consolidation block
   - wallets
   - tokens
6. Watch the status panel in that row as the background job advances.
   - early or active states can show `Starting`, `Queued`, or `Processing`
   - retry-aware states can show `Retrying`, `Stalled`, or `Failed`
   - completed rows show `Completed`
7. Review the extra row details as they appear:
   - stage text such as `Preparing snapshot job`, `Checking archive-node availability`, `Indexing single transfers`, `Indexing batch transfers`, `Building holder state`, `Saving snapshot results`, or `Snapshot ready`
   - progress summaries such as current/target block numbers, indexed block
     numbers, token-ownership counts, or saved-transfer counts
   - activity text such as last update time, attempt count, and previous
     failure count
   - current error or previous failure text when the backend provides it
8. Use row actions as needed:
   - completed rows expose the snapshot download action
   - retryable failed or stalled rows expose a retry action with accessible
     name `Retry snapshot`
   - while retry submission is in flight, that action is disabled, swaps to a
     spinner, and reports busy state as `Retrying snapshot`
   - all rows keep the delete action
9. Continue only after all snapshot rows are completed.
   - `Next` is shown once at least one snapshot exists, but stays disabled
     until every snapshot is completed
   - `Run analysis` appears only after all snapshots are completed and the
     snapshot operations still have not been run

## Common Scenarios

- Search for a known collection instead of typing the contract manually.
- Leave `Token ID(s)` empty to snapshot the full collection.
- Set `Consolidation block number` when you want holder consolidation before
  downstream plan use.
- Keep the step open while EMMA updates row status in the background.
- Retry a failed or stalled snapshot from the same row instead of recreating it.
- Download a completed snapshot's token output before moving to later plan
  steps.

## Edge Cases

- A newly added row can briefly show `Starting` with `Waiting for first status
  update` before the backend reports a richer stage.
- A row can show `Retrying` while the job is still active after one or more
  failed attempts.
- A row can keep polling in the background even after an issue appears, so
  status text can change without manual refresh.
- `Next` can be visible but disabled while one or more snapshot rows are still
  unresolved.
- If snapshot rows are completed but operations have not been run yet, `Run
  analysis` is shown instead of an enabled `Next`.
- Progress details are best-effort backend data; some rows expose only generic
  status text instead of detailed counters.

## Failure and Recovery

- When one or more snapshot rows fail, EMMA shows `Snapshot attention required`
  above the step.
- The warning explains that failed snapshots must be retried or deleted before
  the plan can move on.
- Use the row retry action to restart a retryable snapshot. On success, EMMA
  shows `Snapshot retry started`.
- While the retry request is still starting, the same control stays disabled
  and announces `Retrying snapshot`.
- If a row stays failed or stalled, delete it and recreate the snapshot with
  corrected inputs.
- If issue text is shown in the row, use that message to decide whether to wait
  for background completion, retry, or recreate the job.

## Limitations / Notes

- `Create Snapshots` has no `Skip` path.
- Adding a snapshot creates a background job; it does not immediately make the
  snapshot ready for later plan steps.
- `Run analysis` does not bypass incomplete snapshot jobs.
- The status table is the only in-step progress surface for snapshot jobs.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [Map Delegations](feature-map-delegations.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
