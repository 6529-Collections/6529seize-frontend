# Meme Lab Card Route Tabs and Navigation

## Overview

This page owns two connected routes:

- Card detail route: `/meme-lab/{id}`
- Distribution route: `/meme-lab/{id}/distribution`

Card detail uses `focus` tab deep links and previous/next card navigation.
Distribution route shows wallet-level distribution rows, wallet filters, and
pagination.

On desktop, card sections use 16px headings, 14px labels and values, and 12px
metadata. Previous/next controls have compact rounded corners. A horizontal
divider separates Card details from Properties. The main tab baseline spans
the content width, matching The Memes. Properties use quiet borderless tiles
in a three-column, six-property preview. **Show all
{count} properties** expands the list; **Show fewer** restores the preview. The
control appears only when more than six properties are available. Smaller
screens keep all properties visible. Timeline entries use the full section width with
dark backgrounds, thin markers, and horizontal dividers. Smaller screens keep
their existing typography and controls.

## Location in the Site

- Meme Lab card route: `/meme-lab/{id}`
- Meme Lab distribution route: `/meme-lab/{id}/distribution`

## Entry Points

- Open a card from `/meme-lab` or `/meme-lab/collection/{collection}`.
- Open a direct card URL such as `/meme-lab/123`.
- Open a direct tab URL such as `/meme-lab/123?focus=activity`.
- Open a progressive locale URL such as `/meme-lab/123?locale=de-DE`.
- On card `Overview`, use `Distribution Plan` when shown; supported
  non-default `locale` values are preserved in the linked distribution URL.
- Open `/meme-lab/{id}/distribution` directly.

## User Journey

### Card Route `/meme-lab/{id}`

1. Open `/meme-lab/{id}`.
2. The route reads `focus` and resolves one visible tab:
   `Overview`, `Listings & offers`, `Collectors`, `History`, or `References`.
3. If `focus` is missing or unsupported, the page opens `Overview`.
4. Switch tabs from the tab row; each switch rewrites `focus` in place while
   preserving supported `locale` query values. Primary and History tab switches
   keep the tab row visible with the new section at its top.
5. Use previous/next arrows to move to adjacent card IDs while keeping the
   current query string.
6. On `Overview`, review card stats, collection links, ownership summary when
   connected, original media controls, and marketplace shortcuts when available.
7. Original files, metadata, properties and card details follow the description
   in Overview. Existing `focus=the-art` URLs open Overview. The
   `focus=listings-and-offers` tab shows market prices immediately without a
   second accordion. **View listings & offers** beside the artwork actions opens
   this tab and focuses its market section.
8. On `Collectors`, review the holder leaderboard. At 768 px and wider,
   click the `Balance` column label to switch between high-to-low and low-to-high
   order. Its arrow shows the current direction. The header supports Enter and
   Space. Smaller screens retain the separate ascending and descending controls.
9. On `References`, review linked The Memes cards referenced by the Meme Lab
   card.
10. On `History`, use the sub-tabs for `Card Activity`, `Your Transactions`
    when wallet transactions are available, or `Timeline`.
11. On `Card Activity`, filter transaction types, review rows, and paginate.
12. On `Timeline`, review card history milestones.

### Collect, list or make an offer

Meme Lab cards use the same trading controls and purchase review as The Memes.
On desktop, **Connect wallet** appears above the trading actions. When **Collect**
is available, **List** sits in **More trading actions** beside **Make an offer**;
without **Collect**, **List** remains visible in the action row. Smaller screens
keep their existing layout. **View listings & offers** remains below the actions.
On desktop, **Mint date** and **Mint Price** share a row above the card statistics.
**Distribution Plan** follows the mint row when available. All edition, burn,
reserve, rank, collection and metadata information retains its existing values
and visibility rules; smaller screens keep their existing order.
**Collect** near the artwork shows the lowest supported listing; **Other listings**
shows alternatives. **Make an offer** opens a WETH offer for this exact card.
**List** checks ownership and requires the wallet holding the editions to sign.
Prices can load before connecting; reviewing a trade requires a connected wallet.

In **Listings & offers**, choose **Collect** beside a listing or **Sell** beside
an eligible offer. When several orders share a price, choose the exact order from
the expanded row. Set a supported edition quantity and review the selected
listings together. Collection-wide or trait offers are checked for this exact
Meme Lab card before review.

