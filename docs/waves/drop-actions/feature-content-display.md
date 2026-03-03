# Wave Drop Content Display

## Overview

Standard wave drop cards render the full post body inline.
Long posts are not collapsed behind a `Show full post` control, so reading a long
post does not require an in-card expand step.
Markdown formatting, mention rendering, and inline linkification are handled in the
shared drop-content renderer across wave and DM timelines.

In memes-specific drop cards, description text keeps authored newline breaks instead
of collapsing into one paragraph.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Standard wave drop card views that reuse shared drop-content rendering.

## Entry Points

- Open a wave or direct-message thread and scroll to a long post.
- Follow a shared drop link (`?drop=...`) that opens specific post content in
  context.
- Navigate storm parts with previous/next controls on multipart drops.

## User Journey

1. Open a thread and locate a drop.
2. Read full post body inline with no in-card expand action.
3. Interact with markdown text, mentions, and linkified URLs directly from the
   card body.
4. For storm drops, navigate parts with previous/next controls.
5. When click-through is enabled in that context, open drop detail by clicking body
   content after text selection is cleared.

## Common Scenarios

- Long markdown posts render directly in timeline cards.
- Fenced markdown code blocks keep code-style presentation inline.
- Consecutive blank markdown lines remain visually separated.
- Wave mention tokens like `#[wave_name]` become inline links when matching mention
  metadata exists.
- Mention links can include wave avatar icons when profile metadata is present.
- On hover-capable devices, mention links can open a wave summary card.
- Raw `http(s)` URLs are linkified inline when rendering text segments.
- `#[name]` tokens without matching metadata remain plain text.
- Plain-text normalization can render unmatched `#[name]` as `#name`.
- Linkified URLs open in a new tab with safe `rel` attributes.
- URL clicks stop event propagation so they do not trigger parent drop-card
  click-through navigation.
- Selecting text in a drop body suppresses click-through so users can copy text
  without opening drop details.
- Same-origin links carrying `drop` query params are rebased to current thread
  context before rendering.
- When a same-origin link carries both `drop` and `serialNo`, the `drop` target
  remains primary and renders drop-preview/open behavior instead of a serial quote
  jump card.

## Edge Cases

- Very long posts increase card height and push neighboring rows in normal scroll
  flow.
- In storm posts, previous/next controls are disabled on first/last parts.
- Text and media blocks render as one continuous card body when attachments exist.
- Links from other domains, and same-origin links without `drop`, keep original URL
  and rendering path.
- Only `http://` and `https://` URLs are transformed into inline links.
- Homepage Explore Waves previews keep URL text non-clickable to preserve compact
  preview behavior.
- URLs adjacent to punctuation can still render as clickable links while trailing
  punctuation remains plain text.
- On touch-only devices, mentions stay as inline links without desktop hover cards.

## Failure and Recovery

- There is no expansion-state recovery path because long posts are never collapsed.
- If drop-detail navigation fails, users remain in-thread and can retry.
- If current-location context cannot be resolved for a same-origin shared drop link,
  the UI falls back to original link target.
- If thread loading stalls, refreshing/reopening the wave reloads the drop list.

## Limitations / Notes

- Users cannot collapse long posts back to shortened previews in standard drop cards.
- Current-thread URL rebasing applies only to same-origin links with `drop`
  query parameters.
- This page covers shared drop text rendering; compact summary UIs in other areas may
  apply different truncation rules.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Reply Preview Rows](feature-reply-preview-rows.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Markdown Blank-Line Preservation](../composer/feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](../composer/feature-markdown-code-blocks.md)
- [Wave Drop External Link Previews](../link-previews/feature-external-link-previews.md)
