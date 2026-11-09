# Create and Manage Decisions

## Overview

Wave administrators can create multiple Rank or Approve decisions in a
wave. Chat, visibility and administration belong to the wave. Participation,
voting, dates, outcomes and display settings belong to each decision.

## Location in the Site

Open **Decisions**, then **+ Decision** beside its filter pills, or use
`/waves/{waveId}/decisions/new`. For an existing decision, open **Settings**. The overview card shows the decision type, status, name, description and guidelines. Its edit control changes the name, description and guidelines for the selected decision. The pinned wave post remains in About. **Appearance and labels** contains its display controls. Drafts also have **Finish draft setup** for their unpublished execution settings. **Pause results** and **Resume results** are separate controls in the **Pause history** section.

## Entry Points

Creating a wave opens its shared
chat without creating a decision. Wave administrators can add decisions
afterward; decision setup is separate from wave creation.
The **Decisions** tab follows the selected decision's **Settings** tab and precedes named curations. Administrators retain it for management; other viewers see it when there is more than one visible decision. Unknown counts or permissions keep it hidden until that access or count is established.

## User Journey

1. Open **Decisions**, then **+ Decision**, with decision creation permission.
2. Choose Rank or Approve and configure eligibility, dates, submission
   requirements, voting credits, result rules, outcomes and presentation.
   **Decision type** opens a dropdown on desktop and a bottom sheet on
   smaller screens, including the app. The current choice is marked; choosing
   another type closes the picker. Dismissing it leaves the choice unchanged.
   In the app, the setup editor keeps the focused name or description field
   above the keyboard and action bar. Closing the keyboard restores the editor's
   full height.
3. Changes save automatically. Incomplete settings are retained on this device;
   valid drafts sync to the server and are visible to wave administrators.
   Opening a draft returns directly to the setup wizard with saved settings
   prefilled. **Close editor** returns to the decision list without publishing
   and preserves your draft.
4. The final step has **Previous**, **Close editor** and **Publish**. Review and
   publish it. A scheduled first result must be in the future,
   and participation or voting periods must not already have ended.
5. Manage the decision through its administration controls while shared
   wave chat continues independently.

## Common Scenarios

- Rank can use an ongoing leaderboard or scheduled and rolling results.
- Approve requires an approval threshold that is a whole number greater than
  zero. A required duration above that threshold and a winner limit are optional.
  Voting limits and negative-vote rules remain per decision. Next highlights invalid voting settings; server autosave waits until
  those settings are valid. Incomplete input is saved on this device.
- **Whole decision** shares one voting budget across the decision’s entries.
  **Decision guidelines** apply to its entries and voting; chat and its
  guidelines belong to the parent wave.
- In **Settings**, use the gear beside Participation or Voting **Access** to edit
  its criteria with the existing access editor. These controls remain available
  after entries are submitted.
  An access change preserves existing entries, votes, outcomes and result progress.
- Edit the name, description and guidelines together inside the overview card, then choose **Save changes** or **Cancel**.
- For an original decision in an older wave, **Edit decision rules** opens its existing administration settings. Review entry requirements, dates, voting and winner limits, then choose **Save changes**. **Close editor** saves valid changes and returns to Settings.
- Expand **Appearance and labels** in Settings to change the submission button, proposal card display, Approve tab labels and outcome visibility. Approve decisions default to **Proposals** and **Approved**; custom labels apply to that decision's tabs. Save or cancel within that section. These changes create a new configuration version without changing execution rules or access.
- **Pause results** stops winner selection without closing otherwise open
  entry or vote windows. **Resume results** allows evaluation again. A paused
  Rank occurrence is skipped without shifting later scheduled occurrences.
- Decisions complete through their configured rules, or administrators can
  permanently stop them with **Archive and stop decision** in Settings.
  This closes submissions and voting and stops future winner selection.
  Results already being decided finish before archival; their winners and awards remain.
  Archiving a published decision with any past entries or votes requires a
  non-blank reason, recorded in its audit history. Deleted entries and reset
  votes still count. Review the confirmation before proceeding.
- **Archive** moves a draft or completed decision into history. Open a saved
  draft from **Decisions → Drafts**; its Archive button is above the setup
  editor. Archiving preserves entries, votes, winners and awarded outcomes.
  **Clone as a draft**
  creates a new draft from a terminal decision; review its dates before
  publishing.

## Edge Cases

- **Anonymous submissions** is off by default. Enable it in the decision
  setup overview to hide each submitter's identity from other users until that
  submission wins. The setting is fixed after publication, even before the
  first entry. Winning reveals only the winning entry's author; other entries
  remain anonymous across later draws. Submitters are responsible for any
  identifying information they include in their content or metadata.

- A published decision cannot change between Rank and Approve.
- For newer decisions, after the first accepted entry, credit, signing, submission, timing, result
  and outcome rules are fixed. Approve threshold and hold duration remain editable in Settings. Participation and voting access, title, description
  and presentation remain editable while the decision is published.
- Original decisions in older waves retain their existing administration permissions after entries arrive. Their type, identity strategy and outcome definitions stay fixed. Voting credit source, scope and negative-vote rules stay fixed after the first vote, including votes later reset or deleted. An existing vote cap may only increase or become unlimited. Schedule changes must leave the next result in the future and cannot replace an unresolved due result; winner limits cannot fall below completed results.
- A stale editing form is rejected if another administrator saved a newer
  version. For inline settings, cancel and reopen the section to edit the latest version. The draft setup editor also supports saving a separate draft copy.
- Terminal decisions cannot reopen. A clone has its own identity, entries,
  votes and budget.
- A wave containing native decision history cannot be deleted. Archive its
  decisions instead. Deleting ordinary chat history preserves decision
  content.

## Failure and Recovery

If draft creation fails after a new hub was created, keep the hub and use
**Decisions → + Decision** to create the decision. If a lifecycle command fails, reload the
decision before retrying. Server permissions are checked on every action;
losing wave-administrator access also removes management authority.

## Limitations / Notes

Main Stage and other privileged designations are controlled by operations.
Ordinary wave administration cannot grant them. The original decision in an older wave uses the same decision views, **Settings**, and direct `?tab=rules` links. Its name, description, guidelines, appearance, access and available administration controls belong to that decision. Changing the selected default or creating a sibling does not replace the original decision or its historical links.

For Approve decisions, **Edit approval thresholds** changes the required approvals and hold duration, including after entries and votes exist. Enter the hold in seconds; 0 means immediate approval. A hold cannot exceed the approval window. Cancel and reopen the editor if another administrator has saved newer settings.


## Related Pages

- [Decisions](README.md)
- [Browse and participate](feature-competitions.md)
- [Wave creation](../create/README.md)
- [Wave outcomes](../feature-outcome-lists.md)

### Pause history

In **Settings**, the **Pause history** section shows each pause’s start and end dates and reason to anyone who can view the decision. **Pause results** sits beside this history, beside the other Settings sections. Its confirmation dialog requires a non-blank reason before confirming; the reason becomes part of the visible history. **Resume results** ends the current pause, retaining its dates and reason. Older pauses without a reason show “No reason recorded.”
