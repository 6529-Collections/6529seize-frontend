# Wave Header Controls

## Overview

Wave header controls let users manage the active wave from `About` without
leaving the thread.

Users can:

- Follow or unfollow (`Join` / `Joined`)
- Use notification controls after following
- Open wave description from the info button
- Open and close followers from the `Joined` count
- Pin or unpin the wave
- Open the wave name link
- Rename the wave and update the picture (when edit-eligible)
- Open author options (`Mute` / `Unmute`, `Delete`)

## Location in the Site

- Right-sidebar `About` tab on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Mobile `About` view for an active wave.

## Entry Points

1. Open an active wave and switch to `About`.
2. Use the top-right control row (`Join` / `Joined`, notification controls).
3. Use header controls near the wave title, avatar, and metadata.
4. Open the owner options menu (`⋮`) when available.

## Permission Rules

- Anyone viewing the header can open description and followers.
- `Join`, notification settings, and pin require a connected non-proxy profile.
- Rename and picture edit require `canEditWave` eligibility:
  author or admin-eligible, connected, and non-proxy.
- Owner options menu (`Mute` / `Unmute`, `Delete`) is only shown when the connected
  handle matches the wave author.

## User Journey

1. Open `About` in an active wave.
2. Select `Join` to follow (or `Joined` to unfollow).
3. If followed, set notification mode (`@` mentions-only or all drops when enabled).
4. If the wave is muted, use `Muted` to unmute from the same top row.
5. Use the info button to open the wave description panel.
6. Close description with outside click, `Escape`, or the info button.
7. Select `Joined` count to toggle between about content and followers.
8. Use `Back` in followers to return to `About`.
9. Use pin to keep the wave in pinned lists (up to 20 total).
10. Open the wave name to go to `/waves/{waveId}`.
11. If edit-eligible, use pencil actions to rename or update picture.
12. If author, open `⋮` for `Mute` / `Unmute` and `Delete`.
13. For `Delete`, confirm in modal. Success redirects to `/waves`.

## Common Scenarios

- Follow a wave, then tune notification mode.
- Open followers, then use `Back` or `Joined` again to return to `About`.
- Pin active waves for faster return.
- Rename a wave without leaving the thread (`Save` stays disabled until the name changes).
- Open the canonical wave route from the header name link.
- Delete an author-owned wave from the same panel.

## Edge Cases

- Signed-out users and proxy sessions do not get follow, notification, pin,
  edit, or owner controls.
- Notification controls render only when the wave is followed.
- `All` notifications can be disabled for high-follower waves.
- When muted, notification mode buttons are replaced by a `Muted` control.
- Pin attempts beyond 20 are blocked and show an error toast.
- Controls show loading states and disable repeat clicks while requests are running.
- Pencil edit controls are hover-revealed and may not appear on touch-only web layouts.

## Failure and Recovery

- If signature auth is canceled, follow, rename, picture update, and delete do not apply.
- If follow/unfollow fails, the prior follow state remains and an error toast is shown.
- If notification mode toggle fails, the prior notification mode remains.
- If mute/unmute fails, the prior mute state remains and an error toast is shown.
- If pin/unpin fails, keep the current pin state and retry from the same button.
- If rename or picture update fails, keep the modal open, fix auth/session issues,
  and retry.
- If delete modal is canceled or closed, nothing is deleted.

## Limitations / Notes

- Detailed notification and mute behavior is owned by
  [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md).
- Detailed pin limits and cross-surface pin behavior is owned by
  [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md).
- Direct-message route behavior is owned by
  [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md).
- Wave header controls vary by role and active session state.

## Related Pages

- [Wave Header Index](README.md)
- [Update Wave Picture](feature-wave-picture-edit.md)
- [Chat and Gallery View Toggle](feature-chat-gallery-toggle.md)
- [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md)
- [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
