# Wave Header Controls

## Overview

Wave header controls let users manage a wave from the `About` surface without
leaving the thread.

Users can:

- Follow or unfollow (`Join` / `Joined`)
- Open notification mode controls after following
- Open wave description from the info button
- Open followers from the `Joined` count
- Pin or unpin the wave
- Rename the wave or open picture edit (when edit-eligible)
- Open author options (`Mute` / `Unmute`, `Delete`)

## Location in the Site

- Right-sidebar `About` panel on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Mobile/app `About` panel variants for active waves.

## Entry Points

- Open an active wave and switch to `About`.
- Use controls near the wave name, metadata, and avatar.
- Open the owner options menu (`⋮`) when available.

## Permission Rules

- Anyone viewing the header can open description and followers.
- `Join`, notification settings, and pin require a connected non-proxy profile.
- Rename and picture edit require `canEditWave` eligibility (author or admin-eligible,
  connected, non-proxy).
- Owner options menu (`Mute` / `Unmute`, `Delete`) is author-only.

## User Journey

1. Open `About` in an active wave.
2. Select `Join` to follow (or `Joined` to unfollow).
3. If followed, set notification mode (`@` mentions-only or all drops when enabled).
4. Use the info button to open wave description.
5. Select `Joined` count to switch between about content and followers.
6. Use pin to keep the wave in pinned lists.
7. If edit-eligible, use pencil actions to rename or update picture.
8. If author, open `⋮` for `Mute` / `Unmute` and `Delete`.
9. For `Delete`, confirm in modal. Success redirects to `/waves`.

## Common Scenarios

- Follow a wave, then tune notification mode.
- Check follower list and return to about content.
- Pin active waves for faster return.
- Rename a wave without leaving the thread.
- Delete an author-owned wave from the same panel.

## Edge Cases

- Signed-out users and proxy sessions do not get follow, notification, pin,
  edit, or owner controls.
- Notification mode controls render only when the wave is followed.
- `All` notifications can be disabled for high-follower waves.
- When muted, notification mode buttons are replaced by a `Muted` unmute control.
- Rename `Save` stays disabled until the name changes.
- Pencil edit controls are hover-revealed and may not appear on touch-only layouts.

## Failure and Recovery

- If auth is canceled or fails, no header action is applied.
- If follow/unfollow, mute/unmute, or delete fails, the prior state remains and
  an error toast is shown.
- If rename fails, keep the modal open, fix auth/session issues, and retry.
- If delete modal is canceled or closed, nothing is deleted.

## Limitations / Notes

- Detailed notification and mute behavior is owned by
  [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md).
- Detailed pin limits and cross-surface pin behavior is owned by
  [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md).
- Header controls vary by role and active session state.

## Related Pages

- [Wave Header Index](README.md)
- [Update Wave Picture](feature-wave-picture-edit.md)
- [Chat and Gallery View Toggle](feature-chat-gallery-toggle.md)
- [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md)
- [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
