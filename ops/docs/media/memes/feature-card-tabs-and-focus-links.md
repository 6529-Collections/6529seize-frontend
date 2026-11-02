# The Memes Card Tabs and Focus Links

## Overview

- `/the-memes/{id}` uses `focus` to open a specific card tab.
- Missing or invalid `focus` opens the default Overview tab.
- Overview includes other published Memes by the card's credited artists, followed
  by a collapsed `References: Meme Lab & ReMemes` section.
- Tab changes and card arrows keep URL query state and update in place.
- Primary and History tab switches keep the tab row visible and show the new
  section from its top, including while its content loads.
- `Overview` contains original files, metadata, properties and artwork statistics
  below the description. Existing `focus=the-art` links open Overview.
- `Listings & offers`, immediately after Overview, shows the market summary and
  price levels directly. Switching tabs retains the market selection and review.
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

| Focus Value           | User-Visible Area                                          |
| --------------------- | ---------------------------------------------------------- |
| `live`                | `Overview` primary tab                                     |
| `your-cards`          | `History` primary tab, `Your Transactions` sub-tab         |
| `the-art`             | `Overview` primary tab, including artwork details          |
| `listings-and-offers` | `Listings & offers` primary tab                            |
| `references`          | `Overview`, with `References: Meme Lab & ReMemes` expanded |
| `collectors`          | `Collectors` primary tab                                   |
| `history`             | `History` primary tab, default history sub-tab             |
| `your-transactions`   | `History` primary tab, `Your Transactions` sub-tab         |
| `activity`            | `History` primary tab, `Card Activity` sub-tab             |
| `timeline`            | `History` primary tab, `Timeline` sub-tab                  |

- Missing or invalid `focus` opens `Overview`.
- The primary tabs are `Overview`, `Listings & offers`, `Collectors`, and `History`.
  They keep the blue underline. History sub-tabs use compact round pills, and
  the activity-type dropdown is a compact framed button aligned to the right.
- Card Activity rows stack on narrow screens while preserving their item,
  wallet, total, date and transaction links.
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
10. The expandable References section uses the active supported `locale` for Meme Lab/ReMemes
    descriptions, logo alt text, sort labels, refresh labels, ReMeme empty
    state, ReMeme card accessible names, ReMeme link locale preservation, and
    replica counts.
11. The header calendar period strip uses the active supported `locale` for
    period labels, season-link accessible text, locale-preserving season
    links, and period number formatting.
12. Artwork details load with Overview. References, collectors, activity and
    timeline code load when first opened. The market stays mounted across tabs.
13. The header Art Viewer uses the active supported `locale` for media action
    accessible names and save dialog titles.
14. Artwork detail rows in `Overview` use the active supported `locale` for
    section headings, metric labels, empty states, open/download labels, and
    TDH/rank number formatting.
15. If a numeric card id is unresolved, the route removes `focus`, hides tab
    content, and shows the shared next-mint fallback panel with subscription
    awareness for that card.

## Route States

- Loading state: heading is visible while card data is still resolving; tab row is not rendered yet.
- Load error state: if both the server seed and client fallback request fail,
  the route replaces the loading skeleton with an inline `Try again` action.
- Resolved card state: tab row and tab content render.
- Unresolved numeric id state: route shows the shared next-mint fallback panel
  and subscription awareness widget for that numeric id.
- Non-integer id state: route shows the `MEME` not-found screen.

## Common Scenarios

- On desktop, the artwork stays in the left column while the adjacent card
  details scroll. It stops at the end of that section, before the tabs. On
  smaller screens the artwork scrolls normally with the page.
- Market actions sit in one bordered panel at every screen size.
  When a wallet connection is required, its existing guidance and white Connect
  wallet button lead the panel. The button shares the line in wider panels and
  fills its own row in narrower panels. A divider separates this requirement
  from the trading actions.
  Collect keeps the shared blue action style, dimmed and non-interactive when
  disabled, in both the panel and the bottom bar.
  Delivery controls stay hidden while a wallet connection is required; after
  connection, they appear below the main action row.
- On phones and tablets, the latest card's countdown and Subscription Minting
  panel appear above the artwork. Ownership, format switching and media actions
  stay below the artwork. The tab row stays at the top while scrolling below 1024px;
  swipe the row to reach all four tabs when needed.
