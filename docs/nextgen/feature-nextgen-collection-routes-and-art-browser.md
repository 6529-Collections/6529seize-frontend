# NextGen Collection Routes and Art Browser

Parent: [NextGen Index](README.md)

## Overview

NextGen collection routes expose collection overview tabs, a full art browser,
and trait-set views.

## Location in the Site

- Collection overview route: `/nextgen/collection/{collection}`
- Collection tab route family: `/nextgen/collection/{collection}/{view}`
- Full art route: `/nextgen/collection/{collection}/art`
- Full trait-sets route: `/nextgen/collection/{collection}/trait-sets`

## Entry Points

- Open a collection from `/nextgen` featured content.
- Open a collection from `/nextgen/collections`.
- Use `View All` from collection slideshow or collection-art preview blocks.
- Open a collection URL directly.

## User Journey

1. Open a collection route.
2. Use overview tabs (`Overview`, `About`, `Provenance`, `Trait Sets`).
3. Open `The Art` route (`/art`) for full token browsing.
4. In `/art`, apply filters (traits, listing status, sort, direction).
5. Open token cards to continue into `/nextgen/token/{token}`.
6. Open `/trait-sets` for full trait-set browsing, search, and pagination.

## Common Scenarios

- Collection routes render slideshow preview only when `mint_count > 0`.
- Numeric collection path segments are rewritten to slug-style collection names.
- `/art` syncs active filters into URL query params for reload persistence.
- Mobile starts `/art` with filters collapsed; desktop starts with filters open.
- Collection `Trait Sets` tab uses route `top-trait-sets`, while
  `/trait-sets` is the dedicated full-page trait-set browser.

## Edge Cases

- Unknown collection view segments fall back to `Overview`.
- Missing collections return Next.js not-found behavior.
- Trait or token queries can produce zero-result states with valid filters.

## Failure and Recovery

- Art and trait fetches do not expose a dedicated retry button in-page.
- Clear filters or change sort/listing constraints when result counts drop to
  zero.
- Refreshing or reopening the route retries collection, trait, and token fetches.

## Limitations / Notes

- Collection art sorting is limited to predefined filter options.
- Collection and trait browsing interactions require client-side JavaScript.

## Related Pages

- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
