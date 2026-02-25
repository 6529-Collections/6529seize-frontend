# Wave Drop Composer Metadata Submissions

## Overview

Wave drop composer metadata can be submitted as standalone content. A drop can
be sent with populated metadata even when the editor body and file uploads are
empty.

## Location in the Site

- Wave detail threads: `/waves/{waveId}`
- Direct-message wave threads: `/messages?wave={waveId}`
- Drop/post composer row and metadata panel in the thread footer

## Entry Points

- Open a wave thread and use the composer metadata action.
- Open metadata from requirement prompts in drop mode when requirements are
  shown.
- Add custom metadata rows directly from the metadata panel.

## User Journey

1. Open the metadata panel in the composer.
2. Fill one or more metadata values.
3. Leave text and files empty (optional).
4. Submit from the composer.
5. The drop is sent with metadata payload and no visible text/media body.

## Common Scenarios

- Submit structured metadata updates without writing markdown.
- Combine metadata with text/media in a single submission.
- Fill required metadata keys, then submit immediately.
- Use numeric metadata values, including `0`, as valid entered values.

## Edge Cases

- Empty or whitespace-only metadata values do not make the composer submittable
  by themselves.
- Required metadata keys cannot be removed from the metadata panel.
- Metadata rows can be added/removed while composing before submission.
- If current draft content is empty but metadata exists, submission still
  proceeds.

## Failure and Recovery

- Missing required metadata or required media blocks submission until resolved.
- If authentication or required signature is canceled, submission stops and the
  draft remains available.
- If upload/signing/submission errors occur, the composer shows error feedback
  and users can retry.
- If an attached file is empty, the upload is blocked with an upload error and
  users must attach a valid file to continue.
- Multipart upload progress is capped at `0%`–`100%`, so retries do not show
  progress overflow in upload indicators.

## Limitations / Notes

- Submit stays disabled until at least one content source exists (text, media,
  existing parts, or populated metadata).
- Metadata values reset with the rest of composer state after successful
  submission.
- This page covers metadata behavior in the wave composer, not creation-time
  wave requirement setup.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Emoji Shortcodes](feature-emoji-shortcodes.md)
- [Wave Creation Drop Settings](../create/feature-drops-step.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
