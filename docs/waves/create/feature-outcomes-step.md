# Wave Creation Outcomes Step

## Overview

Use `Outcomes` to define winner rewards in `Rank` wave creation.
You must save at least one outcome before `Next` can move to `Description`.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create mode: `?create=wave` on waves/messages shells
- Step label: `Outcomes`
- User-reachable only in `Rank` creation (`Approve` is disabled in `Overview`)

## Step Path

- `Rank`: `Overview -> Groups -> Dates -> Drops -> Voting -> Outcomes -> Description`

## Outcome Types

### `Manual`

- Required: `Manual action`
- Required: `Winning Positions` (examples: `1-3,5,7-9`)
- `Save` adds one manual row to the outcomes list

### `Rep`

- Required: `Rep Category`
- Starts with one winner row
- `Add winner` appends rows
- `Save` adds one rep row (category, total, winner count)

### `NIC`

- Starts with one winner row
- `Add winner` appends rows
- `Save` adds one NIC row (total, winner count)

## User Journey

1. Open `Outcomes` from `Voting`.
2. Click one type: `Manual`, `Rep`, or `NIC`.
3. Fill the selected form.
4. Click `Save` to add a row, or `Cancel` to discard draft edits.
5. Repeat to add more outcomes.
6. Click `Next` to continue to `Description`.

## Common Scenarios

- Mix outcome types in one wave (for example manual + rep).
- Add multiple winner rows for `Rep` or `NIC`.
- Return from `Description` to `Outcomes` and adjust rewards before submit.

## Edge Cases

- If no rows are saved, `Next` is blocked and `No outcomes added` is highlighted.
- While a type form is open, step-level `Previous` and `Next` actions are hidden.
- Manual validation can show:
  - `Please enter your manual action`
  - `Please enter positions`
  - `Invalid position format`
- Rep/NIC saves require totals greater than `0`.
- Changing selected type while editing drops unsaved form values.
- Saved `Manual` and `Rep` rows can be removed.
- Saved `NIC` rows show a remove icon, but it currently does not remove the row.

## Failure and Recovery

- If save validation appears, fix highlighted fields and click `Save` again.
- If a saved `Manual` or `Rep` row is wrong, remove it and create a new row.
- If a saved `NIC` row is wrong, restart create-wave to clear it.
- If create mode closes before submit, reopen create-wave and re-enter outcomes.

## Limitations / Notes

- Percentage distribution mode is not exposed in the current outcomes UI.
- `Approve` outcomes paths exist in code but are not user-reachable from the type picker.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
