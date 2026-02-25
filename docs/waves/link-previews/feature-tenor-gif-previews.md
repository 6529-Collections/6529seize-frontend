# Wave Drop Tenor GIF Previews

## Overview

Wave post and reply renderers treat certain Tenor links as inline GIF embeds instead
of plain URL text.

For links under `media.tenor.com` whose URL path ends in `.gif`, the parser renders
an inline animated image preview. In chat-style message surfaces (`chat` preview
variant), the GIF block uses a fixed-height layout to keep timelines stable while
new content loads. In `home` preview surfaces, GIFs are not fixed to that chat
height so they can use their natural card layout.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Wave home/leaderboard card surfaces that render markdown-based previews (for
  example boosted and leaderboard cards that route `home` variants through
  shared preview components)

## Entry Points

- Open a wave or DM drop that contains a supported Tenor GIF URL.
- Paste a supported Tenor GIF URL in a drop and save it.
- Open any supported home-card surface that includes a Tenor GIF link.

## User Journey

1. Open a thread or card containing a `media.tenor.com` URL ending in `.gif`.
2. The URL renders as an inline GIF block with rounded corners.
3. In chat and message contexts, the preview appears at a fixed height so long
   media rows stay visually stable while the GIF loads.
4. In home/leaderboard surfaces, the preview appears in the shared card width
   flow without the fixed chat height.
5. Continue through the thread with link actions available from the surrounding drop
   controls.

## Common Scenarios

- Supported URL format is `media.tenor.com` over `http:` or `https:` with a
  pathname ending in `.gif`.
- Query parameters are supported as long as the host and path still match.
- Multiple matching GIF URLs in one context each get their own preview block.
- If link previews are hidden for a drop, Tenor GIF URLs render as plain links
  until previews are re-enabled.

## Edge Cases

- Non-`media.tenor.com` hosts and non-`.gif` URLs do not use this GIF embed
  behavior.
- Invalid URLs and blocked/invalid hostnames stay as plain links.
- If the URL resolves to non-image content, preview providers fall back to normal
  link behavior.
- Chat surfaces still preserve the surrounding compact action and navigation flow even
  when large GIF media is present.

## Failure and Recovery

- The renderer does not use a special loading skeleton for Tenor GIF embeds; users
  still see the surrounding drop layout while the browser loads the image.
- If the GIF cannot be fetched, the inline media block fails to render and users can
  continue with the surrounding post context.
- If preview visibility toggling fails, the drop returns to its prior state and users
  can retry from the same context.

## Limitations / Notes

- This page documents only `media.tenor.com` `.gif` handler behavior.
- Tenor links are treated as provider-specific embeds and do not use the generic
  OpenGraph metadata card path.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Docs Home](../../README.md)
