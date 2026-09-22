# Wave Drop Composer Metadata Submissions

## Overview

The standard wave composer supports metadata submissions.

- Metadata rows are authored from non-curation `Drop` mode.
- A draft with populated metadata can be submitted with no body text and no
  file uploads.
- If you switch back to `Post` after filling metadata in `Drop` mode, populated
  metadata values stay attached to the current draft.
- Curation `Drop` mode is URL-only and does not use metadata rows.

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages/{waveId}`
- The `Submit drop` dialog and standard composers in `Drop` mode

## Entry Points

1. Select `Submit drop` in the wave header, or enter `Drop` mode where the
   composer offers it.
2. Select the `Add metadata` code icon beside the input. On compact layouts,
   open composer actions first and select `Metadata`.
3. The metadata section opens below the input with any required fields already
   added. It stays hidden until opened, including when metadata is required.

`Post` mode and curation URL composers do not expose the metadata editor.

## User Journey

1. Review any required fields and enter their values. Required field names are
   locked and these rows cannot be removed.
2. Select `Add field` to add an optional field. Focus moves to `Field name`.
3. Enter a name and value, for example `Medium` and `Digital`.
4. Close the section using its heading when finished. The entire section hides;
   values stay in the current draft when reopened from the icon.
5. Submit the drop. Metadata is included with the drop; there is no separate
   save action.

## Common Scenarios

- Add required metadata for a participatory submission before sending.
- Add optional details with `Add field` and remove an optional row with its
  trash button.
- Submit a metadata-only draft when at least one named metadata field has a
  populated value.
- On narrow screens, field names and values stack vertically. In the native
  app, the submit dialog uses the shared keyboard inset and scrolls focused
  fields into view.

## Metadata Row Behavior

- In `Drop` mode, required metadata rows are preloaded from wave settings and
  shown when you open metadata.
- Required keys are locked and required rows cannot be removed.
- A required value is treated as missing only when it is `null`, `undefined`,
  or `""`.
- Numeric required values accept `0`, negative numbers, and decimals.
- Optional fields accept text values. A populated value needs a field name;
  unnamed values show an inline error and block submission.
- Empty unnamed rows are omitted from the submission.
- Every input has a persistent label. Required and numeric fields are identified
  in text.
- Switching from `Drop` to `Post` closes the metadata panel.
- In `Post` mode, required metadata and required media checks are not enforced.
- Switching from `Drop` to `Post` removes only required rows that still have no
  value; filled metadata stays attached to the draft.

## Submit Rules

- Submit stays disabled until at least one content source exists (non-blank
  body text, attached media, existing storm parts, or at least one populated
  metadata value).
- Whitespace-only metadata values do not count as populated metadata content.
- In `Drop` mode, missing required metadata or required media blocks submit.
- A compact informational line is visible as soon as `Drop` mode opens, even
  before the draft has body text. It states what is still required, such as
  `Required: add an image.` or `Required: complete metadata (Medium).`
- The final `Drop` action stays disabled while a required item is missing.
  Adding or editing an individual storm part remains available; requirements
  gate the final storm submission.
- The line is informational. Use the existing upload and metadata controls to
  complete it. Each completed requirement is removed; the line disappears when
  nothing is missing.

## Edge Cases

- Returning to `Post` removes only required rows that still have no value.
- Returning to `Post` keeps populated metadata on the current draft, but the
  metadata editor stays closed until you switch back to `Drop`.
- `Post` mode can submit existing metadata already attached to the draft, but
  it cannot add new metadata rows directly.
- Curation URL composer flows never expose metadata rows.

## Failure and Recovery

- If wallet auth/signature/terms is canceled, submission stops and current
  draft state stays.
- If upload or signing preparation fails, the composer shows an error and keeps
  draft state for retry.
- Upload progress is clamped to `0%`-`100%`.
- Composer state resets once a request is queued.
- If API submission fails after queueing, re-enter metadata/content and submit
  again.
- If you switch back to `Post` and need to change metadata, return to `Drop`
  mode and reopen the metadata panel.

## Limitations / Notes

- `Post` mode does not expose the metadata editor.
- Curation URL composer flows use URL-only submission and do not expose metadata
  rows.
- Composer access/eligibility constraints are documented in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).
- This page covers thread-composer metadata behavior, not wave-creation
  metadata setup.

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Curation URL Submissions](feature-curation-url-submissions.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Body Length Limits and Storm Rules](feature-wave-drop-body-length-limits.md)
- [Wave Creation Drop Settings](../create/feature-drops-step.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
