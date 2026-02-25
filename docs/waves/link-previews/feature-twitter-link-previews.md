# Wave Drop Twitter/X Link Previews

## Overview

Wave drop markdown renders supported Twitter/X status links as inline tweet
preview cards instead of plain URL text. When tweet content cannot be loaded,
the card falls back to a clearly labeled external-link state.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that contains a supported Twitter/X status URL.
- Paste a supported Twitter/X status URL in a drop and view it after publishing.
- Open shared drop links that include a supported Twitter/X status URL in
  markdown content.

## User Journey

1. Open a wave or direct-message thread with a supported Twitter/X status URL.
2. The URL renders as an inline tweet card with a loading placeholder.
3. When tweet data is available, the card renders tweet content inline.
4. Long tweet previews can show a compact view first and expose a `Show full
   tweet` control.
5. If tweet data is unavailable or rendering fails, the card switches to a
   fallback state labeled `Tweet unavailable` with an `Open on X` link.

## Common Scenarios

- Supported links include `twitter.com` and `x.com` hosts (including
  subdomains like `mobile.twitter.com`) when the URL path (including
  `/i/web/status/{id}`) contains `status/{id}` or `statuses/{id}` with a
  numeric tweet ID.
- Tracking query parameters after the tweet ID (for example `?s=20`) do not
  prevent the tweet preview card from rendering.
- In drop contexts that show link actions, users still get adjacent copy/open
  controls next to the tweet preview card.
- Multiple supported Twitter/X links in one drop each render their own preview
  card.
- If link previews are hidden for a drop, Twitter/X URLs stay as plain links
  until previews are shown again.

## Edge Cases

- Twitter/X links without a valid numeric tweet ID do not render as tweet cards
  and remain regular links.
- Legacy hash-based status URL formats such as
  `https://twitter.com/#!/user/status/{id}` are accepted, including variants
  that append query parameters.
- If tweet content is short, the preview can render fully without compact
  controls.

## Failure and Recovery

- While tweet data is loading, users see a loading placeholder in the card.
- If tweet data is unavailable (for example removed, restricted, or not
  returned), users see a fallback card with `Tweet unavailable` and can continue
  with `Open on X`.
- If tweet preview rendering throws an error, users see the same fallback card
  and can still open the original URL.
- If preview visibility toggling fails, the drop returns to its prior state and
  users can retry from the same thread context.

## Limitations / Notes

- Only Twitter/X status URLs with numeric tweet IDs are eligible for tweet
  preview cards.
- Preview availability depends on external tweet data responses and network
  conditions.
- This page covers wave-style drop markdown rendering, not standalone tweet
  pages outside drop cards.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
