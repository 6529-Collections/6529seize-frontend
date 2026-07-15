# Storm Composer

## Overview

The storm composer builds one post from multiple ordered parts. Saved parts sit
in a separate `Storm draft` workspace above the current editor, so they do not
look like messages that have already been posted.

The primary action always describes the next result: `Add part`,
`Save changes`, or `Post storm`.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}`
- Thread footer composer on desktop and mobile

## Entry Points

1. Write the first part in the standard thread composer.
2. Open the composer actions if they are collapsed.
3. Select `Break into storm`.

`Break into storm` is available only when the current part has text or media
and stays within the storm length limit.

## User Journey

1. Write the first part and select `Break into storm`.
2. Review the saved part in the private `Storm draft` workspace.
3. Write the next part in the editor labelled `Write part 2`.
4. Select `Add part` to save it. Continue until the storm is complete.
5. Leave the current editor empty and select `Post storm` to publish all saved
   parts in their displayed order.

Desktop users can use `Enter` for the primary action. With current content it
adds or saves a part; with an empty current editor it posts the storm.

## Common Scenarios

- Select `Edit` on a saved part to load it into the main editor, then select
  `Save changes`. `Cancel edit` keeps the original saved version.
- Use the up and down controls to move a saved part earlier or later.
- Remove an individual saved part with its remove control.
- Select `Discard`, then confirm `Discard draft`, to clear every saved part and
  the current unsaved part.
- A media-only part is valid and appears as `Media-only part` in the draft.

## Edge Cases

- Blank or whitespace-only text is not saved as a part.
- Editing a saved part is available only when the current editor has no unsaved
  text or media. Add or clear the current part first.
- Part controls are unavailable while an edit or submission is in progress.
- Removing the final saved part exits storm mode; any current editor content
  remains available as a regular single-part draft.
- The storm workspace is local draft state. Other users cannot see its saved
  parts until the storm is posted.

## Failure and Recovery

- If `Add part` is disabled, wait for inline media uploads to finish or shorten
  the storm so its total text stays below the supported limit.
- If `Post storm` is not shown, save or clear the current part first.
- If `Edit` is unavailable, add or clear the current unsaved part.
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
