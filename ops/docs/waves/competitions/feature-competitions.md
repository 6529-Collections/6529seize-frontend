# Browse and Participate in Decisions

## Overview

A wave's decisions share its chat and visibility. Entries, votes, credits
and results belong to the decision you open. Two decisions in the same
wave can run at the same time with different participation and voting rules.

Decisions were formerly called competitions. The scheduled winner-selection
moments formerly called decisions are now called results, as in **Next result**,
**Pause results** and the **Results timeline**.

## Location in the Site

- Decision collection: `/waves/{waveId}/decisions`.
- One decision: `/waves/{waveId}/decisions/{decisionId}`.
- An entry can be opened directly with `?entry={entryId}`.
- Older `/waves/{waveId}/competitions` and
  `/waves/{waveId}/competitions/{decisionId}` links redirect permanently to the
  matching `/decisions` page, keeping their query. See
  [Legacy Route Redirects](../../shared/feature-legacy-route-redirects.md).

## Entry Points

Open **Decisions** from an eligible wave, follow a decision link, or open
a decision notification. The wave header and navigation stay visible. The
collection opens from **Decisions**; open an existing draft from its card.
The **Decisions** tab shows a count of active and upcoming decisions. The
badge is hidden when there are none; drafts and completed decisions do not count.
**Chat** returns to the wave's existing conversation. The collection offers
**Active and upcoming**, **Completed**, and **All**; wave administrators also
see **Drafts**. In the app, compact pills show **Active and upcoming** and
**More**. More opens the remaining filters and displays the selected filter name.
Dismissing it keeps the selection. Desktop and mobile web show all available
filters as compact pills. When the row is too narrow, scroll the pills
horizontally; an edge fade shows where more controls are off-screen. Selecting
a filter, including from **More**, scrolls its pill into view.
To create a decision, select **+ Decision** beside the collection
filter pills. It opens setup directly and appears only in the Decisions
view when you have creation permission. The wave tab-row **Create** menu
contains the eligible curation and subwave actions.
Cards show the start date and, when set, the end date. Dates in the past use
**Started** or **Ended**; future dates use **Starts** or **Ends**.

## Default Decision

Ordinary wave navigation restores that wave's last selected valid tab in this
browser or app. **Chat** is the fallback when there is no valid remembered choice,
and loading or refreshing decision data does not override a deliberate Chat
selection. Remembered decision views retain their decision identity; if
another decision has become the default, ordinary entry falls back to Chat.
Explicit destination links and Back/Forward retain their intended section.
Switching waves keeps the wave list in place and opens the remembered section
directly. If its data is still loading, the loading state stays in that section
without opening Chat or Decisions first.
Selecting a decision tab uses the default decision unless a link or earlier
explicit selection supplies another decision. See [Wave Content Tabs](../chat/feature-content-tabs.md)
for the per-wave navigation contract.
Chat and the selected decision views share one wave-level tab row, with the
content directly below it. This applies to the default and explicitly opened
published decisions. The row starts with **Chat**, followed by the decision's
leaderboard and results views, **Votes**, and **Settings**. **Settings** is the last
decision tab, followed by **Decisions** when available and then named curations.
**Votes** has **My Votes**, **All votes**, and **Activity** subtabs, all scoped to
the selected decision. These subtabs use the shared compact pill style on
desktop, mobile web, and the app. **Settings** opens its rules, access, appearance,
administration and pause history with the existing read and edit permissions.
Chat remains shared by the whole wave.

**Decisions** is hidden for non-administrators when the default is the wave's
sole visible decision, including for signed-out viewers. The count includes
current, past and future decisions. Administrators retain it for management.
Unknown counts or permissions keep it hidden until administrator access or more
than one visible decision is established. Direct collection links remain
readable when the tab is hidden.
Routine background refreshes keep the established tabs in place. The collection
tab updates when the refreshed decision data or permissions change, not merely
because another request starts.
Temporary refresh failures retain already loaded decision content and the
selected section. If access is rejected or the decision is no longer
available, that section shows an error with a retry action.

