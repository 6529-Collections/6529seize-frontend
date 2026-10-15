# Memes Voting Checkpoints

## Overview

This page covers how the Memes voting checkpoint schedule is shown to users:
the wave FAQ and the About Apply page both state the checkpoint time in UTC and
add the viewer's own time zone.

## Location in the Site

- The Memes wave `FAQ` tab, in the `How Does Voting Work?` section
- `/about/apply`, in the `Checkpoint Schedule` list

## Entry Points

- Open the Memes wave at `/waves/{waveId}`, choose `FAQ`, then open
  `How Does Voting Work?`.
- Open `/about/apply` directly or from the About menu.

## User Journey

1. Open either surface.
2. Read the checkpoint schedule. The top submission on the leaderboard is
   selected three times a week, on Monday, Wednesday and Friday at 16:00 UTC.
3. After the page loads, a note in parentheses gives the same checkpoints in
   your own time zone, for example `(your time: Mon, Wed, Fri 09:00 PDT)` in Los
   Angeles in summer.

## Common Scenarios

- The checkpoint is 16:00 UTC all year. It is not tied to London time, so it
  does not move with daylight saving in the UK.
- Your own time zone can move the checkpoint to another hour or another weekday.
  In Auckland the same checkpoints read `Tue, Thu, Sat` in the morning. The
  note names the weekday so you can tell.
- The note follows daylight saving in your zone. It is worked out for the next
  checkpoint of each weekday, so around a clock change it can list a different
  time for each day.
- The wave FAQ takes the time of day from the wave's own decision schedule. If
  that is not available yet, it shows 16:00 UTC.
- In the `Checkpoint Schedule` list on `/about/apply`, the weekday on the left
  is the UTC weekday. The note on each row gives the matching local weekday and
  time.

## Edge Cases

- If your device time zone is UTC, no local note is added because it would
  repeat the UTC time.

## Failure and Recovery

- If the local note looks wrong, check the date, time and time zone on your
  device. The UTC time is always the one that counts.

## Limitations / Notes

- Weekday names in the note follow your browser language. The surrounding FAQ
  and Apply text is currently English only.

## Related Pages

- [Memes Index](README.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Memes Minting Guide](../../media/memes/feature-minting-guide.md)
