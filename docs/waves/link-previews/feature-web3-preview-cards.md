# Wave Drop Web3 Preview Cards

Parent: [Wave Link Previews Index](README.md)

## Overview

Wave markdown renders dedicated web3 cards for supported ENS, NFT marketplace,
Art Blocks, Compound, and `pepe.wtf` links.

If a URL does not match a supported rule, rendering falls back to a generic
external preview or a plain link.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Home-style markdown cards that reuse link-preview rendering:
  - Boosted cards on `/`
  - Wave leaderboard grid cards

## Supported URL Patterns

### ENS targets

- Raw ENS names (`*.eth`)
- Raw addresses (`0x...`)
- ENS reverse names (`*.addr.reverse`)
- `https://app.ens.domains/{name}`
- `https://app.ens.domains/name/{name}`
- `https://app.ens.domains/address/{name-or-address}`
- `https://etherscan.io/address/{name-or-address}`

### NFT marketplaces

Only `https://` URLs match. Host must be apex or `www`.

- Manifold: `https://manifold.xyz/@{creator}/id/{listingId}`
- SuperRare: `https://superrare.com/artwork/eth/{contract}/{tokenId}`
- Foundation: `https://foundation.app/mint/eth/{contract}/{tokenId}`
- OpenSea item: `https://opensea.io/item/ethereum/{contract}/{tokenId}`
- OpenSea asset: `https://opensea.io/assets/ethereum/{contract}/{tokenId}`
- Transient NFT: `https://transient.xyz/nfts/ethereum/{contract}/{tokenId}`
- Transient mint: `https://transient.xyz/mint/{slugOrId}`

### Art Blocks

- `https://artblocks.io/token/{tokenId}`
- `https://artblocks.io/token/{contract}/{tokenId}`
- `https://live.artblocks.io/token/{tokenId}`
- `https://media.artblocks.io/{tokenId}[.ext]`
- `https://media-proxy.artblocks.io/{contract}/{tokenId}[.ext]`
- `https://token.artblocks.io/{tokenId}`
- `https://token.artblocks.io/{contract}/{tokenId}`

### Compound

- App market paths for supported markets:
  - `https://app.compound.finance/markets/{market}`
  - `https://app.compound.finance/comet/{market}`
- App account path with wallet query:
  - `https://app.compound.finance/account?address={wallet}`
- Etherscan transaction:
  - `https://etherscan.io/tx/{hash}`
- Etherscan known Compound market contract:
  - `https://etherscan.io/address/{contract}`

### `pepe.wtf`

- `https://pepe.wtf/asset/{slug}`
- `https://pepe.wtf/collection/{slug}`
- `https://pepe.wtf/artists/{slug}`
- `https://pepe.wtf/sets/{slug}`

## Entry Points

- Open or publish a drop with one or more supported URLs.
- Open an existing drop that already contains supported URLs.
- If previews are hidden for your drop, use `Show link previews`.

## User Journey

1. Open a supported web3 URL in a wave, DM, boosted card, or leaderboard card.
2. The renderer matches URL shape and picks the provider card.
3. Loading placeholders appear while metadata resolves.
4. The final card renders with provider fields and open-link actions.
5. In chat/DM layouts, side actions show beside the card. In home-style
   layouts, side actions are hidden.

## Common Scenarios

- ENS cards show name/address context, records, ownership, and ENS/Etherscan links.
- Marketplace cards show title/media/price; missing media can use fallback sources.
- OpenSea cards filter blocked OpenGraph-overlay image URLs.
- Art Blocks cards show project/token context with `View live` and
  `Open on Art Blocks`.
- Compound links render market, account, or transaction layouts by URL shape.
- `pepe.wtf` links render asset, collection, artist, or set cards.

## Edge Cases

- Unsupported host/path shapes do not use web3 cards.
- Marketplace matching is strict to supported HTTPS host and path rules.
- Etherscan `/address/{contract}` only shows a Compound card for known Compound
  market contracts.
- ENS inputs can normalize case, punycode, and address checksum format.
- If previews are hidden on a drop, links stay plain until previews are shown.

## Failure and Recovery

- While data loads, cards show loading placeholders/skeletons.
- Marketplace cards can fall back to `Preview unavailable` cards with open-link
  actions.
- ENS links can fall back to plain links when ENS preview resolution fails.
- Art Blocks cards can keep rendering with placeholder media when metadata/media
  is missing.
- Compound links can fall back to generic external preview, then plain link.
- `pepe.wtf` cards fall back to an `Open on pepe.wtf` link card when resolver
  requests fail.
- Refresh or reopen the thread to retry.

## Limitations / Notes

- Dedicated web3 cards activate only for supported URL patterns above.
- Compound market coverage depends on the supported registry-backed market list.
- Displayed market/protocol values are snapshots and can drift from live state.
- Card completeness depends on upstream metadata quality and availability.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Knowledge and Workspace Previews](feature-knowledge-and-workspace-previews.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
