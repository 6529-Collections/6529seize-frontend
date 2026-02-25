# Wave Drop NFT Marketplace Link Previews

## Overview

Wave drop markdown renders supported NFT marketplace URLs as dedicated
marketplace cards instead of generic metadata cards. These cards prioritize
visual media, title, and marketplace call-to-action behavior for listing-style
links.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop-card context that uses the shared wave markdown renderer

## Entry Points

- Open or publish a drop containing one of these supported URL families:
  - `https://manifold.xyz/@{creator}/id/{listingId}`
  - `https://superrare.com/artwork/eth/{contract}/{tokenId}`
  - `https://foundation.app/mint/eth/{contract}/{tokenId}`
  - `https://opensea.io/item/ethereum/{contract}/{tokenId}`
  - `https://opensea.io/assets/ethereum/{contract}/{tokenId}`
  - `https://transient.xyz/nfts/ethereum/{contract}/{tokenId}`
  - `https://transient.xyz/mint/{slug}`
- Re-enable previews for a drop when previews were previously hidden.

## User Journey

1. Open a thread with a supported marketplace URL in drop text.
2. The URL renders as a marketplace preview frame while data is resolved.
3. The card fills with available media, title, and marketplace CTA details.
4. Use open/copy link actions from the card frame without leaving the thread
   unless you choose to open the marketplace destination.

## Common Scenarios

- OpenSea item and asset URLs render marketplace cards instead of generic
  Open Graph cards.
- Manifold, SuperRare, Foundation, and Transient listing-style links use the
  same marketplace card frame with provider-specific metadata when available.
- Multiple supported marketplace links inside one drop render as separate
  cards.

## Edge Cases

- Only secure `https://` URLs matching supported host + path patterns render
  marketplace cards.
- Marketplace URLs outside supported path families remain regular links or use
  generic preview handling.
- If previews are hidden for a drop, marketplace links stay plain until
  previews are shown again.

## Failure and Recovery

- If marketplace preview data fails to resolve, the card switches to a
  `Preview unavailable` state while keeping direct navigation to the original
  link.
- Users can retry by reloading the thread or reopening the wave.

## Limitations / Notes

- Marketplace-card activation is path-specific, not host-only.
- Card detail quality depends on public marketplace metadata and network
  responses.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Art Blocks Token Previews](feature-art-blocks-token-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