Purchases show separate **Pay with** and **Deliver to** wallets. Choose a confirmed
profile wallet or **Send to a fren**; a purchase review also lets you
change delivery from its expanded **Deliver to** row. Review quantities, fees and
the resolved destination before continuing in your wallet. Prices and availability
are checked again automatically, and changed terms require another review.

See [Listings and Offers](../feature-card-market-depth.md) for selection rules and
[Collecting Tools](../collecting.md) for wallet support and transaction recovery.

### Distribution Route `/meme-lab/{id}/distribution`

1. Open this route from `Distribution Plan` on `Overview`, or open the route
   directly.
2. The route validates `{id}` as a positive integer.
3. The route reads supported `locale` query values for progressive
   message-backed copy and locale-aware number formatting.
4. Review the page header, optional distribution photos, and wallet table.
5. Use wallet search filters to narrow rows; changing filters resets pagination
   to page 1.
6. Review allowlist-phase columns, minted/total columns, and pagination when
   enough rows are available.

## Common Scenarios

- Share a deep link such as `/meme-lab/123?focus=timeline`.
- Preserve a non-default locale while moving between tabs, for example
  `/meme-lab/123?locale=de-DE&focus=collectors`.
- Stay on the same tab while moving card-to-card with navigation arrows.
- Open `Distribution Plan` from a non-default locale URL, keep that locale on
  the distribution route, filter for one or more wallets, then clear filters.

## Edge Cases

- Unsupported `focus` values fall back to `Overview`.
- Legacy `focus=activity`, `focus=timeline`, and `focus=your-transactions`
  deep links open the grouped `History` tab and select the matching sub-tab.
- If card metadata does not resolve for `{id}`, the route can render only the
  page heading, with no inline not-found panel.
- Previous/next arrows are disabled at the first and last available card index.
- Artwork details in Overview resolve animation media from metadata when top-level `animation`
  is blank but metadata provides `animation` or `animation_url`.
- Only available original media links appear, with matching open/download
  actions.
- File type and dimensions use available metadata; missing values show `N/A`.
- `Card Activity` can show a loading spinner first, then an empty-state panel
  when no rows are available.
- `/meme-lab/{id}/distribution` with non-positive or invalid IDs shows the
  distribution not-found screen.
- Distribution routes with valid IDs can show an empty
  `The Distribution Plan will be made available soon!` state.
- Distribution wallet filters can show `No results found for the search
criteria.` even when unfiltered distribution data exists.
- Distribution fetch failures fall back to the same empty-state view (no
  dedicated inline error panel).

## Failure and Recovery

- Timeline previews use [historical media fallbacks](../nft/feature-media-source-fallbacks.md#historical-timeline-previews)
  when a recorded Arweave source fails.
- If card content does not appear, reopen the card from `/meme-lab` or refresh
  `/meme-lab/{id}`.
- If a deep link opens the wrong tab, replace `focus` with a supported key or
  remove it.
- If card detail stays on heading-only state, open a nearby card ID or reopen
  from `/meme-lab`.
- If distribution filters return no rows, clear wallet filters and retry.
- If distribution remains empty without filters, retry later from the same
  route.

## Limitations / Notes

- `focus` supports the visible tabs plus legacy/deep-link keys described above.
- Non-default `locale` values currently use progressive message fallbacks; the
  detail route preserves supported locale values but does not add locale path
  prefixes yet.
- Tab switches use in-place URL replacement, so browser Back does not step
  through prior tab changes.
- Tab switches preserve supported locale query values.
- `Distribution Plan` link on card `Overview` is shown only when distribution
  is available for that card, and preserves supported non-default `locale`
  query values.
- Marketplace shortcuts are hidden in the iOS app.
- Meme Lab trading is available from individual card pages. The set planner,
  Lowest listings and TDH tools continue to cover Memes, Gradients and Pebbles.
- Card and distribution data are API-backed snapshots and can lag briefly.
- Card-level ownership chips, marketplace details, media fallback, and transfer
  behavior are owned by media NFT feature pages.

## Related Pages

- [Media Collections Index](README.md)
- [Meme Lab List and Collection Browsing](feature-meme-lab-list-and-collection-browsing.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [NFT Marketplace Shortcut Links](../nft/feature-marketplace-links.md)
- [NFT Media Source Fallbacks](../nft/feature-media-source-fallbacks.md)
- [NFT Transfer](../nft/feature-transfer.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
