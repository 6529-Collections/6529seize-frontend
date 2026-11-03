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
collection opens from **Competitions**; open an existing draft from its card.
The **Competitions** tab shows a count of active and upcoming competitions. The
badge is hidden when there are none; drafts and completed competitions do not count.
**Chat** returns to the wave's existing conversation. The collection offers
**Active and upcoming**, **Completed**, and **All**; wave administrators also
see **Drafts**. In the app, compact pills show **Active and upcoming** and
**More**. More opens the remaining filters and displays the selected filter name.
Dismissing it keeps the selection. Desktop and mobile web show all available
filters as compact pills. When the row is too narrow, scroll the pills
horizontally; an edge fade shows where more controls are off-screen. Selecting
a filter, including from **More**, scrolls its pill into view.
To create a competition, select **+ Competition** beside the collection
filter pills. It opens setup directly and appears only in the Competitions
view when you have creation permission. The wave tab-row **Create** menu
contains the eligible curation and subwave actions.
Cards show the start date and, when set, the end date. Dates in the past use
**Started** or **Ended**; future dates use **Starts** or **Ends**.

## Default Competition

Ordinary wave navigation restores that wave's last selected valid tab in this
browser or app. **Chat** is the fallback when there is no valid remembered choice,
and loading or refreshing competition data does not override a deliberate Chat
selection. Remembered competition views retain their competition identity; if
another competition has become the default, ordinary entry falls back to Chat.
Explicit destination links and Back/Forward retain their intended section.
Switching waves keeps the wave list in place and opens the remembered section
directly. If its data is still loading, the loading state stays in that section
without opening Chat or Competitions first.
Selecting a competition tab uses the default competition unless a link or earlier
explicit selection supplies another competition. See [Wave Content Tabs](../chat/feature-content-tabs.md)
for the per-wave navigation contract.
Chat and the selected competition views share one wave-level tab row, with the
content directly below it. This applies to the default and explicitly opened
published competitions. The row starts with **Chat**, followed by the competition's
leaderboard and results views, **Votes**, and **Settings**. **Settings** is the last
competition tab, followed by **Competitions** when available and then named curations.
**Votes** has **My Votes**, **All votes**, and **Activity** subtabs, all scoped to
the selected competition. These subtabs use the shared compact pill style on
desktop, mobile web, and the app. **Settings** opens its rules, access, appearance,
administration and pause history with the existing read and edit permissions.
Chat remains shared by the whole wave.

**Competitions** is hidden for non-administrators when the default is the wave's
sole visible competition, including for signed-out viewers. The count includes
current, past and future competitions. Administrators retain it for management.
Unknown counts or permissions keep it hidden until administrator access or more
than one visible competition is established. Direct collection links remain
readable when the tab is hidden.
Routine background refreshes keep the established tabs in place. The collection
tab updates when the refreshed competition data or permissions change, not merely
because another request starts.
Temporary refresh failures retain already loaded competition content and the
selected section. If access is rejected or the competition is no longer
available, that section shows an error with a retry action.

Wave **About**, **REP**, and **Configuration** belong to the information panel.
Select the wave name to open About: on desktop it opens the right sidebar; on
mobile it opens a dismissible panel. Closing that panel or using Back returns
to the original competition, tab, curation and scroll position.

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
4. Competitions open on **Leaderboard**. Use the wave tab row for the selected competition. The leaderboard
   uses the familiar list/grid controls, sorting, rich drop cards and **Drop**
   action. When entries are closed or your profile cannot submit, the leaderboard
   omits the generic submission notice; submission forms still show eligibility feedback.
   Rank competitions show the schedule; Approve competitions show
   approval thresholds, progress and approved counts. Winners use the existing
   podium or timeline for Rank and approved-drop cards for Approve. Outcomes
   use expandable reward cards; My votes shows editable vote rows and reset
   controls inside Votes; All votes shows profiles and vote totals and Activity shows vote changes. **Settings** groups the settings
   into Participation, Voting and Winners cards, below the competition description
   and guidelines. Administrators edit the name, description and guidelines directly in the overview card and use **Appearance and labels** beneath the cards for display settings. Select the wave's **Chat** tab to continue the wave's conversation,
   then return through the competition collection or link.

## Common Scenarios

- A competition can use **Anonymous submissions**. Other users see each
  submission without its author identity until that submission wins. A win
  reveals only that entry's author; the same person's other entries stay
  anonymous, including through later draws. You can still find your own entries
  in **My submissions**. Content and metadata remain visible as submitted, so
  avoid including identifying information if you want to stay anonymous.
- Unrevealed anonymous submissions remain visible even when you have blocked
  their author's account, so blocking cannot identify the author. Hiding a
  specific drop and platform moderation still apply. Related author
  notifications remain visible despite account blocks and identity mutes until
  that entry wins; ordinary notifications retain their existing filters.

- After a submission is accepted, its entry opens with a confirmation naming
  the competition and **View my entry**. **My submissions** is available on the
  leaderboard and direct-entry view for your own signed-in profile when you have
  entries. It stays hidden while the initial lookup is loading or confirms no
  entries; a failed lookup keeps the control available so you can retry.
  On the leaderboard, it is a text button beside **Drop**. When the toolbar
  needs two rows, view and sort controls occupy the top row; **My submissions**
  aligns left and **Drop** aligns right below.
- **My submissions** lists your entries in the selected competition, including
  their recorded status, with older entries available through **Load more**.
  It keeps the selected competition, leaderboard sort and view unchanged.

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
- **Pause decisions**, beside **Pause history** in Settings, pauses winner selection. The confirmation dialog requires a reason. Pause history shows each pause’s dates and reason, including after resuming. Participation and voting remain
  available when their dates and eligibility permit. Approve results can be
  finalized after voting closes if a threshold hold or pause is still pending.
- Cancelled and archived competitions remain accessible through history. They
  do not accept new entries or votes.

## Failure and Recovery

- If an older upload cannot be used for an anonymous submission, upload the
  media again and retry. The submission form keeps your other input.

- If a leaderboard load fails, use **Retry**. Already loaded rows remain visible
  if a refresh fails. Entry recovery does not create another submission.
- If a saved submission’s entry status cannot be loaded, use **Check again** or
  **View artwork** before submitting another copy. A failed artwork load does
  not undo a confirmed entry; retry the artwork load or use **My submissions**.

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

Original competitions and newer competitions use the same leaderboard, Votes, winners and Settings views. **My Votes** retains vote editing, selected-vote reset and **Explain vote**, which opens a reply in the shared wave chat. Main Stage retains its artwork submission wizard and artwork views; Curation retains supported-URL submissions and price sorting and filters; Quorum retains its proposal wizard. These experiences belong only to the competition with the corresponding designation.

## Related Pages

- [Competitions](README.md)
- [Create and manage competitions](feature-manage-competitions.md)
- [Wave participation](../flow-wave-participation.md)
- [Chat composer availability](../chat/feature-chat-composer-availability.md)
