# Delete Your Wave Chat History

## Overview

Authenticated profiles can permanently remove their own chat messages from one
wave or direct-message thread. Submission and winner drops are kept. A current
pinned message authored by the profile is also kept.

## Location in the Site

Open a wave or direct-message thread, then open `About` and `Configuration`.
The `Delete all my messages from this wave` control appears between `Curations`
and `Your display` when a profile is connected and is not acting through a proxy.

## Entry Points

Select `Delete all my messages from this wave` to open the confirmation dialog.
The control remains available if chat was later disabled.

## User Journey

1. Review the scope and irreversible-deletion warning.
2. Select `Yes, delete my messages` and authenticate if prompted.
3. Keep the view open while the dialog reports progress. Large histories are
   deleted in batches automatically.
4. Wait for the completion message. The thread and cached drop lists refresh.

Messages sent after deletion starts are kept. The same history cutoff applies
when retrying an interrupted operation.

## Common Scenarios

- Large histories can take time. The progress count is the minimum number of
  confirmed deletions, so it may undercount when a response was lost.
- An empty history completes without changing content.
- Before deletion starts, cancelling the dialog leaves all messages unchanged.

## Edge Cases

- The wave's current pinned message is protected when each batch is deleted.
- Only the current profile's chat messages in the selected wave are deleted.
- Switching profiles or leaving the view stops further requests. An in-flight
  request may still finish, and completed deletions cannot be undone.
- After a refresh, the latest messages load first. Older surviving messages
  remain available by scrolling back through the thread.

## Failure and Recovery

An interrupted deletion stays open with a recovery message. Already deleted
messages stay deleted. Select `Retry deletion` to continue the same operation;
newer messages remain protected. Closing the paused dialog preserves progress.

To resume after leaving the view or reloading, reopen `About` -> `Configuration`
with the same profile in the same browser tab. Resume information is retained
for that tab's session when browser storage is available. If storage is
unavailable, recovery is retained until the page reloads.

## Limitations / Notes

Deletion is permanent. There is no percentage or estimated finish time because
the remaining history is not counted up front. While deletion runs, confirmation
and dismissal controls are disabled to prevent accidental duplicate operations.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave About Sections](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Docs Home](../../README.md)
