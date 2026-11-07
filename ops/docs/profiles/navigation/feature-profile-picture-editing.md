# Profile Picture Editing

## Overview

On your own profile, you can update the header profile picture.
The editor supports one source at a time:

- one selected meme
- one uploaded image file

Desktop includes this field alongside the other profile fields. Smaller layouts
keep the individual picture editor.

## Location in the Site

- Profile header avatar on:
  - `/{user}`
  - `/{user}/<tab>`

## Entry Points

- Open your own profile route.
- The profile is editable only when:
  - the profile has a handle
  - you are viewing your own profile
  - no active profile proxy context
- On desktop, choose `Edit` beside `Preferences` and use the `Profile picture`
  section in the combined profile editor.
- On smaller layouts, use the circular `Edit profile` button and choose
  `Profile picture`.

## User Journey

1. Open your own profile and choose `Edit` on desktop, or
   `Edit profile` -> `Profile picture` on a smaller layout.
2. The modal opens. A saved or selected profile picture appears inside the
   `Upload image` area, below Meme search, without a separate preview row.
3. Choose one source:
   - `Select Meme` search is visible immediately above the upload control,
     separated by `or`. Desktop and smaller layouts use the same compact field.
   - On desktop, you can start typing while the Meme list loads; results use
     the text you have already entered when they arrive.
   - `Upload image` supports choosing a file or dragging and dropping it.
     Both choices stay available after selecting an image, so you can switch sources.
4. Click `Save` on desktop (which also saves other changed profile fields), or
   `Save PFP` in the individual picture editor.
5. On success, a `Profile updated` toast appears, the modal closes, and the
   header image refreshes.

## Common Scenarios

- Meme search matches case-insensitive `#<id> <name>` text.
- Selecting a meme clears any selected file.
- Selecting a file clears any selected meme.
- The individual editor keeps `Save PFP` disabled until a source is selected.
  Desktop enables `Save` when any profile field has a pending valid change.
- Upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP`.
- While dragging a file over the upload area, the drop target highlights.
- On desktop, closing with unsaved changes asks whether to discard them.
  The individual picture editor retains its existing `Cancel` action.

## Edge Cases

- If meme search has no matches, the dropdown opens with no rows.
- Desktop announces Meme loading and offers `Try again` if the list fails.
  In the smaller individual editor, an unavailable list opens with no rows.
- If an unsupported file type is chosen, users see `Invalid file type`.
- If a local file exceeds 2MB, the upload panel shows:
  `File size must be less than 2MB`.
- The file picker resets after each attempt, so users can select the same file
  again.
- While saving, action buttons show progress and prevent duplicate submission.
  Desktop also disables close actions. The smaller individual editor retains
  its existing backdrop and Escape dismissal behavior.

## Failure and Recovery

- Desktop failures keep unsaved changes in the dialog with an error. If a
  selected Meme already saved before another field failed, retry preserves it
  and saves only the remaining changes.

### Individual Picture Editor

- Failed authentication shows:
  `You must be logged in to save settings`.
- If no source is selected at save time, users see:
  `You must select an image`.
- If the app cannot reach the upload server, users see:
  `Can't reach image upload server. Please try again.`
- If upload is blocked by server policy (`403`), users see:
  `Upload was blocked by the server (403). Please try again later.`
- If the server rejects file size (`413`), users see:
  `Image is too large; max 2MB.`
- For other upload/save failures, users see either the returned error or:
  `Upload failed. Please try again.`
- After a failed save, the editor stays open for retry. The smaller individual
  editor can still be dismissed with backdrop click or `Escape`.

## Limitations / Notes

- Editing is available only on your own profile when the profile has a handle
  and no active profile proxy context.
- The editor supports one source at a time (meme or uploaded file).
- The modal does not include crop or transform controls.
- Maximum upload size is 2MB.
- Uploaded files go to the 6529 API, which checks the file's contents and
  pins the image on IPFS. A file whose contents are not a PNG, JPEG, GIF or
  WebP image is rejected whatever its name, and the editor shows the server's
  message.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Profile Banner Editing](feature-banner-editing.md)
