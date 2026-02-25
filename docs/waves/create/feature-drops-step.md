# Wave Creation Drop Settings

## Overview

The `Drops` step in wave creation controls what participants can submit in rank
and approve waves. Creators can set required submission types, required
metadata fields, an optional participant submission cap, and optional
participation terms.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- `Drops` step for non-chat wave types (`Rank` and `Approve`)

## Entry Points

- Start creating a new wave and move to the `Drops` step.
- Navigate back to `Drops` from later creation steps to revise requirements.
- Open create-wave from wave navigation surfaces and complete the step flow.

## User Journey

1. Open the `Drops` step.
2. Choose one required submission type option:
   - `None`
   - `Image`
   - `Audio`
   - `Video`
3. Add required metadata rows and set each row's type/name.
4. Optionally set `Maximum number of simultaneous submissions per participant`.
5. Optionally enable participation terms and enter terms text.
6. Continue to the next creation step.

## Common Scenarios

- Leave required type as `None` to allow unrestricted media type submissions.
- Set one media requirement (`Image`, `Audio`, or `Video`) for all participant
  submissions.
- Add one or more required metadata keys so participants must provide structured
  values.
- Leave the simultaneous-submissions field blank for unlimited submissions per
  participant.

## Edge Cases

- The simultaneous-submissions field only keeps positive integer values.
  Invalid, zero, or negative input is treated as blank.
- Duplicate metadata names are marked as invalid so creators can resolve
  conflicts.
- Chat waves do not include this `Drops` step.
- Disabling participation terms clears any previously entered terms text.

## Failure and Recovery

- If metadata names are duplicated, rename duplicates until uniqueness errors
  clear.
- If a submission cap is entered incorrectly, re-enter a positive value or
  leave the field blank for unlimited behavior.
- If requirement choices become too strict, switch required type to `None` or
  remove metadata rows before continuing.

## Limitations / Notes

- Required type selection is single-choice (`None` or one media type at a
  time).
- The simultaneous-submissions cap is optional.
- Participation terms apply to non-chat waves and require participant wallet
  signature when enabled.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Wave Content Tabs](../discovery/feature-content-tabs.md)
- [Docs Home](../../README.md)
