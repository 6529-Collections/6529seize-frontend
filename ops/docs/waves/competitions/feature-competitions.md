# Browse and Participate in Competitions

## Overview

A wave's competitions share its chat and visibility. Entries, votes, credits
and results belong to the competition you open. Two competitions in the same
wave can run at the same time with different participation and voting rules.

## Location in the Site

- Competition collection: `/waves/{waveId}/competitions`.
- One competition: `/waves/{waveId}/competitions/{competitionId}`.
- An entry can be opened directly with `?entry={entryId}`.

## Entry Points

Open **Competitions** from an eligible wave, follow a competition link, or open
a competition notification. The wave header and navigation stay visible. The
collection and create/edit forms open from **Competitions**.
The **Competitions** tab shows a count of active and upcoming competitions. The
badge is hidden when there are none; drafts and completed competitions do not count.
**Chat** returns to the wave's existing conversation. The collection has a second
row of tabs for **Active and upcoming**, **Completed**, and **All**;
wave administrators can also see **Drafts**. **Add competition** sits alongside
these tabs for users who can create competitions.
Cards show the start date and, when set, the end date. Dates in the past use
**Started** or **Ended**; future dates use **Starts** or **Ends**.

## Default Competition

Opening a wave without an explicit destination opens **Chat** and stays there
while competition data loads or refreshes. Selecting a competition tab uses the
default competition unless a link or earlier explicit selection supplies another
competition.
Chat and the competition views share one wave-level tab row, with the selected
content directly below it. There is no second competition tab row or surrounding
detail panel. This applies to single-competition waves and to the default in
waves with multiple competitions. Native competitions also expose Voters in
that same row. Both native and legacy defaults expose **Configuration** immediately
before the final **About** tab. Configuration opens the selected competition’s
existing rules and settings, with the same read and edit permissions. Chat remains
shared by the whole wave.

For a logged-in non-admin, **Competitions** is hidden when the default is the
wave’s sole visible competition. The check includes current, past and future
competitions: an active default plus a past or future competition keeps the tab
visible. Wave administrators retain the tab for management. While the count or
permissions are unresolved, the tab stays available; logged-out visibility is
unchanged. A direct collection link remains readable when the tab is hidden.

Explicitly opening a non-default competition from the collection or a direct
link shows its title, an **All competitions** return link, and its own navigation
inside the wave. Opening the default from the collection keeps the single-row
layout.

- One eligible competition is the default, including upcoming or completed history.
- With running competitions, the earliest competition start wins. Paused
  decisions still count as running.
- With none running, the next competition to start wins over completed history.
- With none running or upcoming, the most recently ended competition wins.
  Archived completed competitions remain eligible; archiving does not change
  their ending time.
- Drafts, archived unpublished drafts and cancelled competitions are excluded.
  With none eligible, the wave remains a chat hub.

The default can change as competitions start, finish or are published. Choosing
another competition or following a competition or entry link keeps that choice
across tabs, reload and Back/Forward. Opening a submission or vote form keeps
its original competition even if the default changes while the form is open.
Returning to Chat preserves the competition context for the familiar competition
tabs. The collection lets you choose a different competition at any time.

## User Journey

1. Choose a competition and read its rules, dates and eligibility.
2. Create a new competition submission. Chat messages and existing competition
   drops cannot be submitted as entries. Complete any required media, metadata, identity submission or
   terms fields. If signing is required, confirm the destination and action in
   your wallet.
3. Open an active entry to vote, including from shared chat. The vote dialog
   uses that entry's competition credit type and limits. Review its available, spent
   and remaining credit. Changing a vote replaces your current value; zero
   removes it. Negative votes are available only where the rules permit them.
4. Competitions open on **Leaderboard**. Use the wave tab row for the default,
   or the competition detail row for an explicitly opened non-default. The leaderboard
   uses the familiar list/grid controls, sorting, rich drop cards and **Drop**
   action. Rank competitions show the schedule; Approve competitions show
   approval thresholds, progress and approved counts. Winners use the existing
   podium or timeline for Rank and approved-drop cards for Approve. Outcomes
   use expandable reward cards; My votes shows editable vote rows and reset
   controls; Voters shows profiles and vote totals. **Configuration** groups the settings
   into Participation, Voting and Winners cards, below the competition description
   and guidelines. Administrators edit the name, description and guidelines directly in the overview card and use **Appearance and labels** beneath the cards for display settings. Select the wave's **Chat** tab to continue the wave's conversation,
   then return through the competition collection or link.

## Common Scenarios

- Competition drops in shared chat show their competition name beneath the author,
  linked to that competition. They also show their current total, your vote, rank,
  and voter count using the existing competition-card layout. The voter dropdown
  includes voters and vote history for that entry. Totals refresh after voting.
- Spending credit in one competition does not reduce the budget in another.
  A budget can be shared across that competition's entries or apply separately
  to each entry, depending on its rules.
- Adding a competition can change the default under the rules above. Each
  competition keeps its own leaderboard and results through its direct link.
- A winning entry records a result in its competition. Its drop remains a
  dedicated competition submission.
- Winner notifications link to the relevant competition or
  entry. Publishing, updating, pausing, and resuming a competition do not send
  notifications. Ordinary native entry submissions do not broadcast a new
  notification to every wave follower; mentions and replies retain their own
  behavior.

## Edge Cases

- Every competition drop belongs to exactly one competition for its lifetime.
- Competition submissions cannot be edited, including unsigned submissions.
  Chat messages remain separate.
- **Delete** removes an entry from competition views, results, votes and direct
  entry links, and releases its active voting spend. Authors can delete their
  drops; administrators can do so when the wave enables administrator deletion.
  There are no Withdraw or Disqualify actions or entry-removal notifications.
  Winners also stop consuming active voting credit.
- **Pause decisions**, beside **Pause history** in Configuration, pauses winner selection. The confirmation dialog requires a reason. Pause history shows each pause’s dates and reason, including after resuming. Participation and voting remain
  available when their dates and eligibility permit. Approve results can be
  finalized after voting closes if a threshold hold or pause is still pending.
- Cancelled and archived competitions remain accessible through history. They
  do not accept new entries or votes.

## Failure and Recovery

- If default selection cannot load, retry while shared chat remains usable.
  Competition controls do not silently use a different competition.
- If a resource cannot be loaded, retry or return to shared chat. A private or
  missing competition does not reveal its entries through a direct link.
- If the rules changed, reload before submitting or voting again. Review the
  current configuration before signing a replacement request.
- A rejected wallet signature leaves the action unsubmitted. A temporary
  network failure can be retried without duplicating an accepted action.
- Credit and group membership are checked when an action is accepted. A
  previously enabled control cannot preserve eligibility after it changes.

## Limitations / Notes

Competition discovery, creation, participation and management depend on feature
availability. Existing direct links can still show authorized competition
history when these controls are unavailable. A link can show an unavailable
state if the server has not enabled its support.
The default controls navigation; it grants no participation, voting or Main
Stage privileges. Main Stage privileges apply only to an explicitly designated
competition, never automatically to all competitions in its wave.

## Related Pages

- [Competitions](README.md)
- [Create and manage competitions](feature-manage-competitions.md)
- [Wave participation](../flow-wave-participation.md)
- [Chat composer availability](../chat/feature-chat-composer-availability.md)
