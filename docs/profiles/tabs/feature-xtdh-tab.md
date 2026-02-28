# Profile xTDH Tab

## Overview

The `xTDH` tab at `/{user}/xtdh` has two views:

- `Granted`: grants created by the viewed profile.
- `Received`: collections, tokens, and contributors sending xTDH to the viewed profile.

The tab is marked `Beta` and always shows a test-mode banner.

## Location in the Site

- Route: `/{user}/xtdh`
- Parent route: `/{user}`

## URL State and Deep Links

`xTDH` uses URL query params for view state and sorting.

Top-level view:

- `tab=received` opens `Received`.
- Any other `tab` value opens `Granted`.
- If `tab` is missing, the page normalizes the URL to `tab=granted`.

Granted status tabs use the same `tab` param:

- `tab=pending|revoked|failed` opens those status views.
- `Active` resolves to `tab=granted` (shared links with `tab=active` also open `Active`).

Granted filters:

- `sub=all|ended|active|not_started` (only for `Active`)
- `sort=created_at|valid_from|valid_to|tdh_rate`
- `dir=asc|desc`

Received filters:

- `xtdh_received_sort=xtdh|xtdh_rate`
- `xtdh_received_dir=asc|desc`
- `xtdh_received_contract=<contract>`
- `xtdh_received_tokens_sort=xtdh|xtdh_rate`
- `xtdh_received_tokens_dir=asc|desc`
- `xtdh_token_contrib_sort=xtdh|xtdh_rate`
- `xtdh_token_contrib_dir=asc|desc`
- `xtdh_token_contrib_group=grant|grantor`

## Entry Points

- Open `/{user}/xtdh` directly.
- Switch to `xTDH` from any profile tab.
- Click the `xTDH` stat in profile header stats.
- Open a shared link containing xTDH query params.

## Access and Mode Rules

- The page is readable for any visible profile.
- Create/revoke/stop actions are available only when a connected profile exists, no active profile proxy is set, and the connected profile matches the viewed profile.
- Outside that owner mode, the tab is read-only.

## Stats Header

The header shows:

- `Generating`
- `Inbound`
- `Outbound`
- `Net`
- `Granted rate` progress (`outbound / generating`)

In owner mode, `Outbound` includes an action button that switches to `Granted` and scrolls to `Create New Grant`.

## Granted View

Available controls:

- Status tabs: `Active`, `Pending`, `Revoked`, `Failed`
- Pending tab badge: live pending count
- Active sub-filters: `All`, `Ended`, `Active`, `Not Started`
- Sort: `Created At`, `Valid From`, `Valid To`, `TDH Rate`
- Pagination: `Load More`

Grant row actions (owner mode only):

- `Stop Grant`: ends the grant immediately.
- `Revoke Grant`: rewinds validity to grant start time (treats it as never granted).

Empty states:

- Filtered result: `No grants found`
- Your profile with no grants: `You haven't granted any xTDH yet`
- Other profile with no grants: `This identity hasn't granted any xTDH yet`

## Create New Grant

`Create New Grant` is shown only in owner mode and only inside `Granted`.

Flow:

1. Select a collection and token scope (`all` tokens or selected tokens).
2. Enter total xTDH/day amount.
3. Review validity (`Never expires` or future date/time) and submit.

Submit is blocked when:

- no collection is selected,
- token scope is invalid,
- amount is missing, zero, or above available grant rate,
- expiration is in the past.

Submit requires wallet authentication. Success message:
`Grant submitted. You will see it once processed.`

## Received View

Received is a drill-down:

1. Collections list.
2. Select collection to open token allocations.
3. Select token to open contributors.
4. Select a contributor row with a grant to open grant details.

Controls:

- Collections: search + sort (`xTDH`, `xTDH Rate`)
- Tokens: sort (`xTDH`, `xTDH Rate`)
- Contributors: sort (`xTDH`, `xTDH Rate`) + grouping (`By Grant`, `By Grantor`)
- `Load More` for collections, tokens, and contributors

State persistence:

- Collection selection and sort/group controls are URL-backed.
- Selected token and selected grant details are local UI state (not URL-backed).

## Loading, Error, and Recovery

- Stats header shows inline error + `Retry` on failure.
- Granted/collections/tokens/contributors have loading states and retryable initial errors.
- Pagination failures keep loaded rows and show inline `Retry`.
- Received grant-detail fetch failures show `Retry`.
- Grant auth/submit failures show inline errors and allow retry.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [xTDH Network Overview](../../network/feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](../../network/feature-xtdh-formulas.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
