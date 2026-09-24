# EMMA Access and Plan Management

## Scope

- Connect wallet and sign in at `/emma`.
- Create, open, and delete plans at `/emma/plans`.
- Open plan routes at `/emma/plans/{planId}`.

## Routes and Entry Points

- Routes: `/emma`, `/emma/help`, `/emma/plans`, `/emma/plans/{planId}`
- Navigation path: `About -> Data & Developer Tools -> EMMA`
- Open directly: `/emma`, `/emma/plans`, `/emma/plans/{planId}`

## Access States at `/emma`

- Signed-in users go directly to `/emma/plans`, including when the session is
  restored without a live signing-wallet connection.
- Signed-out users see compact wallet guidance. Use `Connect wallet` when no
  valid address is selected, or `Sign in` when an address is available.
- A connected wallet alone does not count as a signed-in session.
- EMMA shows a neutral loading state while authentication is being restored.
- The guidance says to use a consolidated-account address, avoid vault
  addresses, and that no gas/fee is required to sign in.
- Failed or canceled sign-in stays on the entry page so users can retry.
- Opening the plans list or an individual plan while signed out takes users to
  sign-in first. Successful sign-in returns to the requested plan route.

## About EMMA

- The question-mark link beside `EMMA` on the entry and plans pages is named
  `About EMMA` and opens `/emma/help`.
- Help is public, including for signed-out users. It contains the introduction,
  Janus link, community background, and TDH rate-limit explanation.
- `Back to EMMA` returns to the entry route, which sends signed-in users to plans.

## Plan List at `/emma/plans`

- `Create new` opens `Create new Distribution plan`.
- Creating a plan requires `Name` and `Description`.
- On success, EMMA routes to `/emma/plans/{planId}`.
- Existing plans render in a table with `Name`, `Description`, and `Date`.
- Long names and descriptions wrap within their columns, including text without
  spaces. The table and `Create new` control stay within the page width.
- On narrow screens, each plan's name and description stack above a bottom row
  containing the date and delete action.
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
- Plan content and its API requests wait until a signed-in session is available.

## Rate-Limit Policy Text on `/emma/help`

- Users with TDH `< 25,000` and at least `1`: up to `3` allowlists per day.
- Users with TDH `> 25,000`: unlimited allowlists per day.
- This is user-facing policy text and can change.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
