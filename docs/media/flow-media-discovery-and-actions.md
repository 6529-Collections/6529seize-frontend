# Media Discovery and Actions Flow

## Overview

This flow covers cross-route media tasks:

- Find the current drop on `/`.
- Mint on `/the-memes/mint` when minting is active.
- Move through The Memes card, distribution, and calendar routes.
- Continue into Meme Lab, ReMemes, and 6529 Gradient list/detail routes.

## Location in the Site

- Home entry surface: `/` (`Latest Drop` or `Next Drop`)
- The Memes routes: `/the-memes`, `/the-memes/mint`, `/the-memes/{id}`,
  `/the-memes/{id}/distribution`
- Memes calendar route: `/meme-calendar`
- Meme Lab routes: `/meme-lab`, `/meme-lab/collection/{collection}`,
  `/meme-lab/{id}`, `/meme-lab/{id}/distribution`
- ReMemes routes: `/rememes`, `/rememes/{contract}/{id}`, `/rememes/add`
- Gradient routes: `/6529-gradient`, `/6529-gradient/{id}`

## Entry Points

- Start on `/`:
  - `Latest Drop` can open `Mint` (`/the-memes/mint`).
  - `Next Drop` opens a Wave link (`/waves?wave=...&drop=...`), then users can
    return to media routes.
- Open `Network -> Memes Calendar` from the sidebar.
- Open shared URLs directly.
- Use header search (`The Memes`, `Meme Lab`, `ReMemes`, `6529 Gradient`).
- Use in-route handoffs:
  - `Distribution Plan` from card routes.
  - `References` links between ReMemes and The Memes cards.
  - ReMeme `Replicas` chips for sibling token routes.

## User Journey

1. Open `/` and review the current top card (`Latest Drop` or `Next Drop`).
2. If `Mint` is available, open `/the-memes/mint`.
3. On `/the-memes/mint`, wait for mint data, select `Mint for me` or
   `Mint for fren`, choose a destination wallet, set mint count, and submit.
4. Track transaction state (`Transaction Submitted - SEIZING ...`, then
   `SEIZED!`) on the same page.
5. Open `/the-memes` or `/the-memes/{id}` to browse cards and tabs.
6. Use `Distribution Plan` from card views:
  - Opens `/the-memes/{id}/distribution` when distribution is published.
  - Opens the external card repository path when distribution is not published.
7. Use `/meme-calendar` for timeline and calendar exports.
8. Browse `/meme-lab`, open collection pages, then open `/meme-lab/{id}` and
   optional `/meme-lab/{id}/distribution`.
9. Browse `/rememes`, filter results, open `/rememes/{contract}/{id}` tabs
   (`Live`, `Metadata`, `References`), or submit at `/rememes/add`.
10. Browse `/6529-gradient`, use `sort` and `sort_dir`, open
    `/6529-gradient/{id}`, and use token-level actions.

## Common Scenarios

- Home to mint to card deep-link:
  open `/`, mint at `/the-memes/mint`, then share/open
  `/the-memes/{id}?focus=...`.
- Card to distribution to schedule:
  open `/the-memes/{id}`, open `Distribution Plan`, then check timing on
  `/meme-calendar`.
- Meme Lab to distribution:
  open `/meme-lab`, open a card, then open `Distribution Plan` when present.
- ReMemes reference review:
  filter `/rememes` by `Meme Reference`, inspect detail tabs, then open linked
  The Memes cards from `References`.
- Gradient detail check:
  sort `/6529-gradient` by `ID` or `TDH`, open a token, then use marketplace
  shortcuts when shown.

## Edge Cases

- `/` switches from `Latest Drop` to `Next Drop` when minting is ended and a
  next drop exists.
- On iOS outside `US`, mint controls are hidden. On iOS in `US`, minting uses
  `Mint on 6529.io`.
- `/the-memes/{id}` ignores unsupported `focus` values and falls back to
  `Live`.
- Upcoming numeric `/the-memes/{id}` routes can show the next-mint fallback
  panel instead of full card data.
- `/the-memes/{id}/distribution` with no published distribution shows
  next-mint fallback plus `The Distribution Plan will be made available soon!`.
- Invalid or non-positive distribution IDs show the `DISTRIBUTION` not-found
  view.
- `/rememes` keeps only `meme_id` in the URL. Sort, token type, and page reset
  on reload.
- `/6529-gradient` normalizes unsupported `sort` to `id` and `sort_dir` to
  `asc`.
- Marketplace shortcut icons are hidden on iOS unless detected country is
  `US`.

## Failure and Recovery

- If `/the-memes/mint` shows `Error fetching mint information` or
  `No mint information found`, refresh and retry.
- If `Mint for fren` is selected but mint actions stay unavailable, choose a
  recipient wallet first.
- If calendar handoff is blocked, allow popups or use ICS export.
- If Meme Lab, ReMemes, or Gradient pages stay empty after fetch failures,
  refresh from canonical list routes (`/meme-lab`, `/rememes`,
  `/6529-gradient`).
- If an external marketplace page fails, retry later or use another available
  marketplace shortcut.

## Limitations / Notes

- `/the-memes/mint` always targets the current latest Memes mint.
- Media list/detail state is API-backed and can lag briefly behind chain/API
  changes.
- Some route state is URL-backed (`focus`, `sort`, `sort_dir`), but some
  controls remain in-memory only (for example, several ReMemes filters).
- Marketplace and repository links are external destinations and depend on
  third-party availability.
- Canonical route behavior remains owned by the linked feature pages.

## Related Pages

- [Media Index](README.md)
- [Now Minting Countdown](memes/feature-now-minting-countdown.md)
- [Latest Drop Stats Grid](memes/feature-latest-drop-stats-grid.md)
- [The Memes Mint Flow](memes/feature-mint-flow.md)
- [The Memes Card Tabs and Focus Links](memes/feature-card-tabs-and-focus-links.md)
- [Memes Minting Calendar](memes/feature-minting-calendar.md)
- [Meme Lab List and Collection Browsing](collections/feature-meme-lab-list-and-collection-browsing.md)
- [Meme Lab Card Route Tabs and Navigation](collections/feature-meme-lab-card-route-tabs-and-navigation.md)
- [ReMemes Browse and Detail](collections/feature-rememes-browse-and-detail.md)
- [ReMemes Add Submission](collections/feature-rememes-add-submission.md)
- [NFT Marketplace Shortcut Links](nft/feature-marketplace-links.md)
- [6529 Gradient List Sorting and Loading](rendering/feature-6529-gradient-list-sorting-and-loading.md)
- [Media Routes and Minting Troubleshooting](troubleshooting-media-routes-and-minting.md)
