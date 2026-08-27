# Header Search Modal

## Overview

Header search opens in a modal over the current page.
The search control opens one of two clearly scoped experiences:

- `Search 6529` for `Pages`, `NFTs`, `Profiles`, and `Waves`.
- `Search messages` when opened from an active Wave. This view names the Wave
  and includes `Search all 6529` for switching scope.

## Location in the Site

- Desktop web sidebar: `Search` row.
- Small-screen web header: search button.
- App header: search button.
- The modal opens with a dimmed backdrop and keeps the current route visible.

## Entry Points

- Click `Search` in desktop sidebar navigation.
- Click a header search button where available.
- Press `⌘K` or `Ctrl+K` when a search trigger is mounted.

## User Journey

1. Open search from sidebar, header button, or `⌘K`.
2. Focus lands in the `Search` input and stays trapped in the modal.
3. The title and description show whether search covers all of 6529 or the
   active Wave.
4. Type a query and review the visible query and loaded-result count.
5. In site search, switch between the always-visible `All`, `Pages`, `NFTs`,
   `Profiles`, and `Waves` result types.
6. Use mouse or keyboard (`ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`) to
   open a result. Matching text is highlighted.
7. Close with `Go back` (mobile), `Close search` (desktop), `Escape`, or outside click.

## Common Scenarios

- Site-wide browse:
  - In `All`, each category shows a 3-result preview.
  - `View all <Category>` opens the full list for that category.
- Profile results:
  - Exact, prefix, and substring profile-handle matches appear in that order,
    before results that match only by ENS.
  - Within each match group, profiles are ordered by level from highest to
    lowest.
  - Profiles at the same level keep the order supplied by search.
- Wave results:
  - The `Waves` category includes only non-direct-message Waves.
  - Direct-message conversations remain available through `DMs` navigation.
- Pages catalog:
  - Page results can include top-level navigation destinations such as
    `NFTs`, `Museum`, `Waves`, `DMs`, `Join 6529`, and `About`, secondary
    destinations such as `Discover Waves` (`/discover`) and `6529 Apps`
    (`/about/6529-apps`), plus
    permission-gated operational routes such as `Drop Forge`, `Craft Claims`,
    or `Launch Claims`, subject to the current route catalog.
- Category persistence:
  - Selected category is remembered between openings.
  - `Clear` resets category to `All`.
- Query recovery:
  - The last site query is kept for the current browser tab session.
  - Queries that opened a result appear as recent-search shortcuts after clear.
- In-wave jump:
  - Results use compact message previews showing the author's profile picture,
    message number, date, time, and visually formatted message content.
  - Links, mentions, tags, and Markdown remain visual-only inside a result; the
    result card is the single action that jumps to the message. Mention and tag
    labels are shown without their internal serialization brackets.
  - Filters support one author from the Wave's actual message authors plus
    inclusive `After` and exclusive `Before` local-date boundaries.
  - Selecting an author replaces the author picker with a compact profile row;
    clearing that row restores the picker.
  - Selecting a message result jumps to that drop in the current thread.
  - `Load more` appears when more matches are available.

## Edge Cases

- Site-wide query rules:
  - `Pages` starts at 3 characters and uses the local route catalog.
  - `Profiles` and `Waves` start at 3 characters with a short debounce.
  - `NFTs` uses the same debounce and starts at 3 characters, or shorter numeric input.
- In-wave query rules:
  - Available only when search opens with active wave context.
  - Text search starts at 3 characters with ~250ms debounce and matches word
    prefixes, so `loo` can match `looks`.
  - A valid author or date filter can be searched without text.
  - `After` must precede `Before`; impossible dates and inverted ranges are not
    searched.
- Result-type controls keep the same space before, during, and after search so
  the result panel does not shift horizontally.
- A selected result type remains selected even when it has no matches, making
  the active scope explicit.
- Results from an earlier query are hidden immediately while the next query is
  settling.
- Background page scroll is locked while the modal is open.
- When opened from a header search button, focus returns to that button on close.

## Failure and Recovery

- Site-wide states:
  - Initial: `Start typing to search 6529.io` (with remaining-character hint before threshold).
  - Loading: `Searching for "<query>"` with stable result-row placeholders.
  - Success: loaded-result count plus `for "<query>"`.
  - Empty: query- and result-type-specific guidance.
  - Error: `Something went wrong while searching. Please try again.` + `Try Again`
  - Partial error: successful result types remain usable while failed result
    types are named and can be retried.
- `Try Again` behavior:
  - `All`: retries `Profiles`, `NFTs`, and `Waves` requests that are in scope.
  - `Profiles`/`NFTs`/`Waves`: retries only that category.
  - `Pages`: no retry request (local catalog search).
- In-wave states:
  - Loading: `Loading…`
  - Threshold hint: type at least 3 characters or add a filter.
  - Empty: `No matches found.`
  - Error: `Couldn't load results` with a `Try again` action.

## Limitations / Notes

- Search is modal-only; there is no dedicated `/search` route.
- `⌘K` is available from mounted search triggers.
- `⌘K` and `Ctrl+K` open the search appropriate to the mounted trigger's
  context.
- `Pages` results come from navigation entries, not full-page text content.
- `6529 Apps` has explicit aliases for `6529 Mobile`, `6529 Desktop`, `apps`,
  `mobile`, `desktop`, and supported platform terms.
- Page results change with runtime route visibility (for example wallet/device/region-gated entries).

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [6529 Apps Page](feature-6529-apps-page.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Docs Home](../README.md)
