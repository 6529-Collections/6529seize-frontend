# Wave Discover Sections and Search

## Overview

`/discover` has two browsing modes:

- section mode (`Latest`, `Most Followed`, and other discover sections)
- search mode (wave-name and identity filters)

The page header also includes `My Waves`, `Create Wave`, and `Create DM`
actions when wave content is available for the current profile.

## Location in the Site

- `/discover` header controls
- `/discover` discover sections
- `/discover` search results list

## Entry Points

- Open `Discover` from sidebar or bottom navigation.
- Type in `Search waves`.
- Set or clear `By Identity`.
- Use `My Waves` to filter by your own handle.

## User Journey

1. Open `/discover`.
2. Without active filters, discover sections render as grouped card lists.
3. Each section loads a compact list first; use `Show all` to expand that
   section.
4. Enter a wave name or identity filter to switch into search mode.
5. Search mode replaces sections with one `Search` results grid.
6. Scroll near the bottom of the results to load more matching waves.
7. Clear both filters to return to section mode.

## Common Scenarios

- `My Waves` sets the identity filter to the connected profile handle.
- `By Identity` updates the URL query as `identity={handle}` and clearing it
  removes the query key.
- Wave-name search stays in local UI state and does not add a URL query key.
- Search with no matches shows `No results found. Please try a different keyword or create a new wave.`
- `Show less` returns an expanded section to compact mode.

## Edge Cases

- Sections with no returned waves are hidden.
- `Waves from Authors You Have Repped` appears only for authenticated,
  non-proxy profiles with a handle.
- Section infinite loading starts only while that section is expanded.
- Discovery content does not render for connect/setup/unavailable route states;
  those route-level states resolve first.

## Failure and Recovery

- If section/search requests fail, the visible list can look empty; refresh or
  change filters to retry.
- If paging stalls during scroll-based loading, scroll again or refresh.
- If a stale `identity` query keeps filtering unexpectedly, clear `By Identity`
  and retry.

## Limitations / Notes

- Only `identity` is URL-backed; wave-name search is not persisted in URL state.
- Search mode and section mode are mutually exclusive.
- Compact section mode does not preload full result sets.

## Related Pages

- [Wave Discovery Index](README.md)
- [Wave Discover Cards](feature-discover-cards.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
