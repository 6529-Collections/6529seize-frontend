# Network Nerd Leaderboard

Parent: [Network Index](README.md)

## Overview

`/network/nerd` is an alternate leaderboard route that renders the shared community
leaderboard component in a compact Network view and supports two focus modes:

- `Cards Collected` (default)
- `Interactions`

## Location in the Site

- Route family: `/network/nerd/{focus}`
- Valid routes:
  - `/network/nerd/{focus}` or `/network/nerd/cards-collected` (default focus)
  - `/network/nerd/interactions` (interactions focus)
- No query string controls are used on this route.

## Focus and URL behavior

- Focus is derived from the first optional path segment:
  - `interactions` -> Interactions leaderboard
  - anything else (including no segment) -> Cards Collected
- Switching focus updates the path via `router.replace` so the active view is reflected
  in the URL without a full page reload.
- Sharing `/network/nerd/{focus}` and `/network/nerd/interactions` preserves the selected focus
  when reopened.

## Entry Points

- Open `Nerd view` on the Network identities leaderboard.
- Open `/network/nerd` directly from a bookmark or shared link.

## Edge Behavior

- Unknown path fragments after `/network/nerd/` are treated as fallback and render the
  `Cards Collected` view.
- Page metadata title switches with focus:
  - `Network Nerd - Cards Collected`
  - `Network Nerd - Interactions`

## Related Pages

- [Network Index](README.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
