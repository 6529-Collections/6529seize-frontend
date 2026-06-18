# Social Card and Open Graph Metadata

Parent: [Shared Index](README.md)

## Overview

6529 has mature dynamic Open Graph card rendering. New share surfaces should
expand that coverage and standardize on the existing card families, not rebuild
social-card infrastructure from scratch.

The shared metadata contract lives in `components/providers/metadata.ts`.
User-facing routes pass route metadata through `getAppMetadata`. Routes that
need large social previews use `getLargeSocialCardMetadata`, which standardizes
the `1200x630` image dimensions and `summary_large_image` Twitter card.

## Location in the Site

- Any public route with Next.js `generateMetadata`.
- Dynamic social-card API routes under `/api/og-metadata`.
- Server metadata helpers that build share metadata for profiles, waves, drops,
  collections, NFTs, NextGen, ReMemes, Meme Lab, The Memes, and 6529 Gradient.

## Dynamic Card Families

- `/api/og-metadata/profiles/{identity}` renders identity/profile cards from
  API-backed profile metadata.
- `/api/og-metadata/waves/{id}` renders wave cards from API-backed wave
  metadata.
- `/api/og-metadata/drops/{id}` renders drop cards from API-backed drop
  metadata.
- `/api/og-metadata/collections/{collection}` renders branded collection cards.
  It has built-in defaults for `the-memes`, `meme-lab`, `6529-gradient`,
  `rememes`, and `nextgen`, plus query overrides for `badge`, `image`,
  `subtitle`, and `title`.
- `/api/og-metadata/nfts/{contract}/{id}` renders branded NFT cards with query
  overrides for `artist`, `badge`, `collection`, `image`, `subtitle`, and
  `title`.
- `/api/og-metadata/image?url={url}&w={width}` safely normalizes allowed remote
  images for card rendering.

## Standard Route Contract

- Use `getAppMetadata` for every App Router metadata response so title,
  description, favicon, version, site name, default image, and Twitter site stay
  consistent.
- Use `getLargeSocialCardMetadata` when a route should render as a large social
  card. Do not hand-code `twitterCard: "summary_large_image"` or hard-code
  `1200x630` in route metadata.
- Use `getCollectionSocialCardImagePath` for collection-like pages.
- Use `getNftSocialCardImagePath` for token, NFT, and token-detail pages.
- Keep API-backed entity details in query parameters on the collection/NFT card
  paths instead of creating one-off static OG image URLs.
- Profile, wave, and drop metadata can point directly at their dynamic endpoint
  because those endpoint families already own the entity-specific rendering.

## Current Standardized Coverage

- Site default metadata and default image normalization through
  `getAppMetadata`.
- Profile cards through the profile OG endpoint.
- Wave cards and drop cards through the wave/drop OG endpoints, including
  wave-page entity-specific metadata in `waves-page.shared.tsx`.
- Collection landing cards for The Memes, Meme Lab, 6529 Gradient, ReMemes, and
  NextGen.
- Detail cards for 6529 Gradient tokens, ReMemes, and NextGen tokens through
  the NFT card endpoint.
- NextGen collection, collection subpage, admin, and view metadata through the
  shared collection card helpers.
- The Memes mint metadata through the collection card endpoint.

## Expansion Checklist

1. Pick the existing card family first:
   - profile identity -> profile endpoint
   - wave -> wave endpoint
   - drop -> drop endpoint
   - collection/list/gallery -> collection endpoint
   - NFT/token/detail -> NFT endpoint
2. Add a new endpoint only when the entity model cannot fit an existing card
   family.
3. Route metadata should call `getAppMetadata` and, for large cards,
   `getLargeSocialCardMetadata`.
4. Collection/NFT cards should use the helper path builders instead of manual
   `BASE_ENDPOINT` string interpolation.
5. Provide useful fallback metadata when API data is missing: stable title,
   collection/badge label, and no broken image query.
6. Add focused tests that assert title, `twitter.card`, Open Graph image
   dimensions, endpoint pathname, query parameters, and missing-data fallback.
7. For new or changed render endpoints, verify the PNG response in a browser or
   endpoint test and confirm dimensions remain `1200x630`.
8. Update this page when a new route family becomes standardized.

## Known Follow-Ups

- Continue migrating older static collection and editorial pages that still
  rely on bespoke image URLs or inline metadata tags.
- Prefer helper-backed metadata for newly added public App Router pages before
  adding route-specific card code.
- Keep social-card route tests in sync with endpoint defaults so branded cards
  do not silently lose titles, subtitles, image fallbacks, or dimensions.

## Related Pages

- [Shared Index](README.md)
- [Media Collections Index](../media/collections/README.md)
- [Media NFT Index](../media/nft/README.md)
- [NextGen Index](../nextgen/README.md)
- [Profiles Index](../profiles/README.md)
- [Waves Index](../waves/README.md)
