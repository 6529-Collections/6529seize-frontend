# Groups List and Create Actions Troubleshooting

Parent: [Groups Index](README.md)

## Overview

Use this page when `/network/groups` filters, card actions, or create/edit
flows do not behave as expected.

## Create/Edit Route Opens List Instead

- `Create New` and `?edit=` routes require authenticated, non-proxy context.
- If auth is cancelled, or proxy mode is active, the app returns to list mode.
- Recovery:
  1. Sign in with a non-proxy profile.
  2. Re-open `Create New`, `Edit`, or `Clone` from `/network/groups`.
  3. If using a deep link, reload it after auth is ready.

## Filters Not Applying

- `By Identity` only applies when a suggestion is selected.
- Suggestions appear after at least 3 typed characters.
- `By Group Name` applies from typed input with a short debounce.
- Recovery:
  1. Select an identity suggestion explicitly.
  2. Clear `identity` or `group` query params and retry.
  3. Use `My groups` for a quick creator filter.

## List Is Empty or Missing Expected Cards

- Empty grids can be valid when filters match no groups.
- Failed fetches can also leave no cards visible.
- Recovery:
  1. Clear filters and reload `/network/groups`.
  2. Re-apply one filter at a time.
  3. If editing from a stale link, reopen the target from the card menu.

## Create/Test Button Disabled

- Actions stay disabled when configuration validation fails.
- Common blockers:
  - No active filter source
  - Include wallets over `10,000`
  - Exclude wallets over `1,000`
  - Any `min > max` range from prefilled legacy values
- Recovery:
  1. Add at least one valid filter.
  2. Reduce wallet totals below limits.
  3. Fix invalid ranges.

## Create Fails with Name Error

- `Create` requires a non-empty name.
- `Test` can run without a name and uses `{handle} Test Run`.
- Recovery:
  1. Add a name.
  2. Retry `Create`.

## Wallet Imports Not Showing Expected Results

- CSV import keeps only valid `0x` wallet addresses and ignores invalid tokens.
- EMMA import needs successful auth and a selected list.
- Recovery:
  1. Re-upload CSV with valid wallet data.
  2. Re-run EMMA import after confirming auth.
  3. Clear stale imported data before retrying.

## Grant Lookup Shows Errors

- Manual grant IDs are still submitted even when lookup fails.
- Non-`GRANTED` statuses are allowed and can be selected.
- Recovery:
  1. Correct the grant ID if the status/result is unexpected.
  2. Keep the grant only when the non-granted status is intentional.

## Delete, Rep All, or NIC All Fails

- Delete is available only on your own groups.
- Rep/NIC actions require auth and valid action inputs.
- Recovery:
  1. Confirm you are signed in.
  2. For Rep, set both amount and category.
  3. Retry the action from card idle state.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Network Group Scope Flow](../network/flow-network-group-scope.md)
