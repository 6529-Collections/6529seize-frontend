# Profile Picture Editing

## Overview

On your own profile, you can update the header profile picture.
The editor supports one source at a time:

- one selected meme
- one uploaded image file

This flow is separate from banner editing.

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
- Click the avatar edit control (`Edit profile picture`).

## User Journey

1. Open your own profile and click the avatar edit control.
2. The modal opens. If you already have a profile picture, the upload panel shows its preview.
3. Choose one source:
   - `Select Meme`: search and click a meme row.
   - `Upload`: click to choose a file or drag and drop a file.
4. Click `Save PFP`.
5. On success, a `Profile updated` toast appears, the modal closes, and the
   header image refreshes.

## Common Scenarios

- Meme search matches case-insensitive `#<id> <name>` text.
- Selecting a meme clears any selected file.
- Selecting a file clears any selected meme.
- `Save PFP` is disabled until at least one valid source is selected.
- Upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP`.
- While dragging a file over the upload area, the drop target highlights.
- `Cancel` closes the modal when save is not in progress.

## Edge Cases

- If meme search has no matches, the dropdown opens with no rows.
- If the meme list request is unavailable, `Select Meme` opens with no rows.
- If an unsupported file type is chosen, users see `Invalid file type`.
- If a local file exceeds 2MB, the upload panel shows:
  `File size must be less than 2MB`.
- The file picker resets after each attempt, so users can select the same file
  again.
- While save is running, `Cancel` is disabled and `Save PFP` shows a spinner.
- While save is running, backdrop click, outside-click, and `Escape` can still
  close the modal while the request continues.

## Failure and Recovery

- If authentication fails at save time, users see:
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
- After a failed save, the modal stays open so users can retry (unless they
  already closed it with backdrop click or `Escape`).

## Limitations / Notes

- Editing is available only on your own profile when the profile has a handle
  and no active profile proxy context.
- The editor supports one source at a time (meme or uploaded file).
- The modal does not include crop or transform controls.
- Maximum upload size is 2MB.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Profile Banner Editing](feature-banner-editing.md)
