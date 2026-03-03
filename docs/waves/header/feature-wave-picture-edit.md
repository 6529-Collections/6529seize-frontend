# Update Wave Picture

## Overview

Edit-eligible users can update a wave picture from the header avatar.

The avatar pencil opens `Update wave picture` with image upload and preview.

## Location in the Site

- Wave `About` header on:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- The avatar edit control is hover-revealed in hover-capable layouts.

## Entry Points

- Open a wave where `canEditWave` is true (author or admin-eligible, connected,
  non-proxy).
- Hover the avatar and select `Edit wave picture`.

## User Journey

1. Open wave `About`.
2. Select the avatar pencil.
3. In `Update wave picture`, upload by click or drag-and-drop.
4. Confirm preview.
5. Select `Save`.
6. Complete auth.
7. The app uploads media, updates wave data, closes modal, and refreshes the avatar.

## Common Scenarios

- Accepted formats: `JPG`, `JPEG`, `PNG`, `GIF`, `WEBP`.
- Max file size: `10MB`.
- `Save` stays disabled until a valid file is selected.
- `Cancel`, outside click, or `Escape` closes without saving.

## Edge Cases

- Users without edit permission do not see the avatar edit control.
- On touch-only layouts, hover-only controls might not be available.
- Unsupported files show `Invalid file type`.
- Oversized files show `File size must be less than 10MB`.
- Failed auth shows `Failed to authenticate`.
- Upload/update failures show API text or fallback `Failed to update wave picture`.

## Failure and Recovery

- If save fails, keep modal open, select a valid file again if needed, and retry.
- If auth failed, re-authenticate and retry `Save`.
- If modal state looks stale, close and reopen before retrying.

## Limitations / Notes

- The modal uses wave update permissions from `canEditWave`.
- There is no crop flow and no in-modal remove-file action.
- If no new file is selected, no update request is sent.

## Related Pages

- [Wave Header Index](README.md)
- [Wave Header Controls](feature-wave-header-controls.md)
- [Wave Notification Controls](../sidebars/feature-wave-notification-controls.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
