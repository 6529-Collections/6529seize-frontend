# Wave Creation Outcomes Setup

## Overview

The `Outcomes` step defines how winners are rewarded in rank-wave creation.
Creators add one or more outcome definitions and must save at least one outcome
before moving to the final `Description` step.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Outcomes`
- Available in `Rank` wave creation

## Entry Points

- Create a rank wave and continue from `Voting` to `Outcomes`.
- Return to `Outcomes` from later steps to revise reward setup.

## User Journey

1. Open `Outcomes`.
2. Pick outcome type: `Manual`, `Rep`, or `NIC`.
3. Configure the selected type and click `Save`.
4. Review saved outcomes in the list.
5. Add additional outcomes or remove existing outcomes from the list.
6. Continue to `Description` once at least one outcome exists.

## Common Scenarios

- Add a `Manual` outcome for explicit winning positions (`1-3`, `5`, `7-9`).
- Add a `Rep` outcome by selecting category and winner distribution values.
- Add a `NIC` outcome with winner distribution values.
- Combine multiple outcomes (for example one `Manual` plus one `Rep`) in the
  same wave.

## Edge Cases

- If no outcomes are saved, step validation shows `No outcomes added` as an
  error and blocks forward navigation.
- Invalid manual positions format blocks save until corrected.
- `Rep` outcomes require a selected category.
- Distribution totals must be valid before save:
  - absolute-value winners must sum correctly,
  - percentage-based winners must total `100%`.

## Failure and Recovery

- If a save attempt fails validation, fix the highlighted fields and retry.
- If you add the wrong outcome type, remove that outcome row and create the
  correct one.
- If create flow closes before completion, reopening flow requires re-entering
  outcomes that were not submitted.

## Limitations / Notes

- This step is user-reachable in `Rank` creation.
- Chat waves do not include outcomes setup.
- Approve-specific outcomes code paths exist internally, but `Approve` type is
  currently disabled in `Overview`.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Creation Description Step](feature-description-step.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
- [Docs Home](../../README.md)
