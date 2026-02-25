# Group Creation and Edit Flow

## Overview

The groups area supports creating new group definitions and editing existing
groups from the same configuration surface.

Within the configuration surface, the TDH requirement field supports three
selection modes and defaults to `TDH + xTDH`:

- `TDH`
- `xTDH`
- `TDH + xTDH`

## Location in the Site

- Base groups route: `/network/groups`
- Create mode: `/network/groups?edit=new`
- Edit mode: `/network/groups?edit={groupId}`

## Entry Points

- Open `Network -> Groups` and choose `Create New`.
- Open a group card action that routes to edit mode.
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
  - `TDH`
  - `xTDH`
  - `TDH + xTDH`
- For newly created groups, TDH mode defaults to `TDH + xTDH`.
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
- `Create` is disabled while configuration validation fails or a submit request
  is already in progress.
- `Cancel` or `Back` returns to the groups list view.

## Failure and Recovery

- If the connected profile has no primary wallet, turning `Include me` on does
  not update `Include Identities`.
- Users can still turn `Include me` off to remove their connected-profile
  wallets from `Include Identities`.
- Groups created before TDH inclusion-mode selection are treated as `TDH` for
  edit and display.

## Not Yet Documented

- TODO: Document field-level validation behavior and user-facing validation
  messaging across each filter type.
- TODO: Document the `Test` action flow and how member-count previews update
  after test runs.
- TODO: Document create/edit behavior differences for permission changes during
  an active session.
- TODO: Document wallet import failure and recovery behavior for upload and EMMA
  sources.
- TODO: Document how each mode changes threshold interpretation
  (`TDH`, `xTDH`, `TDH + xTDH`) with concrete examples.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Wave Right Sidebar Group and Curation Management](../waves/sidebars/feature-right-sidebar-group-management.md)
- [xTDH Network Overview](../network/feature-xtdh-network-overview.md)
- [Docs Home](../README.md)
