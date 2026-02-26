# EMMA Access and Plan Operations Troubleshooting

## Overview

Use this page when `/emma` access, `/emma/plans` plan management, or plan
operation runs are blocked.

## Location in the Site

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Plan execution warning surface: top warning bar in `/emma/plans/{planId}`
- Plan execution loading surface: fullscreen blocking loader during active runs

## Quick Triage

1. Reopen `/emma` and verify wallet connection.
2. Sign in again with `Sign In with Web3`.
3. Reopen `/emma/plans` and confirm the plan list is loading.
4. Reopen the target `/emma/plans/{planId}` route.
5. If a run failed, use `Run Analysis` from the warning bar and wait for the
   active run overlay to clear.

## Symptom -> Fix

- `/emma` stays on `Connect Your Wallet`:
  connect a valid wallet address first, then retry sign-in.
- `Sign In with Web3` does not move to plans:
  the auth request failed or was canceled; retry the sign-in action.
- `Unauthorized` toast appears on `/emma/plans` or plan actions:
  return to `/emma`, sign in again, then retry.
- Create-plan modal does not submit:
  both `Name` and `Description` are required before `Create`.
- `/emma/plans/{planId}` redirects back to `/emma`:
  the plan ID is invalid/inaccessible or loading failed; reopen from plans list.
- Top warning says `Distribution plan building failed`:
  read the backend reason shown in the warning and retry with `Run Analysis`.
- Step progression shows `Run analysis` instead of `Next`:
  run analysis first, wait for run completion, then continue.
- In `Map Delegations`, `Run analysis` shows and `Skip` is hidden:
  at least one plan operation is still unrun; click `Run analysis`, wait for
  completion, then retry.
- `Map Delegations` shows `Delegations are done using contract ...` and no input:
  a delegation contract is already mapped for this plan; this step is read-only
  for that value.
- `Publish to GitHub` is disabled in review:
  finalize distribution and ensure at least one photo and one automatic airdrop
  upload are present.

## Edge Cases

- During active run states (`CLAIMED`/`PENDING`), plan UI stays blocked by a
  fullscreen loader.
- Subscriptions admin users must confirm token ID before review footer actions
  are available.
- The synthetic `Public` row in review keeps JSON/CSV/Manifold export buttons
  visible but disabled by design.

## Limitations / Notes

- EMMA does not show a dedicated success banner after run completion; the page
  returns to normal step controls.
- API and auth issues are surfaced through toast errors instead of inline form
  errors in many EMMA screens.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Access and Plan Management](feature-emma-access-and-plan-management.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Map Delegations](feature-map-delegations.md)
- [Subscriptions Distribution Review](feature-subscriptions-distribution-review.md)
- [Route Error and Not Found](../shared/feature-route-error-and-not-found.md)
