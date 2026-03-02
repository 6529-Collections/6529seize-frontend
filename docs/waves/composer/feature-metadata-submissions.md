# Wave Drop Composer Metadata Submissions

## Overview

The standard wave composer supports metadata submissions.

- Metadata can be submitted with no body text and no file uploads.
- This applies to non-curation composer flows in both `Post` (chat) and `Drop`
  (participation) modes.
- Curation `Drop` mode is URL-only and does not use metadata rows.

## Location in the Site

- Wave thread: `/waves/{waveId}`
- Direct-message thread: `/messages?wave={waveId}`
- Thread footer composer actions row (`Post` / `Drop`)

## Entry Points

1. Open composer actions and select `Add metadata`.
2. On narrow rows, select the chevron first, then `Add metadata`.
3. In `Drop` mode with required metadata configured, select the `Metadata`
   requirement chip to reopen the panel.

## Metadata Row Behavior

- In `Drop` mode, required metadata rows are preloaded from wave settings.
- Required keys are locked and required rows cannot be removed.
- A required value is treated as missing only when it is `null`, `undefined`,
  or `""`.
- Numeric required values accept `0`, negative numbers, and decimals.
- In `Chat` mode, required metadata and required media checks are not enforced.
- Switching from `Drop` to `Chat` removes only required rows that still have no
  value; required rows with values stay.

## Submit Rules

- Submit stays disabled until at least one content source exists (non-blank
  body text, attached media, existing storm parts, or at least one populated
  metadata value).
- Whitespace-only metadata values do not count as populated metadata content.
- In `Drop` mode, missing required metadata or required media blocks submit.
- Requirement chips render only after the draft is already submittable.
- `Metadata` chip opens the metadata panel. `Media` chip opens a file picker.

## Failure and Recovery

- If wallet auth/signature/terms is canceled, submission stops and current
  draft state stays.
- If upload or signing preparation fails, the composer shows an error and keeps
  draft state for retry.
- Upload progress is clamped to `0%`-`100%`.
- Composer state resets once a request is queued.
- If API submission fails after queueing, re-enter metadata/content and submit
  again.

## Limitations / Notes

- `Add new` custom rows currently do not produce submit-ready metadata values
  and are excluded from the metadata payload.
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
