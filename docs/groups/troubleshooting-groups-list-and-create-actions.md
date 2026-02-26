# Groups List and Create Actions Troubleshooting

Parent: [Groups Index](README.md)

## Use this page when

- `/network/groups` filters do not apply.
- `Create New`, `Edit`, `Clone`, or `Delete` is missing or fails.
- `Create`, `Test`, `Rep all`, or `NIC all` is blocked.
- create/edit exits and your filters are gone.

## Quick Checks

- `Create New` missing: sign in and exit proxy mode.
- `?edit=` deep link opens list: auth was cancelled, not ready, or proxy mode is on.
- `Create`/`Test` disabled: add at least one valid filter and fix limits/ranges.
- `Rep all`/`NIC all` blocked: only one card can run vote-all at a time.
- List looks empty: could be no matches or fetch failure (no inline list error).

## Create New Button Is Missing

- `Create New` is shown only for authenticated, non-proxy sessions.
- Recovery:
  1. Sign in with a non-proxy profile.
  2. Reload `/network/groups`.
  3. Re-open `Create New`.

## Edit/Clone Deep Link Opens List Instead

- `/network/groups?edit=new` and `/network/groups?edit={groupId}` switch to create mode only after auth succeeds and proxy mode is off.
- If auth is cancelled, not ready, or proxy mode is active, the page stays in list mode.
- Recovery:
  1. Sign in with a non-proxy profile.
  2. Re-open `Create New`, `Edit`, or `Clone`.
  3. If using a deep link, reload it after auth is ready.

## Edit/Clone Opens Create but Values Are Not Prefilled

- Edit/clone prefill depends on loading the target group and its wallet lists.
- Invalid or stale `edit` IDs can open create mode without expected saved values.
- Recovery:
  1. Return to `/network/groups`.
  2. Open the target again from that card’s `Edit`/`Clone` menu.
  3. Avoid reusing old deep links for removed or outdated groups.

## Filters Are Not Applying

- `By Identity` applies only after you select a suggestion (click or `Enter`).
- Identity suggestions start after at least 3 typed characters.
- `By Group Name` updates results after a short debounce.
- Recovery:
  1. Select an identity suggestion explicitly.
  2. Clear `identity` and `group` query params, then retry.
  3. Use `My groups` to set creator filter quickly.

## List Is Empty or Missing Expected Cards

- Empty results are valid when filters match no groups.
- Failed fetches can also leave the grid empty.
- `/network/groups` has no dedicated inline fetch-error state.
- Recovery:
  1. Clear filters and reload `/network/groups`.
  2. Re-apply one filter at a time.
  3. If you came from an old edit link, reopen the target from the card menu.

## Edit/Clone/Delete Menu Is Missing

- Card menus are shown only for authenticated, non-proxy sessions.
- Menu label is `Edit` for your own group and `Clone` for other users.
- `Delete` appears only on your own groups.
- Recovery:
  1. Confirm you are signed in.
  2. Exit proxy mode if active.
  3. Re-open the card menu.

## Create or Test Is Disabled

- `Create` and `Test` are disabled while configuration is invalid or while create is already running.
- Common blockers:
  - No active filter source
  - Include identities over `10,000`
  - Exclude identities over `1,000`
  - `min > max` for Level, TDH, Rep, or NIC
- Recovery:
  1. Add at least one valid filter.
  2. Reduce wallet totals below limits.
  3. Fix any `min > max` range.

## Create Fails with Name Error

- `Create` requires a non-empty name.
- `Test` can run without a name and uses `{handle} Test Run`.
- Recovery:
  1. Add a name.
  2. Retry `Create`.

## Wallet Imports Do Not Match Expected Results

- Include/exclude wallets are merged from identity picks, EMMA import, and CSV import, then deduplicated.
- CSV import keeps only valid `0x` wallet addresses and ignores invalid tokens.
- EMMA import requires a selected list and successful auth.
- Recovery:
  1. Re-upload CSV with valid wallet data.
  2. Re-run EMMA import after auth succeeds.
  3. Clear imported wallets and retry one source at a time.

## Grant Lookup Shows Errors

- Typed grant IDs are still submitted even when lookup fails.
- Non-`GRANTED` statuses are still selectable.
- Recovery:
  1. Correct the grant ID if the result is unexpected.
  2. Keep non-granted status only when intentional.

## Rep All, NIC All, or Delete Fails

- `Delete` is available only on your own groups.
- `Rep all` and `NIC all` require auth.
- `Rep all` requires amount and category. `NIC all` requires amount.
- Only one card can be in vote-all mode at a time; other cards disable vote-all actions until active mode ends.
- Recovery:
  1. Confirm you are signed in.
  2. For Rep, set amount and category; for NIC, set amount.
  3. Cancel any active vote-all action, then retry.

## Filters Disappear After Back, Cancel, or Create

- Leaving create/edit (`Back`, `Cancel`, or successful `Create`) returns to base `/network/groups`.
- Existing list query params are cleared on that return.
- Recovery:
  1. Re-apply filters after returning to list mode.
  2. Keep/share filtered URLs separately when needed.

## Related Pages

- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Network Group Scope Flow](../network/flow-network-group-scope.md)
