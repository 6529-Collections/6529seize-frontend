# Profile xTDH Tab

## Overview

The `xTDH` tab at `/{user}/xtdh` has two views:
- `Granted`: grants created by the viewed profile.
- `Received`: collections, tokens, and contributors currently sending xTDH to the viewed profile.

The tab is marked `Beta` and always shows the xTDH test/demo banner.

This page covers tab content only. Visibility, hidden-tab fallback, and profile-tab routing rules are owned by
[Profile Routes and Tab Visibility](../navigation/feature-tabs.md).

## Location in the Site

- Route: `/{user}/xtdh`
- Parent route: `/{user}`

## Query Parameters

- `tab=<value>`:
  - `received` opens `Received`.
  - `pending|revoked|failed` opens `Granted` and selects that status tab.
  - `active|granted` opens `Granted` and selects `Active`.
  - unknown values fall back to `Granted` `Active`.
  - if missing, the page rewrites the URL to `tab=granted`.
- Granted-view params:
  - `sub=all|ended|active|not_started` (used only when granted status tab is `Active`)
  - `sort=created_at|valid_from|valid_to|tdh_rate`
  - `dir=asc|desc`
- Received-view params:
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
- Switch to `xTDH` from another profile tab.
- Click the `xTDH` value in the profile header stats row.
- Open a shared `/{user}/xtdh?...` link.

## Access and Owner Mode

- Anyone who can view the profile can read the tab.
- Owner mode is enabled only when:
  - a profile is connected,
  - no active profile proxy is set,
  - the connected profile matches the viewed profile (same consolidation key or same handle).
- Outside owner mode, the tab is read-only.

Owner-only actions:
- create a grant,
- stop or revoke grants in `Pending` or `Granted` status,
- use the `Outbound` quick action in the stats header to jump to create-grant.

## User Journey

1. Open `/{user}/xtdh`.
2. Review the stats header: `Generating`, `Inbound`, `Outbound`, `Net`, and `Granted rate`.
3. Choose `Granted` or `Received`.
4. If using `Granted`:
   - review grant rows by status,
   - optionally create a new grant (owner mode only),
   - open token disclosures for grant-level token detail.
5. If using `Received`:
   - review collections,
   - open one collection to view tokens,
   - open one token to view contributors,
   - open one contributor row with a grant to view grant details.

## Granted View

Controls:

- Status tabs: `Active`, `Pending`, `Revoked`, `Failed`.
- `Pending` tab shows a live pending-count badge.
- `Active` sub-filter: `All`, `Ended`, `Active`, `Not Started`.
- `Load More` pagination for grants.
- Grant rows can show derived status labels such as `ACTIVE`, `SCHEDULED`, or `ENDED` based on validity dates.

Grant actions (owner mode only):

- `Stop Grant`: sets grant validity to now.
- `Revoke Grant`: rewinds validity to grant start (treats grant as never existing).
- Both actions are shown only for `Pending` or `Granted` rows.

Create flow (`Create New Grant`, owner mode only):

1. Select a collection and token scope (`all`, explicit token list, or ranges).
2. Enter the total xTDH/day amount.
3. Set validity (`Never expires` or future date/time).
4. Submit grant.

Submit stays disabled when:

- collection is missing or invalid,
- token selection is missing or invalid,
- amount is missing, non-positive, or above available grant rate,
- expiration is not in the future.

Submit requires wallet authentication. Success message:
`Grant submitted. You will see it once processed.`

## Received View

Received uses a drill-down flow:

1. Collections list (`xTDH Collections`).
2. Select one collection to open `xTDH Tokens`.
3. Select one token to open contributor rows.
4. Select one contributor row with a grant to open grant details.

Controls:

- Collections: search + sort (`xTDH`, `xTDH Rate`)
- Tokens: sort (`xTDH`, `xTDH Rate`)
- Contributors: sort (`xTDH`, `xTDH Rate`) + grouping (`By Grant`, `By Grantor`)
- `Load More` on collections, tokens, and contributors

State persistence:

- URL-backed: selected collection contract + all received sort/group controls.
- Local-only: search text, selected token, selected grant details.

## Failure and Recovery

- Stats header fetch failure shows inline error and `Retry`.
- Granted list:
  - initial load shows skeletons,
  - query errors show a blocking error panel with `Retry`.
- Grant token disclosure panel:
  - first-load fetch failure shows `Retry`,
  - if later pages fail, already loaded tokens stay visible.
- Received collections/tokens/contributors:
  - initial fetch failures show `Retry`,
  - later page failures keep loaded rows and show inline retry.
- Grant details panel fetch failure shows `Retry`.
- Create-grant auth or submit failures show inline error text and allow retry.

## Limitations / Notes

- xTDH is still in test/demo mode; data is expected to reset after the test period.
- Granted `sort` and `dir` are URL-driven; there is no visible granted sort control in the tab UI.
- Received contributor rows without a grant are informational only and do not open grant details.
- Received collection cards without a contract value are disabled and cannot open token drill-down.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Tabs Index](README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [xTDH Network Overview](../../network/feature-xtdh-network-overview.md)
- [xTDH Rules and Distribution Formula](../../network/feature-xtdh-formulas.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
