# Wave Drop Twitter/X Link Previews

Parent: [Wave Link Previews Index](README.md)

## Overview

Supported Twitter/X status URLs render as inline tweet cards instead of plain
links. Cards are rendered by the frontend using native UI fed by the
server-side Twitter oEmbed preview endpoint, not by embedding the third-party
X/Twitter widget.

This page covers:

- wave and direct-message markdown drops
- wave leaderboard cards that render markdown in home style
- boosted cards on `/` when the card preview URL resolves to a supported
  Twitter/X status URL

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
- Boosted cards on `/`
- Wave leaderboard card content that reuses markdown rendering

## Supported URL Patterns

- Hosts: `twitter.com` and `x.com`, including subdomains (for example
  `mobile.twitter.com`)
- Path must contain `status/{numericId}` or `statuses/{numericId}`
- `i/web` variants are supported (for example `.../i/web/status/{id}`)
- Legacy hash-bang links are supported (for example
  `https://twitter.com/#!/user/status/{id}`)
- Query parameters after the tweet ID are supported

Links that do not match these rules stay regular links.

## Entry Points

- Open or publish a drop that contains a supported Twitter/X status URL.
- Open a shared drop route where markdown contains a supported Twitter/X status
  URL.
- Open a boosted drop on `/` where the selected preview URL is a supported
  Twitter/X status URL.
- If previews are hidden on your thread drop, use desktop `More` >
  `Restore link previews` when available.

## User Journey

1. Open a surface with a supported Twitter/X status link.
2. The renderer validates the link and extracts the tweet ID.
3. A tweet-shaped loading state appears.
4. The app requests `/api/twitter/preview`, which fetches
   `https://publish.twitter.com/oembed` server-side and parses the returned HTML.
5. If oEmbed metadata loads, the source, author, post text, media, timestamp,
   and available engagement facts render inline.
6. Engagement facts are passive labels. The card links to the original post,
   while wave side actions provide open/copy controls where that layout supports
   them.
7. In wave/DM chat layouts, side actions (open/copy) appear beside the card.
   In home-style layouts, side actions are hidden.

## Common Scenarios

- Multiple supported Twitter/X links in one drop each render their own tweet card.
- If previews are hidden for a drop, Twitter/X links stay plain until previews are
  shown again.
- Hidden previews can be restored from the desktop `More` menu on eligible
  thread drops.
- During serial-jump or history-load scroll operations, the card uses the same
  local Twitter preview card and server-side oEmbed metadata cache.

## Edge Cases

- Non-numeric tweet IDs do not render as tweet cards.
- Links missing `status`/`statuses` do not render as tweet cards.
- Invalid Twitter/X links do not fall back to generic OpenGraph cards; they remain
  regular links.
- Supported links render with the local Twitter preview card instead of the generic
  OpenGraph card.

## Failure and Recovery

- If oEmbed metadata is unavailable, users still see a native fallback card with
  the original URL and `Open on X`.
- If local Twitter preview card rendering throws in markdown-rendered cards, the
  renderer falls back to a regular link.
- In boosted cards on `/`, supported Twitter/X status URLs use the same local
  Twitter preview card.

## Limitations / Notes

- Only Twitter/X status URL patterns listed above are supported.
- This page covers tweet cards in wave/DM markdown, leaderboard markdown, and
  boosted `/` cards.
- This page does not cover non-drop tweet surfaces.
- Real-time X engagement counts are not fetched. Any engagement facts shown come
  from the preview payload and are not interactive X intent actions.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
