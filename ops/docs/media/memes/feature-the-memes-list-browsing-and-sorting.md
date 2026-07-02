# The Memes List Browsing and Sorting

## Overview

- `/the-memes` is the main browse route for The Memes cards.
- The list state is URL-backed by `sort`, `sort_dir`, optional `year`, and
  optional `szn`.
- Sort, year, season, and volume-window changes rewrite the URL and reload from
  page one.
- Infinite scroll loads additional API pages while a `next` page exists.

## Location in the Site

- Route: `/the-memes`
- Typical entries:
  - Bottom navigation `Collections`
  - Header search result `The Memes`
  - Mobile/tablet `Collections` dropdown `The Memes`
  - Direct query URLs

## Entry Points

- Open `/the-memes`.
- Open a direct query URL, for example:
  - `/the-memes?sort=age&sort_dir=desc`
  - `/the-memes?sort=volume_24_hours&sort_dir=desc`
  - `/the-memes?sort=meme&sort_dir=asc&szn=12`
  - `/the-memes?sort=age&sort_dir=asc&year=4`

## URL Query Model

- `sort` accepts these normalized values:
  - `age`
  - `edition_size`
  - `meme`
  - `hodlers`
  - `tdh`
  - `percent_unique`
  - `percent_unique_cleaned`
  - `floor_price`
  - `market_cap`
  - `highest_offer`
  - `volume_24_hours`
  - `volume_7_days`
  - `volume_30_days`
  - `volume_all_time`
- `sort_dir` accepts `asc` or `desc` (case-insensitive on input).
- `year` accepts zero or positive integers that match loaded Meme Calendar
  years. Year 0 is supported.
- `szn` accepts positive integers only.
- `year` scopes the season dropdown. With no year selected, the season dropdown
  shows all loaded seasons. With a year selected, it shows only seasons in that
  year and the all option becomes `All Year N Seasons`.
- If `year` is present with no `szn`, the API request filters by all loaded
  seasons in that year. For example, Year 4 filters the list to the loaded Year
  4 seasons.
- On initial load and after control changes, the route rewrites query values to
  lowercase canonical form and drops unrelated query keys.

## User Journey

1. Open `/the-memes`.
2. The route resolves query state with defaults: `sort=age`,
   `sort_dir=asc`, and no season filter.
3. The first card page loads from `/api/memes_extended_data` with
   `page_size=48`.
4. Use sort direction controls (`asc`/`desc`).
5. Use sort controls:
   - `Age`, `Edition Size`, `Meme`, `Collectors`, `TDH`, `Unique %`,
     `Unique % Exc. Museum`, `Floor Price`, `Market Cap`, `Highest Offer`,
     `Volume`.
6. If using `Volume`, choose window: `24 Hours`, `7 Days`, `30 Days`,
   or `All Time`.
7. Set a year with the year dropdown (`All Years`, `Year 0`, `Year 1`, and so
   on).
8. Set a season with the season dropdown (`All Seasons`, `All Year N Seasons`,
   or a specific season in the active year).
9. Each control change updates the query, clears loaded rows, and refetches
   from page one.
10. When sorting by `Meme`, cards are grouped under meme headings. Heading order
   follows `sort_dir`; cards inside each heading are ordered by card id
   ascending.
11. Scroll near the page bottom to load more pages.
12. Open a card to navigate to `/the-memes/{id}`.

## Route States

- Loading:
  - While page data is being fetched, the route shows `Fetching` with a dot
    loader.
- End of list:
  - When the API returns no `next` page, automatic loading stops.
- Empty result:
  - When a fetch completes with no cards, the route shows a dedicated empty
    state suggesting a different season or sort option.
- Fetch failure:
  - The page has no inline error banner or retry button.
  - Already loaded rows stay visible.

## Common Scenarios

- Browse newest first:
  - `/the-memes?sort=age&sort_dir=desc`
- Rank by recent trading:
  - Set `Volume`, then select `24 Hours`, `7 Days`, `30 Days`, or `All Time`.
- Browse one season only:
  - Set a season filter (`szn`) and keep any sort.
- Browse one year only:
  - Set a year filter (`year`) and keep season on `All Year N Seasons`.
- Group by meme:
  - Set sort to `Meme`.
- Share exact list state:
  - Copy the rewritten route URL.
- Open a year from a card page:
  - Click the `YEAR N` breadcrumb on `/the-memes/{id}` to return to the list
    filtered to that year.

## Edge Cases

- Unsupported non-volume `sort` values fall back to `Age`.
- `sort=volume_*` with an unsupported suffix falls back to `Volume (All Time)`.
- Unsupported `sort_dir` values fall back to ascending (`asc`).
- Invalid or non-positive `szn` values are ignored.
- Invalid `year` values are ignored.
- If `szn` is not present in loaded season options, both `year` and `szn` are
  removed.
- If both `year` and `szn` are present but the season is not in that year, both
  filters are removed and the route returns to the default unfiltered list.
- Choosing a volume window while not already on `Volume` switches the active
  sort to `Volume`.
- Query input matching for `sort` and `sort_dir` is case-insensitive.
- Query keys outside `sort`, `sort_dir`, `year`, and `szn` are removed by route
  rewrites.
- Infinite scroll only continues while another API page exists.

## Failure and Recovery

- If ordering or season output is unexpected, reapply controls and use the
  rewritten URL.
- If the list looks blank with `szn` present, remove `szn` and reload.
- If loading stalls, refresh `/the-memes`.
- If card navigation fails, reopen the card from `/the-memes` or open
  `/the-memes/{id}` directly.

## Limitations / Notes

- List rows are API-backed and can lag briefly after metadata or market changes.
- Loading more rows depends on scrolling near the page bottom.
- The route does not preserve unrelated query keys.
- The route has no dedicated error-state callout.

## Related Pages

- [Media Memes Index](README.md)
- [The Memes Card Tabs and Focus Links](feature-card-tabs-and-focus-links.md)
- [The Memes Mint Flow](feature-mint-flow.md)
- [NFT Balance Indicators](../nft/feature-balance-indicators.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
- [Docs Home](../../README.md)
