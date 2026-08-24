# Wave Creation Schedule

## Overview

The `Schedule` step sets timing for `Rank` and `Approve` waves.
`Rank` waves set submission, voting, and winner announcement timing.
`Approve` waves set when the wave opens and an optional end date.

The default view keeps the schedule decisions needed for the selected wave type
visible. Less common schedule expansion and optional end controls are grouped
in expandable sections named for those controls.

## Location in the Site

- Full-page create route: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Schedule`
- User-reachable in `Rank` and `Approve` wave creation

## Entry Points

- Start a `Rank` or `Approve` create flow and continue
  `Overview -> Groups -> Schedule`.
- Use `Back` from `Drops`, `Rules`, `Voting`, `Outcomes`, or `Description`.
- On large screens, use the step rail to return to `Schedule` after you have
  moved past it.

## User Journey

For scheduled `Rank` waves:

1. Set `Submissions Open`.
2. Set `Voting Opens` (must be at or after submission start).
3. Set `First Winners Announcement` date and time (must be at or after voting
   start).
4. To extend the schedule, open `Winner schedule` and add optional
   `Additional Announcements` as intervals (`Hours`, `Days`, or `Weeks`).
5. In that section, optionally enable `Repeating Announcement Cycles`
   after at least one additional interval exists.
6. If recurring is enabled, optionally set `Wave End Date` in the same
   disclosure.
7. Collapse the section if desired; all entered values remain in the
   draft.
8. Continue to `Drops`.

For `Perpetual Ranking` waves:

1. Set `Submissions Open`.
2. Set `Voting Opens`.
3. Continue to `Drops`. There are no winner announcements or end date. No
   optional-settings section is shown, including an empty one.

For `Approve` waves:

1. Set `Wave Start` in the visible calendar.
2. To limit the duration, open `Wave end` and optionally set
   `Wave End`.
3. Continue to `Drops`.

## Common Scenarios

- One-time winners: set only `First Winners Announcement`.
- Fixed schedule: add intervals and leave recurring off.
  - End date follows the last scheduled announcement.
- Recurring schedule: add intervals, enable recurring, then leave no end date or
  set an optional end date and time.
- Mid-flow adjustment: return from later steps and revise dates before final
  submit.
- Open-ended approval: leave `Wave End` blank. The Outcomes step explains when
  the wave will otherwise run indefinitely.

## Edge Cases

- `Submissions Open` cannot be set in the past; past picks are pushed to
  current time.
- If voting start moves forward, first winners announcement can auto-shift so
  it stays at or after voting start.
- `Wave End Date` appears only when recurring is on and at least one additional
  interval exists.
- When recurring is turned on, the end date starts blank. Users can add or clear
  it later.
- End-date calendar selection blocks days before one full configured cycle is
  complete.

## Failure and Recovery

- An error in an optional wave end automatically opens `Wave end`,
  marks it `Needs attention`, and exposes the invalid date control.
- Errors in visible schedule controls remain visible in their schedule card.
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

- `Chat` waves skip `Schedule`.
- `Perpetual Ranking` has no winner announcements, outcomes, or end date.
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
