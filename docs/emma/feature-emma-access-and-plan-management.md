# EMMA Access and Plan Management

## Overview

EMMA access starts at `/emma`, where users connect a wallet and sign in before
managing plans at `/emma/plans`.

## Location in the Site

- Routes: `/emma`, `/emma/plans`, `/emma/plans/{planId}`
- Navigation path: `Tools -> EMMA`

## Entry Points

- Open `Tools -> EMMA` from the app sidebar.
- Open `/emma` directly.
- Open `/emma/plans` or `/emma/plans/{planId}` directly when already signed in.

## User Journey

1. Open `/emma`.
2. If wallet is not connected, the page shows `Connect Your Wallet` guidance.
3. After connecting, click `Sign In with Web3`.
4. On successful sign-in, EMMA routes to `/emma/plans`.
5. In plans view, use `Create new` to open the create-plan modal.
6. Enter `Name` and `Description`, then submit `Create`.
7. EMMA routes to `/emma/plans/{planId}` for the newly created plan.
8. Reopen an existing plan by clicking its table row.
9. Delete a plan from the row-level trash action.

## Common Scenarios

- First-time open with no plans shows `No plan` and prompts creating one.
- Existing plans are listed with `Name`, `Description`, and `Date`.
- Deep-linking to `/emma/plans/{planId}` opens a saved plan directly.

## Edge Cases

- `/emma` shows rate-limit policy copy for plan creation:
  TDH `< 25,000` users are limited to 3 allowlists/day; TDH `> 25,000` users
  are listed as unlimited.
- Plan dates are displayed as `DD/MM/YY`.
- Delete action uses row-level loading state and does not navigate to the plan.
- If plan loading fails for `/emma/plans/{planId}`, EMMA redirects back to
  `/emma`.

## Failure and Recovery

- API auth failures show `Unauthorized`; sign in again from `/emma`.
- Network/API failures show error toasts (for example,
  `Something went wrong, try again`) and users can retry in place.
- If a plan route fails to load, EMMA returns to `/emma`; reconnect/sign in and
  reopen the plan.

## Limitations / Notes

- Creating a plan requires both `Name` and `Description`.
- Plan list and plan-detail actions depend on an active authenticated session.
- Access/rate-limit policy text is user-facing guidance and may change over time.

## Related Pages

- [EMMA Index](README.md)
- [EMMA Distribution Plan Operations Flow](flow-emma-distribution-plan-operations.md)
- [Custom Snapshot Wallet Batching](feature-custom-snapshot-wallet-batching.md)
- [EMMA Access and Plan Operations Troubleshooting](troubleshooting-emma-access-and-plan-operations.md)
- [Docs Home](../README.md)
