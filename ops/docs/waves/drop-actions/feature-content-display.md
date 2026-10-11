# Wave Drop Content Display

Parent: [Wave Drop Actions Index](README.md)

## Overview

Standard Wave and direct-message timelines shorten long text bodies. Select
`Show more` to render the complete markdown body and `Show less` to return to
the plain-text preview. Short bodies still render in full. Single-drop views
opened with `?drop=...` also keep the complete body visible.

Published proposals in a standard Wave configured for compact proposal cards
use their authored preview card instead. Selecting that card opens the complete
original proposal.

The shared body renderer handles markdown, mentions, emoji shortcodes, and links.
Multipart drops ("storms") stay in one card while users switch parts.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
- Wave/DM timeline drop cards and quoted-drop cards that reuse the shared markdown renderer.

## Entry Points

- Open a wave or direct-message thread and read a drop body.
- Open a thread URL with `?drop=...` and view the selected drop in place.
- Open a multipart drop and move between parts.

## User Journey

1. Open a thread and locate a drop.
2. Read a short body in full. For a long body, read its plain-text preview and
   select `Show more` to reveal the complete markdown.
3. Use markdown links, mentions, and quoted-drop content from the body.
4. Select `Show less` to shorten an expanded body again.
5. If the drop is a storm, switch parts with previous/next controls and the part counter.
6. In click-through surfaces, open drop detail only when no text is selected.
7. Marketplace preview-card interactions stay scoped to the preview and do not
   bubble to parent-card click-through navigation.

## Common Scenarios

- Long timeline bodies start as a plain-text preview. Full markdown, links,
  mentions, and inline preview cards mount after `Show more` is selected.
- Expanded state remains with the drop while it is temporarily replaced by a
  virtual-scroll placeholder.
- Normal messages use the long-body control even when the Wave uses compact
  cards for published proposals.
- Ordered lists accept both `1.` and `1)` markers and keep the chosen delimiter
  when rendered.
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
- Media and file attachments outside the markdown body stay visible while the
  text preview is collapsed.
- Use a PDF attachment's eye button to open its preview. On iPhone and iPad,
  including the iOS app, the reader fills the screen and shows the page count.
  Scroll through the pages and pinch to zoom. Close the reader to return to the
  wave; the wave stays in place while you read.
- Desktop previews use the browser's PDF viewer. **Download** and **Copy link**
  remain in the attachment options menu.
- Drop-author profile pictures first request a scaled image variant when supported by the media host.
- If that optimized avatar load fails, the card retries with an unoptimized load of the same source.
- If both avatar attempts fail (or no avatar source exists), the card keeps layout with a neutral profile placeholder.

## Edge Cases

- Storm previous/next buttons are disabled at the first and last part.
- Links containing both `drop` and `serialNo` follow `drop` behavior first.
- Quote-card expansion is depth-limited and cycle-guarded; guarded links fall back to plain links.
- Selecting text in the body blocks card click-through so copy actions do not open drop detail.
- Link and button interactions in the body stop propagation to avoid accidental parent-card navigation.
- Expanding or collapsing a body keeps the reader's current place in the
  reverse-scrolling thread. If the reader is already at the latest drop, the
  thread remains pinned there.
- Marketplace preview-card click events are contained within the preview so
  curation marketplace clicks do not trigger parent-card navigation.

## Failure and Recovery

- iOS PDF previews show **Loading PDF…** while downloading and **Loading page…**
  while rendering. If loading fails or times out, choose **Try again** or
  **Open full PDF**. Password-protected files and files above the preview
  limit must be opened separately.

- If smart-link rendering fails for a URL, the renderer falls back to a standard clickable link.
- If syntax highlighting fails, code still renders as readable code text.
- If current-route context cannot be resolved for same-origin `drop` links, the original link target is used.
- If quoted-drop data is slow or unavailable, the quote area can stay in placeholder state while the rest of the thread remains usable.
- If author avatar fetch/decoding fails in both optimized and unoptimized modes, the user still sees a stable placeholder box instead of a broken image.

## Limitations / Notes

- The preview is plain text. Markdown formatting and interactive links are
  available after expansion.
- Long-body detection uses the saved source text and line count. It does not
  continuously measure rendered post height.
- Compact proposal cards are a per-Wave proposal presentation, not a generic
  long-post collapse control.
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
- [Compact Proposal Cards](feature-proposal-cards.md)
- [Wave Drop External Link Previews](../link-previews/feature-external-link-previews.md)
