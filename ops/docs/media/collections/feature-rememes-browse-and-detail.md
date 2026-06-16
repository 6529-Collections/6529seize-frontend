# ReMemes Browse and Detail

## Overview

- `/rememes` is the ReMemes browse route.
- `/rememes/{contract}/{id}` is the ReMeme detail route.
- Browse supports sort/filter controls, random refresh, pagination, and detail
  handoff.
- Browse is progressively i18n-ready for labels, accessible names, metadata,
  logo alt text, loading text, count formatting, locale-preserving card/detail
  navigation, and the Add ReMeme action.
- Detail is progressively i18n-ready for document metadata, labels, accessible
  names, tab labels, reference-card labels, and locale-preserving navigation.
- Detail uses in-page tabs: `Overview`, `Metadata`, and `References`.

## Location in the Site

- Browse route: `/rememes`
- Detail route: `/rememes/{contract}/{id}`

## Entry Points

- Open `Collections > ReMemes` from the sidebar.
- Search `ReMemes` in header search, then open the page result.
- Open `/rememes` directly.
- Open a shared detail URL (`/rememes/{contract}/{id}`) directly.
- Open a card from `/rememes`.
- Open a ReMeme card from `/the-memes/{id}` `ReMemes` section.

## User Journey

### Browse Route `/rememes`

1. Open `/rememes`.
2. Wait for `Fetching ...` to finish.
3. Review the header actions:
   - Result count badge
   - `LFG: Start the Show!`
   - `Add ReMeme` (`/rememes/add`, preserving non-default `locale`)
4. Apply filters:
   - `Sort`: `Random` or `Recently Added`
   - `Token Type`: `All`, `ERC-721`, `ERC-1155`
   - `Meme Reference`: `All` or one Meme ID
5. If `Sort` is `Random`, use refresh to reroll current page results.
6. Open a card to `/rememes/{contract}/{id}`.
7. Use pagination when results exceed 40 items.

### Detail Route `/rememes/{contract}/{id}`

1. Open the route directly or from a browse card.
2. On `Overview`, review artwork, collection/contract label, creator/added-by
   fields (when shown), and external links.
3. Use `Overview` replica chips (when shown) to open sibling token IDs.
4. Open `Metadata` to review token URI, token type, parsed metadata, and
   attributes.
5. Open `References` to view linked `The Memes` cards and open
   `/the-memes/{id}`.

## Common Scenarios

- Filter by one Meme reference, then open a replica from detail `Overview`.
- Switch to `Recently Added` to inspect newer additions first.
- Open `Metadata` for token URI and attributes, then open `References` to
  inspect linked Meme cards.

## URL and Query Behavior

- Browse reads `meme_id` and `locale`.
- Detail reads `locale`.
- Changing `Meme Reference` updates the URL to `?meme_id={id}` (or clears it
  for `All`) and preserves non-default `locale` values.
- Supported locale query values are `en-US`, `en-GB`, `fr-FR`, `es-ES`, and
  `de-DE`; unsupported locale values fall back to `en-US`.
- Malformed, non-positive, unsafe, and non-canonical `meme_id` values are
  normalized before browse renders. Invalid values are removed from the URL
  while unrelated params and supported non-default locales are preserved;
  leading-zero positive values such as `0042` redirect to canonical
  `?meme_id=42`.
- Count formatting follows the active locale; visible token IDs remain stable
  identifiers.
- Browse exposes the card grid as a labelled results list for assistive
  technology.
- Browse card, Add ReMeme, detail back, replica, and reference-card links
  preserve non-default `locale` values.
- Sort, token type, and page are in-memory state and reset on reload.
- Changing sort/token type/meme filter resets pagination to page 1.
- Detail tabs (`Overview`, `Metadata`, `References`) are in-page state only and
  do not use URL query keys.

## Loading, Empty, and Error States

- Browse shows `Fetching ...` during each list fetch.
- Browse filter controls are hidden while fetch is in progress.
- Empty results show the shared `Nothing here yet` panel.
- Browse fetch failures show no inline error banner. If the route already had
  results, the previous results remain rendered after failure.
- Detail route has no dedicated loading row; before token data resolves, only
  the ReMemes banner can be visible.
- If detail response does not resolve to exactly one token, no dedicated
  not-found or retry panel is shown.
- `References` has no loading state and can show the empty panel before
  references finish loading.
- If references fetch fails, `References` stays on empty panel with no inline
  error.

## Edge Cases

- Refresh icon is only available in `Random` sort mode.
- `Recently Added` maps to descending `created_at` order.
- Replica chips appear only when the token has more than one replica.
- `NFT Marketplace Links` are hidden on iOS unless detected country is `US`.
- On mobile/tablet (`< xl`), collection switching appears in a dropdown above
  filters.
- Valid positive numeric `meme_id` values that are not in the loaded meme list
  still apply as a filter and can return empty results.

## Failure and Recovery

- If browse looks empty unexpectedly, reset to `All`, switch to `Random`, then
  refresh results.
- If a shared detail URL appears blank, reopen the token from `/rememes` cards
  to confirm a valid contract/token pair.
- If `References` stays empty for a known token, reopen the detail route and
  retry the tab.
- If marketplace shortcuts are missing on iOS, use available non-gated links
  (for example Etherscan) or retry on a supported platform/location.

## Limitations / Notes

- Browse/filter behavior is API-backed and can lag briefly behind latest
  submissions.
- Browse page size is fixed at 40.
- Filter state is not fully shareable by URL (`meme_id` only).
- Detail tabs are not deep-linkable by URL.
- Marketplace behavior is documented canonically in NFT marketplace docs.
- Non-`en-US` Rememes browse/detail translations currently fall back to
  `en-US` while the route-level migration pattern is reviewed.

## Related Pages

- [Media Collections Index](README.md)
- [ReMemes Add Submission](feature-rememes-add-submission.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
