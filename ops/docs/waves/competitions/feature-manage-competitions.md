# Create and Manage Competitions

## Overview

Wave administrators can create multiple Rank or Approve competitions in a
wave. Chat, visibility and administration belong to the wave. Participation,
voting, dates, outcomes and display settings belong to each competition.

## Location in the Site

Open the wave's **Competitions** tab, then **Add competition**, or use
`/waves/{waveId}/competitions/new`. For an existing competition, open **Configuration**. The overview card shows the competition type, status, name, description and guidelines. Its edit control changes the name, description and guidelines in place. **Appearance and labels** contains its display controls. Drafts also have **Finish draft setup** for their unpublished execution settings. **Pause decisions** and **Resume decisions** are separate controls in the **Pause history** section.

## Entry Points

Where the competition experience is available, creating a wave opens its shared
chat without creating a competition. Wave administrators can add competitions
afterward; competition setup is separate from wave creation.
The **Competitions** tab sits beside **Chat**. It appears for administrators who
can add competitions, and for other viewers when the wave has competitions they
can access.

## User Journey

1. Open **Add competition** as a wave administrator.
2. Choose Rank or Approve and configure eligibility, dates, submission
   requirements, voting credits, decision rules, outcomes and presentation.
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
- In **Configuration**, use the gear beside Participation or Voting **Access** to edit
  its criteria with the existing access editor. These controls remain available
  after entries are submitted.
  An access change preserves existing entries, votes, outcomes and decision progress.
- Edit the name, description and guidelines together inside the overview card, then choose **Save changes** or **Cancel**. Published competitions no longer open a separate editing wizard.
- Expand **Appearance and labels** in Configuration to change the submission button, proposal card display, Approve tab labels and outcome visibility. Approve competitions default to **Proposals** and **Approved**; custom labels apply to that competition's tabs. Save or cancel within that section. These changes create a new configuration version without changing execution rules or access.
- **Pause decisions** stops decision execution without closing otherwise open
  entry or vote windows. **Resume decisions** allows evaluation again. A paused
  Rank occurrence is skipped without shifting later scheduled occurrences.
- Competitions complete through their configured rules. Administrators cannot
  manually end or cancel a competition.
- **Archive** moves a draft or terminal competition into history. **Clone as a draft**
  creates a new draft from a terminal competition; review its dates before
  publishing.

## Edge Cases

- A published competition cannot change between Rank and Approve.
- After the first accepted entry, credit, signing, submission, timing, decision
  and outcome rules are fixed. Participation and voting access, title, description
  and presentation remain editable while the competition is published.
- A stale editing form is rejected if another administrator saved a newer
  version. For inline settings, cancel and reopen the section to edit the latest version. The draft setup editor also supports saving a separate draft copy.
- Terminal competitions cannot reopen. A clone has its own identity, entries,
  votes and budget.
- A wave containing native competition history cannot be deleted. Archive its
  competitions instead. Deleting ordinary chat history preserves competition
  content.

## Failure and Recovery

If draft creation fails after a new hub was created, keep the hub and create
the competition from its collection. If a lifecycle command fails, reload the
competition before retrying. Server permissions are checked on every action;
losing wave-administrator access also removes management authority.

## Limitations / Notes

Main Stage and other privileged designations are controlled by operations.
Ordinary wave administration cannot grant them. The original competition in
an older wave continues using its established controls. Creating another
competition does not replace that original competition or its links.

## Related Pages

- [Competitions](README.md)
- [Browse and participate](feature-competitions.md)
- [Wave creation](../create/README.md)
- [Wave outcomes](../feature-outcome-lists.md)

### Pause history

In **Configuration**, the **Pause history** section shows each pause’s start and end dates and reason to anyone who can view the competition. **Pause decisions** sits beside this history, beside the other Configuration sections. Its confirmation dialog requires a non-blank reason before confirming; the reason becomes part of the visible history. **Resume decisions** ends the current pause, retaining its dates and reason. Older pauses without a reason show “No reason recorded.”
