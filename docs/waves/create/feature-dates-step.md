# Wave Creation Dates and Timeline

## Overview

The `Dates` step in wave creation schedules when submissions open, when voting
starts, when winners are announced, and (for recurring schedules) when the
wave ends.

## Location in the Site

- Full-page wave creation flow: `/waves/create`
- Step label: `Dates`
- Available for non-chat wave types (`Rank` and `Approve`)

## Entry Points

- Start creating a `Rank` or `Approve` wave and continue from `Groups` to
  `Dates`.
- Select `Dates` from the create-wave step rail to revisit timing.
- Return to `Dates` from later steps to adjust scheduling before finishing.

## User Journey

1. Open the `Dates` step.
2. Use the collapsible sections:
   - `Wave Timeline`
   - `Winners Announcements`
   - `Wave End Date` (shown only when recurring announcements are enabled)
3. Set `Drops Submission Opens`.
4. Set voting start timing:
   - `Rank`: choose `Drops Voting Begins` (not earlier than submission start).
   - `Approve`: voting timing follows submission start timing.
5. Set `First Winners Announcement` date and time.
6. Add or remove additional winner-announcement intervals.
7. Optionally enable `Repeating Announcement Cycles` once at least one
   additional interval exists.
8. If recurring is enabled, set `Wave End Date` and review projected final
   announcement timing.

## Common Scenarios

- Single-announcement wave:
  - Set first winners announcement and leave additional intervals empty.
- Fixed multi-announcement schedule:
  - Add one or more additional intervals; the wave end aligns to the last
    scheduled announcement.
- Recurring schedule:
  - Add intervals, enable recurring cycles, and set an explicit end date.
- Keyboard-driven scheduling:
  - Toggle section headers by keyboard and continue editing calendars/time
    pickers without using pointer-only controls.

## Edge Cases

- For `Rank` waves, voting start is constrained to submission start or later.
- For `Approve` waves, submission and voting start are treated as one timing.
- Recurring mode cannot be enabled until at least one additional interval is
  configured.
- `Wave End Date` controls appear only when recurring mode is active and
  additional intervals exist.
- On the first interaction with winner-announcement controls, the timeline
  section can auto-collapse to keep focus on announcement setup.
- Section headers expose expanded/collapsed state and linked content regions
  for assistive technologies.

## Failure and Recovery

- If recurring mode is toggled without additional intervals, users are prompted
  to add an interval first.
- If timeline ordering becomes invalid, adjust submission/voting/announcement
  times until chronological order is restored.
- If recurring end timing is too early, move the end date forward so expected
  announcements fit within the schedule.

## Limitations / Notes

- Chat waves skip this `Dates` step entirely.
- Additional winner announcements are configured as intervals, not as arbitrary
  standalone timestamps.
- Expanded/collapsed section state is session UI state and resets on page
  reload.

## Related Pages

- [Waves Index](../README.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
