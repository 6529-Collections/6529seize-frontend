# Wave Drop External Link Previews

## Overview

Wave drop markdown renders many non-embedded links as rich preview cards instead
of plain URL text. These generic cards use fetched page metadata (title,
description, domain, and image when available) and keep standard link actions
next to the card.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open a drop that contains an eligible `http://` or `https://` URL.
- Paste an eligible URL in a drop and view it after publishing.
- Toggle hidden link previews back on for a drop that currently shows plain
  links.

## User Journey

1. Open a wave or direct-message thread with an eligible URL in drop text.
2. The URL renders a preview card with loading placeholders while metadata is
   fetched.
3. The card updates with available metadata such as domain, title,
   description, and image.
4. Use adjacent link actions to copy or open the destination.
5. Continue reading the thread without leaving the drop context unless you open
   the link.

## Common Scenarios

- Standard web articles and documentation links render a generic metadata card.
- Repeated previews of the same URL in an active session usually resolve faster
  because short-lived preview caches are reused.
- Metadata fields that include long unbroken URL-like text (for example hashes
  or long path/query segments) wrap inside the card so preview width stays
  aligned with the drop and adjacent action buttons remain visible.
- Dedicated preview handlers take priority for known providers (for example
  YouTube, Twitter/X, TikTok, Farcaster, Google Workspace, Wikimedia, NFT
  marketplaces, Art Blocks, ENS targets, Compound links, and `pepe.wtf`), so
  those links render provider-specific cards instead of the generic metadata
  card.
- If previews are hidden for a drop, links render as plain anchors until the
  author enables previews again.

## Edge Cases

- Invalid URLs and non-HTTP(S) schemes stay as regular links.
- Local/private/internal targets do not render fetched metadata previews.
- Some host families are intentionally excluded from this generic card path
  because they use dedicated preview behavior (for example YouTube, Twitter/X,
  TikTok, Farcaster, Google Workspace, Wikimedia, NFT marketplace links, Art
  Blocks token links, ENS targets, Compound links, and `pepe.wtf` links).
- Multiple eligible links in one drop render as separate preview cards.
- Long unbroken metadata tokens can wrap mid-token to avoid horizontal card
  overflow in narrow layouts.

## Failure and Recovery

- While metadata is loading, users see a skeleton placeholder.
- If metadata fetch fails or returns no useful preview content, the UI falls
  back to a clickable link state instead of a rich metadata card.
- If preview visibility toggling fails, the drop returns to its prior state and
  an error toast is shown.

## Limitations / Notes

- Preview fetching is limited to public HTTP(S) destinations.
- Card quality depends on metadata published by the target site.
- This page describes generic metadata cards in wave-style markdown; provider
  specific embeds are documented separately.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop NFT Marketplace Link Previews](feature-nft-marketplace-link-previews.md)
- [Wave Drop Google Workspace Link Previews](feature-google-workspace-link-previews.md)
- [Wave Drop Farcaster Link Previews](feature-farcaster-link-previews.md)
- [Wave Drop TikTok Link Previews](feature-tiktok-link-previews.md)
- [Wave Drop Wikimedia Link Previews](feature-wikimedia-link-previews.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop ENS Link Previews](feature-ens-link-previews.md)
- [Wave Drop Compound Link Previews](feature-compound-link-previews.md)
- [Wave Drop Pepe.wtf Link Previews](feature-pepe-link-previews.md)
- [Wave Drop Art Blocks Token Previews](feature-art-blocks-token-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Docs Home](../../README.md)
