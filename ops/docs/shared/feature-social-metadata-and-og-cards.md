# Social Metadata and OG Cards

Parent: [Shared Index](README.md)

## Overview

Public 6529 routes use social metadata so shared links can render previews in
wallets, chat apps, search surfaces, and social platforms. The current product
is not missing OG/social cards from scratch: profiles, waves, and wave drops
already have mature dynamic Open Graph image endpoints.

The correct roadmap is to expand and standardize this coverage. New work should
build on the existing `/api/og-metadata` rendering stack, shared metadata
helper, and route-level `generateMetadata` integrations instead of introducing a
parallel system.

## Current Foundation

The app already has these dynamic 1200x630 social-card surfaces:

- Profiles: `/api/og-metadata/profiles/{identity}` renders identity cards with
  profile visual treatment and is wired through profile page metadata.
- Waves: `/api/og-metadata/waves/{id}` renders wave cards with wave-specific
  title, creator, description/media context, and stats.
- Drops: `/api/og-metadata/drops/{id}` renders wave-drop cards for chat and
  submission drops with author, media, vote, date, and attachment context.
- Image proxy: `/api/og-metadata/image` normalizes approved external media for
  dynamic OG rendering.

The main metadata integration points are:

- `components/providers/metadata.ts`: shared `getAppMetadata` wrapper for Next
  metadata, Open Graph, Twitter card, icons, and version metadata.
- `helpers/Helpers.ts`: `getMetadataForUserPage` builds profile page social
  metadata and profile OG-card URLs.
- `app/waves/waves-page.shared.tsx`: `buildWavesMetadata` builds wave metadata
  and switches to drop-specific metadata when `?drop=` or `?serialNo=` is
  present.
- Media and collection routes already set some entity-specific `ogImage`
  values, but many currently use raw thumbnails or fixed images rather than a
  branded 1200x630 card contract.

## Coverage Matrix

| Area                                                    | Current behavior                                                                                                           | Expansion and standardization target                                                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Profiles                                                | Dynamic profile OG image route, large-card dimensions, profile page wiring.                                                | Keep existing card renderer, centralize URL/dimension helpers, and ensure all profile subroutes use the same image and title rules. |
| Waves                                                   | Dynamic wave OG image route for public wave links.                                                                         | Keep the route, standardize fallback title/description rules, and document direct-message privacy behavior.                         |
| Drop shares                                             | `?drop=` and `?serialNo=` can resolve to dynamic drop OG images.                                                           | Preserve query-driven drop cards, normalize titles for chat vs submission drops, and make fallback behavior explicit.               |
| Direct messages                                         | Generic `Messages` metadata; direct-message wave routes do not expose message content in cards.                            | Keep generic cards unless product explicitly approves public preview metadata for private contexts.                                 |
| Home and static app routes                              | Shared fallback metadata and some route-specific images.                                                                   | Give top-level public routes consistent title, description, image, card type, and dimensions.                                       |
| The Memes, Meme Lab, ReMemes, 6529 Gradient             | Token routes fetch/use entity images, often with `summary` Twitter cards or raw token aspect ratios.                       | Add branded NFT social cards that frame token art in 1200x630 images and standardize `summary_large_image` where appropriate.       |
| NextGen collections and tokens                          | Collection/token routes set entity images when available.                                                                  | Add branded collection and token cards with a consistent visual contract and fallback chain.                                        |
| Blog, museum, about, author, and legacy editorial pages | Many pages still contain inline Yoast-style `<meta>` fragments while `generateMetadata` often returns title-only metadata. | Move social metadata into route metadata builders and migrate inline fragments out in batches.                                      |
| Tools and admin-style pages                             | Mostly generic shared metadata.                                                                                            | Keep generic where sharing is not meaningful; add route-specific descriptions only for public utility pages.                        |

## Standard Contract

Every public shareable route should eventually follow the same contract:

- Metadata uses `getAppMetadata` or a shared wrapper around it.
- `og:image` is absolute and resolves against `publicEnv.BASE_ENDPOINT`.
- Branded dynamic cards use 1200x630 dimensions and `summary_large_image`.
- Raw thumbnails are only used as inputs to a branded card or as documented
  fallback behavior.
