# Wave Creation Dates and Timeline

## Overview

The `Dates` step sets timing for `Rank` and `Approve` waves.
`Rank` waves set submission, voting, and winner announcement timing.
`Approve` waves set when the wave opens and an optional end date.

The default view is a compact `Schedule` summary built from the current draft
values. Expand `Advanced settings` only when the default timing needs to change.

If recurring announcements are enabled, this step can also set an optional
`Wave End Date`.

## Location in the Site

- Full-page create route: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Dates`
- User-reachable in `Rank` and `Approve` wave creation

## Entry Points

- Start a `Rank` or `Approve` create flow and continue
  `Overview -> Groups -> Dates`.
- Use `Back` from `Drops`, `Rules`, `Voting`, `Outcomes`, or `Description`.
- On large screens, use the step rail to return to `Dates` after you have
  moved past it.

## User Journey

For either wave type, first review the schedule summary. If it is correct,
continue without opening the detailed calendars. If it needs adjustment, expand
`Advanced settings`; collapsing it later preserves every entered date, interval,
and recurring-cycle choice.

For `Rank` waves:

1. Set `Drops Submission Opens`.
2. Set `Drops Voting Begins` (must be at or after submission start).
3. Set `First Winners Announcement` date and time (must be at or after voting
   start).
4. Add optional `Additional Announcements` as intervals (`Hours`, `Days`, or
   `Weeks`).
5. Optional: enable `Repeating Announcement Cycles` after at least one
   additional interval exists.
6. If recurring is enabled, optionally set `Wave End Date`.
7. Continue to `Drops`.

For `Approve` waves:

1. Set `Wave Starts`.
2. Optionally set `Wave End`.
3. Continue to `Drops`.

## Common Scenarios

- One-time winners: set only `First Winners Announcement`.
- Fixed schedule: add intervals and leave recurring off.
  - End date follows the last scheduled announcement.
- Recurring schedule: add intervals, enable recurring, then leave no end date or
  set an optional end date and time.
- Mid-flow adjustment: return from later steps and revise dates before final
  submit.

## Edge Cases

- `Drops Submission Opens` cannot be set in the past; past picks are pushed to
  current time.
- On first interaction with `Winners Announcements`, `Wave Timeline` can
  auto-collapse once.
- If voting start moves forward, first winners announcement can auto-shift so
  it stays at or after voting start.
- `Wave End Date` appears only when recurring is on and at least one additional
  interval exists.
- When recurring is turned on, the end date starts blank. Users can add or clear
  it later.
- End-date calendar selection blocks days before one full configured cycle is
  complete.

## Failure and Recovery

- A hidden date validation error automatically opens `Advanced settings` and
  marks it `Needs attention`.
- If `Next` does not advance, verify:
  - submission start <= voting start
  - first announcement is not before voting start
  - explicit recurring end date, if set, is valid
- If recurring controls are missing, add at least one additional announcement
  interval first.
- If first announcement shifts after a voting-date change, set it again in
  `Winners Announcements`.
- If end-date selection feels too early in recurring mode, move it later or use
  longer intervals.

## Limitations / Notes

- `Chat` waves skip `Dates`.
- Additional announcements are interval-based; there is no standalone timestamp
  list.
- Saved create-wave drafts preserve date values for later recovery on the same
  device.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Creation Rules Step](feature-rules-step.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
