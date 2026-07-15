# The Memes Card Tabs and Focus Links

## Overview

- `/the-memes/{id}` uses `focus` to open a specific card tab.
- Missing or invalid `focus` opens the default Overview tab.
- Tab changes and card arrows keep URL query state and update in place.
- If a numeric `{id}` does not resolve to a published card, the route shows
  the shared next-mint fallback panel plus subscription awareness for that
  upcoming card.

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

- Supported `focus` values map to the visible detail UI as follows:

| Focus Value         | User-Visible Area                                  |
| ------------------- | -------------------------------------------------- |
| `live`              | `Overview` primary tab                             |
| `your-cards`        | `History` primary tab, `Your Transactions` sub-tab |
| `the-art`           | `Overview` primary tab, art details opened         |
| `references`        | `References` primary tab                           |
| `collectors`        | `Collectors` primary tab                           |
| `history`           | `History` primary tab, default history sub-tab     |
| `your-transactions` | `History` primary tab, `Your Transactions` sub-tab |
| `activity`          | `History` primary tab, `Card Activity` sub-tab     |
| `timeline`          | `History` primary tab, `Timeline` sub-tab          |

- Missing or invalid `focus` opens `Overview`.
- `Your Transactions` appears only when the connected wallet has transactions
  for the card; otherwise the route falls back to `Card Activity`.

## User Journey

1. Open `/the-memes/{id}`.
2. The route loads card metadata and card data for `{id}`.
3. The route resolves `focus` to one tab.
4. If `focus` is missing or unsupported, the route opens `Overview`.
5. Switching tabs updates `focus` with native history replacement integrated
   with the Next router, avoiding a server round trip or full-page navigation.
6. Previous/next arrows move to adjacent card IDs and keep the full query string.
7. The `Overview` live stats use the active supported `locale` for source
   copy fallbacks, mint dates, counts, ranks, percentages, and market numbers.
8. `Card Activity` uses the active supported `locale` for volume labels and
   ETH numbers, activity headings, the transaction-type dropdown label/options,
   loading and empty states, and the hidden activity-table caption.
9. `Timeline` uses the active supported `locale` for its region label, UTC date
   formatting, URI/TXN link labels, change field labels, and timeline media
   accessible names.
10. `References` uses the active supported `locale` for Meme Lab/ReMemes
    descriptions, logo alt text, sort labels, refresh labels, ReMeme empty
    state, ReMeme card accessible names, ReMeme link locale preservation, and
    replica counts.
11. The header calendar period strip uses the active supported `locale` for
    period labels, season-link accessible text, locale-preserving season
    links, and period number formatting.
12. Additional art details, references, collectors, activity, and timeline code
    load only when first opened; collapsed art details are not mounted.
13. The header Art Viewer uses the active supported `locale` for media action
    accessible names and save dialog titles.
14. The Art additional-details rows use the active supported `locale` for
    section headings, metric labels, empty states, open/download labels, and
    TDH/rank number formatting.
15. If a numeric card id is unresolved, the route removes `focus`, hides tab
    content, and shows the shared next-mint fallback panel with subscription
    awareness for that card.

## Route States

- Loading state: heading is visible while card data is still resolving; tab row is not rendered yet.
- Resolved card state: tab row and tab content render.
- Unresolved numeric id state: route shows the shared next-mint fallback panel
  and subscription awareness widget for that numeric id.
- Non-integer id state: route shows the `MEME` not-found screen.

## Common Scenarios

- Share a direct `Activity` or `Timeline` link by sharing `focus=...`.
- Keep the same tab while stepping through cards with previous/next arrows.
- Open an unresolved numeric card URL and use the fallback mint timing panel.
- Open `Your Cards` to check personal ownership and transfer history.
- Open `The Art` to review original media, Arweave links/downloads, and file
  details for the currently visible slide.

## Edge Cases

- Unknown `focus` values open `Overview`.
- Tab URL replacements preserve other existing query keys and only change
  `focus`.
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
- Primary tab labels, history tab labels, heading accessible names, and the
  back link accessible name are message-backed for progressive localization.
- During component-level migration, the optional `locale` query parameter can be
  used to smoke-test supported locales on this detail route. Missing or
  unsupported `locale` values fall back to `en-US`.
- Overview live-stat labels, creator labels, additional-details controls, mint
  dates, counts, ranks, percentages, and market numbers are routed through the
  progressive i18n helpers.
- Card Activity headings, dropdown labels/options, volume labels and ETH
  numbers, loading and empty states, and the hidden table caption are routed
  through the progressive i18n helpers.
- Shared activity-row copy, pagination copy, and transaction-specific date and
  amount formatting remain deferred activity-surface debt.
- Header Art Viewer fullscreen/open/download/downloading/close controls,
  previous/next media buttons, and save dialog titles are routed through the
  progressive i18n helpers.
- The Art additional-details section headings, metric labels, empty states,
  open/download labels, and TDH/rank number formatting are routed through the
  progressive i18n helpers. Property trait names/values and media URLs remain
  source-data copy.
- References tab Meme Lab/ReMemes descriptions, logo alt text, sort labels,
  refresh labels, ReMeme empty state, ReMeme card accessible names, ReMeme link
  locale preservation, and replica counts are routed through the progressive
  i18n helpers. ReMeme names, collection names, token IDs, and source NFT
  metadata remain source-data copy.
- The References refresh action is keyboard reachable with a semantic button.
- The header calendar period strip has message-backed period labels and
  accessible names, locale-aware number formatting, locale-preserving season
  links, a labelled group for the secondary period cluster, and a 24px minimum
  target on the season link.
- Timeline region labels, UTC date formatting, URI/TXN link labels, and shared
  change field labels are routed through the progressive i18n helpers.
- Timeline image alt text, video accessible labels, and HTML iframe titles use
  message-backed text based on the localized change label.
- Timeline metadata values render as plain text with preserved line breaks;
  event text remains source-data copy and deeper media semantics remain
  deferred shared-timeline debt.
- Non-source locales fall back to `en-US` for this detail surface until
  reviewed translations are added.
- Primary tabs expose selected state with `aria-pressed`; History tabs use the
  shared tablist pattern with `aria-selected` and arrow-key navigation.
- Deferred loading applies to additional art details, References, Collectors,
  Card Activity, and Timeline; first open can be slower than later switches.
- Fallback panel is the compact card-route view and is fixed to local timezone.
- Fallback panel includes the same subscription awareness widget used on home
  for the selected upcoming card.
- Fallback panel does not expose full `/meme-calendar` controls: no timezone toggle, no `Next Mint` jump button, no `Meme #` input, and no upcoming-mints table.

## Related Pages

- [Media Memes Index](README.md)
- [The Memes List Browsing and Sorting](feature-the-memes-list-browsing-and-sorting.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
