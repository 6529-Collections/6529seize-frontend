# ReMemes Browse and Detail

## Overview

ReMemes browse and token inspection use two routes:
`/rememes` for catalog filtering and `/rememes/{contract}/{id}` for token
detail tabs.

## Location in the Site

- ReMemes browse route: `/rememes`
- ReMeme detail route: `/rememes/{contract}/{id}`

## Entry Points

- Open `/rememes` directly.
- Open `ReMemes` from sidebar or header search.
- Open a shared detail URL directly.
- From `/rememes`, open any token card.

## User Journey

1. Open `/rememes` and wait for `Fetching ...` to finish.
2. Review result count and cards (40 items per page before pagination).
3. Apply filters:
   - `Sort`: `Random` or `Recently Added`
   - `Token Type`: `All`, `ERC-721`, `ERC-1155`
   - `Meme Reference`: `All` or a specific Meme card
4. If `Random` is selected, use refresh to reroll current page results.
5. Open a card to `/rememes/{contract}/{id}`.
6. On detail, switch tabs:
   - `Live`
   - `Metadata`
   - `References`
7. On `Live`, use external links (Etherscan, collection links, marketplace
   shortcuts when available) and open replica token IDs when shown.

## Common Scenarios

- Filter by one Meme reference, then open detail for an exact replica token.
- Switch to `Recently Added` to inspect newer additions first.
- Open detail `Metadata` to inspect token URI, parsed metadata, and attributes.

## Edge Cases

- Only `meme_id` is persisted in the URL; sort, token type, and page reset on
  reload.
- If browse fetch fails, the route can render the empty-state panel with no
  inline error banner.
- Before detail data resolves, the route can show only the ReMemes banner
  image with no dedicated loading indicator.
- Detail route has no dedicated not-found/retry panel when contract or token
  data does not resolve.
- `References` does not show a dedicated loading state and can briefly render
  an empty-state panel before references load.
- If referenced Meme fetch fails for detail, `References` can stay on
  empty-state with no inline error panel.
- Marketplace shortcuts are hidden on iOS when detected country is not `US`.

## Failure and Recovery

- Reset filters to `All`, return to `Random`, and refresh results.
- Reopen detail from browse cards if a shared contract/token link is malformed.
- If detail appears blank, retry with a verified contract and token ID pair.
- If marketplace shortcuts are missing on iOS, use available non-gated links
  (for example Etherscan) or retry on a supported platform/location.

## Limitations / Notes

- Browse filter state is mostly in-memory and not fully shareable by URL.
- Detail tabs are in-page state (no tab query parameter).
- Marketplace behavior is documented canonically in NFT marketplace docs.

## Related Pages

- [Media Collections Index](README.md)
- [ReMemes Add Submission](feature-rememes-add-submission.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
