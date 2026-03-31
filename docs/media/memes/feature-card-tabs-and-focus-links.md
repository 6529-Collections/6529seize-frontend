# The Memes Card Tabs and Focus Links

## Overview

- `/the-memes/{id}` uses `focus` to open a specific card tab.
- Missing or invalid `focus` is normalized to `?focus=live`.
- Tab changes and card arrows keep URL query state and update in place.
- If a numeric `{id}` does not resolve to a published card, the route shows the shared next-mint fallback panel.

## Location in the Site

- Card route: `/the-memes/{id}`
- Fallback panel on the same route when card data is unresolved

## Entry Points

- Open a card from `/the-memes`.
- Open a direct card URL such as `/the-memes/123`.
- Open a direct tab deep link such as `/the-memes/123?focus=activity`.
- Use the tab row on the card page.
- Use previous/next arrows in the card header.

## Focus Keys

- Supported `focus` values: `live`, `your-cards`, `the-art`, `collectors`, `activity`, `timeline`.
- User-visible tabs: `Live`, `Your Cards`, `The Art`, `Collectors`, `Activity`, `Timeline`.

## User Journey

1. Open `/the-memes/{id}`.
2. The route loads card metadata and card data for `{id}`.
3. The route resolves `focus` to one tab.
4. If `focus` is missing or unsupported, the route opens `Live` and rewrites to `?focus=live`.
5. Switching tabs updates `focus` with `router.replace`, so the route does not do a full-page navigation.
6. Previous/next arrows move to adjacent card IDs and keep the full query string.
7. `The Art`, `Activity`, and `Timeline` load on first open, then stay mounted for later tab switches.
8. If a numeric card id is unresolved, the route removes `focus`, hides tab content, and shows the shared next-mint fallback panel.

## Route States

- Loading state: heading is visible while card data is still resolving; tab row is not rendered yet.
- Resolved card state: tab row and tab content render.
- Unresolved numeric id state: route shows the shared next-mint fallback panel for that numeric id.
- Non-integer id state: route shows the `MEME` not-found screen.

## Common Scenarios

- Share a direct `Activity` or `Timeline` link by sharing `focus=...`.
- Keep the same tab while stepping through cards with previous/next arrows.
- Open an unresolved numeric card URL and use the fallback mint timing panel.
- Open `Your Cards` to check personal ownership and transfer history.
- Open `The Art` to review original media, Arweave links/downloads, and file
  details for the currently visible slide.

## Edge Cases

- Unknown `focus` values are rewritten to `?focus=live`.
- Tab and fallback URL rewrites preserve other existing query keys and only change/remove `focus`.
- Tab switches update the current URL entry, so browser Back does not step through each tab change.
- `Your Cards` shows wallet-specific empty states:
  - No wallet connected: prompt to connect a wallet.
  - Wallet connected with no editions: ownership empty-state message.
- `The Art` can still open in animated mode when top-level `animation` is
  blank but metadata provides `animation` or `animation_url`.
- If only one original media URL resolves, `The Art` shows just that media
  slide and its matching download/link row.
- `File Type` and `Dimensions` rows appear only when the active `The Art`
  slide has usable metadata values.
- If card fetches fail or resolve inconsistently, the route can stay in a heading-only state with no dedicated inline error panel.

## Failure and Recovery

- If a numeric ID resolves to fallback mode, use fallback timing details or return to `/the-memes` and open a nearby card.
- If card content does not appear (heading-only state), refresh the route or reopen the card from `/the-memes`.
- If a deep link opens the wrong tab, replace `focus` with a supported value.
- If the route shows `MEME` not-found, retry with a positive integer card id.

## Limitations / Notes

- Tab changes use in-place URL replacement, so browser Back skips prior tab changes.
- Deferred loading applies to `The Art`, `Activity`, and `Timeline`; first open can be slower than later switches.
- Fallback panel is the compact card-route view and is fixed to local timezone.
- Fallback panel does not expose full `/meme-calendar` controls: no timezone toggle, no `Next Mint` jump button, no `Meme #` input, and no upcoming-mints table.

## Related Pages

- [Media Memes Index](README.md)
- [The Memes List Browsing and Sorting](feature-the-memes-list-browsing-and-sorting.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
