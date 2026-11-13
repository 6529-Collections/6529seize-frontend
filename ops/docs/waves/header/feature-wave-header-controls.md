# Wave Header Controls

## Overview

Wave header controls let users manage the active wave from `About` without
leaving the thread. Waves the viewer has not joined also show a `Join` call to
action in the conversation header.

Users can:

- Add or edit Wave REP when eligible
- Share or copy a non-DM wave link
- Join from the conversation header when not yet a member
- Follow or unfollow (`Join` / `Joined`) from `About`
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

In non-DM `About` headers, available Score, Quality, Hot, and Wave REP statistics
use up to two compact columns, with each label beside its icon and value.

## Entry Points

1. Open an active wave, select the `Show right sidebar` icon in the desktop/tablet
   header or `Wave details` on compact web, then select `About`.
2. Use the top-right control row (`Join` / `Joined`, notification controls).
3. Use header controls near the wave title, avatar, and metadata.
4. Open the owner options menu (`⋮`) when available.

On phones, select the wave name to open `About`. Swipe down from the sheet's
handle or header, use `Close`, tap outside, press Escape, or use the device’s
Back action to return to the thread.
The main `About` sheet has a Close control; Back controls inside subviews return
to their parent view.

## Conversation Header

In the native app's compact header, the parent-wave link sits directly above
the wave name beside the avatar. Long names truncate within the available space
so they do not overlap the header actions. A hidden or absent description leaves
no extra row in this identity block.

At desktop and tablet widths (768px and above), the conversation header groups
its avatar, parent-wave link, name, and a short one-line description preview into a compact
identity block. The small shield and number beside the name show Wave Score
when available. Hover, click, or use the keyboard to open its details card and
`Learn more` link. No score space is left for waves without a score or for DMs.

When the center column becomes narrow, including when a sidebar is open, the
name and score stay together on one line. The description teaser remains visible
until the center header is narrower than 640px; below that width, the name and
score are centered beside the avatar. Select the wave name to read the full
description in `About`. The action row
stays on one line: `Join` and Add/Edit REP keep their labels, while submission
actions use compact icons. `More wave actions` stays visible on desktop and tablet,
with the eligible gallery/chat action and the existing time-display choices inside.
An active temporary time override keeps its zone indicator and undo control
visible beside the main actions. Columns of 640–767px keep the description teaser
with compact submission icons; wider columns restore the submission labels.

On mobile web, the available score also stays beside the name on one line,
centered with the avatar. `Join` keeps its white surface, text label, accessible
name, plus icon and touch target. `Wave details` stays visible beside `More wave
actions` and opens the details panel in one click. Search stays directly visible
before More and opens message search in one click; selecting the name still opens
`About`. The header stays on one line, using the production dimensions: a 36px
avatar, unchanged title typography, a 13px avatar-to-text gap, and 32px utility
buttons separated by 8px gaps. Submission controls stay directly accessible. Direct messages do not
show a Wave Score.

The top-right controls start with `Join` when the viewer has not joined the
wave, then Add REP for eligible viewers, followed by the
create/submit action when available, search, `More wave actions`,
and the right-sidebar toggle. Gallery/chat eligibility and the original action
icons are preserved inside More. Add REP is also available in the right sidebar's
`About` section, alongside the full trust information and sharing. Existing
contributors see `Edit REP`.
On compact web, REP stays in `About` and sharing remains in `More wave actions`.
The desktop and tablet Add/Edit REP control has a subtle border and transparent
surface, keeping it quieter than the white `Join` action.
Add/Edit REP and the About panel's share or copy button use matching compact
proportions, with larger touch areas around their visible surfaces.
The More, message search, and right-sidebar controls use
the same hover-label styling as Profile Waves Feed.

