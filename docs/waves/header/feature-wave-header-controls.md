# Wave Header Membership and Owner Controls

## Overview

The wave header exposes membership and owner actions without leaving the active
wave view.
Depending on viewer permissions, users can join/unjoin, rename, mute, or delete
from header controls.

## Location in the Site

- Wave header surfaces under `/waves/{waveId}` and `/messages?wave={waveId}`
- Header panels rendered in desktop and mobile wave contexts

## Entry Points

- Open a wave with header visible.
- Use header actions near wave name and metadata.
- Open owner options (`⋮`) when available.

## User Journey

1. Open a wave and review header metadata (`Joined`, creation time, name).
2. If authenticated and not in proxy mode, use `Join` / `Joined` to follow or
   unfollow the wave.
3. If the user has edit rights, use the pencil action by wave name to open
   rename modal, then save.
4. If the user is the wave author, open `⋮` for owner options:
   - `Mute` / `Unmute`
   - `Delete`
5. For `Delete`, confirm in modal; on success the app returns to `/waves`.

## Common Scenarios

- Join a wave directly from header while browsing thread content.
- Rename a wave in place without leaving the current route.
- Use owner menu to mute a noisy wave or remove the wave entirely.
- Open followers from the `Joined` count action in header contexts that support
  follower panel switching.

## Edge Cases

- Unauthenticated users and proxy sessions do not get join/edit/owner actions.
- Rename save is disabled until the name actually changes.
- Delete option is shown only for the wave author's own wave.
- Mute/unmute or delete failures keep current state and show error toasts.

## Failure and Recovery

- If join/unjoin fails, retry from the same header button.
- If rename fails (for example auth expired), re-authenticate and retry save.
- If delete is canceled or modal closes, no change is applied.

## Limitations / Notes

- Detailed mute-state behavior and sidebar indicators are owned by
  [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md).
- Detailed pin behavior is owned by
  [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md).
- Header options are permission-gated and can differ by wave type and user role.

## Related Pages

- [Wave Header Index](README.md)
- [Update Wave Picture](feature-wave-picture-edit.md)
- [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md)
- [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
