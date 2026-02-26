# Update Wave Picture

## Overview

Signed-in users with edit rights can update a wave picture from the wave header.

When allowed, the header avatar area shows an edit control that opens an update modal with an image uploader.

## Location in the Site

- Wave header on wave views where the header avatar is shown.
- Desktop and mobile wave detail flows where the header `WaveHeader` component is used.

## Entry Points

- Open a wave you can edit and view its header image.
- Trigger the picture edit control from the avatar area.

## User Journey

1. Open the wave and locate the wave avatar in the header.
2. Select the edit control to open `Update wave picture`.
3. Choose a new file by clicking the upload box or using drag-and-drop.
4. Confirm file preview appears in the uploader panel.
5. Select `Save` to upload and apply the new picture.
6. On success, the modal closes and the header picture updates.

## Common Scenarios

- `JPG`, `JPEG`, `PNG`, `GIF`, and `WEBP` are accepted file types.
- The file size limit is 10MB.
- `Save` remains disabled until a valid file is selected.
- `Cancel`, clicking outside the modal, or pressing `Escape` closes without saving.

## Edge Cases

- Unsupported file formats display `Invalid file type`.
- Files above 10MB display `File size must be less than 10MB`.
- If authentication fails at save time, users see `Failed to authenticate`.
- If upload or API update fails, users see an error toast with server text or a fallback
  `Failed to update wave picture`.

## Failure and Recovery

- If upload or update fails, users can retry after correcting the file and selecting `Save` again.
- If authentication was lost, users must sign in and reopen the modal.
- If the form stays unresponsive, close and reopen the wave picture modal to retry.

## Limitations / Notes

- The edit control is available only when `canEditWave` conditions are met:
  wave owner, authenticated and not in proxy profile mode, or explicit wave edit eligibility.
- The modal used here does not provide in-modal file removal or image cropping controls.
- If no new file is selected, save is disabled and no request is sent.

## Related Pages

- [Waves Header Index](README.md)
- [Wave Header and Avatar Access](../../profiles/navigation/feature-profile-picture-editing.md)
- [Wave Right Sidebar Controls](../sidebars/README.md)
- [Wave Right Sidebar Group and Curation Management](../sidebars/feature-right-sidebar-group-management.md)
