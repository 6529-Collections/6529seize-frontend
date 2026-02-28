# Wave Creation Drop Settings

## Overview

The `Drops` step controls what participants can submit in `Rank` waves.
Creators can set required submission type, required metadata keys, optional
submission cap, and optional participation terms.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- `Drops` step in `Rank` wave creation

## Entry Points

- Start creating a `Rank` wave and move to `Drops`.
- Navigate back to `Drops` from later steps to revise requirements.
- Open create-wave from wave navigation surfaces and complete the same step
  sequence.

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
- Set one media requirement (`Image`, `Audio`, or `Video`) for all
  participant submissions.
- Add required metadata keys for structured participant input.
- Leave simultaneous-submissions blank for unlimited submissions per
  participant.

## Edge Cases

- Simultaneous-submissions keeps positive integer values only.
- Invalid, zero, or negative submission-cap input is treated as blank.
- Duplicate metadata names are marked invalid so creators can resolve conflicts.
- Disabling participation terms clears previously entered terms text.

## Failure and Recovery

- If metadata names are duplicated, rename duplicates until uniqueness errors
  clear.
- If submission cap is invalid, re-enter a positive value or clear the field
  for unlimited behavior.
- If requirements are too strict, switch required type to `None` or remove
  metadata rows before continuing.

## Limitations / Notes

- Required type selection is single-choice (`None` or one media type).
- Submission cap is optional.
- Participation terms apply to non-chat waves and require participant wallet
  signature when enabled.
- Chat waves do not include this step.
- The `Approve` type is currently shown as disabled in `Overview`, so users do
  not reach an approve-specific `Drops` path.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
