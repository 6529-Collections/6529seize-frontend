# Header Search Modal

## Overview

Header search opens in a modal over the current page.
The search control opens one of two clearly scoped experiences:

- `Search 6529` for `Pages`, `NFTs`, `Profiles`, `Waves`, and `Messages`.
- `Search messages` when opened from an active Wave. This view names the Wave
  and includes `Search all 6529` for switching scope.

## Advanced message search

Message search is available to everyone and has removable `in:` and `from:`
chips alongside the text query. The global `Messages` tab starts across all Waves.
When opened inside a Wave, it opens with `in:` set to that Wave. Remove that chip to search across every Wave you can read,
including private Waves and conversations you have access to. Results outside
the selected Wave show their Wave name and open the matching message there.

The `in:` and `from:` keywords are fixed command syntax in every language.
Type `in:` to choose a Wave or `from:` to choose an author from suggestions.
Use the arrow keys and Enter, or select a suggestion. The rest of the input is
the usual message text search: at least three characters, using the existing
prefix-aware matching. Author-only searches also work. Both filters can be
combined with text. An unfinished filter waits for a selection before searching.
To search for literal `from:` or `in:` text, prefix the keyword with a backslash
(for example, `\in: progress`).

## Wave name matching

Wave names match regardless of letter case, spaces, and separator punctuation
such as dashes and apostrophes. In wave-name search, `%`, `_`, and backslashes
remain literal characters, not search wildcards.
For example, `memes chat`, `memeschat`, and `memes-chat` find `Memes-Chat`;
`maybes dive bar` finds `maybe's dive bar`. Every typed word must match, in any
order, and partial words work: `chat memes` and `meme chat` also find
`Memes-Chat`.

Exact names appear first, followed by names equivalent after punctuation is
removed under these rules, full-phrase matches, and then matches containing
every term. A full-phrase match contains the normalized query contiguously.
Shorter names after that same normalization rank ahead within each group;
equally relevant names use newest first. A query containing only punctuation
returns no matches.

These rules apply to the `Waves` results, the `in:` Wave picker, sidebar
`Find a wave…`, and composer `#` mentions. The `in:` picker has no minimum name
length and shows newest-first suggestions when no name is entered. The `Waves`
results, sidebar, and mentions keep their existing minimum query lengths.
Access rules are unchanged: the `Waves` results, sidebar, and mentions exclude
DMs; the `in:` picker can include conversations you can read.

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
   `Profiles`, `Waves`, and `Messages` result types.
6. Use mouse or keyboard (`ArrowUp`, `ArrowDown`, `Home`, `End`, `Enter`) to
   open a result. Matching text is highlighted.
7. Close with `Go back` (mobile), `Close search` (desktop), `Escape`, or outside click.

## Common Scenarios

- Site-wide browse:
  - In `All`, each category shows a 3-result preview.
  - `View all <Category>` opens the full list for that category.
- Message results:
  - Open `Messages` for message text and author/Wave filters.
  - Message matches appear only in `Messages`; `All` previews the other categories.
  - Global results show the Wave name and open the matching message.
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
  - `Clear` in site search resets category to `All`. In `Messages`, clearing text
    keeps the category and selected filter chips.
- Query recovery:
  - The last site query is kept for the current browser tab session.
  - Queries that opened a result appear as recent-search shortcuts after clear.
- In-wave jump:
  - Results use compact message previews showing the author's profile picture,
    message number, date, time, and visually formatted message content.
  - Links, mentions, tags, and Markdown remain visual-only inside a result; the
    result card is the single action that jumps to the message. Mention and tag
    labels are shown without their internal serialization brackets.
  - Use `from:` to choose an author and `in:` to change or remove the Wave scope.
  - Selecting a result in the originating Wave jumps to that message. Results
    in other Waves open the matching Wave and message.
  - `Load more` appears when more matches are available.

## Edge Cases

- Site-wide query rules:
  - `Pages` starts at 3 characters and uses the local route catalog.
  - `Profiles` and `Waves` start at 3 characters with a short debounce.
  - `NFTs` uses the same debounce and starts at 3 characters, or shorter numeric input.
- Message query rules:
  - Text search starts at 3 characters with ~250ms debounce and matches word
    prefixes, so `loo` can match `looks`.
  - An author filter can be searched without text.
  - A Wave filter alone needs text or an author before searching.
- Result-type controls keep the same space before, during, and after search so
  the result panel does not shift horizontally.
- A selected result type remains selected even when it has no matches, making
  the active scope explicit.
- Results from an earlier query are hidden immediately while the next query is
  settling.
- Background page scroll is locked while the modal is open.
- In-wave search keeps its query, filters, and input focus when competition
  details finish loading in the background.
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
- Message states:
  - Loading: `Searching messages`
  - Threshold hint: type at least 3 characters or add a filter.
  - Empty: `No messages found`.
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
