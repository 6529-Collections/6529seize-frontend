# Wave Creation Outcomes Step

## Overview

Use `Outcomes` to define winner rewards in `Rank` and `Approve` wave creation.
You must add at least one outcome before `Next` can move to `Description`.
The same step is shared by full-page wave creation, the create-wave modal, and
create-subwave.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop modal create mode: `?create=wave` on waves/messages shells
- Step label: `Outcomes`
- User-reachable in `Rank` and `Approve` creation

## Entry Points

- `Rank`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`
- `Approve`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`
- From `Voting`, select `Next`.
- On large screens, a completed `Outcomes` step can also be reopened from the
  progress rail before the wave is submitted.

## Outcome Types

### `Manual`

- A custom reward or result that the creator fulfills, rather than a credit
  distribution performed by the site.
- In `What winners receive`, describe the reward or result. For example:
  `Signed print shipped by the creator`.
- When outcomes are shown, this text appears in the wave's `Outcome` tab and
  winner views.
- For a `Rank` wave, `Winning ranks` controls who receives the outcome. Enter
  single ranks or ranges separated by commas, such as `1-3, 5, 7-9`.
- For an `Approve` wave, approved winners receive the configured outcome.
- `Add outcome` adds the configured manual row without finishing wave
  creation.

### `Rep`

- Rep is distributed automatically by the site.
- Required: `Rep Category`
- Starts with one winner row
- `Add winner` appends rows
- `Add outcome` adds one rep row (category, total, winner count)

### `NIC`

- NIC is distributed automatically by the site.
- Starts with one winner row
- `Add winner` appends rows
- `Add outcome` adds one NIC row (total, winner count)

## User Journey

1. Open `Outcomes` from `Voting`.
2. Click one type: `Manual`, `Rep`, or `NIC`.
3. Fill the selected form.
4. Click `Add outcome` to add a row, or `Cancel` to discard draft edits.
5. Repeat to add more outcomes.
6. Choose whether `Show outcomes` should expose configured outcome details to
   participants in the `Outcome` tab and winner views.
7. Click `Next` to continue to `Description`.

## Common Scenarios

- Mix outcome types in one wave (for example manual + rep).
- Add multiple winner rows for `Rep` or `NIC`.
- Add the same manual reward to several `Rank` positions with one range entry.
- Turn `Show outcomes` off to configure awards while keeping their details
  hidden from participants after creation.
- Return from `Description` to `Outcomes` and adjust rewards before submit.

## Edge Cases

- If no rows are saved, `Next` is blocked and `No outcomes added` is highlighted.
- While a type form is open, step-level `Previous` and `Next` actions are hidden.
- Manual validation can show:
  - `Describe what winners receive.`
  - `Enter at least one winning rank.`
  - `Use ranks from 1 to 10,000 and ranges separated by commas, such as 1-3, 5, 7-9.`
- A saved manual `Rank` row summarizes the selected winning ranks.
- Rep/NIC saves require totals greater than `0`.
- Changing selected type while editing drops unsaved form values.
- Saved `Manual` and `Rep` rows can be removed.
- Saved `NIC` rows show a remove icon, but it currently does not remove the row.

## Failure and Recovery

- If validation appears, fix the described field and click `Add outcome` again.
- If a saved `Manual` or `Rep` row is wrong, remove it and create a new row.
- If a saved `NIC` row is wrong, restart create-wave to clear it.
- If create mode closes before submit, reopen create-wave and re-enter outcomes.

## Limitations / Notes

- Percentage distribution mode is not exposed in the current outcomes UI.
- `Approve` outcomes use approve-specific forms and payload mapping.
- Turning off `Show outcomes` changes participant-facing visibility, not the
  configured outcome payload.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
