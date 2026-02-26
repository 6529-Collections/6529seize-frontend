# Profile Banner Editing

## Overview

Signed-in users can update their own profile cover from the profile header.
The editor supports two modes:

- `Gradient`: pick two hex colors and apply them as the banner gradient.
- `Image`: upload a cover image and preview it before saving.

## Location in the Site

- Profile header banner on routes under `/{user}` and `/{user}/<tab>`

## Entry Points

- Open your own profile while signed in and not in proxy-profile mode.
- Click the edit control on the banner area.

## User Journey

1. Open your own profile page.
2. Click the banner edit control (pencil overlay) to open `Edit profile cover`.
3. Choose a mode:
   - `Gradient`: use color controls to pick two colors.
   - `Image`: click or drag-and-drop a banner file into the uploader.
4. Confirm the preview, then choose `Save`.
5. On success, the modal closes and the profile updates with your new banner.

## Common Scenarios

- Users can switch between `Gradient` and `Image` modes at any time before saving.
- In `Gradient` mode, both colors persist as banner settings.
- In `Image` mode, a selected image is shown in the upload preview immediately.
- If `Image` is selected when there is no existing banner image, save requires an image file.
- `Save` is enabled only when there are pending banner changes.

## Edge Cases

- Unsupported file formats show `Invalid file type`.
- Files larger than `2MB` show an inline size error and block save.
- While dragging, the drop target highlights; after a too-large upload attempt the input briefly shakes.
- If upload fails, a toast error is shown and the modal stays open.
- If the current mode is `Image` and no file is chosen on a profile with no image, save is blocked.

## Failure and Recovery

- If upload or banner save fails, correct the upload and retry with `Save`.
- If authentication is missing when saving, the save flow stops with
  `You must be logged in to save settings`.
- If the modal closes unintentionally before saving, reopen it from the same banner.

## Limitations / Notes

- Banner uploads are capped at `2MB`.
- Accepted upload formats are `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP`.
- There is no in-editor crop or in-modal image transform step.
- `Banner_2` is only used when using `Gradient` mode.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Tabs](feature-tabs.md)
