# Header Search Modal

## Overview

Header search opens as a modal overlay so users can find pages, profiles, NFTs,
waves, and (when available) messages in the current wave without leaving the
current context first. In site-wide mode, results are grouped by category in
one shared results panel, with `All` previews and per-category filtering tabs.

## Location in the Site

- Desktop navigation: `Search` item in the left sidebar.
- Header surfaces: search icon button in app/header layouts where available.
- The modal appears above the current route with a dimmed backdrop.

## Entry Points

- Click `Search` in desktop sidebar navigation.
- Click the magnifying glass button in a header that includes search.
- Press keyboard shortcut `Meta + K` when a search trigger is available.

## User Journey

1. Open search from sidebar, header button, or keyboard shortcut.
2. Focus lands in the labeled search input (`Search`) and tab focus stays
   inside the modal.
3. Enter a query:
   - Site-wide mode returns matching pages, profiles, NFTs, and waves.
   - Site-wide pages/profiles/waves search starts at 3 characters.
   - Site-wide NFT search can still return results for short numeric token IDs.
   - In wave contexts, users can switch between `In this Wave` and `Site-wide`.
   - `In this Wave` message search starts at 2 characters.
4. In site-wide mode, use category tabs (`All`, `Pages`, `Profiles`, `NFTs`,
   `Waves`) to narrow visible results. In `All`, each category shows a preview
   subset and can expand into a full list with `View all`.
5. Move through results with pointer hover or keyboard arrows, then select with
   click or `Enter`.
6. Close search with `Go back`, `Close search`, `Escape`, or outside click.

## Common Scenarios

- Quick route jump:
  - Search pages and open destination directly from results.
- Identity lookup:
  - Search profile handle/wallet and open the matching profile route.
- NFT lookup:
  - Search by collection token and open NFT details.
- Wave lookup:
  - Open wave results directly, including DM waves.
- Wave message lookup:
  - In `In this Wave`, search drop content and jump to matching messages.
- Category filtering:
  - In site-wide mode, switch categories to keep one query while narrowing the
    same results panel.
- All-mode scanning:
  - Review a mixed preview of matching categories, then open `View all` for one
    category when the preview is not enough.

## Edge Cases

- Site-wide guidance appears before enough characters are typed:
  - Pages/profiles/waves require at least 3 characters.
  - NFT search also supports shorter numeric queries for token-ID lookups.
  - Wave message search uses a 2-character minimum.
- Category filters can collapse back to `All` if the chosen category no longer
  has matches for the current query.
- In site-wide `All`, each category preview is capped; larger result sets expose
  a `View all <Category>` action.
- Category selection is remembered between modal openings.
- Category controls expose selected-state tab semantics and are linked to the
  search results panel for assistive technologies.
- The query input keeps a stable accessible label (`Search`) so screen readers
  and keyboard users land on a named field when the modal opens.
- `Enter` opens a result only when a populated results list is shown; loading,
  error, empty, and initial guidance states do not trigger navigation.
- When closed from the header search button flow, focus returns to the same
  trigger button.
- Background page scroll is locked while the modal is open.

## Failure and Recovery

- While search calls are in flight, results panel shows loading feedback.
- If no matches are found, the modal shows an explicit empty state.
- Site-wide API failures show an error message with `Try again`.
- `Try again` reruns the active site-wide searches for the current view:
  - `All` retries profiles, NFTs, and waves searches that are currently eligible
    for the query.
  - `Profiles`, `NFTs`, and `Waves` retry only that selected category.
- While a retry is in progress, the `Try again` control is temporarily disabled.
- If wave-message search fails, users see a failure message and can retry by
  editing the query or reopening search.
- In-wave message search exposes empty/error feedback inline and does not show a
  separate `Try again` button.
- Site-wide loading, empty, error, and initial guidance all render in the same
  results panel region so context is preserved while state changes.

## Limitations / Notes

- Search is modal-first and does not have a dedicated `/search` route.
- `Meta + K` depends on platform/browser keyboard handling.
- `Pages` results reflect navigable app destinations exposed by the navigation
  model, not arbitrary free-text page content.
- Category tabs appear only in site-wide mode when there are category-grouped
  results (or a previously selected category filter is active).

## Related Pages

- [Navigation Index](README.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Profile Navigation Flow](../profiles/flow-profile-navigation.md)
- [Docs Home](../README.md)