- Collect and Make an offer use 44px buttons. Collect keeps enough width for its
  complete label and price; Make an offer uses the remaining space and can truncate
  visually without changing its accessible name. In very narrow panels, Collect
  fills the first row, with Make an offer and the square more-actions menu below.
  Wider panels keep all three controls on one row. The bottom bar also keeps the
  complete Collect label visible. When Collect
  is present, the available List action is inside that menu. Without Collect,
  Make an offer and the available List action share the row; when List is also
  unavailable, Make an offer fills both labelled slots. Review offers remains
  available inside the menu. All actions share one panel
  background and retain their existing button styles.
  View listings & offers is a separate navigation row below Supply details &
  rankings, outside the trading panel. It still opens the Listings & offers tab.
  Each action keeps its existing availability and trading behavior.
- Review offers keeps its dialog height stable while the initial offers load.
  Muted placeholder rows appear first; the wallet and quantity form is revealed
  with the available orders. On phones, the order list scrolls above a fixed
  footer containing the wallet, quantity and Review exact terms controls. The
  footer remains visible when selecting an order or scrolling to the last one.
  Selecting an order and connecting a wallet work as before.
- Below 1024px, when the inline market actions leave the screen, a bottom bar
  repeats the available Collect and Make an offer actions. On desktop windows
  with a visible left rail, the bar starts after that rail. On phones it spans
  the screen. In the app it sits above bottom
  navigation and stays behind open dialogs. While listings are selected in the
  active Listings & offers tab, the selection review bar takes its place.
  The card actions return when the selection is cleared or another tab opens.
  Delivery, owner actions and the additional-actions menu remain in the inline section.
- Long descriptions initially show five lines on phones. `Read more` reveals
  the full description and `Show less` restores the preview. Properties show
  the first six tiles; `Show all N properties` reveals the remainder and
  `Show fewer` restores the preview. Short sections need no disclosure.
- In `Collectors`, screens narrower than 768 px show a collector list with this
  card's metrics in a `This card` row, with a `Total` row aligned underneath.
  Each collector has one header row labelling the Balance, TDH and Unweighted TDH
  columns above both rows of values. The stat block starts under the avatar. On very narrow
  screens, the list scrolls horizontally so labels and values stay on one line.
  Swipe sideways, or focus the list and use the arrow keys, to see all columns.
  The collector's name has its own row above the values. Choose
  Balance, TDH, Unweighted TDH, Total balance, Total TDH or Total unweighted TDH
  in the scrolling sort bar; the separate arrows set ascending or descending
  order. Choosing a metric keeps the current direction and highlights its values.
- Use the search icon to filter by one or several identities; remove chips to
  broaden the results.
  Filtered results retain each collector's TDH rank. Pages contain 25 collectors.
- Large mobile values use compact notation from 100,000, with exact displayed
  values available to assistive technology. Download CSV exports all matching
  collectors with full numeric values in the selected order. Its icon shows
  a tooltip on hover or keyboard focus when the text label is hidden. The button
  shows progress, announces completion, and reports a download failure for retry.
- At 768 px and wider, the Collectors table shows the same information in
  columns. Sorting and paging keep the previous rows visible while the next
  results load.
- In Overview, explore `More by {artist}` for up to four other published Meme
  Cards per credited artist directly after the description, before detailed metadata.
  Cards are ordered by newest card number first. Each preview
  links to its card page and preserves the selected locale.
- Use `View all` to expand an artist's remaining cards in place, and `Show fewer`
  to return to the four-card preview. The current card is excluded.
- Expand `References: Meme Lab & ReMemes` below the artist galleries to see works
  related to the current card. The URL uses `focus=references`, so the expanded
  section can be shared directly. Collapsing it returns to `focus=live`.
- Share a direct `Activity` or `Timeline` link by sharing `focus=...`.
- Keep the same tab while stepping through cards with previous/next arrows.
- Open an unresolved numeric card URL and use the fallback mint timing panel.
- Open `Your Cards` to check personal ownership and transfer history.
- Open `Overview` to review original media, Arweave links/downloads, properties,
  and file details.

## Edge Cases

- Artist galleries use the credited artist profiles' earlier cards and explicit
  Main Stage winner-to-card links. Cards without artist profile handles use the
  collection's artist catalogue. Collaborating artists can each have a gallery; cards credited
  to more than one artist may appear in more than one gallery.
- An artist with no other cards has no gallery. For cards without profile handles,
  no gallery appears if the catalogue has no matching card; the card's artist links remain
  available above.
- Unknown `focus` values open `Overview`.
- Tab URL replacements preserve other existing query keys and only change
  `focus`.