Wave **About**, **REP**, and **Configuration** belong to the information panel.
Select the wave name to open About: on desktop it opens the right sidebar; on
mobile it opens a dismissible panel. Closing that panel or using Back returns
to the original decision, tab, curation and scroll position.

- One eligible decision is the default, including upcoming or completed history.
- With running decisions, the earliest decision start wins. Decisions with
  paused results still count as running.
- With none running, the next decision to start wins over completed history.
- With none running or upcoming, the most recently ended decision wins.
  Archived completed decisions remain eligible; archiving does not change
  their ending time.
- Drafts, archived unpublished drafts and cancelled decisions are excluded.
  With none eligible, the wave remains a chat hub.

The default can change as decisions start, finish or are published. Choosing
another decision or following a decision or entry link keeps that choice
across tabs, reload and Back/Forward. Opening a submission or vote form keeps
its original decision even if the default changes while the form is open.
Returning to Chat preserves the decision context for the familiar decision
tabs. The collection lets you choose a different decision at any time.

## User Journey

1. Choose a decision and read its rules, dates and eligibility.
2. Create a new decision submission. Chat messages and existing decision
   drops cannot be submitted as entries. Complete any required media, metadata, identity submission or
   terms fields. If signing is required, confirm the destination and action in
   your wallet.
3. Open an active entry to vote, including from shared chat. The vote dialog
   uses that entry's decision credit type and limits. Review its available, spent
   and remaining credit. Changing a vote replaces your current value; zero
   removes it. Negative votes are available only where the rules permit them.
4. Decisions open on **Leaderboard**. Use the wave tab row for the selected decision. The leaderboard
   uses the familiar list/grid controls, sorting, rich drop cards and **Drop**
   action. When entries are closed or your profile cannot submit, the leaderboard
   omits the generic submission notice; submission forms still show eligibility feedback.
   Rank decisions show the schedule; Approve decisions show
   approval thresholds, progress and approved counts. Winners use the existing
   podium or timeline for Rank and approved-drop cards for Approve. Outcomes
   use expandable reward cards; My votes shows editable vote rows and reset
   controls inside Votes; All votes shows profiles and vote totals and Activity shows vote changes. **Settings** groups the settings
   into Participation, Voting and Winners cards, below the decision description
   and guidelines. Administrators edit the name, description and guidelines directly in the overview card and use **Appearance and labels** beneath the cards for display settings. Select the wave's **Chat** tab to continue the wave's conversation,
   then return through the decision collection or link.

## Common Scenarios

- A decision can use **Anonymous submissions**. Other users see each
  submission without its author identity until that submission wins. A win
  reveals only that entry's author; the same person's other entries stay
  anonymous, including through later draws. You can still find your own entries
  in **My submissions**. Content and metadata remain visible as submitted, so
  avoid including identifying information if you want to stay anonymous.
- Media attached to an entry keeps the artist's original file, including
  embedded details such as location, camera details, capture time and the
  file name. Photos posted in chat and on profiles have those details removed.
  Remove anything you do not want public from the file before submitting,
  especially for an anonymous submission.
- Unrevealed anonymous submissions remain visible even when you have blocked
  their author's account, so blocking cannot identify the author. Hiding a
  specific drop and platform moderation still apply. Related author
  notifications remain visible despite account blocks and identity mutes until
  that entry wins; ordinary notifications retain their existing filters.

- After a submission is accepted, its entry opens with a confirmation naming
  the decision and **View my entry**. **My submissions** is available on the
  leaderboard and direct-entry view for your own signed-in profile when you have
  entries. It stays hidden while the initial lookup is loading or confirms no
  entries; a failed lookup keeps the control available so you can retry.
  On the leaderboard, it is a text button beside **Drop**. When the toolbar
  needs two rows, view and sort controls occupy the top row; **My submissions**
  aligns left and **Drop** aligns right below.
- **My submissions** lists your entries in the selected decision, including
  their recorded status, with older entries available through **Load more**.
  It keeps the selected decision, leaderboard sort and view unchanged.

