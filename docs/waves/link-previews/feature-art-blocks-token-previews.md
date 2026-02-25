# Wave Drop Art Blocks Token Previews

## Overview

Wave drop markdown can render supported Art Blocks token URLs as rich token
cards instead of plain links. The card presents token artwork, project/title
metadata, artist attribution, and token feature traits when available.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that contains a supported Art Blocks token URL.
- Paste a supported Art Blocks token URL in a drop and view it after
  publishing.
- Open a shared drop link that already includes a supported Art Blocks token
  URL.
- Re-enable previews for a drop if link previews were hidden.

## User Journey

1. Open a drop containing a supported Art Blocks token URL.
2. The URL renders as a token card frame while preview details load.
3. The card updates with available token metadata (project/title, token number,
   artist, and traits).
4. Select the image or `View live` action to open the live render viewer inside
   a modal, or use `Open on Art Blocks` to leave the site.
5. Continue reading the thread with the same drop-level link actions available
   next to the card.

## Common Scenarios

- Flagship token links such as `https://www.artblocks.io/token/{tokenId}` render
  as token cards.
- Contract-specific token links such as
  `https://www.artblocks.io/token/{contract}/{tokenId}` also render as token
  cards.
- Art Blocks `live`, `media`, `media-proxy`, and `token` URL families can map
  to the same token-card behavior when a valid token identifier is present.
- If token traits are available, the card shows a short list first and lets
  users expand to view more.
- Multiple supported Art Blocks links in one drop render as separate cards.

## Edge Cases

- If Art Blocks card previews are disabled for the environment, supported links
  stay as regular anchors.
- Art Blocks URLs with unsupported paths or invalid identifiers stay as regular
  links instead of token cards.
- If link previews are hidden for a drop, Art Blocks URLs remain plain links
  until previews are shown again.
- If token metadata is missing, the card can still render with fallback title
  and artist values.
- If token media fails to load, the card shows a `Preview unavailable` visual
  placeholder.

## Failure and Recovery

- While token metadata is loading, the card shows placeholder loading UI.
- If metadata requests fail or return no payload, users still retain working
  open/copy actions and can continue using the thread.
- The live viewer modal can be dismissed with `Escape`, backdrop click, or the
  close control.
- If live embedding is unavailable in a user session, `Open on Art Blocks`
  remains available as a fallback path.

## Limitations / Notes

- Art Blocks previews require supported URL formats with valid token
  identifiers.
- This page describes wave/drop markdown rendering, not standalone Art Blocks
  or marketplace pages.
- Preview detail quality depends on metadata returned by Art Blocks endpoints.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
