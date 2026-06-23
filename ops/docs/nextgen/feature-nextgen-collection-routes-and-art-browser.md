# NextGen Collection Routes and Art Browser

Parent: [NextGen Index](README.md)

## Overview

This page covers collection-route browsing:

- Collection tabs (`Overview`, `About`, `Provenance`, `Trait Sets`)
- Full art browser (`/art`)
- Full trait-set browser (`/trait-sets`)

## Location in the Site

- Collection overview route: `/nextgen/collection/{collection}`
- Collection tab routes:
  `/nextgen/collection/{collection}/{about|provenance|top-trait-sets|overview}`
- Full art route: `/nextgen/collection/{collection}/art`
- Full trait-sets route: `/nextgen/collection/{collection}/trait-sets`

## Entry Points

- Open `Explore Collection` from `/nextgen` featured content.
- Open a collection card from `/nextgen/collections`.
- Use `View All` from the collection `The Art` preview.
- Use `View All` or `View All Trait Sets` from the `Trait Sets` preview.
- Open a collection URL directly.

## User Journey

1. Open `/nextgen/collection/{collection}`.
2. Switch tabs (`Overview`, `About`, `Provenance`, `Trait Sets`) as needed.
3. Open `View All` in `The Art` to move to `/art`.
4. In `/art`, set trait filters, listing status, sort, and direction.
5. Open token cards to continue into `/nextgen/token/{token}`.
6. Open `/trait-sets` for full trait-set browsing with wallet search.

## Route Behavior

- Missing collections return Next.js not-found.
- Unknown collection view segments resolve to `Overview`.
- Numeric collection paths (for example `/nextgen/collection/1`) are rewritten
  to slug routes (for example `/nextgen/collection/pebbles`).
- Collection slideshow renders only when `mint_count > 0`.
- `Trait Sets` tab uses `top-trait-sets`; `/trait-sets` is the dedicated
  full-page trait-set browser.

## Art Browser (`/art`)

- Full-page `/art` supports:
  `Traits`, `Listing Status`, `Sort`, and sort direction controls.
- `Listing Status` values are `All`, `Listed`, and `Not Listed`.
- Rarity toggles (`Trait Normalization`, `Trait Count`) are only active for
  rarity-based sort modes.
- Default full-page state: `Sort = ID`, `Direction = DESC`, `Listing Status = All`.
- Query params are restored on load:
  `traits`, `sort`, `sort_direction`, `listed`, `show_normalised`,
  `show_trait_count`.
- Invalid trait/value query pairs are ignored.
- Changing controls updates the `/art` URL query so reload/back-forward keeps
  active filters.
- Collection-page `The Art` preview shows 6 cards and links to full `/art`.
- `/art` states:
  loading spinners, total-result counter, `No results found`, and pagination.
- Mobile opens `/art` with filters collapsed; desktop opens with filters shown.

## Trait Sets (`/trait-sets` and `top-trait-sets`)

- `top-trait-sets` (tab view) is preview mode (`page_size = 10`).
- Full `/trait-sets` uses larger pages (`page_size = 25`) and wallet search.
- Trait pills are collection-specific plus `Ultimate`.
- Each trait row shows collector, distinct-value count, and token/value links.
- Trait values link back to filtered `/art` routes.
- Missing values display under `Not Seized`; complete sets show a completion
  check state.
- Empty states:
  `No results found` for regular trait views, `None!` state for empty
  `Ultimate` results.

## Failure and Recovery

- Collection, art, and trait-set fetches do not expose a dedicated retry button.
- Reloading the route retries collection/trait/token fetches.
- If `/art` is empty, clear trait/listing filters or change sort.
- If `/trait-sets` is empty, clear wallet search or switch trait mode.

## Limitations / Notes

- Art sorting and listing controls are fixed to predefined options.
- Collection, art, and trait-set interactions require client-side JavaScript.

## Related Pages

- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
- [NextGen Collection and Token Media Flow](flow-nextgen-collection-and-token-media.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