Unavailable submission actions show a lock icon at every width. Hover, focus,
or select the lock to read the full restriction reason. The Memes `How to Submit`
helper keeps its label when space allows and opens nomination guidance. In a
narrow center column and on phones it uses a transparent, borderless lock icon,
with `How to Submit` retained as its accessible name. The native app's nomination
helper uses the same borderless treatment. Its lock matches Search and More's
resting icon color and brightens on hover, since it opens guidance rather than
acting as a disabled button. Other restricted submission controls
keep their bordered surfaces.
On the web, the Main Stage submit/help control sits before message search.
Compact web keeps Search directly visible after submit/help and before More.
Add/Edit REP sits beside `Join` when both controls are shown.

### Join Call to Action

- `Join` is a white primary button with a plus icon. It is the first top-right
  control on desktop, tablet, and compact web, and it leads the native app
  header's right-hand actions.
- Selecting `Join` checks the session, joins the wave, and shows a short
  `Joined` confirmation in the same place. Screen readers hear
  `You joined {wave}.` The confirmation then returns the header to its member
  controls. If you joined with the keyboard, focus stays on the confirmation
  until you move it.
- Joined waves do not show the header button. Leave, notification, and mute
  controls stay in `About`, where `Joined` leaves the wave.
- Signed-out visitors see `Join`; it opens the wallet connect flow. After
  signing in, select `Join` again so the wave is joined with the profile you
  chose.
- The header button is not shown for direct messages, proxy sessions, or a
  connected wallet whose profile has not loaded.
- Subwaves have their own `Join`; joining a subwave does not join its parent.
- The header and `About` buttons use the same join request and update the
  wave list immediately, including the `Joined` collection.
- Leaving removes the open wave from `Joined` while keeping its content open.
  A parent remains if you still belong to one of its subwaves. Failed requests
  keep the joined row; joining again restores a wave you left.

## Permission Rules

- Anyone viewing the header can open description and followers, and share a non-DM wave.
- Add/Edit REP requires a connected non-author, non-proxy profile. DMs do not offer REP.
- `About` `Join` / `Joined`, notification settings, and pin require a connected
  non-proxy profile.
- The conversation-header `Join` follows the rules in Join Call to Action:
  signed-out visitors can use it to start signing in.
- Rename and picture edit require a non-DM wave plus `canEditWave` eligibility:
  author or admin-eligible, connected, and non-proxy.
- Owner options menu is only shown when the connected handle matches the wave
  author.

## User Journey

1. Open a wave you have not joined and select `Join` in the conversation
   header, or open `About` in an active wave.
2. In `About`, select `Join` to follow (or `Joined` to unfollow).
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
11. Renaming the wave leaves decision titles and rules unchanged.
    If edit-eligible on a non-DM wave, use pencil actions to rename or update
    picture.
12. If author, open `⋮` for profile-wave actions and `Delete`. In the mobile
    sheet or tablet overlay, `Wave options` opens inside the same panel. The
    mobile sheet keeps its height as you enter options or return to About. Use
    `Back` to return to `About`; `Close` dismisses the whole panel.
13. For `Delete`, confirm in modal. Success redirects to `/waves`.

## Common Scenarios

- Follow a wave, then tune notification mode.
- Open followers, then use `Back` or `Joined` again to return to `About`.
- Pin active waves for faster return.
- Rename a wave without leaving the thread (`Save` stays disabled until the name changes).
- Mobile Wave REP and picture editors use Close or a downward header swipe to
  dismiss; their desktop dialogs also offer Cancel.
- On direct-message waves, the name link stays available but rename/picture
  pencils stay hidden.
- Open the canonical wave route from the header name link.
- Delete an author-owned wave from the same panel.

## Edge Cases

- Signed-out users and proxy sessions do not get `About` follow, notification,
  pin, edit, or owner controls. Signed-out visitors still see the header `Join`,
  which starts signing in instead of joining.
- Leaving from `About` brings the header `Join` back.
- The bell notification menu renders only when the wave is followed; the
  speaker-muted control can render before joining.
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
- If delete modal is canceled or closed, nothing is deleted. When opened from
  the information sheet, cancellation returns to `Wave options`.

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
