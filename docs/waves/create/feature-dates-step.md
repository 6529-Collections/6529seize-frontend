# Wave Creation Dates and Timeline

## Overview

The `Dates` step sets when a `Rank` wave accepts submissions, when voting
starts, and when winners are announced.

If recurring announcements are enabled, this step also sets `Wave End Date`.

## Location in the Site

- Full-page create route: `/waves/create`
- Create-wave modal flows that reuse the same step sequence
- Step label: `Dates`
- User-reachable in `Rank` wave creation (`Approve` is shown in `Overview` but
  disabled)

## Entry Points

- Start a `Rank` create flow and continue `Overview -> Groups -> Dates`.
- Use `Back` from `Drops`, `Voting`, `Outcomes`, or `Description`.
- On large screens, use the step rail to return to `Dates` after you have
  moved past it.

## User Journey

1. Set `Drops Submission Opens`.
2. Set `Drops Voting Begins` (must be at or after submission start).
3. Set `First Winners Announcement` date and time (must be at or after voting
   start).
4. Add optional `Additional Announcements` as intervals (`Hours`, `Days`, or
   `Weeks`).
5. Optional: enable `Repeating Announcement Cycles` after at least one
   additional interval exists.
6. If recurring is enabled, set `Wave End Date`.
7. Continue to `Drops`.

## Common Scenarios

- One-time winners: set only `First Winners Announcement`.
- Fixed schedule: add intervals and leave recurring off.
  - End date follows the last scheduled announcement.
- Recurring schedule: add intervals, enable recurring, then set an end date and
  time.
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
- When recurring is turned on, end date is prefilled to a future default
  covering about two full announcement cycles unless a later valid end date
  already exists.
- End-date calendar selection blocks days before one full configured cycle is
  complete.

## Failure and Recovery

- If `Next` does not advance, verify:
  - submission start <= voting start
  - first announcement is not before voting start
  - end date is set and valid
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
- Create-step state is local to the active create session; closing the create
  modal/page resets draft values.

## Related Pages

- [Wave Creation Index](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave Creation Overview Step](feature-overview-step.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
