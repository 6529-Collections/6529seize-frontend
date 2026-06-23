# EMMA Access and Plan Operations Troubleshooting

## Scope

Use this page when EMMA sign-in, plan loading, step progression, or review
actions are blocked.

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Warning surface: top bar in `/emma/plans/{planId}` when run status is `FAILED`
- Loading surface: fullscreen blocking loader during active run or refresh states

## Quick Reset

1. Reopen `/emma` and verify the connected wallet address is valid.
2. Retry `Sign In with Web3`.
3. Reopen `/emma/plans` and check for error toasts (`Unauthorized`, `Something went wrong, try again`).
4. Open the target plan from the table row in `/emma/plans`.
5. If the warning bar shows `Distribution plan building failed`, click `Run Analysis` and wait for the blocking loader to clear.

## Route and Access Issues

- `/emma` stays on `Connect Your Wallet`:
  connect a valid wallet address, then retry sign-in.
- `Sign In with Web3` does not move to plans:
  the auth request failed or was canceled; retry sign-in.
- `/emma/plans` shows `No plan` right after `Unauthorized` toast:
  the auth session was cleared; return to `/emma`, sign in again, then reopen plans.
- `/emma/plans` shows `Something went wrong, try again`:
  retry the action; if it persists, go back to `/emma`, sign in again, then reopen plans.
- Create-plan modal does not submit:
  `Name` and `Description` are both required before `Create`.
- `/emma/plans/{planId}` redirects back to `/emma`:
  the plan ID is invalid/inaccessible or plan load failed; reopen from the plans list.
- Top warning says `Distribution plan building failed`:
  read the backend reason shown in the warning and retry with `Run Analysis`.

## Step Progression Blockers

- `Run analysis` shows instead of `Next`:
  one or more plan operations have not run; click `Run analysis`, wait for completion, then continue.
- `Next` is disabled in `Create Snapshots`:
  at least one snapshot row is still incomplete; wait for all rows to reach
  `Completed`, or retry/delete failed rows first.
- `Snapshot attention required` appears in `Create Snapshots`:
  one or more snapshot jobs failed; use the row retry action or delete the
  broken snapshot before continuing.
- `Run analysis` is hidden in `Create Snapshots`:
  at least one snapshot row is still unresolved; EMMA shows `Run analysis` only
  after every snapshot is completed.
- `Next` is missing in `Create Custom Snapshot`:
  add at least one custom snapshot, or use `Skip` if you do not need this step.
- `Next` is missing in `Create Phases`:
  add at least one phase first.
- `Next` is missing in `Build Phases`:
  add at least one component to the selected phase, then run required analysis.
- In `Map Delegations`, `Run analysis` shows and `Skip`/`Next` are hidden:
  at least one operation is unrun; run analysis first.
- `Map Delegations` shows `Delegations are done using contract ...` and no input:
  a delegation contract is already mapped for this plan; this step is read-only for that value.

## Review and Publish Blockers (Subscriptions Admins)

- Review footer actions are missing:
  your wallet is not in the subscriptions-admin list.
- `Confirm Token ID` keeps reopening in `Review`:
  subscriptions-admin actions stay blocked until you confirm a valid positive token ID.
- `Publish to GitHub` is disabled in review:
  `Finalize Distribution` first, then upload at least one photo and at least
  one artist or team airdrop entry.
- `Artist Airdrops` or `Team Airdrops` upload is rejected:
  remove any header row and use raw `address,count` lines with one valid wallet
  and one positive integer per line.
- `JSON`/`CSV`/`Manifold` buttons are disabled on `Public`:
  this is expected; the synthetic `Public` row keeps those exports visible but disabled.

## Runtime and Permission Notes

- During active run states (`CLAIMED`/`PENDING`), plan UI stays blocked by a fullscreen loader.
- Plan refresh/fetch states can show the same blocking loader briefly.
- Subscriptions footer actions in `Review` are visible only to subscriptions-admin wallets.
- EMMA does not show a dedicated success banner after run completion; controls return to normal state in-place.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [EMMA Create Snapshots Status and Retry](feature-create-snapshots-status-and-retry.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Map Delegations](feature-map-delegations.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [Route Error and Not Found](../shared/feature-route-error-and-not-found.md)
