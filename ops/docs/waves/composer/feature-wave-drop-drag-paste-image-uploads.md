# Wave Drop Composer Media Uploads

## Overview

Add media with the upload button, by dragging files onto a chat, or by dragging
or pasting them into the text editor. Unsupported files are reported immediately
by name, with the supported formats. Existing text and valid files stay in the
draft.

## Location in the Site

- Wave thread composer and replies: `/waves/{waveId}`
- Direct-message composer and replies: `/messages/{waveId}`
- Create-wave `Description` step: `/waves/create`, including modal flows

## Entry Points

- Choose `Upload a file` or `Upload media` in the composer.
- Drag files onto the chat to add them to the file tray.
- Focus the text editor, then drag or paste images to insert them inline.
  Other supported files go to the file tray.

## User Journey

1. Add files to an available composer.
2. Check any rejection message. It names every unsupported file and lists the
   formats below. Supported files from the same batch can still be added.
3. Wait for image preparation to finish. An inline image shows a loading
   placeholder while uploading. An AVIF selected for the tray uploads and
   processes before its preview appears; the composer shows its progress.
4. Add or edit the message. Sending and continuing a Storm wait for pending
   image preparation to finish.
5. Send the drop, then select its image to open the image viewer.

## Supported Formats and Limits

- Images: PNG, JPG/JPEG, GIF, WebP, and **AVIF still images**.
- Video: MP4, MOV (including `.qt`), and AVI.
- Audio: MP3 (including `.mpeg` audio), WAV, AAC, and OGG.
- 3D: GLB.
- Attachments: PDF and CSV.
- Media files must be non-empty and no larger than **500 MB**.
- PDF files: up to **25 MB** and **100 pages**. CSV files: up to **50 MB**.
- The file tray allows **eight files across the whole drop**, including its
  Storm parts. Excess files are skipped; existing selections are kept.
- AVIF images must contain a single still image, with at most **64 million
  pixels** and no side longer than **16,383 pixels**.

## Common Scenarios

- **Saved an AVIF from a website:** upload the `.avif` file normally. It is
  converted to WebP so that supported browsers and older apps can display it.
  Conversion applies orientation and removes embedded metadata.
- **Adding several files:** a rejected file does not cancel valid files in the
  batch. Duplicate selections and files beyond the count limit are skipped.
- **Pasting a caption and image:** the text is preserved even if the image is
  rejected or its upload fails.
- **Posting to a wave that requires images:** a prepared AVIF counts as an image.
  The wave's other participation requirements still apply.

## Edge Cases

- Uppercase `.AVIF` and AVIF files with an empty or generic browser MIME type
  are accepted. Renaming another file to `.avif`, or an AVIF to `.jpg`, does not
  convert it and is rejected.
- Animated AVIF is unsupported. Export a still image or use GIF for animation.
- HEIC/HEIF, SVG, BMP, TIFF, and JPEG XL are unsupported image uploads.
- A slow upload or processing step keeps the image pending. Text remains
  editable. Leaving the composer cancels pending file preparation.

## Failure and Recovery

- **Unsupported file:** choose a listed format or export the file into one.
  Retrying the unchanged unsupported file will not help.
- **Invalid, empty, oversized, or corrupt image:** the message names the file.
  Choose a complete file within its limits; export a smaller image if needed.
- **Upload or processing failure:** a failed inline placeholder or pending tray
  image is removed. Other text and files remain. Retry a valid file when the
  connection or service recovers.
- **No upload control:** sign in with a profile and check that the wave allows
  you to post. Uploading media does not override wave access rules.

## Limitations / Notes

The format list applies to drop media. Profile pictures, wave pictures, meme
submissions, distribution photos, and Profile CMS have their own upload rules.
Inline images show a loading placeholder rather than a per-image progress bar.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Image Viewer and Scaling](../drop-actions/feature-image-viewer-and-scaling.md)
- [Docs Home](../../README.md)
