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
- Click the banner edit overlay (`Edit banner`).

## User Journey

1. Open your own profile page.
2. Click the banner edit overlay to open `Edit profile cover`.
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
- `Save` is enabled only when the active mode has pending changes.
- In `Gradient` mode, changing either color enables `Save`.
- In `Image` mode, `Save` stays disabled until a new file is selected.
- If the current banner already has an image, `Image` mode shows the current
  banner preview on open.
- If the current banner is an image, switching to `Gradient` immediately counts
  as a change. Saving replaces the image with gradient colors.
- `Cancel`, outside-click, and `Escape` close the modal when a save is not in
  progress.

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

- If authentication is missing when saving, users see:
  `You must be logged in to save settings`.
- If image upload fails, an error toast appears (server message or
  `Failed to upload banner image`) and the modal stays open.
- If the profile update request fails, an error toast appears and no banner
  change is applied.
- Fix the issue (for example, pick a valid file) and retry with `Save`.

## Limitations / Notes

- Banner editing appears only on your own profile when the profile has a
  handle.
- The edit overlay is hidden while acting through an active profile proxy.
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
