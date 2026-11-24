# Waves Move to the 6529 Network

## Overview

Votes, entries, polls, wave REP, and wave and decision settings move
from 6529.io's database to the 6529 Network. 6529.io stops taking changes to
them at the freeze, and the 6529 Network takes them at the switch-on. Chat
keeps working throughout: posts, replies, edits, deletions of chat posts,
reactions and direct messages are not affected.

Two build settings name the instants in UTC:
`NEXT_PUBLIC_WAVES_FREEZE_AT` (for example `2026-11-25T00:00:00Z`) and
`NEXT_PUBLIC_WAVES_SWITCH_ON_AT` (for example `2026-11-26T00:00:00Z`). Unless
both are set and the switch-on comes after the freeze, nothing below applies:
the site shows no notice and pauses nothing.

### Waves That Stay

6529.io's API marks each wave, a drop's wave and each decision with
`stays_on_site`. Inside a wave marked `true`, the notice doesn't show and
nothing on this page pauses; its votes, entries, polls, wave REP and settings
keep going to 6529.io's API, which keeps taking them. A wave whose object
doesn't carry the field is treated the same way, so nothing pauses or
announces a move the wave may not make. The waves list and the create-wave
flow, which have no single wave, keep the notice, and creating a wave stays
paused from the freeze.

The browser's request guard follows the same rule: it refuses a write only
for a wave a page has read as moving, and a new wave.

## Location in the Site

- The notice: a wave's view (`/waves/{waveId}`, not direct messages, its
  decision pages included), the waves list on the web with no wave selected,
  and the create-wave flow. The viewer can hide it; it shows again when it says
  something new (the next phase, or new wording).
- Paused controls: vote buttons and forms, quick vote, My Votes, submission
  buttons and forms, the composer's drop mode and poll button, poll ballots,
  the Wave REP dialog, wave name, picture, access groups, chat settings and
  custom rules, wave deletion, new waves and subwaves, and decision creation,
  editing, access and actions.

## The Notice

With the freeze at Wednesday 25 November 00:00 UTC and the switch-on at
Thursday 26 November 00:00 UTC, the notice says:

| When                             | What it says                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before the freeze                | Votes, entries and wave settings move to the 6529 Network. From Wednesday 00:00 UTC you can't change them until Thursday 00:00 UTC. Chat keeps working. |
| From the freeze to the switch-on | Votes, entries and wave settings are moving to the 6529 Network. You can't change them until Thursday 00:00 UTC. Chat keeps working.                    |
| After the switch-on              | Votes, entries and wave settings moved to the 6529 Network on Thursday 26 November. You can't change them on this site yet. Chat keeps working.         |

Times are shown in UTC. The notice changes at the freeze and at the switch-on
while the page stays open. Hiding it is remembered in the browser until the
notice changes.

## What Is Paused From the Freeze

Paused controls are hidden, or disabled with the paused line:
`Paused for the move to the 6529 Network.`

- Votes: the `Vote` button is disabled with the paused line. Vote forms, My
  Votes and quick vote do not take changes. Current votes and leaderboards
  stay visible.
- Entries: submission buttons show `Submissions Paused` or the paused line.
  The composer opens for chat, and for someone who can only submit it says
  submissions are paused; it does not switch to drop mode. A drop already
  drafted is refused when sent, not posted as chat, and an entry the sender
  already showed in the feed is taken back. Submission forms do not send;
  entries can't be withdrawn.
- Polls: ballots show results only, with the paused line; new polls can't be
  added to a post, and a post with a poll already drafted is refused when
  sent.
- Wave REP: the dialog shows the current allocation; Save and Remove are off.
- Waves: name, picture, access groups, chat settings and custom rules have no
  edit control; deletion and new subwaves are hidden; the create-wave flow
  does not go past its first step.
- Decisions: no new decision (the new-decision page shows the paused line);
  drafts, settings, access, pause, resume, publish, archive and clone are not
  offered.
- Any of these requests sent anyway is stopped in the browser with the paused
  line. The 6529.io API's own freeze decides what it accepts.
- The API's freeze (6529seize-backend #2553) also refuses replacing a group
  that a wave, a decision or a curation uses, and edits to entry posts. The
  site leaves those controls on, so the API's message shows.

Ratings of chat posts, curations, pins, the pinned drop, boosts, bookmarks,
mutes, notification settings, meme collaborations, direct-message deletion,
and groups no wave, decision or curation uses (direct-message preferences,
network filters) are not affected.

## Changing the Dates

The instants are baked into each build. Postponing means changing both
settings in the build workflows, then building and deploying again before the
old freeze passes; removing them calls the move off. The 6529.io API reads its
own freeze setting, and the two must name the same instants.

## Rolling Out

The code ships first, with neither setting in the build workflows, so nothing
changes. The two settings go into the production and staging workflows in a
separate change. That change deploys together with the 6529.io API's own
freeze setting (6529seize-backend #2553), so the site and the API pause the
same writes at the same instant.

## Localization

The notice and the paused line are in en-US only. Other locales fall back to
en-US until `wavesMove.*` is added to their dictionaries.

## Troubleshooting

- The notice is missing: the build does not set both instants, they are not UTC
  instants ending in `Z`, or the switch-on is not after the freeze.
- The notice shows the wrong state: the device clock decides the phase; check
  that it is correct.

## Related Pages

- [Waves Index](README.md)
- [Wave Participation Flow](flow-wave-participation.md)
