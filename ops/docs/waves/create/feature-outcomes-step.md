# Wave Creation Outcomes Step

## Overview

Use `Outcomes` to define winner rewards in `Rank` and `Approve` wave creation.
You must save at least one outcome before `Next` can move to `Description`.

Outcome type, reward configuration, and outcome visibility stay visible.
The optional Approve winner limit is in the named `Winner limits` expandable.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create mode: `?create=wave` on waves/messages shells
- Step label: `Outcomes`
- User-reachable in `Rank` and `Approve` creation

## Step Path

- Scheduled `Rank`: `Overview -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description`
- `Approve`: `Overview -> Groups -> Schedule -> Drops -> Rules -> Voting -> Outcomes -> Description`

`Perpetual Ranking` skips this step because its live leaderboard is the outcome
and it never announces winners.

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
6. Choose whether to `Show outcomes` after creation.
7. For `Approve`, open `Winner limits` and optionally set `Max Winners`; blank
   means unlimited.
8. Click `Next` to continue to `Description`.

## Common Scenarios

- Mix outcome types in one wave (for example manual + rep).
- Add multiple winner rows for `Rep` or `NIC`.
- Return from `Description` to `Outcomes` and adjust rewards before submit.
- Open-ended approval: when both wave end and max winners are blank, the visible
  warning explains that the wave will run indefinitely.

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
- `Show outcomes` defaults on. `Max Winners` defaults blank.
- A non-default `Max Winners` value shows `Customized` on the collapsed
  `Winner limits` disclosure.

## Failure and Recovery

- If save validation appears, fix highlighted fields and click `Save` again.
- If a saved `Manual` or `Rep` row is wrong, remove it and create a new row.
- If a saved `NIC` row is wrong, restart create-wave to clear it.
- If create mode closes before submit, reopen create-wave and re-enter outcomes.

## Limitations / Notes

- Percentage distribution mode is not exposed in the current outcomes UI.
- `Approve` outcomes use approve-specific forms and payload mapping.
- `Perpetual Ranking` has no Outcomes step or optional-settings disclosure.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
