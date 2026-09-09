# Delete Your Wave Chat History

## Overview

Authenticated profiles can permanently remove their own chat messages from one
wave without deleting their submission drops. If the profile authored the
wave's current pinned drop, that pinned drop is also preserved.

## Location in the Site

- Open a wave or direct-message thread.
- Open `About`, then `Configuration`.
- Select `Delete all my messages from this wave` between `Curations` and
  `Your display`.

The control is shown when a profile is connected and is not acting through a
proxy. It remains available if chat was later disabled, so existing history can
still be removed.

## Confirmation and Scope

The confirmation dialog explains that:

- only chat messages authored by the current profile are deleted;
- submission and winner drops are not deleted;
- a current pinned message authored by the profile is kept; and
- deletion is irreversible.

Selecting `Yes, delete my messages` authenticates the profile if needed and
calls `DELETE /waves/{waveId}/my-chat-history`. The completed response removes
the deleted messages from the active thread and refreshes cached drop lists.

## Failure and Recovery

- A failed request keeps the confirmation dialog open and shows a retryable
  error toast.
- If no eligible chat messages exist, no content is changed and the UI reports
  that no messages were deleted.
- Closing or cancelling the dialog does not change any messages.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave About Sections](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Actions Index](../drop-actions/README.md)
- [Docs Home](../../README.md)
