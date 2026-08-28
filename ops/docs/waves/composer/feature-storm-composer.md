# Storm Composer

## Overview

The storm composer builds one post from multiple ordered parts. Saved parts sit
in a separate `Storm draft` workspace above the current editor, so they do not
look like messages that have already been posted.

The primary action always describes the next result: `Add part`, `Save changes`,
or `Post storm`. An empty Storm draft shows a disabled `Add part` action until
the first part has valid text or media.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}`
- Thread footer composer on desktop and mobile

## Entry Points

1. Open the composer actions if they are collapsed.
2. Select `Storm` in the compact composer or `Break into storm` in the expanded
   composer.
3. The private `Storm draft` workspace opens immediately with `0 parts` and the
   editor labelled `Write part 1`.

If the editor already contains valid text or media, selecting the Storm action
saves that content as part 1 instead. Poll and Storm cannot be started at the
same time. The active Storm draft spans the composer width and
uses a bottom divider to separate saved parts from the current input instead of
nesting the draft inside another card. Blue is reserved for the Storm icon,
left accent, and part-count badge; the section, title, saved-part rows, content,
and controls use the app's neutral iron palette.
In the main wave composer, the section background and dividers extend through
the composer's outer padding while the draft content keeps the input alignment.

## User Journey

1. Select the Storm action to open the private `Storm draft` workspace.
2. Write part 1 in the editor labelled `Write part 1`.
3. Select `Add part` to save it. Continue with each following numbered part.
4. Leave the current editor empty and select `Post storm` to publish all saved
   parts in their displayed order.

Desktop users can use `Enter` for the primary action. With current content it
adds or saves a part; after at least one part is saved, using it with an empty
current editor posts the storm.

## Common Scenarios

- Select `Edit` on a saved part to load it into the main editor, then select
  `Save changes`. `Cancel edit` keeps the original saved version.
- Use the up and down controls to move a saved part earlier or later.
- Remove an individual saved part with its remove control.
- On mobile and in the app, each saved part places its 44px edit, move, and
  remove controls in a separate row below the content so they remain easy to
  reach without squeezing the draft text.
- Saved parts use one numbered marker for orientation. The editor placeholder
  communicates which part comes next without repeating that prompt above it.
- Select `Discard`, then confirm `Discard draft`, to clear every saved part and
  the current unsaved part.
- When the Storm has no saved or unsaved content, select `Close` to leave Storm
  mode immediately without a confirmation step.
- A media-only part is valid and appears as `Media-only part` in the draft.

## Edge Cases

- Blank or whitespace-only text is not saved as a part.
- An empty Storm draft cannot be posted; add at least one valid part first.
- Editing a saved part is available only when the current editor has no unsaved
  text or media. Add or clear the current part first.
- Part controls are unavailable while an edit or submission is in progress.
- Removing the final saved part keeps the empty Storm draft open so a new part
  can be written or the draft can be discarded.
- The storm workspace is local draft state. Other users cannot see its saved
  parts until the storm is posted.

## Failure and Recovery

- If `Add part` is disabled, wait for inline media uploads to finish or shorten
  the storm so its total text stays below the supported limit.
- If `Post storm` is not shown, save or clear the current part first.
- If `Edit` is unavailable, add or clear the current unsaved part.
- On narrow layouts, this recovery instruction appears above the saved parts
  while Edit is unavailable. Each unavailable Edit control also references the
  instruction for assistive technology.
- If authentication, upload, signature, or submission fails, correct the error
  and retry from the restored draft.
- If a part is removed accidentally, rewrite it before posting; individual
  removals do not have an undo action.

## Limitations / Notes

- Storm text-length rules are documented in
  [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md).
- Reordering uses explicit move controls rather than drag and drop.
- The storm is submitted as one drop with multiple parts. After posting, use
  the previous and next controls on the drop to read each part.
- Create-wave `Description` uses a different editor flow.

## Related Pages

- [Wave Composer Index](README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md)
- [Wave Drop Composer Drag-and-Paste Image Uploads](feature-wave-drop-drag-paste-image-uploads.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
