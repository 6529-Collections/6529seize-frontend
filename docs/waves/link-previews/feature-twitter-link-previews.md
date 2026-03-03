# Wave Drop Twitter/X Link Previews

Parent: [Wave Link Previews Index](README.md)

## Overview

Supported Twitter/X status URLs render as inline tweet cards instead of plain
links.

This page covers:

- wave and direct-message markdown drops
- wave leaderboard cards that render markdown in home style
- boosted cards on `/` when the card preview URL resolves to a supported
  Twitter/X status URL

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
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
- If previews are hidden for a drop, use `Show link previews` when available.

## User Journey

1. Open a surface with a supported Twitter/X status link.
2. The renderer validates the link and extracts the tweet ID.
3. A loading state appears (`Loading tweet...`).
4. If tweet data loads, the tweet renders inline.
5. In auto-compact contexts, long tweets show `Show full tweet`; selecting it
   expands the tweet inline.
6. In wave/DM chat layouts, side actions (open/copy) appear beside the card.
   In home-style layouts, side actions are hidden.

## Common Scenarios

- Multiple supported Twitter/X links in one drop each render their own tweet card.
- If previews are hidden for a drop, Twitter/X links stay plain until previews are
  shown again.
- Hidden drops can show one inline `Show link previews` action beside the first
  hidden link.
- During serial-jump or history-load scroll operations, newly inserted drops can
  stay in auto-compact mode.

## Edge Cases

- Non-numeric tweet IDs do not render as tweet cards.
- Links missing `status`/`statuses` do not render as tweet cards.
- Invalid Twitter/X links do not fall back to generic OpenGraph cards; they remain
  regular links.
- Short tweets render without `Show full tweet`.

## Failure and Recovery

- If tweet data is unavailable in markdown-rendered cards, users see
  `Tweet unavailable` with `Open on X`.
- If tweet rendering throws in markdown-rendered cards, the same fallback appears.
- In boosted cards on `/`, unavailable tweet data falls back to an `X post` card
  linking to the original URL.
- If `Show full tweet` appears, users can expand in place without leaving the
  current surface.

## Limitations / Notes

- Only Twitter/X status URL patterns listed above are supported.
- This page covers tweet cards in wave/DM markdown, leaderboard markdown, and
  boosted `/` cards.
- This page does not cover non-drop tweet surfaces.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
