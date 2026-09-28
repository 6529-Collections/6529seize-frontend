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
a competition notification. **Shared chat** returns to the wave's existing
conversation. The collection offers active and historical filters; wave
administrators can also see drafts.

## User Journey

1. Choose a competition and read its rules, dates and eligibility.
2. Submit a new entry, or preview and attach an existing drop you authored in
   that wave. Complete any required media, metadata, identity submission or
   terms fields. If signing is required, confirm the destination and action in
   your wallet.
3. Open an active entry to vote. Review that competition's available, spent
   and remaining credit. Changing a vote replaces your current value; zero
   removes it. Negative votes are available only where the rules permit them.
4. Use Entries, Leaderboard, My votes, Winners, Outcomes, Voters and Rules
   to inspect the competition. Open **Shared chat** to continue the wave's
   conversation, then return through the competition collection or link.

## Common Scenarios

- Spending credit in one competition does not reduce the budget in another.
  A budget can be shared across that competition's entries or apply separately
  to each entry, depending on its rules.
- A wave with an existing competition keeps that original experience. Adding
  another competition does not replace the original leaderboard or results.
- A winning native entry records a result in its competition. Its shared drop
  remains part of ordinary wave content.
- Lifecycle and winner notifications link to the relevant competition or
  entry. Ordinary native entry submissions do not broadcast a new notification
  to every wave follower; mentions and replies retain their own behavior.

## Edge Cases

- A drop can belong to only one active, unfinished competition entry at a
  time. An original wave winner is not an eligible chat drop to attach.
- Unsigned active content can be edited only while satisfying its competition
  requirements. Signed entries and winners are frozen. Competition history
  retains its accepted content; moderation or deletion can make it unavailable.
- Withdrawal and disqualification preserve history and release the affected
  active voting spend. Winners also stop consuming active voting credit.
- **Pause decisions** pauses winner selection. Participation and voting remain
  available when their dates and eligibility permit. Approve results can be
  finalized after voting closes if a threshold hold or pause is still pending.
- Cancelled and archived competitions remain accessible through history. They
  do not accept new entries or votes.

## Failure and Recovery

- If a resource cannot be loaded, retry or return to shared chat. A private or
  missing competition does not reveal its entries through a direct link.
- If the rules changed, reload before submitting or voting again. Review the
  current configuration before signing a replacement request.
- If an existing drop changed after preview, preview it again before signing.
- A rejected wallet signature leaves the action unsubmitted. A temporary
  network failure can be retried without duplicating an accepted action.
- Credit and group membership are checked when an action is accepted. A
  previously enabled control cannot preserve eligibility after it changes.

## Limitations / Notes

Competition discovery, creation, participation and management depend on feature
availability. Existing direct links can still show authorized competition
history when these controls are unavailable. A link can show an unavailable
state if the server has not enabled its support.
There is no single current competition for a wave. Older wave links continue
to open their established experience. Main Stage privileges apply only to an
explicitly designated competition, never automatically to all competitions in
its wave.

## Related Pages

- [Competitions](README.md)
- [Create and manage competitions](feature-manage-competitions.md)
- [Wave participation](../flow-wave-participation.md)
- [Chat composer availability](../chat/feature-chat-composer-availability.md)
