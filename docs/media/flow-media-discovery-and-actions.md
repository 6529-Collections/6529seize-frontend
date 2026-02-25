# Media Discovery and Actions Flow

## Overview

This flow covers a common media journey: discover the active Memes drop, open
minting, inspect card-level media details, and move to adjacent tools like
distribution plans, marketplace links, calendar scheduling, and Gradient views.

## Location in the Site

- Home latest-drop surface: `/`
- Memes mint route: `/the-memes/mint`
- Memes card and distribution routes: `/the-memes/{id}`,
  `/the-memes/{id}/distribution`
- Memes schedule route: `/meme-calendar`
- Gradient routes: `/6529-gradient`, `/6529-gradient/{id}`

## Entry Points

- Start from the home latest-drop countdown card and select `Mint`.
- Open `/the-memes/mint` directly.
- Open a direct card URL and switch tabs with `focus=...`.
- Open `/meme-calendar` from navigation.
- Open `/6529-gradient` from search/sidebar.

## User Journey

1. Open `/` and locate the latest-drop panel with countdown and stats.
2. Continue to `/the-memes/mint` from the countdown `Mint` action (or open the
   route directly).
3. Wait for mint data to resolve, then choose recipient mode (`Mint for me` or
   `Mint for fren`) and destination wallet.
4. Submit minting from the action module and monitor in-page transaction status.
5. Open `/the-memes/{id}` to inspect live card details, tabbed media views, and
   related actions such as `Distribution Plan`.
6. Use `/meme-calendar` (or next-mint fallback panels on upcoming numeric card
   URLs) to confirm schedule and export event timing.
7. Use NFT detail pages (Memes, Meme Lab, ReMemes, Gradient) for outbound
   marketplace links where available.
8. Use `/6529-gradient` list sorting controls (`sort`, `sort_dir`) to find and
   open specific Gradient tokens.

## Common Scenarios

- Start on home, open `Mint`, complete minting, then review card tabs on
  `/the-memes/{id}`.
- Open a shared card deep link such as `/the-memes/{id}?focus=activity` and
  move back to `Live` or `Your Cards`.
- Open `Distribution Plan` from latest-drop details or card detail pages to
  check phase and allocation context.
- Check `/meme-calendar` for upcoming timing, then export to Google Calendar or
  ICS.
- Sort `/6529-gradient` by `TDH` and open token detail routes from the list.

## Edge Cases

- `/the-memes/{id}` falls back to `Live` when `focus` is missing or unsupported.
- Upcoming numeric card routes can render the shared next-mint panel instead of
  full card tabs.
- Mint controls vary by platform and eligibility (for example iOS country
  gating and recipient-wallet requirements).
- `/6529-gradient` normalizes unsupported query values to default sort settings.
- Marketplace shortcut icons are hidden on iOS when detected country is not
  `US`.

## Failure and Recovery

- If mint or countdown data fetch fails, refresh the route to retry claim/data
  resolution.
- If recipient selection blocks minting, switch recipient mode and explicitly
  choose a valid destination wallet.
- If a calendar handoff is blocked (popup restrictions), retry with allowed
  popups or use ICS export.
- If a marketplace destination fails in a new tab, retry later or use another
  marketplace link while the source page remains open.
- If Gradient loading ends with no rows, refresh `/6529-gradient` to retry
  collection fetch.

## Limitations / Notes

- Media and mint state are informational snapshots that can lag live chain/API
  updates by a few seconds.
- Marketplace shortcuts are external links only and depend on third-party
  availability.
- Flow details for each surface remain canonical in feature pages for Memes,
  NFT, and rendering subareas.

## Related Pages

- [Media Index](README.md)
- [The Memes Mint Flow](memes/feature-mint-flow.md)
- [The Memes Card Tabs and Focus Links](memes/feature-card-tabs-and-focus-links.md)
- [Memes Minting Calendar](memes/feature-minting-calendar.md)
- [NFT Marketplace Shortcut Links](nft/feature-marketplace-links.md)
- [6529 Gradient List Sorting and Loading](rendering/feature-6529-gradient-list-sorting-and-loading.md)
- [Media Routes and Minting Troubleshooting](troubleshooting-media-routes-and-minting.md)
