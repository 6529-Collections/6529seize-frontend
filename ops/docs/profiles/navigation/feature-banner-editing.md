# Profile Banner Editing

## Overview

Signed-in profile owners can update their profile cover from the profile
header.

The editor has two modes:

- `Gradient`: pick two colors for the cover gradient.
- `Image`: upload a cover image and preview it before saving.

## Location in the Site

- Profile header banner on `/{user}` and `/{user}/<tab>` routes.

## Entry Points

- Open your own profile route while signed in.
- Confirm the profile is editable:
  - the profile has a handle
  - you are viewing your own profile
  - no active profile proxy context
- On desktop, choose `Edit` beside `Preferences` and use the `Profile cover`
  section in the combined profile editor.
- On smaller layouts, use the circular `Edit profile` button and choose
  `Profile cover`.

## User Journey

1. Open your own profile page.
2. Choose `Edit` on desktop, or `Edit profile` -> `Profile cover` on a
   smaller layout. Desktop opens all five profile fields together; the smaller
   layout opens the individual `Edit profile cover` editor.
3. The modal starts in:
   - `Image` mode when the current banner is an image.
   - `Gradient` mode when the current banner is gradient colors.
4. Choose a mode:
   - `Gradient`: use `Background Color 1` and `Background Color 2`.
   - `Image`: click or drag-and-drop a banner file into the uploader and
     confirm the preview.
5. Click `Save`.
6. On success, a `Profile updated.` toast appears, the modal closes, and the
   banner refreshes.

## Common Scenarios

- Users can switch between `Gradient` and `Image` before saving.
- On desktop, `Save` applies all changed profile fields. The smaller cover
  editor saves only the cover and requires a cover change.
- In `Gradient` mode, changing either color counts as a change.
- In `Image` mode, select an image before saving. The smaller editor keeps
  `Save` disabled until a new file is selected.
- If the current banner already has an image, `Image` mode shows the current
  banner preview on open.
- If the current banner is an image, switching to `Gradient` immediately counts
  as a change. Saving replaces the image with gradient colors.
- Close actions are available when a save is not in progress. On desktop,
  closing with unsaved profile changes asks whether to discard them.

## Edge Cases

- Unsupported file formats show `Invalid file type`.
- Files larger than `2MB` show `File size must be less than 2MB`, briefly shake
  the upload area, and block save.
- While dragging, the drop target highlights until drag leaves or the file is
  dropped.
- The file picker allows selecting the same file again after a failed attempt.
- While saving, close actions are disabled so users cannot dismiss the modal
  mid-save.

## Failure and Recovery

- Desktop failures keep the dialog and unsaved changes open with an error.
  If another field already saved, retry saves only the remaining changes.
- In the smaller cover editor, missing authentication shows:
  `You must be logged in to save settings`.
- Upload and profile-save failures leave the editor open. The smaller editor
  reports these failures in a toast; desktop shows them in the dialog.
- Fix the issue (for example, pick a valid file) and retry with `Save`.

## Limitations / Notes

- Banner editing appears only on your own profile when the profile has a
  handle.
- Profile editing is hidden while acting through an active profile proxy.
- Banner uploads are capped at `2MB`.
- Accepted upload formats are `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP`.
- Image mode does not include crop or transform tools.
- Saving in `Image` mode clears `banner_2`; gradient second color is used only
  in `Gradient` mode.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
