# Wave Creation Voting Configuration

## Overview

Use `Voting` in `Rank` wave creation to define how votes are counted.
Pick the vote mode, optional `Rep` scope, and optional time-weighted averaging.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/discover`
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages?wave={waveId}`
- Step label: `Voting`
- User-reachable only in `Rank` creation (`Approve` is shown in `Overview` but
  disabled)

## Step Path

- `Rank`: `Overview -> Groups -> Dates -> Drops -> Voting -> Outcomes -> Description`

## Navigation Behavior

- Enter `Voting` from `Drops`.
- `Back` from `Outcomes` returns to `Voting`.
- `Next` stays enabled; validation runs when clicked.
- On large screens, the step rail can reopen completed steps only.
- On smaller screens, use `Back` and `Next`.

## What You Can Set

1. Choose one vote mode:
   - `By TDH + XTDH` (default)
   - `By TDH`
   - `By Rep`
2. If `By Rep` is selected, set at least one scope field:
   - `Rep Category`, or
   - `Profile` (identity search)
3. Review `Allow Negative Votes` (shown but disabled).
4. Optional: enable `Time-Weighted Voting`.
5. If enabled, set `Averaging Interval` in `Minutes` or `Hours`.
6. Click `Next` to continue to `Outcomes`.

## Validation and State Rules

- `By Rep` blocks forward navigation when both `Rep Category` and `Profile` are
  empty.
- Switching from `By Rep` to `By TDH + XTDH` or `By TDH` clears saved `Rep`
  fields.
- `XTDH` is not offered as a standalone selectable mode.
- Time-weighted interval must stay between `5 minutes` and `24 hours`.
- If interval is empty, invalid, or below minimum on blur, it resets to the
  selected-unit minimum (`5` minutes or `1` hour).
- If interval is above maximum, it is capped (`1440` minutes or `24` hours).
- Switching between `Minutes` and `Hours` converts and clamps the interval.
- Wave create payload always sends `forbid_negative_votes: false` (negative
  votes allowed).

## Failure and Recovery

- If `By Rep` validation blocks progress, fill either `Rep Category` or
  `Profile`, then click `Next` again.
- If time-weighted interval validation appears, set a value in range and retry.
- If submit fails later in `Description`, keep voting settings and retry submit.

## Limitations / Notes

- Creator-facing voting options are only `By TDH + XTDH`, `By TDH`, and
  `By Rep`.
- `Allow Negative Votes` is currently non-interactive in create-wave.
- Time-weighted voting is available only for `Rank` waves.
- `Approve` paths exist in code, but users cannot reach them from the current
  type picker.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Outcomes Step](feature-outcomes-step.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
