# Wave Header Controls

## Overview

Wave header controls let users manage the active wave from `About` without
leaving the thread.

Users can:

- Add or edit Wave REP when eligible
- Share or copy a non-DM wave link
- Follow or unfollow (`Join` / `Joined`)
- Use the bell notification menu after following
- Mute or unmute waves from the speaker-muted control
- Open wave description from the info button
- Open and close followers from the `Joined` count
- Pin or unpin the wave
- Open the wave name link
- Rename the wave and update the picture (when edit-eligible on non-DM waves)
- Open author options such as profile-wave actions and `Delete`

## Location in the Site

- Right-sidebar `About` tab on:
  - `/waves/{waveId}`
  - `/messages/{waveId}`
- Mobile `About` view for an active wave.

The official Announcements wave uses the same blue outlined megaphone tile in
the wave list, active thread header, right-sidebar `About`, and mobile `About`.
These surfaces show the tile even when Announcements has a saved wave picture.

## Entry Points

1. Open an active wave, select the `Show right sidebar` icon in the desktop/tablet header (or the
   `Wave details` icon on compact web), then select `About`.
2. Use the top-right control row (`Join` / `Joined`, notification controls).
3. Use header controls near the wave title, avatar, and metadata.
4. Open the owner options menu (`⋮`) when available.

## Conversation Header

At desktop and tablet widths (768px and above), the conversation header groups
its avatar, parent-wave link, name, and a short one-line description preview into a compact
identity block. The small shield and number beside the name show Wave Score
when available. Hover, click, or use the keyboard to open its details card and
`Learn more` link. No score space is left for waves without a score or for DMs.

The top-right controls start with Add REP for eligible viewers, followed by the
create/submit action when available, chat/gallery toggle when supported, search,
and the right-sidebar toggle. Add REP is also available in the right sidebar's
`About` section, alongside the full trust information and sharing. Existing
contributors see `Edit REP`.
On compact web, REP stays in `About` and sharing remains in `More wave actions`.

Unavailable submission actions show a lock icon at every width. Hover, focus,
or select the lock to read the full restriction reason. The Memes `How to Submit`
helper keeps its desktop label and opens nomination guidance.

## Permission Rules

- Anyone viewing the header can open description and followers, and share a non-DM wave.
- Add/Edit REP requires a connected non-author, non-proxy profile. DMs do not offer REP.
- `Join`, notification settings, and pin require a connected non-proxy profile.
- Rename and picture edit require a non-DM wave plus `canEditWave` eligibility:
  author or admin-eligible, connected, and non-proxy.
- Owner options menu is only shown when the connected handle matches the wave
  author.

## User Journey

1. Open `About` in an active wave.
2. Select `Join` to follow (or `Joined` to unfollow).
3. If followed, open the bell button to choose `@ALL` mention notifications
   or `Notify for all messages`.
4. Use the speaker-muted button to mute the wave before or after joining, or
   unmute it when the wave is already muted.
5. Use the info button to open the wave description panel.
6. Close description with outside click, `Escape`, or the info button.
7. Select `Joined` count to toggle between about content and followers.
8. Use `Back` in followers to return to `About`.
9. Use pin to keep the wave in pinned lists (up to 20 total).
10. Open the wave name to go to `/waves/{waveId}`.
11. If edit-eligible on a non-DM wave, use pencil actions to rename or update
    picture.
12. If author, open `⋮` for profile-wave actions and `Delete`.
13. For `Delete`, confirm in modal. Success redirects to `/waves`.

## Common Scenarios

- Follow a wave, then tune notification mode.
- Open followers, then use `Back` or `Joined` again to return to `About`.
- Pin active waves for faster return.
- Rename a wave without leaving the thread (`Save` stays disabled until the name changes).
- On direct-message waves, the name link stays available but rename/picture
  pencils stay hidden.
- Open the canonical wave route from the header name link.
- Delete an author-owned wave from the same panel.

## Edge Cases

- Signed-out users and proxy sessions do not get follow, notification, pin,
  edit, or owner controls.
- The bell notification menu renders only when the wave is followed; the
  speaker-muted control can render before joining.
- All-message notifications can be unavailable for high-follower waves unless
  already enabled; the unavailable all-message row stays disabled in the
  notification menu.
- When muted, the bell notification menu is replaced by a speaker-muted `Muted`
  control that unmutes the wave.
- Direct-message waves never show rename or picture-edit pencils, even when the
  connected user would otherwise pass `canEditWave`.
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
- Active thread-header title/subtitle preview + popover behavior is owned by
  [Wave Description Preview Popover](feature-wave-description-preview-popover.md).
- Detailed pin limits and cross-surface pin behavior is owned by
  [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md).
- Direct-message route behavior is owned by
  [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md).
- Shared avatar picture/collage fallback rules are owned by
  [Wave Avatar Fallbacks](../../shared/feature-wave-avatar-fallbacks.md).
- Wave header controls vary by role and active session state.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Description Preview Popover](feature-wave-description-preview-popover.md)
- [Update Wave Picture](feature-wave-picture-edit.md)
- [Chat and Gallery View Toggle](feature-chat-gallery-toggle.md)
- [Wave Avatar Fallbacks](../../shared/feature-wave-avatar-fallbacks.md)
- [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md)
- [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
