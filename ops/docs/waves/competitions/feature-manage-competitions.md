# Create and Manage Competitions

## Overview

Wave administrators can create multiple Rank or Approve competitions in a
wave. Chat, visibility and administration belong to the wave. Participation,
voting, dates, outcomes and display settings belong to each competition.

## Location in the Site

Open **Competitions**, then **+ Competition** beside its filter pills, or use
`/waves/{waveId}/competitions/new`. For an existing competition, open **Settings**. The overview card shows the competition type, status, name, description and guidelines. Its edit control changes the name, description and guidelines for the selected competition. The pinned wave post remains in About. **Appearance and labels** contains its display controls. Drafts also have **Finish draft setup** for their unpublished execution settings. **Pause decisions** and **Resume decisions** are separate controls in the **Pause history** section.

## Entry Points

Creating a wave opens its shared
chat without creating a competition. Wave administrators can add competitions
afterward; competition setup is separate from wave creation.
The **Competitions** tab follows the selected competition's **Settings** tab and precedes named curations. Administrators retain it for management; other viewers see it when there is more than one visible competition. Unknown counts or permissions keep it hidden until that access or count is established.

## User Journey

1. Open **Competitions**, then **+ Competition**, with competition creation permission.
2. Choose Rank or Approve and configure eligibility, dates, submission
   requirements, voting credits, decision rules, outcomes and presentation.
   **Competition type** opens a dropdown on desktop and a bottom sheet on
   smaller screens, including the app. The current choice is marked; choosing
   another type closes the picker. Dismissing it leaves the choice unchanged.
   In the app, the setup editor keeps the focused name or description field
   above the keyboard and action bar. Closing the keyboard restores the editor's
   full height.
3. Changes save automatically. Incomplete settings are retained on this device;
   valid drafts sync to the server and are visible to wave administrators.
   Opening a draft returns directly to the setup wizard with saved settings
   prefilled. **Close editor** returns to the competition list without publishing
   and preserves your draft.
4. The final step has **Previous**, **Close editor** and **Publish**. Review and
   publish it. A scheduled first decision must be in the future,
   and participation or voting periods must not already have ended.
5. Manage the competition through its administration controls while shared
   wave chat continues independently.

## Common Scenarios

- Rank can use an ongoing leaderboard or scheduled and rolling decisions.
- Approve requires an approval threshold that is a whole number greater than
  zero. A required duration above that threshold and a winner limit are optional.
  Voting limits and negative-vote rules remain per competition. Next highlights invalid voting settings; server autosave waits until
  those settings are valid. Incomplete input is saved on this device.
- **Whole competition** shares one voting budget across the competition’s entries.
  **Competition guidelines** apply to its entries and voting; chat and its
  guidelines belong to the parent wave.
- In **Settings**, use the gear beside Participation or Voting **Access** to edit
  its criteria with the existing access editor. These controls remain available
  after entries are submitted.
  An access change preserves existing entries, votes, outcomes and decision progress.
- Edit the name, description and guidelines together inside the overview card, then choose **Save changes** or **Cancel**.
- For an original competition in an older wave, **Edit competition rules** opens its existing administration settings. Review entry requirements, dates, voting and winner limits, then choose **Save changes**. **Close editor** saves valid changes and returns to Settings.
- Expand **Appearance and labels** in Settings to change the submission button, proposal card display, Approve tab labels and outcome visibility. Approve competitions default to **Proposals** and **Approved**; custom labels apply to that competition's tabs. Save or cancel within that section. These changes create a new configuration version without changing execution rules or access.
- **Pause decisions** stops decision execution without closing otherwise open
  entry or vote windows. **Resume decisions** allows evaluation again. A paused
  Rank occurrence is skipped without shifting later scheduled occurrences.
- Competitions complete through their configured rules. Administrators cannot
  manually end or cancel a competition.
- **Archive** moves a draft or terminal competition into history. **Clone as a draft**
  creates a new draft from a terminal competition; review its dates before
  publishing.

## Edge Cases

- **Anonymous submissions** is off by default. Enable it in the competition
  setup overview to hide each submitter's identity from other users until that
  submission wins. The setting is fixed after publication, even before the
  first entry. Winning reveals only the winning entry's author; other entries
  remain anonymous across later draws. Submitters are responsible for any
  identifying information they include in their content or metadata.

- A published competition cannot change between Rank and Approve.
- For newer competitions, after the first accepted entry, credit, signing, submission, timing, decision
  and outcome rules are fixed. Approve threshold and hold duration remain editable in Settings. Participation and voting access, title, description
  and presentation remain editable while the competition is published.
- Original competitions in older waves retain their existing administration permissions after entries arrive. Their type, identity strategy and outcome definitions stay fixed. Voting credit source, scope and negative-vote rules stay fixed after the first vote, including votes later reset or deleted. An existing vote cap may only increase or become unlimited. Schedule changes must leave the next decision in the future and cannot replace an unresolved due decision; winner limits cannot fall below completed decisions.
- A stale editing form is rejected if another administrator saved a newer
  version. For inline settings, cancel and reopen the section to edit the latest version. The draft setup editor also supports saving a separate draft copy.
- Terminal competitions cannot reopen. A clone has its own identity, entries,
  votes and budget.
- A wave containing native competition history cannot be deleted. Archive its
  competitions instead. Deleting ordinary chat history preserves competition
  content.

## Failure and Recovery

If draft creation fails after a new hub was created, keep the hub and use
**Competitions → + Competition** to create the competition. If a lifecycle command fails, reload the
competition before retrying. Server permissions are checked on every action;
losing wave-administrator access also removes management authority.

## Limitations / Notes

Main Stage and other privileged designations are controlled by operations.
Ordinary wave administration cannot grant them. The original competition in an older wave uses the same competition views, **Settings**, and direct `?tab=rules` links. Its name, description, guidelines, appearance, access and available administration controls belong to that competition. Changing the selected default or creating a sibling does not replace the original competition or its historical links.

For Approve competitions, **Edit approval thresholds** changes the required approvals and hold duration, including after entries and votes exist. Enter the hold in seconds; 0 means immediate approval. A hold cannot exceed the approval window. Cancel and reopen the editor if another administrator has saved newer settings.


## Related Pages

- [Competitions](README.md)
- [Browse and participate](feature-competitions.md)
- [Wave creation](../create/README.md)
- [Wave outcomes](../feature-outcome-lists.md)

### Pause history

In **Settings**, the **Pause history** section shows each pause’s start and end dates and reason to anyone who can view the competition. **Pause decisions** sits beside this history, beside the other Settings sections. Its confirmation dialog requires a non-blank reason before confirming; the reason becomes part of the visible history. **Resume decisions** ends the current pause, retaining its dates and reason. Older pauses without a reason show “No reason recorded.”
