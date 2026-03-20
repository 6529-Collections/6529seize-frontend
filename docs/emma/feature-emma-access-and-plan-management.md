# EMMA Access and Plan Management

## Scope

- Connect wallet and sign in at `/emma`.
- Create, open, and delete plans at `/emma/plans`.
- Open plan routes at `/emma/plans/{planId}`.

## Routes and Entry Points

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Navigation path: `Tools -> EMMA`
- Open directly: `/emma`, `/emma/plans`, `/emma/plans/{planId}`

## Access States at `/emma`

- If no valid wallet is connected, EMMA shows `Connect Your Wallet`.
- With a valid wallet, EMMA shows sign-in guidance and `Sign In with Web3`.
- Sign-in guidance says to use a consolidated-account address, avoid vault
  addresses, and that no gas/fee is required to sign in.
- Successful sign-in routes to `/emma/plans`.
- Failed or canceled sign-in keeps users on `/emma`.

## Plan List at `/emma/plans`

- `Create new` opens `Create new Distribution plan`.
- Creating a plan requires `Name` and `Description`.
- On success, EMMA routes to `/emma/plans/{planId}`.
- Existing plans render in a table with `Name`, `Description`, and `Date`.
- Dates render as `DD/MM/YY`.
- Loading state shows a centered spinner.
- Empty state shows `No plan`.
- Clicking a row opens that plan.
- Deleting uses a row-level trash action with row-level loading.
- The trash action does not trigger row navigation.

## Plan Route at `/emma/plans/{planId}`

- Route starts with a loading view while plan data is fetched.
- If the plan is accessible, EMMA initializes plan state and moves into plan
  steps.
- Deep links to `/emma/plans/{planId}` work when the plan is accessible.
- If plan load fails, EMMA routes back to `/emma`.

## Failures and Recovery

- API auth failures show `Unauthorized`.
- Network/API failures show `Something went wrong, try again`.
- If auth fails on `/emma/plans` or plan actions, return to `/emma`, sign in
  again, then retry.
- `/emma/plans` can open without an active auth session, but plan API calls can
  still fail.

## Rate-Limit Policy Text on `/emma`

- Users with TDH `< 25,000` and at least `1`: up to `3` allowlists per day.
- Users with TDH `> 25,000`: unlimited allowlists per day.
- This is user-facing policy text and can change.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
