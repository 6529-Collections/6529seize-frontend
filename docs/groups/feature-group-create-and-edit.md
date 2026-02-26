# Group Creation and Edit Flow

## Overview

The groups area supports creating new group definitions and editing existing
groups from the same configuration surface.

Within the configuration surface, the TDH requirement field exposes two
selection tabs and defaults to `TDH + xTDH`:

- `TDH + xTDH`
- `TDH`

## Location in the Site

- Base groups route: `/network/groups`
- Create mode: `/network/groups?edit=new`
- Edit mode: `/network/groups?edit={groupId}`

## Entry Points

- Open `Network -> Groups` and choose `Create New`.
- Open a group card actions menu and choose `Edit` (your own group) or
  `Clone` (someone else's group).
- Open a direct URL with `?edit=new` or `?edit={groupId}`.

## Known Behavior

- Group create/edit mode requires an authenticated, non-proxy session.
- The configuration form includes:
  - Name
  - Include-me and private toggles
  - Filter configuration (Level, TDH, CIC, Rep, NFT/collection, and grant
    inputs)
  - `Include Identities` and `Exclude Identities` sections
- The TDH section includes an inclusion mode selector with values:
  - `TDH + xTDH`
  - `TDH`
- For newly created groups, TDH mode defaults to `TDH + xTDH`.
- Legacy groups that already store `XTDH` inclusion continue to load that value
  in edit mode, even though the selector does not expose a dedicated `xTDH`
  tab; choosing another tab switches the stored mode.
- Include/exclude identity sections support manual identity selection, wallet
  upload/import inputs, and a unique-wallet counter.
- `Include me` toggle behavior:
  - Turning it on adds the connected profile's primary wallet to
    `Include Identities`.
  - Turning it off removes connected-profile wallets from
    `Include Identities`, even when no primary wallet is currently available.
- Include/exclude wallet limits are enforced:
  - Include list max: `10,000`
  - Exclude list max: `1,000`
- Edit mode preloads both included and excluded identity-wallet sets from the
  existing group configuration.
- `Create` and `Test` are disabled while configuration validation fails or the
  corresponding action is already running.
- `Cancel` or `Back` returns to the groups list view.

## Validation and Action Preconditions

- Client-side validation checks all group filters before `Create` or `Test`:
  - At least one filter source exists: include wallets, exclude wallets, level,
    TDH, rep, CIC, NFT collection ownership, or beneficiary grant.
  - Include wallets must be `<= 10,000`.
  - Exclude wallets must be `<= 1,000`.
  - When both values are set, each numeric range must have `min <= max` for:
    level, TDH, rep, and CIC.
- If any rule fails, buttons stay disabled and the action returns `Group
  configuration is invalid.` from the mutation layer.
- Wallet list input is normalized:
  - Wallets are case-normalized and deduplicated when combining manual search,
    EMMA, and file-import sources.
  - Include-list overflow shows a red "Maximum allowed wallets count is ..."
    message once the configured limit is exceeded.
- `Test` and `Create` share the same validation gate, so a failing validation
  blocks both actions.

## Test Action and Members Preview

- `Test` submits a test group using the current form payload.
- If the Name field is empty, test submission uses `{connected handle} Test Run`
  as the fallback name.
- On successful test, the page queries `community-members/top` with the created
  test group and displays `Members count`.
- On test failure (non-auth), the error returned by the submit path is shown in a
  toast message.

## Failure and Recovery

- If the connected profile has no primary wallet, turning `Include me` on does
  not update `Include Identities`.
- Users can still turn `Include me` off to remove their connected-profile
  wallets from `Include Identities`.
- Groups created before TDH inclusion-mode selection fall back to `TDH` in edit
  mode when no inclusion strategy value is stored.

## Not Yet Documented

- TODO: Document create/edit behavior differences for permission changes during
  an active session.
- TODO: Document wallet import failure and recovery behavior for upload and EMMA
  sources.
- TODO: Document threshold interpretation examples for current selector modes
  (`TDH`, `TDH + xTDH`) and legacy `xTDH`-configured groups.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Wave Right Sidebar Group and Curation Management](../waves/sidebars/feature-right-sidebar-group-management.md)
- [xTDH Network Overview](../network/feature-xtdh-network-overview.md)
- [Docs Home](../README.md)
