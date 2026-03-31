# Wave Drop Set as Pinned Drop

## Overview

Use `Set as pinned drop` to replace the wave's pinned description drop with an
existing posted drop.

On non-direct-message waves, this also changes the content shown in the wave
header description preview/popover.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop overlay in the current thread route: `?drop={dropId}`
- Drop action menus on full drop cards

## Entry Points

- Open a wave or direct-message thread as a wave admin.
- Open the drop action menu on a posted drop:
  - Desktop: `More` (`...`).
  - Chat drops, touch small layouts: long-press a drop.
  - Chat drops, touch medium+ layouts: use the drop header action button.
  - Winner/participation drops, touch layouts: long-press the drop content.
- Select `Set as pinned drop`.

## User Journey

1. Open an eligible thread and find the posted drop you want to pin.
2. Open that drop's action menu.
3. Select `Set as pinned drop`.
4. Complete auth if prompted.
5. While the request runs, the action switches to `Updating pinned drop...` and
   blocks repeat selection for that drop.
6. On success:
   - you see `Pinned drop updated.`
   - the menu closes
   - the active wave and same-wave drop data refresh
   - non-DM header preview/popover surfaces use the newly pinned drop

## Common Scenarios

- Replace an outdated pinned description drop without editing the old post.
- Promote a newer announcement or rules post into the wave header preview.
- Update the pinned drop from either desktop `More` menus or touch action
  menus.

## Edge Cases

- The action is hidden unless the current session is a connected, non-proxy
  wave admin with a profile handle.
- Logged-out users, proxy sessions, non-admin authors, and other non-admin
  members do not see this action.
- Temporary drops (`temp-*`) cannot be set as the pinned drop.
- The loading state is scoped to the selected drop only.

## Failure and Recovery

- If auth is rejected or canceled, no request is sent and the pinned drop stays
  unchanged.
- If the update fails, an error toast appears using the server message when
  available, otherwise a generic error message.
- On failure, the menu stays open so you can retry from the same drop.

## Limitations / Notes

- This action changes the wave's pinned description drop; it does not pin the
  wave itself in sidebar pinned-wave lists.
- The action is available only from existing posted drops, not from drafts or
  temporary drops.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Description Preview Popover](../header/feature-wave-description-preview-popover.md)
- [Pinned Wave Controls](../sidebars/feature-pinned-wave-controls.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
