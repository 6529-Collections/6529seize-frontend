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
- Direct-message thread: `/messages?wave={waveId}`
- Thread footer composer actions row (`Post` / `Drop`)

## Entry Points

1. If the composer shows a `Post` / `Drop` toggle, switch to `Drop`.
2. Open composer actions and select `Add metadata`.
3. On narrow rows, select the chevron first, then `Add metadata`.
4. In `Drop` mode with required metadata configured, select the `Metadata`
   requirement chip to reopen the panel.

`Post` mode does not show `Add metadata` and does not expose the metadata
editor.

## User Journey

1. If available, switch the thread composer from `Post` to `Drop`.
2. Open composer actions and select `Add metadata`.
3. Add or review metadata rows, then fill the values you want to submit.
4. Submit from `Drop`, or switch back to `Post` to keep writing with the same
   populated metadata attached to the draft.

## Common Scenarios

- Add required metadata for a participatory submission before sending.
- Reopen the metadata panel from the `Metadata` requirement chip in `Drop`
  mode.
- Submit a metadata-only draft when at least one metadata value is populated.
- Fill metadata in `Drop`, then switch back to `Post` to continue a chat-style
  draft without reopening the panel.

## Metadata Row Behavior

- In `Drop` mode, required metadata rows are preloaded from wave settings.
- Required keys are locked and required rows cannot be removed.
- A required value is treated as missing only when it is `null`, `undefined`,
  or `""`.
- Numeric required values accept `0`, negative numbers, and decimals.
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
- Requirement chips render only in `Drop` mode after the draft is already
  submittable.
- `Metadata` chip opens the metadata panel in `Drop` mode. `Media` chip opens a
  file picker.

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

- `Add new` custom rows currently do not produce submit-ready metadata values
  and are excluded from the metadata payload.
- `Post` mode hides the `Add metadata` action and does not expose the metadata
  editor.
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
