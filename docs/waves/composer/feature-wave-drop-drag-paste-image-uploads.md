# Wave Drop Composer Drag-and-Paste Image Uploads

## Overview

The wave composer supports dragging and pasting image files directly into the body
editor. Dropped/pasted images are uploaded automatically and rendered inline as
the image placeholder transitions to a remote image URL.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}`
- Full composer at `/waves/create`
- Wave description composer surfaces that use the same editor

## Entry Points

- Open a wave, DM, or wave creation composer.
- Focus the body editor.
- Drop an image file onto the editor or paste an image from the clipboard.

## User Journey

1. Trigger drag/drop or paste with one or more files while focus is in the body
   editor.
2. For supported image files, the editor inserts a temporary loading image block
   at the insertion point.
3. Each image uploads through the wave-drop multipart media pipeline.
4. On success, the loading placeholder is replaced with the final uploaded image
   URL.
5. On upload failure, that specific placeholder is removed.

## Common Scenarios

- Pasting screenshots or copied image files into the composer.
- Dropping a single image or a small set of images into the editor.
- Inserting multiple images; each accepted image is processed individually.

## Edge Cases

- The drag/paste handler only accepts image files with types from the image
  pipeline (`image/*`, `image/heic`, `image/heif`, `image/gif`, `image/webp`).
- If no accepted images are found in the dropped/pasted set, the composer shows
  a toast: `Unsupported file type for Drag & Drop / Paste.`
- If an upload fails during that path, the loading image node is removed and the
  editor does not keep a broken placeholder.
- Empty-file and oversized-file failures also remove the temporary placeholder;
  this path does not show a per-image inline error row.
- The path does not surface upload progress in the composer; feedback is limited to
  placeholder replacement/removal behavior.

## Failure and Recovery

- If a file is rejected as unsupported, use a supported image type and retry the
  drop or paste.
- If an upload placeholder disappears, retry with a smaller non-empty file, or
  use the Upload Media control for a clean retry.
- For oversized or empty files, re-choose a valid image before re-uploading.

## Limitations / Notes

- `multiPartUpload` enforces a hard `500 MB` max file size and blocks empty files
  in this upload path.
- This path is image-only and does not apply non-image media drag/paste flows.
- Pasted/dragged image acceptance can differ from the media-selector control, which
  has a broader MIME target.
- The drag/paste path uses placeholder replacement/removal feedback rather than
  per-file progress or detailed inline error panels.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Curation URL Submissions](feature-curation-url-submissions.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Docs Home](../../README.md)
