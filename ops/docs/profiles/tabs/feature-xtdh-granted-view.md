# Profile xTDH Granted View

## Overview

The `Granted` view under `/{user}/xtdh` is where a profile reviews grants it has
issued.

This view includes:

- granted-list filtering by status,
- grant token-disclosure panels,
- owner-only grant actions (`Stop` and `Revoke`),
- owner-only `Create New Grant` flow.

Shared tab routing and owner-mode rules are documented in:
[Profile xTDH Tab](feature-xtdh-tab.md).

## Location in the Site

- Route: `/{user}/xtdh`
- View selector: `tab=granted` or any granted-status deep-link value

## Query Parameters

- `tab=<value>`
  - `active|granted` selects `Active`.
  - `pending` selects `Pending`.
  - `revoked` selects `Revoked`.
  - `failed` selects `Failed`.
- `sub=all|ended|active|not_started`
  - used only when granted status tab is `Active`.
  - ignored for `Pending`, `Revoked`, and `Failed`.
- `sort=created_at|valid_from|valid_to|tdh_rate`
- `dir=asc|desc`

## Entry Points

- Open `/{user}/xtdh?tab=granted` directly.
- Open `/{user}/xtdh?tab=<active|pending|revoked|failed>` deep links.
- Switch to `Granted` from `Received`.
- Use the `Outbound` quick action in the stats header (owner mode only):
  it switches to `Granted`, then scrolls to `Create New Grant`.

## User Journey

1. Open the `Granted` view.
2. Choose status tab: `Active`, `Pending`, `Revoked`, or `Failed`.
3. If in `Active`, optionally choose sub-filter:
   `All`, `Ended`, `Active`, or `Not Started`.
4. Review grant rows and open token disclosures when needed.
5. If owner mode is enabled, stop/revoke eligible grants and create new grants.

## Granted List Behavior

- Status tabs:
  - `Active`, `Pending`, `Revoked`, `Failed`.
  - `Pending` shows a live count badge while pending grants exist.
- `Active` sub-filter appears only on `Active`.
- `Load More` paginates grant rows.
- Granted rows can show derived badges from validity dates:
  `ACTIVE`, `SCHEDULED`, or `ENDED`.

Grant token panel:

- `all tokens` grants show a static message.
- specific-token grants show a `Show/Hide` disclosure panel.
- disclosure first load shows spinner, then token grid.
- first-load fetch failure shows inline `Retry`.

## Grant Actions

Grant actions are shown only when both are true:

- owner mode is enabled,
- row status is `Pending` or `Granted`.

Actions:

- `Stop Grant`
  - confirmation modal confirms immediate stop,
  - sets grant `valid_to` to now.
- `Revoke Grant`
  - confirmation modal confirms rewind behavior,
  - sets grant `valid_to` to grant start (treated as never existing).

## Create New Grant Flow

`Create New Grant` is owner-only and appears below the granted list.

Flow:

1. Select collection and token scope (`all`, explicit tokens, or ranges).
2. Enter total xTDH/day amount.
3. Set validity (`Never expires` or future date/time).
4. Submit.

Submit stays disabled when:

- collection is missing or invalid,
- token selection is missing or invalid,
- amount is missing, non-finite, or non-positive,
- amount is above available grant rate,
- expiration is not in the future.

Submit requires wallet authentication.
Success message:
`Grant submitted. You will see it once processed.`

## Failure and Recovery

- Granted list:
  - initial load shows skeleton rows,
  - initial fetch failure shows blocking error panel with `Retry`.
- Grant token disclosure:
  - first-load failure shows `Retry`.
  - later pagination failures do not replace already loaded rows.
    retry by reaching list end again.
- `Stop`/`Revoke` failures surface as error toasts; retry from the same action.
- Create-grant auth and submit failures show inline error text; submit can be
  retried.

## Limitations / Notes

- Granted `sort` and `dir` are URL-driven; there is no visible granted sort
  control in the UI.
- Pending badge refresh is polling-driven and not instant across all clients.

## Related Pages

- [Profiles Tabs Index](README.md)
- [Profile xTDH Tab](feature-xtdh-tab.md)
- [Profile xTDH Received View](feature-xtdh-received-view.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