- The card title matches the route's canonical entity name.
- The description is concise, stable, and safe to expose publicly.
- Fallbacks degrade to a generic 6529 image without breaking crawlers.
- Private, permissioned, or direct-message routes do not leak private entity
  content through public metadata.

## Expansion Plan

1. Baseline audit correction and coverage matrix.
   - Document existing dynamic profile, wave, and drop cards.
   - Record the gaps as standardization work, not greenfield work.

2. Shared metadata contract and helper expansion.
   - Add constants/helpers for 1200x630 card dimensions, large-card metadata,
     absolute card URLs, fallback images, and Twitter card type selection.
   - Keep `getAppMetadata` as the central integration point.

3. Normalize existing profile, wave, and drop OG usage.
   - Refactor profile, wave, and drop metadata call sites to use the shared
     contract.
   - Preserve existing dynamic route behavior and the wave query-param card
     selection.
   - Add focused tests for image URL, dimensions, Twitter card, and privacy
     fallback behavior.

4. Add branded NFT and collection social cards.
   - Extend the existing `/api/og-metadata` stack with token and collection card
     renderers for The Memes, Meme Lab, ReMemes, 6529 Gradient, and NextGen.
   - Use token/collection art as media inside a 6529-branded 1200x630 frame
     rather than relying on arbitrary raw image aspect ratios.

5. Standardize legacy collection and NFT metadata builders.
   - Add helper path builders for branded collection and NFT social-card image
     routes.
   - Migrate The Memes, Meme Lab, 6529 Gradient, The Memes mint, shared
     The Memes/Meme Lab NFT metadata, and 6529 Gradient detail metadata to the
     branded card contract.

6. Standardize NextGen and ReMemes metadata.
   - Migrate ReMemes landing, add, and detail routes to branded
     collection/NFT cards.
   - Migrate NextGen landing, admin, collection, collection subpage, and token
     routes while preserving entity-specific titles, artists, collection names,
     token ids, and media fallbacks.

7. Add metadata guardrails and durable docs.
   - Add checks for public routes that should have non-generic image metadata.
   - Add tests that keep standardized collection/NFT route metadata on the
     shared helper contract.
   - Add current-state docs for the dynamic card families, helper contract,
     standardized coverage, and future expansion checklist.

Editorial and museum-page migrations remain a future follow-up after this
seven-PR standardization stack; those pages are still represented in the
coverage matrix because they keep legacy inline OG/Twitter fragments.

## Edge Cases

- Dynamic OG route failures should return safe generic metadata rather than
  blocking page rendering.
- Query-selected drop cards must handle missing, deleted, or unavailable drops.
- Media URLs can be missing, oversized, unsupported, or blocked by proxy policy.
- Some token art is vertical, animated, interactive HTML, or video; social cards
  need deterministic static fallback frames.
- Staging and production must resolve absolute image URLs from the configured
  base endpoint.
- File-based Next.js `opengraph-image.tsx` routes are not required for this
  rollout because the existing API routes are reusable across entity metadata
  call sites, especially for query-selected drop previews.

## Failure and Recovery

- If an entity-specific metadata fetch fails, use a generic title, generic
  description, and the default 6529 image.
- If dynamic OG rendering fails, keep route metadata valid and fix the image
  endpoint independently.
- If a page is private or permission-sensitive, prefer generic metadata until a
  public preview contract is approved.

## Limitations / Notes

- This page covers crawler-facing route metadata and social cards. It does not
  cover in-app markdown link previews inside waves.
- The existing dynamic profile, wave, and drop endpoints are the architectural
  baseline for expansion.
- The goal is consistent coverage and easier enforcement, not a redesign of the
  visual language in this baseline step.

## Related Pages

- [Docs Home](../README.md)
- [Shared Index](README.md)
- [Public Wave Preview](../waves/feature-public-wave-preview.md)
- [Wave Drop Link Previews](../waves/link-previews/README.md)
- [The Memes Card Tabs and Focus Links](../media/memes/feature-card-tabs-and-focus-links.md)
- [NextGen Collection Routes and Art Browser](../nextgen/feature-nextgen-collection-routes-and-art-browser.md)
