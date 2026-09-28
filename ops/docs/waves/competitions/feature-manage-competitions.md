# Create and Manage Competitions

## Overview

Wave administrators can create multiple Rank or Approve competitions in a
wave. Chat, visibility and administration belong to the wave. Participation,
voting, dates, outcomes and display settings belong to each competition.

## Location in the Site

Use `/waves/{waveId}/competitions/new` or **New competition** from the wave's
competition collection. Management controls are inside the competition.

## Entry Points

Where the competition experience is available, wave creation can create a
shared hub with no competition or prepare a first competition. An existing
wave can add a competition later from its collection.

## User Journey

1. Open **New competition** as a wave administrator.
2. Choose Rank or Approve and configure eligibility, dates, submission
   requirements, voting credits, decision rules, outcomes and presentation.
3. Save the draft. Drafts are visible to wave administrators.
4. Review and publish it. A scheduled first decision must be in the future,
   and participation or voting periods must not already have ended.
5. Manage the competition through its administration controls while shared
   wave chat continues independently.

## Common Scenarios

- Rank can use an ongoing leaderboard or scheduled and rolling decisions.
- Approve can use a threshold, a required duration above that threshold and a
  winner limit. Voting limits and negative-vote rules remain per competition.
- Presentation settings include labels, proposal display, rules and outcome
  visibility. Editing them creates a new configuration version.
- **Pause decisions** stops decision execution without closing otherwise open
  entry or vote windows. **Resume decisions** allows evaluation again. A paused
  Rank occurrence is skipped without shifting later scheduled occurrences.
- **End** or **Cancel competition** stops future participation, voting and decisions while
  keeping history. Cancellation does not introduce a refund or final winner.
- **Archive** moves a draft or terminal competition into history. **Clone as a draft**
  creates a new draft from a terminal competition; review its dates before
  publishing.

## Edge Cases

- A published competition cannot change between Rank and Approve.
- After the first accepted entry, eligibility, credit, signing, submission,
  timing, decision and outcome rules are fixed. Title, description and
  presentation remain editable while the competition is published.
- A stale editing form is rejected if another administrator saved a newer
  version. Reload and review that version before trying again, or use
  **Save as a new draft** to preserve your configuration separately.
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
