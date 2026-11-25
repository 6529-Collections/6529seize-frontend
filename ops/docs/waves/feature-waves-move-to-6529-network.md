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

Members-only waves, waves behind a hidden or private group, their
decisions, and direct messages stay on 6529.io. 6529.io's API marks each
wave, a drop's wave and each decision with `stays_on_site`. Inside a wave
marked `true`, the notice doesn't show and
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

6529.io settles no result while waves are frozen. In a wave whose result falls
due then (the Main Stage's, for one), the notice adds, from the time it is due:
"The result due Wednesday 16:00 UTC is counted on the 6529 Network after
Thursday 00:00 UTC." Until the switch-on the wave's leaderboard keeps its
standings and its countdown moves on to the next result.

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

## After the Switch-On

In builds with `NEXT_PUBLIC_FEATURE_CHAIN_WAVES` set to `true` and a chain
gateway (`NEXT_PUBLIC_CHAIN_GATEWAY_URL`), votes, poll ballots, wave REP and
entries open again at the switch-on and go to the 6529 Network.

Votes, poll ballots and wave REP:

- Every vote control (the vote dialog, My Votes and its reset, quick vote,
  decision vote forms) sends `VOTE_SET`; a poll ballot sends
  `POLL_BALLOT_SET`; the Wave REP dialog sends `RATING_SET` with the wave as
  its target. Each needs no 6529.io sign-in.
- Each is signed by this browser's key when that key's grant lists the
  operation, and otherwise by the connected wallet, one prompt each. The key
  comes from the identity page:
  `Enable chain actions on this browser`. A key enabled before the switch-on
  can't sign votes; the identity page then offers
  `Add votes to this browser`, one wallet signature for a new 30-day key.
- The key signs a change on its own only when its fee is at most 20 times
  what the change costs at the 6529 Network's lowest fees. Above that, a
  toast says the fee and the wallet signs the change instead.
- The control waits until a block holds the change, then shows it. Totals on
  the page follow once 6529.io's index reads the block.
- A wallet with no identity on the 6529 Network, or an entry, wave or poll the
  network doesn't hold, gets a message saying so; nothing is sent. Once the
  identity page takes changes, the no-identity message links to it.

Entries, signed by the connected wallet (never by the browser key) and shown
once 6529.io's index lists them:

- A submission (the composer's drop mode, the Memes submission form, a
  decision's entry form) keeps its consent signature step, then stores the
  entry's manifest in the 6529 Network's document store and sends
  `SUBMISSION_CREATE`. A resubmission sends the new entry first, then
  withdraws the old one; while the new entry isn't final, the original
  stays.
- Before any prompt, the page reads the decision on the chain: an author
  outside its submit group, or at its limit of entries in the running, gets
  a message saying so and nothing is sent. A declined wallet prompt, or a
  refusal before anything was sent, leaves the entry in the composer.
- The entry form opens where 6529.io's API offers it (`permissions.submit`),
  for a decision made on the 6529 Network as for an imported one. When the
  two disagree, the chain's check above refuses before any prompt, and an
  entry 6529.io doesn't offer can't be made from this site until its API
  catches up.
- An author's delete of their own entry withdraws it (`SUBMISSION_WITHDRAW`),
  from the drop menu and the mobile menu alike.
- A wallet with no identity on the 6529 Network gets a message saying so, and
  nothing is sent. Once the identity page takes changes, the message links to
  it.

The notice then gives the switch-on day as the day the move happened, and
goes on: Your votes, poll ballots, wave REP and entries go there from this
site. Wave settings can't be changed here yet. Chat keeps working.

Wave and decision settings, deleting someone else's entry, new waves and
decisions, and new polls stay paused until their own changes reach this site.

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
