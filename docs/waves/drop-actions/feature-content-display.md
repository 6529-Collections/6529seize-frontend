# Wave Drop Content Display

Parent: [Wave Drop Actions Index](README.md)

## Overview

Wave and direct-message drop cards render full body text inline.
There is no `Show full post` or collapse toggle for long bodies.

The shared body renderer handles markdown, mentions, emoji shortcodes, and links.
Multipart drops ("storms") stay in one card while users switch parts.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Wave/DM drop cards and quoted-drop cards that reuse the shared markdown renderer.

## Entry Points

- Open a wave or direct-message thread and read a drop body.
- Open a thread URL with `?drop=...` and view the selected drop in place.
- Open a multipart drop and move between parts.

## User Journey

1. Open a thread and locate a drop.
2. Read full content inline in the card.
3. Use markdown links, mentions, and quoted-drop content from the body.
4. If the drop is a storm, switch parts with previous/next controls and the part counter.
5. In click-through surfaces, open drop detail only when no text is selected.
6. Marketplace preview-card interactions stay scoped to the preview and do not
   bubble to parent-card click-through navigation.

## Common Scenarios

- Full markdown body renders inline, including headings, lists, quotes, and code.
- Code blocks use syntax highlighting when available.
- Paragraphs split by a single blank line render as separate paragraphs with
  tight spacing.
- Three or more consecutive line breaks remain visually separated.
- `@[handle]` and `#[wave]` tokens become links only when matching mention data exists.
- Wave mentions can show a small wave avatar when wave image data exists.
- On desktop, mention and wave links can show hover tooltips.
- Touch devices keep mention tokens as links but skip hover tooltip wrappers.
- Unknown mention tokens remain plain text.
- Emoji shortcodes render custom or native emoji when available; unknown shortcodes stay as typed.
- `http://` and `https://` URLs render as links or preview cards, based on URL type and preview settings.
- Canonical same-origin wave-drop links (`/waves/{waveId}?drop={dropId}`) use
  drop-open smart-link behavior in the current thread context.
- Legacy query-style wave-drop links (`/waves?wave={waveId}&drop={dropId}`) and
  DM `drop` links fall back to regular link navigation behavior.
- If a drop part contains `quoted_drop` data, a quoted-drop block renders below that part.
- Edited drops show an `(edited)` marker below content.
- Media attachments in the same part render under the text body in the same card.
- Drop-author profile pictures first request a scaled image variant when supported by the media host.
- If that optimized avatar load fails, the card retries with an unoptimized load of the same source.
- If both avatar attempts fail (or no avatar source exists), the card keeps layout with a neutral profile placeholder.

## Edge Cases

- Storm previous/next buttons are disabled at the first and last part.
- Links containing both `drop` and `serialNo` follow `drop` behavior first.
- Quote-card expansion is depth-limited and cycle-guarded; guarded links fall back to plain links.
- Selecting text in the body blocks card click-through so copy actions do not open drop detail.
- Link and button interactions in the body stop propagation to avoid accidental parent-card navigation.
- Marketplace preview-card click events are contained within the preview so
  curation marketplace clicks do not trigger parent-card navigation.

## Failure and Recovery

- If smart-link rendering fails for a URL, the renderer falls back to a standard clickable link.
- If syntax highlighting fails, code still renders as readable code text.
- If current-route context cannot be resolved for same-origin `drop` links, the original link target is used.
- If quoted-drop data is slow or unavailable, the quote area can stay in placeholder state while the rest of the thread remains usable.
- If author avatar fetch/decoding fails in both optimized and unoptimized modes, the user still sees a stable placeholder box instead of a broken image.

## Limitations / Notes

- Users cannot collapse long posts back to shortened previews in standard drop cards.
- Mention links render only when the drop includes matching mention data.
- This page covers shared body rendering. Provider-specific preview behavior and image-viewer controls are documented in separate pages.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Quote Link Cards](feature-quote-link-cards.md)
- [Wave Drop Reply Preview Rows](feature-reply-preview-rows.md)
- [Wave Drop Image Viewer and Scaling](feature-image-viewer-and-scaling.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Link Preview Toggle](../link-previews/feature-link-preview-toggle.md)
- [Wave Drop External Link Previews](../link-previews/feature-external-link-previews.md)
