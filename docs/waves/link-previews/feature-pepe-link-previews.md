# Wave Drop Pepe.wtf Link Previews

## Overview

Wave drop markdown renders supported `pepe.wtf` links as dedicated preview
cards instead of plain links. Cards are specialized by target type (`asset`,
`collection`, `artist`, `set`) and show whatever image, identity, and market
context is available.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that includes a supported `pepe.wtf` URL:
  - `https://pepe.wtf/asset/{slug}`
  - `https://pepe.wtf/collection/{slug}`
  - `https://pepe.wtf/artists/{slug}`
  - `https://pepe.wtf/sets/{slug}`
- Paste one of those URLs into drop markdown and view it after publishing.
- Re-enable link previews for a drop if previews were hidden.

## User Journey

1. Open a thread with a drop containing a supported `pepe.wtf` URL.
2. The URL renders a loading card while preview data is resolved.
3. The card updates into the matching type (asset/collection/artist/set).
4. Review available details and follow deep links (`Open on pepe.wtf`, and
   optional related links when present).
5. Continue reading the thread with drop-level link actions still available
   beside the card.

## Common Scenarios

- Asset cards can show image, collection/asset chips, artist/series/card
  context, supply/holders, listing and sale values, and optional external links
  such as Horizon/XChain/wiki.
- Collection, artist, and set cards show type labels plus available summary
  fields and links relevant to that target.
- If metadata is partial, the card still renders with available fields instead
  of failing entirely.
- Repeated previews of the same `kind + slug` usually resolve faster from
  caching.

## Edge Cases

- `pepe.wtf` URLs outside the supported path families render as regular links
  instead of dedicated cards.
- Cards can render with missing stats or missing imagery when upstream sources
  do not provide those fields.
- Multiple supported `pepe.wtf` links in one drop render as separate cards.
- If link previews are hidden for a drop, `pepe.wtf` links remain plain links
  until previews are shown again.

## Failure and Recovery

- While preview data is loading, users see a skeleton card.
- If preview resolution fails, the UI falls back to a direct `Open on pepe.wtf`
  link card so users can still continue.
- Users can retry by reopening the thread or reloading the page.
- Copy/open actions remain available through the drop action controls.

## Limitations / Notes

- Dedicated cards only apply to supported `pepe.wtf` URL path formats.
- Preview detail quality depends on upstream data availability and network
  responsiveness.
- Displayed market/metadata values are informational and may not match
  real-time execution prices.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop ENS Link Previews](feature-ens-link-previews.md)
- [Wave Drop Art Blocks Token Previews](feature-art-blocks-token-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
