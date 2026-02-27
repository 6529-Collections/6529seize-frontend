# NextGen Collection and Token Media Flow

Parent: [NextGen Index](README.md)

## Overview

This flow covers the main NextGen path from featured discovery into collection
browsing and token media actions, with optional mint and distribution-plan
branches.

## Location in the Site

- Featured discovery: `/nextgen`
- Collection routes:
  `/nextgen/collection/{collection}` and
  `/nextgen/collection/{collection}/{overview|about|provenance|top-trait-sets}`
- Collection browsers:
  `/nextgen/collection/{collection}/art` and
  `/nextgen/collection/{collection}/trait-sets`
- Token routes:
  `/nextgen/token/{token}` and
  `/nextgen/token/{token}/{provenance|display-center|rarity}`
- Optional operation routes:
  `/nextgen/collection/{collection}/{mint|distribution-plan}`

## Entry Points

- Open `/nextgen` and use `Explore Collection`.
- Open a token card from the featured or collection slideshow.
- Open `View All` from `The Art` preview.
- Open a shared collection or token URL directly.
- Open shared `/mint` or `/distribution-plan` URLs directly.

## User Journey

1. Open `/nextgen`.
2. Open a collection from `Explore Collection` or open a slideshow token.
3. On the collection page, switch among `Overview`, `About`, `Provenance`, and
   `Trait Sets`.
4. Optional branch: open full `Trait Sets` and use trait links that route into
   filtered `/art`.
5. Open `View All` in `The Art` to move into `/art`.
6. In `/art`, apply filters/sort as needed and open a token card.
7. On `/nextgen/token/{token}`, start in `About`, then switch media modes:
   `2K`, high-res (`8K` mobile or `16K` desktop), or `Live`.
8. Use media actions: light viewer, dark viewer, `Download`, `Open in new tab`,
   and `Fullscreen`.
9. Switch token detail views (`About`, `Provenance`, `Display Center`,
   `Rarity`) when needed.
10. Optionally branch into `/mint` or `/distribution-plan`, then return to
    collection or token browsing.

## Route Behavior

- Invalid collection slugs return not-found.
- Numeric collection paths (for example `/nextgen/collection/1`) are rewritten
  to slug paths.
- Unsupported collection view segments resolve to `Overview`.
- Unsupported token view segments resolve to `About`.
- If indexed token data is missing or pending, token routes fall back to the
  on-chain token panel.

## Common Scenarios

- Discovery path: `/nextgen` -> collection -> `/art` -> `/nextgen/token/{token}`.
- Direct token path: shared `/nextgen/token/{token}` URL to media controls.
- Trait-set detour: `Trait Sets` preview or full `/trait-sets` -> filtered
  `/art` -> token.
- Mint branch path: collection countdown `MINT`/`BURN TO MINT` -> `/mint`.

## Edge Cases

- Collection routes show slideshow only when `mint_count > 0`; featured
  `/nextgen` can still render the slideshow section.
- `Live` mode stays on static image output when no `animation_url` exists.
- High-res zoom controls stay hidden until the high-res image finishes loading.
- Previous/next token arrows disable at first/last token positions.

## Failure and Recovery

- Slideshow, collection-art, and token-media fetches have no inline retry
  button.
- If slideshow cards or `/art` results look empty, refresh and adjust active
  `/art` filters.
- Standard image failures fall back to `/pebbles-loading.jpeg`.
- High-res failures fall back to `/fallback-image.jpeg`.
- Fullscreen failures keep normal layout and show a browser alert.
- If a download option shows `Coming Soon`, choose another resolution.

## Limitations / Notes

- Slideshow order comes from random token API sorting and is not user-sortable.
- Token media mode list and download resolution list are fixed.
- Some download resolutions can remain `Coming Soon`.
- Mint/admin actions require connected wallet plus correct chain and role.

## Related Pages

- [NextGen Home Views and Navigation](feature-nextgen-home-views-and-navigation.md)
- [NextGen Collection Routes and Art Browser](feature-nextgen-collection-routes-and-art-browser.md)
- [NextGen Collection Slideshow](feature-collection-slideshow.md)
- [NextGen Mint and Distribution Plan](feature-nextgen-mint-and-distribution-plan.md)
- [NextGen Token Media Rendering](feature-token-media-rendering.md)
- [NextGen Slideshow and Token Media Troubleshooting](troubleshooting-nextgen-slideshow-and-token-media.md)
- [NextGen Routes, Mint, and Admin Troubleshooting](troubleshooting-nextgen-routes-mint-and-admin.md)