- Tab switches update the current URL entry, so browser Back does not step through each tab change.
- `Your Cards` shows wallet-specific empty states:
  - No wallet connected: prompt to connect a wallet.
  - Wallet connected with no editions: ownership empty-state message.
- Artwork details in Overview resolve animation media when top-level `animation`
  is blank but metadata provides `animation` or `animation_url`.
- Only available original media links appear, with matching open/download
  actions.
- File type and dimensions use available metadata; missing values show `N/A`.
- If card fetches fail or resolve inconsistently, the route shows an inline
  `Try again` action.

## Failure and Recovery

- If artist works cannot load, use their `Try again` button. A failed image
  displays `Artwork preview unavailable` while keeping its card link usable.
- If a numeric ID resolves to fallback mode, use fallback timing details or return to `/the-memes` and open a nearby card.
- If card content fails to load, use the inline `Try again` action.
- If a deep link opens the wrong tab, replace `focus` with a supported value.
- If the route shows `MEME` not-found, retry with a positive integer card id.

## Limitations / Notes

- Tab changes use in-place URL replacement, so browser Back skips prior tab changes.
- Primary tab labels, history tab labels, heading accessible names, and the
  back link accessible name are message-backed for progressive localization.
- During component-level migration, the optional `locale` query parameter can be
  used to smoke-test supported locales on this detail route. Missing or
  unsupported `locale` values fall back to `en-US`.
- Overview live-stat labels, creator labels, mint
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
- Artwork detail section headings, metric labels, empty states,
  open/download labels, and TDH/rank number formatting are routed through the
  progressive i18n helpers. Property trait names/values and media URLs remain
  source-data copy.
- References section Meme Lab/ReMemes descriptions, logo alt text, sort labels,
  refresh labels, ReMeme empty state, ReMeme card accessible names, ReMeme link
  locale preservation, and replica counts are routed through the progressive
  i18n helpers. ReMeme names, collection names, token IDs, and source NFT
  metadata remain source-data copy.
- The References disclosure and refresh action are keyboard reachable with semantic buttons.
- Artist-gallery and References-disclosure labels use the selected locale's
  messages, with `en-US` fallback until translations are supplied.
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
- Mobile disclosure labels use the same progressive localization fallback.
- Primary tabs expose selected state with `aria-pressed`; History tabs use the
  shared tablist pattern with `aria-selected` and arrow-key navigation.
- Deferred loading applies to artwork details, References, Collectors,
  Card Activity, and Timeline; first open can be slower than later switches.
- Fallback panel is the compact card-route view and is fixed to local timezone.
- Fallback panel includes the same subscription awareness widget used on home
  for the selected upcoming card.
- Fallback panel does not expose full `/meme-calendar` controls: no timezone toggle, no `Next Mint` jump button, no `Meme #` input, and no upcoming-mints table.

## Artist Gallery Translation Follow-up

- Route/components: `/the-memes/{id}`, `MemePageArtistWorks`, and
  `MemePageReferencesSection`.
- Untranslated surface: `theMemes.detail.artistWorks.*` and
  `theMemes.detail.references.sectionTitle`, including loading, error, retry,
  disclosure, and artwork-preview messages.
- Current fallback: `en-GB`, `fr-FR`, `es-ES`, and `de-DE` use `en-US` source
  copy for these keys. Card links retain the selected locale and counts use
  locale-aware formatting.
- User impact: these labels remain in English when another supported locale is
  selected; browsing and keyboard controls remain available.
- Follow-up owner: frontend localization maintainers.
- Remediation: add reviewed entries to the four locale dictionaries, then check
  visible and accessible names, long-label wrapping, and expansion controls in
  each locale.

## Collectors Translation Follow-up

- Collectors mobile labels use the `theMemes.detail.collectors.*` message keys.
  New metric and sort labels currently use the `en-US` fallback in `en-GB`,
  `fr-FR`, `es-ES` and `de-DE`; values use the selected locale's number formatting.
  Frontend localization maintainers should add reviewed translations and check
  longer labels at phone widths.

## Related Pages

- [Media Memes Index](README.md)
- [Artwork Sharing](../nft/feature-artwork-sharing.md)
- [The Memes List Browsing and Sorting](feature-the-memes-list-browsing-and-sorting.md)
- [Memes Minting Calendar](feature-minting-calendar.md)
- [Media Discovery and Actions Flow](../flow-media-discovery-and-actions.md)
- [Media Routes and Minting Troubleshooting](../troubleshooting-media-routes-and-minting.md)
