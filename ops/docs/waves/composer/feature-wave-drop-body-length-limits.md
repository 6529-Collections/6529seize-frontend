# Wave Drop Composer Body Length Limits and Storm Rules

## Overview

The standard thread composer enforces four text-length rules:

- Each part is capped at `25,000` UTF-16 code units.
- Each part is also capped at `65,535` UTF-8 bytes so it fits the persisted
  text field for every supported script and emoji combination.
- A Storm may contain up to `50,000` UTF-16 code units across all of its parts.
- When a storm already has at least one part, submit is blocked if current
  draft text is over `240` characters.

These rules apply to non-curation thread composer flows in both `Post` and
`Drop` modes.

## Location in the Site

- Wave threads: `/waves/{waveId}`
- Direct-message threads: `/messages/{waveId}`
- Thread footer composer on desktop and mobile

## Entry Points

1. Open a wave or DM thread composer and select the Storm action.
2. Write the first part and use the primary `Add part` action to save it.
3. Continue adding later parts, then use `Post storm` from an
   empty current editor to publish the completed storm.

## Rules in Practice

- A single-part post/drop can submit above `240` UTF-16 units, up to the
  per-part unit and byte limits.
- Storm add uses the `50,000` total-text rule, not the `240` submit rule.
- With existing storm parts, submit can only finalize when current draft text is
  `240` chars or less.
- When current content is eligible, the primary action is `Add part`; it saves
  the current draft instead of publishing the storm.
- To finalize and send the storm, submit from an empty current draft.
- Blank or whitespace-only text is not saved as a storm part. Media-only parts
  remain valid.

## Common Scenarios

- Two `25,000`-unit ASCII parts can form one Storm at the total limit. Text
  that uses more UTF-8 bytes per unit may reach the per-part byte limit first.
- In storm mode, a `500`-character draft can still be added with `Add part`
  (if total text stays at or below `50,000`), but submit stays blocked until the
  draft is shortened or cleared.
- In `Drop` mode, required media/metadata can still block submit even when
  length checks pass.

## Server Payload Limits

The server also checks the structure of new drops and edits, including wave
description drops and competition submissions:

- At most `250` parts per drop.
- At most `20` media items and `20` attachments per part, with at most `100`
  media items and `100` attachments across the whole drop.
- At most `100` metadata entries, `500` user mentions, `100` wave mentions,
  and `500` NFT references per drop.
- Media URLs are limited to `2,000` characters; MIME types, media upload IDs,
  and attachment IDs to `100`; NFT tokens to `250`; NFT names to `500`; and
  mentioned wave names to `250`.

Requests above these limits are rejected before the drop is saved. Existing
drops remain readable; editing them applies the current limits. The composer
file tray still allows eight files across all Storm parts, which is below the
server's media and attachment limits.

## Failure and Recovery

- If storm add is disabled, shorten current draft text or keep it as a
  single-part submission.
- If submit is blocked in storm mode, shorten current draft text to `240` or
  less, or add that draft as a part and then submit from an empty draft.
- If submit is still blocked in `Drop` mode, complete required media/metadata
  and retry.
- If auth/signature/upload fails, fix the error and retry from the current
  draft state.
- If the server reports too many parts, media, attachments, metadata entries,
  mentions, or NFT references, reduce that field and retry. Split a large Storm
  into separate posts if needed.

## Limitations / Notes

- Composer text limits and server payload limits both apply. Upload file-size
  and format limits are separate.
- This page covers standard thread composer behavior, not curation URL-only
  composer behavior.
- Thread and DM submissions from this composer send `title: null`.
- Composer access and eligibility states are documented in
  [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md).
- Create-wave `Description` uses a different editor flow in
  [Wave Creation Description Step](../create/feature-description-step.md).

## Related Pages

- [Wave Composer Index](README.md)
- [Storm Composer](feature-storm-composer.md)
- [Waves Index](../README.md)
- [Wave Drop Composer Enter-Key Behavior](feature-enter-key-behavior.md)
- [Wave Drop Composer Metadata Submissions](feature-metadata-submissions.md)
- [Wave Curation URL Submissions](feature-curation-url-submissions.md)
- [Wave Chat Composer Availability](../chat/feature-chat-composer-availability.md)
- [Wave Drop Markdown Blank-Line Preservation](feature-markdown-blank-line-preservation.md)
- [Wave Creation Description Step](../create/feature-description-step.md)
- [Docs Home](../../README.md)
