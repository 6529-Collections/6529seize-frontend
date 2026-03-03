# Header Search Modal

## Overview

Header search opens in a modal over the current page.
It supports:

- `Site-wide` search for `Pages`, `Profiles`, `NFTs`, and `Waves`
- `In this Wave` message search when opened with active wave context

## Location in the Site

- Desktop web sidebar: `Search` row.
- Small-screen web header: search button.
- App header: search button.
- The modal opens with a dimmed backdrop and keeps the current route visible.

## Entry Points

- Click `Search` in desktop sidebar navigation.
- Click a header search button where available.
- Press `⌘K` when a search trigger is mounted.

## User Journey

1. Open search from sidebar, header button, or `⌘K`.
2. Focus lands in the `Search` input and stays trapped in the modal.
3. If wave context is available, choose `In this Wave` or `Site-wide`.
4. Type a query and review results.
5. Optional: switch category (`All`, `Pages`, `Profiles`, `NFTs`, `Waves`) when tabs are shown.
6. Use mouse or keyboard (`ArrowUp`, `ArrowDown`, `Enter`) to open a result.
7. Close with `Go back` (mobile), `Close search` (desktop), `Escape`, or outside click.

## Common Scenarios

- Site-wide browse:
  - In `All`, each category shows a 3-result preview.
  - `View all <Category>` opens the full list for that category.
- Category persistence:
  - Selected category is remembered between openings.
  - `Clear` resets category to `All`.
- In-wave jump:
  - Selecting a message result jumps to that drop in the current thread.
  - `Load more` appears when more matches are available.

## Edge Cases

- Site-wide query rules:
  - `Pages` starts at 3 characters and uses the local route catalog.
  - `Profiles` and `Waves` start at 3 characters with ~500ms debounce.
  - `NFTs` uses ~500ms debounce and starts at 3 characters, or shorter numeric input.
- In-wave query rules:
  - Available only when search opens with active wave context.
  - Starts at 2 characters with ~250ms debounce.
- Category tabs appear only when at least one category has results, or when a non-`All` category was already selected.
- If the selected category has no results for the current query, selection resets to `All`.
- Background page scroll is locked while the modal is open.
- When opened from a header search button, focus returns to that button on close.

## Failure and Recovery

- Site-wide states:
  - Initial: `Start typing to search 6529.io` (with remaining-character hint before threshold).
  - Loading: `Loading...`
  - Empty: `No results found`
  - Error: `Something went wrong while searching. Please try again.` + `Try Again`
- `Try Again` behavior:
  - `All`: retries `Profiles`, `NFTs`, and `Waves` requests that are in scope.
  - `Profiles`/`NFTs`/`Waves`: retries only that category.
  - `Pages`: no retry request (local catalog search).
- In-wave states:
  - Loading: `Loading…`
  - Threshold hint: `Type at least 2 characters to search in <wave name>.`
  - Empty: `No matches found.`
  - Error: `Couldn't load search results.`
  - No dedicated retry button. Retry by changing query text or reopening search.

## Limitations / Notes

- Search is modal-only; there is no dedicated `/search` route.
- Shortcut is `⌘K`; `Ctrl+K` is not wired.
- `Pages` results come from navigation entries, not full-page text content.
- Page results change with runtime route visibility (for example wallet/device/region-gated entries).

## Related Pages

- [Navigation Index](README.md)
- [Web Sidebar Navigation](feature-sidebar-navigation.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Profile Navigation Flow](../profiles/navigation/flow-navigation.md)
- [Docs Home](../README.md)
