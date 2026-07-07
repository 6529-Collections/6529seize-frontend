# Wave Creation Voting Configuration

## Overview

Use `Voting` in `Rank` and `Approve` wave creation to define how votes are
counted.
Pick the vote mode, optional `Rep` scope, optional time-weighted averaging, and
approve-wave threshold behavior.

## Location in the Site

- Full-page create route: `/waves/create`
- Desktop create-wave modal mode (`?create=wave`) on:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- Step label: `Voting`
- User-reachable in `Rank` and `Approve` creation

## Step Path

- `Rank`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`
- `Approve`: `Overview -> Groups -> Dates -> Drops -> Rules -> Voting -> Outcomes -> Description`

## Navigation Behavior

- Enter `Voting` from `Rules`.
- `Back` from `Outcomes` returns to `Voting`.
- `Next` stays enabled; validation runs when clicked.
- On large screens, the step rail can reopen completed steps only.
- On smaller screens, use `Back` and `Next`.

## What You Can Set

1. Choose one vote mode:
   - `TDH + XTDH` (default)
   - `TDH`
   - `Rep`
   - `Card Set TDH`
     - Helper copy: `Only TDH from selected Meme cards counts.`
2. If `Rep` is selected, set at least one scope field:
   - `Rep Category`, or
   - `Profile` (identity search)
3. Set `Allow Negative Votes`.
4. Optional: enable `Time-Weighted Voting`.
5. If enabled, set `Averaging Interval` in `Minutes` or `Hours`.
6. For `Approve` waves, set `Approval threshold`.
7. For `Approve` waves, choose `No hold` or `Require hold time`.
8. If hold time is required, set `Minimum time above threshold` in `Minutes` or
   `Hours`.
9. Click `Next` to continue to `Outcomes`.

## Validation and State Rules

- `Rep` blocks forward navigation when both `Rep Category` and `Profile` are
  empty.
- Switching from `Rep` to `TDH + XTDH`, `TDH`, or `Card Set TDH` clears saved `Rep`
  fields.
- `XTDH` is not offered as a standalone selectable mode.
- Time-weighted interval must stay between `5 minutes` and `24 hours`.
- If interval is empty, invalid, or below minimum on blur, it resets to the
  selected-unit minimum (`5` minutes or `1` hour).
- If interval is above maximum, it is capped (`1440` minutes or `24` hours).
- Switching between `Minutes` and `Hours` converts and clamps the interval.
- `Approve` wave approval threshold must be a whole number greater than `0`.
- `No hold` approves a drop as soon as the score reaches the threshold.
- `Require hold time` requires the score to stay at or above the threshold for
  the configured time.
- Hold time must be a whole positive minute value and cannot be longer than a
  finite approve-wave duration.
- Time-weighted voting and hold time can be enabled together. In that case, the
  hold checks the time-weighted score.
- `Allow Negative Votes` defaults on, so existing behavior still allows
  negative votes.
- Wave create payload sends the inverse backend flag:
  `forbid_negative_votes: false` when allowed, and `true` when blocked.

## Failure and Recovery

- If `Rep` validation blocks progress, fill either `Rep Category` or
  `Profile`, then click `Next` again.
- If time-weighted interval validation appears, set a value in range and retry.
- If hold-time validation appears, set a whole positive minute/hour value,
  choose `No hold`, or extend the approve-wave end date.
- If submit fails later in `Description`, keep voting settings and retry submit.

## Limitations / Notes

- Creator-facing voting options are only `TDH + XTDH`, `TDH`, `Rep`, and
  `Card Set TDH`.
- `Allow Negative Votes` is interactive for `Rank` and `Approve` waves.
- Time-weighted voting is available for `Rank` and `Approve` waves.
- Approval threshold and hold time are available for `Approve` waves.
- `Approve` is available in the create-wave type picker.

## Related Pages

- [Wave Creation Index](README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Creation Outcomes Step](feature-outcomes-step.md)
- [Wave Drop Vote Slider](../drop-actions/feature-vote-slider.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Docs Home](../../README.md)
