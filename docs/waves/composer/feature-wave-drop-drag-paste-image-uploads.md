# Wave Drop Composer Drag-and-Paste Image Uploads

## Overview

Dropping or pasting image files into the drop editor uploads them immediately
and inserts inline images in the editor content.

This page covers drag/paste image uploads only.

## Location in the Site

- Wave thread composer: `/waves/{waveId}`
- Direct-message thread composer: `/messages?wave={waveId}`
- Create-wave `Description` step: `/waves/create`
- Create-wave modal flows that reuse the same `Description` step

## Entry Points

- Open a supported composer/editor surface.
- Keep focus in the body editor.
- Drop image files into the editor or paste image files from the clipboard.

## What Happens

1. The handler reads dropped/pasted files and keeps accepted image MIME types.
2. If none are accepted, the app shows
   `Unsupported file type for Drag & Drop / Paste.` and stops.
3. For each accepted image, the editor inserts a temporary loading image node.
4. Each accepted image uploads independently through `drop-media` multipart
   upload endpoints.
5. On success, that loading node is replaced with the uploaded image URL.
6. On failure, that loading node is removed.

## Rules and Limits

- Accepted types use `image/*` matching, with explicit entries that include
  `image/heic`, `image/heif`, `image/gif`, and `image/webp`.
- Upload rejects empty files.
- Upload rejects files larger than `500 MB`.

## Feedback Model

- No per-image progress bar in the editor for drag/paste uploads.
- No inline row-level failure message for a single failed image upload.
- Drag/paste uploads do not add files to the attachment tray.

## Edge Cases

- Mixed file sets: accepted images upload; unsupported files are ignored when
  at least one image is accepted.
- Multi-image batches: each image can succeed or fail independently.

## Failure and Recovery

- Unsupported-type toast: retry with image files.
- Loading image disappears: retry with a smaller, non-empty image.
- For audio/video or explicit file-queue handling, use `Upload a file`.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Docs Home](../../README.md)
