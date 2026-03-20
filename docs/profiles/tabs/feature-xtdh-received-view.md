# Profile xTDH Received View

## Overview

The `Received` view under `/{user}/xtdh` shows where the viewed profile is
currently receiving xTDH from grants.

The view uses drill-down navigation:

1. collections,
2. collection tokens,
3. token contributors,
4. selected grant details.

Shared tab routing and owner-mode rules are documented in:
[Profile xTDH Tab](feature-xtdh-tab.md).

## Location in the Site

- Route: `/{user}/xtdh`
- View selector: `tab=received`

## Query Parameters

- `tab=received`
- `xtdh_received_sort=xtdh|xtdh_rate`
- `xtdh_received_dir=asc|desc`
- `xtdh_received_contract=<contract>`
- `xtdh_received_tokens_sort=xtdh|xtdh_rate`
- `xtdh_received_tokens_dir=asc|desc`
- `xtdh_token_contrib_sort=xtdh|xtdh_rate`
- `xtdh_token_contrib_dir=asc|desc`
- `xtdh_token_contrib_group=grant|grantor`

## Entry Points

- Open `/{user}/xtdh?tab=received` directly.
- Switch from `Granted` to `Received`.
- Open shared `/{user}/xtdh?tab=received...` links with received sort/group
  query state.

## User Journey

1. Open `Received`.
2. Review `xTDH Collections`.
3. Select one collection to open `xTDH Tokens`.
4. Select one token to open contributor rows.
5. Select one contributor row with a grant to open grant details.

## Collections Step

- Collections list supports:
  - search by collection name,
  - sort by `xTDH` or `xTDH Rate`,
  - `Load More` pagination.
- Collection cards without a contract are disabled and do not open token
  drill-down.
- Selected collection is URL-backed with `xtdh_received_contract`.

## Tokens Step

- Shows collection breadcrumbs and collection summary card.
- If collection metadata is unavailable, row-level fallbacks are shown.
- Token list supports:
  - sort by `xTDH` or `xTDH Rate`,
  - `Load More` pagination.
- Selected token is local-only state (not URL-backed).

## Contributors and Grant Details Step

- Contributors panel supports:
  - sort by `xTDH` or `xTDH Rate`,
  - grouping `By Grant` or `By Grantor`,
  - `Load More` pagination.
- Contributor rows without a grant are informational only and do not open grant
  details.
- Selecting a grant row replaces the contributors list with a grant-details
  panel for that grant.

## State Persistence

- URL-backed:
  - selected collection contract,
  - collection sort and direction,
  - token sort and direction,
  - contributor sort, direction, and grouping.
- Local-only:
  - collection search text,
  - selected token,
  - selected grant details panel.

## Failure and Recovery

- Collections:
  - initial load shows skeleton cards,
  - initial fetch failure shows `Retry`,
  - later page failures keep current rows and show inline retry.
- Tokens:
  - initial fetch failure shows `Retry`,
  - later page failures keep current rows and show inline retry.
- Contributors:
  - initial fetch failure shows `Retry`,
  - later page failures keep current rows and show inline retry.
- Grant details panel:
  - loading shows skeleton rows,
  - fetch failure shows `Retry`.

## Limitations / Notes

- Collection search text is not URL-backed.
- Refreshing the route clears selected token and selected grant details.
- Deep links with unknown `xtdh_received_contract` values can open token view
  without collection summary metadata.

## Related Pages

- [Profiles Tabs Index](README.md)
- [Profile xTDH Tab](feature-xtdh-tab.md)
- [Profile xTDH Granted View](feature-xtdh-granted-view.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
