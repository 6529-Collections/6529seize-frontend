# Wave Discover Route and Navigation

## Overview

`/discover` is a dedicated discovery route for active waves.

- It renders one discovery grid with the route title
  `Active discussions you are not yet following`.
- It reuses the same wave-card surface as home discovery cards, but expands the
  list to 20 results.
- It does not expose local section tabs, a route-local search mode, or a
  `View all` footer action.

Navigation catalogs expose `Discovery` as a first-class destination on web
sidebar, app drawer, mobile bottom navigation, and search `Pages` results.

## Location in the Site

- Dedicated route: `/discover`
- Related navigation surfaces:
  - web sidebar direct row: `Discovery`
  - app drawer direct row: `Discovery`
  - app bottom tab: `Discovery`
  - search `Pages` result: `Discovery`

## Access and Availability

- `/discover` has no dedicated wallet gate.
- The route fetch requests include `exclude_followed=true` and are intended to
  prioritize waves the current session is not already following.
- Existing auth/profile rules for `/waves` and `/messages` still apply after
  you open a thread from discovery.

## Entry Points

- Open `/discover` directly.
- Use `Discovery` in navigation surfaces.
- Use [Header Search Modal](../../navigation/feature-header-search-modal.md)
  and open the `Discovery` page result.

## User Journey

1. Open `/discover` from a direct URL or a shell navigation entry.
2. While data loads, the route renders discovery-card skeletons.
3. When data resolves, the page shows up to 20 active-wave cards.
4. Select a card to open `/waves/{waveId}` or `/messages?wave={waveId}` for
   direct-message waves.
5. Continue thread interaction in wave/message routes.

## Common Scenarios

- Open a dedicated discovery view that is broader than the six-card home grid.
- Browse active waves outside your already-followed set.
- Use shell navigation or search to return to `/discover` without going through
  `/` or `/waves`.

## Edge Cases

- If discovery fetch fails or returns no waves, the route can render as a blank
  page body because the shared section hides on empty/error.
- Cards still route to `/messages?wave={waveId}` for direct-message waves.
- `/discover` does not expose legacy `identity` filters, section tabs, or local
  search controls.
- The route does not render a `View all` footer link because it is already the
  expanded discovery surface.

## Failure and Recovery

- If `/discover` looks blank, refresh the route to rerun discovery fetches.
- If discovery still looks empty, cross-check active wave availability from `/`
  or `/waves`.
- If thread routing fails, open `/waves` or `/messages` first and re-enter the
  target wave.

## Limitations / Notes

- `/discover` is a single-surface route, not a multi-section discovery hub.
- Card rendering behavior is shared with Home discovery and documented in the
  paired card page.

## Related Pages

- [Wave Discovery Index](README.md)
- [Wave Discover Cards](feature-discover-cards.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Waves Index](../README.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Header Search Modal](../../navigation/feature-header-search-modal.md)
