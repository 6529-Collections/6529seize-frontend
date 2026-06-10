# Update Wave Picture

## Overview

Edit-eligible users can change a non-DM wave picture from the `About` avatar.
Selecting the avatar pencil opens `Update wave picture`.

## Location in the Site

- Wave `About` header in right-sidebar surfaces on:
  - `/waves/{waveId}`
  - `/messages/{waveId}`
- Mobile `About` uses the same header component.
- Desktop hover layouts show the pencil overlay when hovering the avatar.
- Touch-only layouts show a small pencil badge on the avatar.

## Availability Rules

- The control renders only on non-direct-message waves when `canEditWave` is
  true.
- `canEditWave` requires:
  - connected profile handle
  - no active proxy session
  - wave author match, or `authenticated_user_eligible_for_admin`

## Entry Points

1. Open an active non-DM wave and switch to `About`.
2. On desktop, hover the avatar. On touch mobile, use the visible pencil badge.
3. Select `Edit wave picture`.

## User Journey

1. Select the avatar pencil to open `Update wave picture`.
2. Add an image by click or drag-and-drop.
3. Confirm the round preview updates.
4. Select `Save`.
5. Complete auth.
6. The app uploads the file, updates `waves/{waveId}`, refreshes wave data, and
   closes the modal.

## Validation and States

- Accepted formats: `JPG`, `JPEG`, `PNG`, `GIF`, `WEBP`.
- Max file size: `10MB`.
- Only the first selected or dropped file is used.
- `Save` stays disabled until a valid file is selected.
- While saving, `Save` stays disabled and shows `Uploading`.
- `Cancel`, outside click, or `Escape` closes without saving.
- There is no in-modal remove action in this flow.

## Errors and Recovery

- No permission or direct-message wave: pencil is not shown.
- Unsupported file: `Invalid file type`.
- Oversized file: `File size must be less than 10MB`.
- Auth failure: `Failed to authenticate`.
- Upload/update failure: API/server message when available, otherwise
  `Failed to update wave picture`.
- On failure, the modal stays open so users can retry `Save`.

## Limitations / Notes

- There is no crop flow.
- No request is sent until a valid file is selected and `Save` is pressed.
- Shared avatar picture/collage fallback rules are documented in
  [Wave Avatar Fallbacks](../../shared/feature-wave-avatar-fallbacks.md).

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Wave Avatar Fallbacks](../../shared/feature-wave-avatar-fallbacks.md)
- [Wave Notification Controls](../sidebars/feature-wave-notification-controls.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
