# Wave Drop Composer Body Length Limits and Storm Rules

## Overview

The standard thread composer enforces three text-length rules:

- Body input is capped at `25,000` characters.
- Storm add is blocked when `existing storm text + current draft text >= 24,000`.
- When a storm already has at least one part, submit is blocked if current
  draft text is over `240` characters.

These rules apply to non-curation thread composer flows in both `Post` and
`Drop` modes.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages?wave={waveId}` (no `/messages/{waveId}`
  route)
- Thread footer composer on desktop and mobile

## Entry Points

1. Open a wave or DM thread composer and type in the body input.
2. Use the storm button (`Break into storm` / `Add a part`) to split content.
3. Use submit (`Post` / `Drop`) or desktop `Enter` submit behavior.

## Rules in Practice

- A single-part post/drop can submit above `240` chars, up to `25,000`.
- Storm add uses the `24,000` total-text rule, not the `240` submit rule.
- With existing storm parts, submit can only finalize when current draft text is
  `240` chars or less.
- When submit is enabled and existing storm parts plus current draft content are
  present, submit adds the current draft as another part (it does not finalize
  the storm).
- To finalize and send the storm, submit from an empty current draft.

## Common Scenarios

- A `24,500`-char draft can submit as one part, but cannot be split into storm.
- In storm mode, a `500`-char draft can still be added with the storm button
  (if total text stays under `24,000`), but submit stays blocked until the
  draft is shortened or cleared.
- In `Drop` mode, required media/metadata can still block submit even when
  length checks pass.

## Failure and Recovery

- If storm add is disabled, shorten current draft text or keep it as a
  single-part submission.
- If submit is blocked in storm mode, shorten current draft text to `240` or
  less, or add that draft as a part and then submit from an empty draft.
- If submit is still blocked in `Drop` mode, complete required media/metadata
  and retry.
- If auth/signature/upload fails, fix the error and retry from the current
  draft state.

## Limitations / Notes

- Limits here are text-only. Media limits are separate.
- This page covers standard thread composer behavior, not curation URL-only
  composer behavior.
- Thread and DM submissions from this composer send `title: null`.
- Composer access and eligibility states are documented in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).
- Create-wave `Description` uses a different editor flow in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Curation URL Submissions](feature-curation-url-submissions.md)
- [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
