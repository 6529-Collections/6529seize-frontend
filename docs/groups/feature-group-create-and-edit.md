# Group Creation and Edit Flow

Parent: [Groups Index](README.md)

## Overview

Group creation, editing, and cloning use one configuration screen on
`/network/groups`.

Users can open that screen from `Create New`, `Edit`, `Clone`, or a deep link,
then run `Test` or `Create`.

## Location in the Site

- Base route: `/network/groups`
- Create surface from list action: `/network/groups` (same route, create view)
- Deep-link create mode: `/network/groups?edit=new`
- Deep-link edit/clone mode: `/network/groups?edit={groupId}`

## Entry Points

- Open `Network -> Groups`, then choose `Create New`.
- Open a group card menu and choose `Edit` (owner) or `Clone` (non-owner).
- Open a direct URL with `?edit=new` or `?edit={groupId}`.

## Access and Mode Gating

- Create/edit requires an authenticated, non-proxy session.
- If auth is cancelled while entering create/edit, the app stays in list view.
- If session state changes to signed-out or proxy while create/edit is open,
  the app returns to list view.
- Exiting create/edit (`Back`, `Cancel`, or successful save) returns to the
  base `/network/groups` route and clears current query params.

## Configuration Surface

- Top-level fields: `Name`, `Include me`, `Private group`.
- Threshold cards:
  - `Level at least`
  - `TDH` mode with tabs `TDH + xTDH` and `TDH`
  - Legacy `XTDH` values still load and can be saved.
  - `NIC at least`, with optional identity and direction
  - `Rep at least`, with optional identity, direction, and category
- NFT cards:
  - `Required NFTs`: user must own all selected tokens.
  - `Collection Access`: user must own any token from selected collections.
  - Supported collections are `Gradients`, `Memes`, `Memelab`, and `Nextgen`.
- Grant card:
  - `xTDH Grant Beneficiary` accepts a typed grant ID or `Find grant` picker.
  - Picker filters by grantor, collection name, and status.
- Identity lists:
  - `Include Identities`
  - `Exclude Identities`
  - Sources: identity search, EMMA list import, CSV upload
  - Combined wallets are deduplicated and normalized to lowercase.
- `Include me` behavior:
  - Turning on adds the connected profile primary wallet (if present) to
    include identities.
  - Turning off removes connected-profile wallets from include identities.

## Validation and Action Preconditions

- `Create` and `Test` share the same configuration validation gate.
- Validation requires at least one active filter source:
  - include wallets, exclude wallets, level, TDH, Rep, NIC, NFT ownership, or
    grant requirement.
- Wallet limits:
  - Include identities: `<= 10,000`
  - Exclude identities: `<= 1,000`
- Range checks:
  - When both values exist, `min <= max` is required for level, TDH, Rep, and
    NIC.
- If validation fails, actions stay disabled and mutation paths return `Group
  configuration is invalid.`
- `Name` is validated on submit:
  - Empty names are rejected on `Create` with `Please name your group.`
  - `Test` uses `{handle} Test Run` when name is empty.

## Save and Test Behavior

- `Test` creates a test group from current config, then loads `Members count`.
- `Create` always uses the same primary action label (`Create`), including edit
  mode.
- Editing your own group creates and publishes a new version with the previous
  version id passed as `old_version_id`.
- Cloning another user’s group publishes a new copy and keeps the original
  group unchanged.
- In edit mode, the selected group values are prefilled (name, privacy,
  thresholds, NFTs, grant ID, include/exclude wallets).
- Save success toast is always `Group created.` (create, edit, and clone).

## Grant Lookup and Import Behavior

- Grant ID lookup can show inline validation errors.
- A typed grant ID is still submitted even when lookup fails.
- Non-`GRANTED` grant statuses are selectable, with an inline warning.
- EMMA import requires auth; cancelled auth leaves EMMA wallets unset.
- CSV import accepts valid `0x` wallet addresses, ignores invalid tokens, and
  deduplicates matches.

## Failure and Recovery

- Edit/clone prefill shows `Loading...` while group data and wallet lists are
  fetched.
- If create/edit opens without expected prefilled data from an edit link, go
  back to list and re-open from the card menu.
- If wallet totals exceed limits, remove entries until totals are within
  limits.
- If `Test` or `Create` fails with API error, retry after confirming auth and
  filter validity.
- If grant lookup fails, either correct the grant ID or continue with the typed
  value intentionally.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Wave Right Sidebar Group and Curation Management](../waves/sidebars/feature-right-sidebar-group-management.md)
- [xTDH Network Overview](../network/feature-xtdh-network-overview.md)
- [Docs Home](../README.md)
