# Wave Drop NFT Marketplace Link Previews

## Overview

Wave drop markdown renders supported NFT marketplace URLs as dedicated
marketplace cards instead of generic metadata cards. Cards prioritize media and
listing context (title and price when available), and include direct open/copy
actions in full-card layouts.

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
2. The marketplace card mounts immediately in the drop and shows a loading
   placeholder.
3. Marketplace preview data starts loading right away and fills card
   media/title/price details when it resolves.
4. Use open/copy actions from the card frame without leaving the thread
   unless you choose to open the marketplace destination.
5. If newer marketplace enrichment arrives later, card fields can refresh
   in-place.

## Common Scenarios

- OpenSea item and asset URLs render marketplace cards instead of generic
  Open Graph cards.
- Manifold, SuperRare, Foundation, and Transient listing-style links use the
  same marketplace card frame with provider-specific metadata when available.
- Multiple supported marketplace links inside one drop render as separate
  cards.
- If drop payload already includes marketplace enrichment metadata, cards can
  render details faster before network fallback completes.
- When NFT-link enrichment is partial, missing fields can be filled from Open
  Graph metadata as fallback.

## Edge Cases

- Only secure `https://` URLs matching supported host + path patterns render
  marketplace cards.
- Marketplace URLs outside supported path families remain regular links or use
  generic preview handling.
- If previews are hidden for a drop, marketplace links stay plain until
  previews are shown again.
- OpenSea overlay-style preview images are filtered so card media can use
  cleaner NFT media sources when available.
- Cards do not wait for a near-viewport trigger; once the drop card is
  rendered, preview loading starts immediately.

## Failure and Recovery

- If marketplace enrichment fails, card loading falls back to Open Graph
  metadata where possible.
- If both enrichment and fallback cannot produce media, the card switches to a
  `Preview unavailable` state while keeping direct navigation to the original
  link.
- If metadata updates arrive later (for example background enrichment), cards can
  refresh automatically without manual reopen.
- Users can always retry by reloading the thread or reopening the wave.

## Limitations / Notes

- Marketplace-card activation is path-specific, not host-only.
- Card detail quality depends on public marketplace metadata and network
  responses.

## Related Pages

- [Waves Index](../README.md)
- [Wave Curation URL Submissions](../composer/feature-curation-url-submissions.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Art Blocks Token Previews](feature-art-blocks-token-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Docs Home](../../README.md)
