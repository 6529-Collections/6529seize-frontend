# Wave Drop Content Display

## Overview

Standard wave drop cards render the full post body inline. Long posts are not
collapsed behind a `Show full post` control, so reading a long drop does not
require an in-card expand action. Image attachments follow the same inline card
flow, with higher-resolution image loading in single-drop detail contexts and
fullscreen controls in the image viewer modal. In memes-specific drop cards,
description text keeps authored newline breaks instead of collapsing into one
paragraph.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any standard wave drop card view that reuses the shared wave-drop content
  renderer (including single-drop and winner/leaderboard card contexts)

## Entry Points

- Open a wave or direct-message thread and scroll to a long post.
- Follow a shared drop link (including links that only carry `?drop=...`) that
  opens a specific post in context.
- Navigate storm parts using previous/next part controls on multi-part drops.
- Open an image attachment from a single-drop detail view or competition
  artwork panel.

## User Journey

1. Open a wave thread or direct-message thread.
2. Find a post with a long body.
3. Read the full post inline in the card without an expansion button.
4. Drag-select text in the post body to copy content without opening drop
   details.
5. Continue scrolling naturally through older/newer drops.
6. For storm drops, move between parts with the previous/next controls.

## Common Scenarios

- Long markdown posts display directly in the drop card.
- Fenced markdown code blocks render inline in the post body and keep a
  code-style presentation instead of collapsing into plain paragraph text.
- Consecutive blank lines in markdown remain visually separated instead of
  collapsing into a single paragraph break.
- In memes wave leaderboard, participation, and winner cards, newline breaks in
  drop descriptions are rendered as separate lines.
- Same-origin links that include a `drop` query parameter (for example
  `/?drop=...` or `/waves/...?...&drop=...`) are rebased to the current thread
  route before rendering, so drop cards and their copy/open actions stay in the
  active wave or DM context.
- When a rebased same-origin link includes both `drop` and `serialNo`, the
  drop target is treated as the primary action and renders a drop preview card
  instead of a serial quote-jump card.
- Raw URLs in drop text are linkified inline when rendering text segments, so
  `https://` links become directly tappable in the post body.
- Clicking a linkified URL opens the destination in a new browser tab and uses
  safe `rel` attributes for external navigation.
- Linkified URLs stop event propagation, so clicking a URL does not trigger
  drop-card click-through navigation.
- Selecting text in a drop body suppresses click-through navigation so users
  can copy text without opening drop details. Structured timeline copy behavior
  is covered in [Wave Drop Selection Copy](feature-selection-copy.md).
- Clicking a drop body (when click-through is enabled in that context) opens
  the drop detail view without a separate "expand post" step.
- Timeline drop cards load attachment images with standard scaled sources for
  feed performance.
- Single-drop detail surfaces (including competition artwork detail panels)
  request larger scaled image variants for clearer full-image viewing.
- Opening an image attachment launches a modal viewer where users can zoom,
  open the source in a browser tab, and enter fullscreen mode.

## Edge Cases

- Very long posts increase card height and push neighboring drops further in
  the scroll flow.
- In storm posts, previous/next controls are disabled at the first/last part.
- Text and media blocks render as one continuous card body; media appears below
  the active part text when attachments exist.
- In memes cards, multiline descriptions can make card headers taller when users
  include multiple line breaks.
- If the current URL already has a `drop` parameter, opening another shared
  drop link replaces only the `drop` value while keeping other active query
  parameters (for example `wave` or `serialNo`).
- Links from other domains, and same-origin links without a `drop` parameter,
  keep their original URL and rendering path.
- Only `http://` and `https://` URLs are transformed into inline links.
- Homepage Explore Waves previews keep URL text non-clickable to preserve compact preview behavior.
- URLs next to sentence punctuation can still render as clickable links while
  the trailing punctuation remains plain text, preserving the tap target.
- After text selection is cleared, click-through behavior returns to normal in
  contexts that support opening drop details from card body clicks.
- If fullscreen is opened from the image viewer modal, fullscreen targets the
  opened modal image rather than the background timeline card image.

## Failure and Recovery

- There is no dedicated expansion-state recovery because long posts are not
  hidden behind a toggle.
- If a drop-detail navigation does not open (for example due to network or
  route issues), users remain in the thread and can retry by clicking again.
- If current-location context cannot be resolved for a same-origin shared drop
  link, the UI falls back to the original link target; users can still open or
  copy the link and retry from the intended thread.
- If loading stalls for the thread itself, refresh/reopen the wave to reload
  the drop list and continue reading.
- If a higher-resolution scaled image URL is unavailable or fails, the viewer
  falls back to the attachment's original media URL.

## Limitations / Notes

- Users cannot collapse long posts back to a shortened preview in standard wave
  drop cards.
- Current-thread URL rebasing applies only to same-origin links that include a
  `drop` query parameter.
- This page covers full wave-drop cards; compact summary UIs in other areas can
  still apply their own truncation rules.
- Higher-resolution image scaling is applied in single-drop detail contexts;
  timeline cards keep standard scaled media loading behavior.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Selection Copy](feature-selection-copy.md)
- [Wave Drop Markdown Blank-Line Preservation](../composer/feature-markdown-blank-line-preservation.md)
- [Wave Drop Markdown Code Blocks](../composer/feature-markdown-code-blocks.md)
- [Wave Drop External Link Previews](../link-previews/feature-external-link-previews.md)
- [Wave Drop YouTube Link Previews](../link-previews/feature-youtube-link-previews.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Media Download](feature-media-download.md)
- [Docs Home](../../README.md)