- Decision drops in shared chat show their decision name beneath the author,
  linked to that decision. They also show their current total, your vote, rank,
  and voter count using the existing decision-card layout. The voter dropdown
  includes voters and vote history for that entry. Totals refresh after voting.
- Spending credit in one decision does not reduce the budget in another.
  A budget can be shared across that decision's entries or apply separately
  to each entry, depending on its rules.
- Adding a decision can change the default under the rules above. Each
  decision keeps its own leaderboard and results through its direct link.
- A winning entry records a result in its decision. Its drop remains a
  dedicated decision submission.
- Winner notifications link to the relevant decision or
  entry. Publishing, updating, pausing, and resuming a decision do not send
  notifications. Ordinary native entry submissions do not broadcast a new
  notification to every wave follower; mentions and replies retain their own
  behavior.

## Edge Cases

- Every decision drop belongs to exactly one decision for its lifetime.
- Decision submissions cannot be edited, including unsigned submissions.
  Chat messages remain separate.
- **Delete** removes an entry from decision views, results, votes and direct
  entry links, and releases its active voting spend. Authors can delete their
  drops; administrators can do so when the wave enables administrator deletion.
  There are no Withdraw or Disqualify actions or entry-removal notifications.
  Winners also stop consuming active voting credit.
- **Pause results**, beside **Pause history** in Settings, pauses winner selection. The confirmation dialog requires a reason. Pause history shows each pause’s dates and reason, including after resuming. Participation and voting remain
  available when their dates and eligibility permit. Approve results can be
  finalized after voting closes if a threshold hold or pause is still pending.
- Cancelled and archived decisions remain accessible through history. They
  do not accept new entries or votes. Administrators can permanently stop a
  published decision using **Archive and stop decision** in Settings.
  The archive button has a red border. The dialog warns that archival is permanent
  and cannot be undone. Enter the full decision name exactly, including capitals,
  spaces and punctuation, to enable **Confirm**. No archive reason is requested.
  This confirmation also applies to drafts and completed decisions. Closing and
  reopening the dialog clears the typed name. Its entries, votes, existing winners
  and awarded outcomes remain readable.

## Failure and Recovery

- If an older upload cannot be used for an anonymous submission, upload the
  media again and retry. The submission form keeps your other input.

- If a leaderboard load fails, use **Retry**. Already loaded rows remain visible
  if a refresh fails. Entry recovery does not create another submission.
- If a saved submission’s entry status cannot be loaded, use **Check again** or
  **View artwork** before submitting another copy. A failed artwork load does
  not undo a confirmed entry; retry the artwork load or use **My submissions**.

- If default selection cannot load, retry while shared chat remains usable.
  Decision controls do not silently use a different decision.
- If a resource cannot be loaded, retry or return to shared chat. A private or
  missing decision does not reveal its entries through a direct link.
- If the rules changed, reload before submitting or voting again. Review the
  current configuration before signing a replacement request.
- A rejected wallet signature leaves the action unsubmitted. A temporary
  network failure can be retried without duplicating an accepted action.
- Credit and group membership are checked when an action is accepted. A
  previously enabled control cannot preserve eligibility after it changes.

## Limitations / Notes

Decision discovery, creation, participation and management depend on feature
availability. Existing direct links can still show authorized decision
history when these controls are unavailable. A link can show an unavailable
state if the server has not enabled its support.
The default controls navigation; it grants no participation, voting or Main
Stage privileges. Main Stage privileges apply only to an explicitly designated
decision, never automatically to all decisions in its wave.

Original decisions and newer decisions use the same leaderboard, Votes, winners and Settings views. **My Votes** retains vote editing, selected-vote reset and **Explain vote**, which opens a reply in the shared wave chat. Main Stage retains its artwork submission wizard and artwork views; Curation retains supported-URL submissions and price sorting and filters; Quorum retains its proposal wizard. These experiences belong only to the decision with the corresponding designation.

## Related Pages

- [Decisions](README.md)
- [Create and manage decisions](feature-manage-competitions.md)
- [Wave participation](../flow-wave-participation.md)
- [Chat composer availability](../chat/feature-chat-composer-availability.md)
