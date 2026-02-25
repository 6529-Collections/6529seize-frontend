# Wave Drop Web3 Preview Cards

## Overview

Wave drop markdown supports dedicated preview cards for several web3-focused link
families instead of generic metadata cards.
This page covers ENS targets, NFT marketplace links, Art Blocks tokens, Compound
links, and `pepe.wtf` links.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop-card contexts using shared markdown preview rendering

## Entry Points

- Open/publish drops containing supported web3 URLs/targets:
  - ENS names/addresses and ENS app/Etherscan ENS targets
  - NFT marketplace links (OpenSea, Foundation, SuperRare, Manifold, Transient)
  - Art Blocks token/live/media URL families with valid token identifiers
  - Compound links (markets, account URLs, recognized tx/address shapes)
  - `pepe.wtf` asset/collection/artist/set links
- Re-enable previews if link previews are hidden for the drop.

## User Journey

1. Open a thread with supported web3 targets.
2. Renderer chooses a provider-specific web3 card type.
3. Card resolves provider metadata (identity, media, market, or protocol context).
4. Use card actions to open canonical destinations while staying in-thread unless
   explicitly navigating out.

## Common Scenarios

- ENS cards render name or reverse-record views with available profile/ownership
  signals.
- ENS input is normalized before resolution (including mixed case and punycode).
- NFT marketplace cards show media/title/price context when available.
- Marketplace cards can prefer enriched `media_preview` URLs before raw media URLs
  when ready preview assets exist.
- Art Blocks cards show token/project metadata and optional live render actions.
- Compound cards resolve market/account/transaction layouts when URL patterns match.
- `pepe.wtf` cards resolve asset/collection/artist/set-specific views.
- If previews are hidden for a drop, web3 targets remain plain links until previews
  are shown again.

## Edge Cases

- Unsupported host/path patterns remain plain links or fall back to generic preview
  handling.
- Cards can render partial content when upstream metadata is sparse.
- If token/media enrichment status is not ready, renderers keep fallback media paths.
- Overlay-style or unusable preview images can be filtered so cleaner media sources
  are used when available.

## Failure and Recovery

- While data loads, users see provider loading/skeleton states.
- If provider fetch/parsing fails, renderer falls back to generic preview or plain
  clickable links.
- If embedded live previews are unavailable, direct-open actions remain available.
- Reopening/reloading thread retries provider preview resolution.

## Limitations / Notes

- Dedicated web3 cards activate only for supported URL/target patterns.
- Displayed market/protocol values are informational snapshots and can drift from
  live state.
- Card detail quality depends on upstream provider metadata availability.

## Related Pages

- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
