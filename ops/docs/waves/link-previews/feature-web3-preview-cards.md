# Wave Drop Web3 Preview Cards

Parent: [Wave Link Previews Index](README.md)

## Overview

Wave markdown renders dedicated web3 cards for supported Etherscan, ENS, NFT
marketplace, Art Blocks, Compound, and `pepe.wtf` links.

If a URL does not match a supported rule, rendering falls back to a generic
external preview or a plain link.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
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

### Etherscan

Only `https://` URLs on the exact supported explorer hosts match. Supported
current networks are Ethereum (`etherscan.io` and `www.etherscan.io`), Sepolia,
and Hoodi. Retired Ropsten, Rinkeby, Goerli, Kovan, and Holesky explorer hosts
render archived-network context without attempting live RPC reads.

Structured entity cards cover:

- Transactions: `/tx/{hash}` and identity-bearing raw transaction, VM trace,
  input decoder, transaction decoder, and search URLs
- Addresses and ENS address lookups: `/address/{address-or-name}`,
  `/address/{address-or-name}/advanced`, token holdings, balance checker, token
  approval checker, name lookup, and search URLs
- Tokens: `/token/{contract}`, token checker, and token tracker URLs
- NFTs: `/nft/{contract}/{tokenId}`
- Blocks: `/block/{height-or-hash}`, `/block/countdown/{height}`, and search
  URLs
- Uncles, blobs, and verified signatures: `/uncle/{hash}`, `/blob/{hash}`, and
  `/verifySig/{id}`

Etherscan lists, analytics, charts, contract tools, converters, account pages,
directory pages, policy/about pages, and newly introduced paths on an approved
host render route-aware cards. Unknown Etherscan subdomains and lookalike
domains do not receive structured treatment.

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

### `pepe.wtf`

- `https://pepe.wtf/asset/{slug}`
- `https://pepe.wtf/collection/{slug}`
- `https://pepe.wtf/artists/{slug}`
- `https://pepe.wtf/sets/{slug}`

## Entry Points

- Open or publish a drop with one or more supported URLs.
- Open an existing drop that already contains supported URLs.
- If previews are hidden on your thread drop, use desktop `More` >
  `Restore link previews`.

## User Journey

1. Open a supported web3 URL in a wave, DM, boosted card, or leaderboard card.
2. The renderer matches URL shape and picks the provider card.
3. Loading placeholders appear while metadata resolves.
4. The final card renders with provider fields and open-link actions.
5. In chat/DM layouts, side actions show beside the card. In home-style
   layouts, side actions are hidden.

## Common Scenarios

- ENS cards show name/address context, records, ownership, and ENS/Etherscan links.
- Marketplace cards show title/media/price.
- Marketplace cards can also show a data-health status badge when metadata is
  stale, errored, or unavailable.
- On live `MEDIA_LINK_UPDATED` patches, marketplace cards prefer preview-image
  URLs when present (card, then small, then thumb variants across nested and
  flat payload shapes).
- Marketplace data-health state is derived from resolver metadata:
  `fresh` (recent successful update), `stale` (successful update is old),
  `error` (failure metadata present), or `unknown` (no status metadata).
- The data-health badge is hidden for `fresh` state and shown for
  `stale`/`error`/`unknown` in both compact and full marketplace card layouts.
- The badge exposes a hover/focus detail message (for example stale age or
  resolver error reason) and uses that same text for accessibility labels.
- If a live patch contains only `media_uri` (full asset URL) and the card
  already has preview media, the existing preview media is retained.
- If a card has no media cached and no preview URL is provided, `media_uri` is
  used as the media fallback.
- When marketplace metadata includes both `price` and `price_currency`, cards
  render value and currency separately. If `price` already ends with the same
  currency token, the duplicate suffix is removed from the displayed value.
- Marketplace `Open` CTA labels use normalized price text plus currency (when
  available) so assistive labels match the visible amount/currency state.
- In click-through containers (for example boosted and leaderboard card
  variants), marketplace preview interactions stay within the preview and do not
  trigger parent-card navigation.
- OpenSea cards filter blocked OpenGraph-overlay image URLs.
- Art Blocks cards show project/token context with `View live` and
  `Open on Art Blocks`.
- Etherscan transaction cards show status, inferred action, participants,
  block/finality context, fee, and timestamp when bounded RPC reads succeed.
- Etherscan address cards distinguish EOAs, contracts, and delegated EOAs and
  show balance and observed block height when available.
- Etherscan token and NFT cards show on-chain identity and standard details;
  block cards distinguish future, proposed, and finalized blocks.
- Etherscan deep-link tabs and tools remain visible as context chips. Partial
  data, retired networks, and route-only cards are labeled rather than
  presented as live data.
- Recognized Compound protocol events enrich an Etherscan transaction card
  with the decoded Compound action; Etherscan URLs are not owned by the
  Compound provider.
- Compound links render market or account layouts from Compound app URLs.
- `pepe.wtf` links render asset, collection, artist, or set cards.

## Edge Cases

- Unsupported host/path shapes do not use web3 cards.
- Marketplace matching is strict to supported HTTPS host and path rules.
- Etherscan matching uses an exact normalized host registry. A host such as
  `foo.etherscan.io` falls back to the ordinary external-link path.
- ENS inputs can normalize case, punycode, and address checksum format.
- Bare `.eth` names and `app.ens.domains` URLs remain ENS cards; Etherscan
  address URLs remain Etherscan cards even when their identifier is an ENS
  name.
- If previews are hidden on a drop, links stay plain until previews are shown.

## Failure and Recovery

- While data loads, cards show loading placeholders/skeletons.
- Marketplace cards can fall back to `Preview unavailable` cards with open-link
  actions.
- Marketplace cards can surface stale or failed resolver status directly on-card
  via the data-health badge, even when media/title/price are otherwise present.
- ENS links can fall back to plain links when ENS preview resolution fails.
- Art Blocks cards can keep rendering with placeholder media when metadata/media
  is missing.
- Etherscan entity cards degrade to identity-preserving partial cards when RPC
  reads fail or exceed their budget. Route-only pages never require an upstream
  request.
- Compound links can fall back to generic external preview, then plain link.
- `pepe.wtf` cards fall back to an `Open on pepe.wtf` link card when resolver
  requests fail.
- Refresh or reopen the thread to retry.

## Limitations / Notes

- Dedicated web3 cards activate only for supported URL patterns above.
- Etherscan live entity data is read from fixed chain RPC clients with bounded
  timeouts. Cards show a snapshot and link to the canonical explorer page.
- Uncle, blob, and verified-signature cards currently preserve verified route
  identity and context but do not claim live structured fields that cannot be
  obtained through the bounded RPC path.
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
