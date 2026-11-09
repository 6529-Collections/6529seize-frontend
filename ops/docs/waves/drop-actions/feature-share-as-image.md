# Share Posts as Image

## Overview

`Share as image` turns a run of posts from a wave or direct message into a PNG
for sharing elsewhere. Unlike a screenshot, the image never shows the viewer's
time zone, phone status bar, unread line, badges, profile button or message
box. It is made on the device; nothing is uploaded.

## Location in the Site

- Desktop: a post's `More actions` menu (`⋮`) > `Share as image`.
- Touch: long-press a post > `Share as image`.
- Available in wave and direct-message conversations (`/waves/{waveId}`,
  `/messages/{waveId}`). Not offered in the single-post overlay.

## User Journey

1. Open `Share as image` from a post. That post is the first post.
2. Select another post to set the last one; every loaded post between them is
   included. Selecting the first post again keeps only it. One image holds up
   to 20 posts; a longer range shows a message and disables `Next`.
3. Select `Next` to open the options and preview, or `Cancel` (or press
   `Escape`) to stop.
4. Choose how times appear:
   - `UTC` (default): the same for everyone, labelled `UTC`.
   - `Time since first post`: `+0 min`, `+2 min`, and so on.
   - `Hide times`: the date stays in the header.
   - `Another time zone`: any IANA zone, including the device's own zone,
     which shows a warning that the image would reveal it.
5. Choose whether to include the wave name and date, and reactions.
6. `Copy image` (where the browser supports it), `Download image`, or
   `Share…` (system share sheet on phones and in the app). `Copy text` copies
   the posts as text with the same times as the image.

## What the Image Contains

- Wave picture, name and the date in the chosen zone (optional).
- Each post's author picture, handle, level, time label, text, first image
  and reaction counts (optional). Videos and files show a "not shown" note.
- Never: the viewer's reaction highlight, unread line, badges, profile button,
  message box, drafts or phone status bar.

The PNG is 1080 pixels wide. The file name uses the wave name and the UTC date
of the first post; for direct messages and private waves it is
`6529-posts-{date}.png`. Private conversations show a reminder before sharing.

## Edge Cases and Recovery

- Images the browser cannot read show as dark placeholders, with a warning.
- If the image cannot be made, nothing is shared and the action can be tried
  again.
- Browsers that cannot copy images do not show `Copy image`; use
  `Download image` or `Copy text`.

## Related

- [Display Time Zone](../header/feature-display-time-zone.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
