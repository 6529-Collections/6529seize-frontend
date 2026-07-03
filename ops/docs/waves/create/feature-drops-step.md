# Wave Creation Drop Settings

## Overview

Use `Drops` in `Rank` and `Approve` wave creation to define submission
requirements:

- one required media type
- optional required metadata keys
- optional simultaneous-submission limit

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- Step label: `Drops`
- User-reachable in `Rank` and `Approve` creation

## Entry Points

- Follow the `Rank` or `Approve` path:
  `Overview -> Groups -> Dates -> Drops`.
- Use `Back` from `Rules` to return in one step.
- On large screens, use the step rail after you move past `Drops`.

## User Journey

1. Choose one required submission type:
   - `None` (default)
   - `Image`
   - `Audio`
   - `Video`
2. Optionally add required metadata rows:
   - set row type (`Text` or `Number`)
   - set metadata name
   - remove rows you do not need
3. Optionally set `Maximum number of simultaneous submissions per participant`.
4. Click `Next` to continue to `Rules`.

## Common Scenarios

- Keep `None` when no media restriction is required.
- Require one media type for all participant submissions.
- Leave metadata empty when no extra fields are needed (`No required metadata
  added`).
- Add metadata rules for fields every participant must provide.
- Leave submission-limit blank for unlimited simultaneous submissions.
- Add creator rules and acceptance requirements in the next `Rules` step.

## Edge Cases

- Required-type controls render as checkboxes, but behave as single-select.
- Duplicate metadata names block `Next`.
- Duplicate rows show `Metadata name must be unique` on each duplicate row.
- Blank metadata-name rows can stay in the form and are excluded from the final
  create request.
- Multiple blank-name rows count as duplicates and block `Next`.
- Submission-limit input keeps only positive integers:
  - `0`, negative, or invalid input clears the value.
  - decimal input is reduced to its integer part (example: `2.5` becomes `2`).

## Failure and Recovery

- If `Next` does not advance, resolve duplicate metadata names, then retry.
- If submission-limit input keeps clearing, enter a positive whole number or
  leave it blank.

## Limitations / Notes

- `Chat` waves skip `Drops`.
- Required metadata is optional.
- Custom creator rules are configured in `Rules`, not `Drops`.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
