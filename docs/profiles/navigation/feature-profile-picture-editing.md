# Profile Picture Editing

## Overview

Signed-in users can update their own profile picture from the profile header by
choosing either one of their memes or an uploaded image file.

Profile picture editing is separate from banner cover editing.

## Location in the Site

- Profile header avatar area on profile routes under `/{user}` and
  `/{user}/<tab>`

## Entry Points

- Open your own profile route while signed in to a profile handle.
- Select the profile picture edit control on the header avatar.

## User Journey

1. Open your own profile and select the avatar edit control.
2. In the modal, choose one source:
   - search and select a meme, or
   - upload an image file by click or drag-and-drop.
3. Review the preview shown in the upload panel.
4. Select `Save PFP`.
5. A success toast (`Profile updated`) appears and the modal closes.

## Common Scenarios

- Meme selection uses a search field that matches meme ID/name text.
- Upload accepts `JPEG`, `JPG`, `PNG`, `GIF`, and `WEBP`.
- Selecting a meme clears a previously selected file.
- Selecting a file clears a previously selected meme.
- `Save PFP` stays disabled until at least one valid selection is made.
- Selecting `Cancel`, clicking outside the modal, or pressing `Escape` closes
  the modal without saving.

## Edge Cases

- If the meme search has no matches, no meme rows are shown until the query is
  changed.
- If a local file exceeds 2MB, the upload panel shows an inline size error.
- If an unsupported file type is chosen, users see an `Invalid file type` toast.
- The file picker allows selecting the same file again after a failed attempt.

## Failure and Recovery

- If the user is not authenticated at save time, the flow stops with:
  `You must be logged in to save settings`.
- If no image source is selected at save time, users see:
  `You must select an image`.
- If the app cannot reach the upload server, users see:
  `Can't reach image upload server. Please try again.`
- If the upload is blocked by server policy (`403`), users see:
  `Upload was blocked by the server (403). Please try again later.`
- If the server rejects file size (`413`), users see:
  `Image is too large; max 2MB.`
- For other upload failures, users see either the returned server error or:
  `Upload failed. Please try again.`

## Limitations / Notes

- Profile picture editing is available only for your own profile and is not
  available while acting through an active profile proxy.
- The modal does not include in-place crop/edit controls; saved output reflects
  the selected meme image or uploaded file.
- Maximum upload size is 2MB.

## Related Pages

- [Profiles Navigation Index](README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Tabs](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Profile Banner Editing](feature-banner-editing.md)
