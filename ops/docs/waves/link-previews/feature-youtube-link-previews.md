# Wave Drop YouTube Link Previews

Parent: [Wave Link Previews Index](README.md)

## Overview

Supported YouTube links render as dedicated video cards backed by the shared
`/api/open-graph` preview pipeline instead of one-off client-side metadata
fetching.

This page covers:

- wave and direct-message markdown drops
- wave leaderboard cards that render markdown in home style
- boosted cards on `/` when the first detected preview URL is a supported
  YouTube URL

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
- Boosted cards on `/`
- Wave leaderboard card content that reuses markdown rendering

## Supported URL Patterns

- Hosts: `youtu.be`, `youtube.com`, and `youtube-nocookie.com`, including
  subdomains (for example `music.youtube.com`)
- Accepted path shapes:
  `youtu.be/{id}`, `/watch?v={id}`, `/shorts/{id}`, `/live/{id}`,
  `/embed/{id}`, `/v/{id}`

`{id}` must match `[A-Za-z0-9_-]{6,}`.

Links that do not match these rules stay regular links.

## Entry Points

- Open or publish a drop that contains a supported YouTube URL.
- Open a shared drop route where markdown contains a supported YouTube URL.
- Open a boosted card on `/` where the first detected preview URL is supported.
- If previews are hidden on your thread drop, use desktop `More` >
  `Restore link previews` when available.

## User Journey

1. Open a surface with a supported YouTube URL.
2. The renderer validates the URL and routes it through `LinkPreviewCard`.
3. `/api/open-graph` detects the URL, fetches YouTube oEmbed metadata
   server-side, and returns a typed `youtube.video` preview response.
4. If `list` and `index` are present, those query values are preserved in the
   metadata fetch URL. If a supported `start` or `t` value is present, it is
   preserved for the watch and embed URLs.
5. A loading card appears in the same stable frame system as other shared link
   previews.
6. On success, the card shows a black `16:9` thumbnail frame, title, channel
   name, and a small YouTube source accent.
7. Select play to swap the thumbnail for an inline `youtube-nocookie.com`
   embed player.
8. In wave/DM chat layouts, side actions (open/copy) are shown. Author-only
   preview toggle actions are shown when allowed.
9. In home-style layouts, side actions are hidden.

## Common Scenarios

- Multiple supported YouTube URLs in one drop each render a separate card.
- YouTube subdomains are supported (for example `music.youtube.com`).
- If previews are hidden for a drop, YouTube URLs stay plain until previews are
  shown again.
- Hidden previews can be restored from the desktop `More` menu on eligible
  thread drops.
- Boosted cards on `/` attempt preview rendering from the first detected URL in
  drop text.

## Edge Cases

- Unsupported YouTube host/path shapes stay regular links.
- Invalid or missing video IDs stay regular links.
- Unsupported YouTube links do not fall back to generic OpenGraph cards.
- If the YouTube oEmbed response is unavailable or invalid, shared link preview
  loading falls back to the original link.

## Failure and Recovery

- If the preview request fails, the shared link preview fallback renders the
  original link.
- If metadata fetch returns no usable payload (for example non-OK oEmbed
  response), `/api/open-graph` returns an error for that URL and the client uses
  the original link fallback.
- There is no in-card retry action; reload or reopen the surface to retry.

## Limitations / Notes

- Inline playback starts only after explicit user action.
- Preview availability and card completeness depend on YouTube oEmbed
  responses.
- Shared preview batching and client caching apply to YouTube cards.
- This page covers wave/DM markdown cards plus leaderboard and boosted home
  variants, not standalone media routes.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
