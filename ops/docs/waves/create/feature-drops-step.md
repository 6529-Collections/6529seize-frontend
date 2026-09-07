# Wave Creation Drop Settings

## Overview

Use `Drops` in `Rank` and `Approve` wave creation to define submission
requirements:

- one required media type
- optional required metadata keys
- optional simultaneous-submission limit
- rules participants must accept and sign before submitting

The submission type stays visible. Optional media requirements, metadata,
simultaneous-submission limits, and signing rules are in `Submission requirements`.
The section is always visible and has no expand/collapse control.

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
  `Setup -> Access -> Schedule -> Drops`.
- Use `Back` from `Voting` to return in one step.
- On large screens, use the step rail after you move past `Drops`.

## User Journey

1. Review the always-visible `Submission requirements` section.
2. Choose one required media type:
   - `None` (default)
   - `Image`
   - `Audio`
   - `Video`
3. Optionally add required metadata rows:
   - set row type (`Text` or `Number`)
   - set metadata name
   - remove rows you do not need
4. Optionally set `Maximum number of simultaneous submissions per participant`.
5. Optionally enter `Rules that require acceptance`. Leave the textbox empty if
   no rules require signing. There is no separate acceptance toggle.
6. Click `Next` to continue to `Voting`.

## Common Scenarios

- Keep `None` when no media restriction is required.
- Require one media type for all participant submissions.
- Leave metadata empty when no extra fields are needed (`No required metadata
  added`).
- Add metadata rules for fields every participant must provide.
- Leave submission-limit blank for unlimited simultaneous submissions.
- Add signing rules in `Submission requirements` when participants must accept
  and sign custom rules before submitting.
- Add chat guidelines in `Guidelines`, directly before `Description`.

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
- Entering signing rules requires a wallet signature before submission. Clearing
  them, including whitespace-only text, removes the requirement.
- Visiting another step preserves the entered requirements and signing rules.

## Failure and Recovery

- If `Next` does not advance, resolve duplicate metadata names, then retry.
- Requirement fields and their validation messages remain visible.
- If submission-limit input keeps clearing, enter a positive whole number or
  leave it blank.

## Limitations / Notes

- `Chat` waves skip `Drops`.
- Required metadata is optional.
- Chat guidelines are configured in `Guidelines`.

Signing rules use the existing participation terms and wallet-signature flow.
They appear in the final Overview and the wave rules panel. Wave admins can
edit them later from Configuration.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Setup Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Schedule](feature-dates-step.md)
- [Wave Creation Guidelines Step](feature-rules-step.md)
- [Wave Creation Voting Configuration](feature-voting-step.md)
- [Wave Drop Composer Metadata Submissions](../composer/feature-metadata-submissions.md)
- [Docs Home](../../README.md)
