# Wave Drop 6529 Collection Previews

## Overview

6529 collection URLs render as first-party collection cards instead of generic
OpenGraph cards. The card fetches normalized data from the 6529 API and shows
only the fields that help a user understand the object in chat.

Museum cards are out of scope for this feature.

## Supported URL Families

- `/the-memes/{id}`
- `/meme-lab/{id}`
- `/6529-gradient/{id}`
- `/nextgen/token/{token}`
- `/rememes/{contract}/{id}`

The route also recognizes the configured app host in local or staging
environments.

## Shared Card Contract

Every first-party collection preview returns:

- `type: "6529.collection"`
- `kind`: one of `the-memes`, `meme-lab`, `6529-gradient`,
  `nextgen-token`, or `rememes`
- `title`: the display title
- `kicker`: compact collection context when useful
- `people`: named people with optional profile links
- `facts`: label/value facts
- `traits`: optional NextGen trait chips
- `image` and `images`: normalized preview media

Cards do not show floor price, live mint or phase status, or live minted count
such as `158/328`.

## Per Collection Rules

### The Memes

- Title: NFT name, for example `The Collective Synapse`
- Kicker: `The Memes #{id}`
- People: `by {artist}` with profile link when the API gives a resolvable 6529
  handle
- Facts:
  - `Edition size {n}`
  - `TDH rate {x}`
  - `Season {x}`
  - `Mint date {date}` when available

When extended data explicitly reports `recorded_in_tdh: false`, the Meme is
still live and the card advertises Manifold `totalMax`. Once it is recorded in
TDH, the card mirrors the backend calculation edition size:
`max(actual edition size, edition_size_floor)`. Legacy or unknown TDH state
also uses that finalized calculation as the safer fallback. Mint-stat totals
are primary-sale accounting and are not edition-size inputs.

### Meme Lab

- Title: NFT name
- Kicker: `Meme Lab #{id}`
- People: artist profile link when resolvable
- Facts:
  - `Edition size {n}`
  - `Mint date {date}` when available

### 6529 Gradient

- Title: token name, for example `6529 Gradient #92`
- Kicker: omitted unless future data adds non-duplicative context
- People:
  - `Artist {profile}`
  - `Collector {profile or display}` when the owner resolves
- Facts:
  - `TDH rate {x}`
  - `Mint date {date}`

### NextGen Token

- Title: token name, for example `Pebbles #514`
- Kicker: `NextGen &middot; {collection name}`
- People:
  - artist profile link when resolvable
  - `Collector {profile or display}` when the current owner resolves
- Facts:
  - `Rarity #{rank} / {supply}`
  - `Mint date {date}`
- Traits:
  - show at most three chips by default
  - choose the rarest values first by `value_count`
  - break ties by `trait_count`
  - hide `Collection Name` and `None`
  - render as `{trait}: {value}`

Short token URLs such as `/nextgen/token/514` should resolve through the API
and render the canonical preview URL `/nextgen/token/{full token id}` so opening
the card lands on the real token page.

### ReMemes

- Title: token metadata name
- Kicker: `ReMemes`
- People: creator or artist profile link when resolvable
- Facts:
  - `References The Memes #{id}` when references exist
  - `Edition size {n}` when meaningful data exists
  - `Replicas {n}` when more than one replica exists

## Responsive Layout

- Desktop and tablet: square art thumbnail on the left, text and metadata on
  the right.
- Mobile: same left/right structure with smaller fixed thumbnail dimensions so
  chat cards stay scannable and stable.
- Collection art renders inside a black square matte with a black border and
  preserved aspect ratio. The card should show the whole NFT image instead of
  cropping it.
- Text is clamped and wrapped inside the card; long titles, handles, or trait
  values must not resize the preview frame.
- Facts and traits wrap into compact chips and overflow is clipped inside the
  stable preview frame.

## Failure Behavior

If a first-party collection URL is recognized but the 6529 API cannot resolve
the object, the route falls back to guarded generic OpenGraph metadata so wave
drops still show a useful card. Unrecognized 6529 URLs continue through the
normal provider and generic OpenGraph pipeline.
