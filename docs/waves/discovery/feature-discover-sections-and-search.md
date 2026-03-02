# Wave Discover Sections and Search

## Overview

`/discover` has two mutually exclusive modes:

- Section mode (`Latest`, `Most Followed`, and related sections)
- Search mode (`Search` grid from `Search waves` and `By Identity`)

When discover content is available, the header includes `My Waves`,
`Create Wave`, and `Create DM`.

## Location in the Site

- `/discover` header controls
- `/discover` discover sections
- `/discover` search results grid

## Access and Availability

- `/discover` content requires a connected non-proxy profile with a handle.
- If access is missing, route-level connect/setup/unavailable states render
  before the discover list UI.

## Entry Points

- Open `Discover` from sidebar or mobile bottom navigation.
- Type in `Search waves`.
- Select or clear `By Identity` (suggestions open after 3+ typed characters).
- Use `My Waves` to set identity to your connected handle.

## User Journey

1. Open `/discover`.
2. With no active filters, section mode renders grouped wave-card lists.
3. Each section first loads a compact list (up to 3 cards).
4. Use `Show all` to expand one section. Other sections are hidden.
5. Expanded mode loads a larger first page (up to 12 cards), then loads more
   when you scroll to the bottom sentinel.
6. Enter a wave name or apply an identity filter to switch to search mode.
7. Search mode replaces sections with one `Search` results grid and loads up to
   20 results per page.
8. Clear both filters to return to section mode.

## Common Scenarios

- `My Waves` sets `By Identity` to your connected handle and writes
  `identity={handle}` to the URL.
- `By Identity` selection writes `identity={selectedIdentity}` to the URL.
- Clearing `By Identity` removes `identity` from the URL.
- Wave-name search stays in local UI state and does not add a URL query key.
- Typing in `By Identity` does not apply a new filter until you select a
  profile value.
- On web, `Create Wave` / `Create DM` update URL state with
  `create=wave` / `create=dm` and open modal flow.
- Search with no matches shows `No results found. Please try a different keyword or create a new wave.`

## Edge Cases

- Sections with no returned waves are hidden.
- `Show all` appears only when a section has at least 3 cards in compact mode.
- Only one section can stay expanded at a time.
- Expanded-section paging starts only after the expanded section reaches its
  larger page size.
- `Waves from Authors You Have Repped` is excluded for no-handle or proxy
  contexts (those contexts resolve route-level availability states first).
- Clearing search filters returns to section mode with the last expanded
  section state.

## Failure and Recovery

- If section requests fail, affected sections can disappear because this view
  has no inline error panel.
- If search requests fail, the view can stay empty or show `No results found.`
- Requests retry automatically, but there is no manual retry button.
- Refresh the page or change filters to trigger another request cycle.
- If paging stalls, scroll again to re-trigger the bottom sentinel or refresh.
- If a stale `identity` query keeps filtering unexpectedly, clear `By Identity`
  and retry.

## Limitations / Notes

- Only `identity` is URL-backed; wave-name search is not URL-backed.
- Search mode and section mode are mutually exclusive.
- Search/filter requests are debounced, so updates are not instantaneous while
  typing.

## Related Pages

- [Wave Discovery Index](README.md)
- [Wave Discover Cards](feature-discover-cards.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
