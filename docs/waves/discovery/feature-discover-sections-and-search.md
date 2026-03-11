# Wave Discover Sections and Search (Legacy Route Removed)

## Overview

The `/discover` route and its section/search modes were removed.

Legacy discover-specific controls are no longer active:

- section mode (`Latest`, `Most Followed`, and related sections)
- discover-local search mode (`Search waves` and `By Identity` on `/discover`)
- discover-header actions (`My Waves`, `Create Wave`, `Create DM`)

## Location in the Site

- Legacy route removed: `/discover`
- Current replacement routes:
  - `/` for home wave cards
  - `/waves` and `/messages` for list and thread navigation

## Access and Availability

- Discover-route access checks are no longer applicable because `/discover`
  no longer exists.
- Existing auth/profile rules for `/waves` and `/messages` continue to apply.

## Entry Points

- Open `/` to discover active waves from home sections.
- Open `/waves` to browse waves list entries.
- Use [Header Search Modal](../../navigation/feature-header-search-modal.md)
  for cross-area search.

## User Journey

1. Start from `/` or `/waves`.
2. Select a wave entry to open `/waves/{waveId}` or `/messages?wave={waveId}`.
3. Continue thread interaction in wave/message routes.

## Common Scenarios

- Discover active waves from home (`Boosted Drops`, `Most active waves`).
- Use `/waves` as the canonical non-DM list route.
- Use `/messages` as the canonical DM list route.
- Navigation controls no longer include a `Discover` destination; use `Waves`
  or `Messages` entries plus home discovery cards.

## Edge Cases

- Stale bookmarks to `/discover` no longer open discover sections/search.
- Legacy `identity` discover-query behavior is not active after route removal.
- Search/page catalogs should not return `/discover` as an active destination.

## Failure and Recovery

- If a stale link points to `/discover`, retry from `/` or `/waves`.
- If thread routing fails, open `/waves` or `/messages` first and re-enter the
  target wave.

## Limitations / Notes

- This page is retained as a legacy reference after discover-route removal.
- Current discovery and search behavior is owned by Home, Waves, and Navigation
  docs.

## Related Pages

- [Wave Discovery Index](README.md)
- [Wave Discover Cards (Legacy Route Removed)](feature-discover-cards.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Waves Index](../README.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Header Search Modal](../../navigation/feature-header-search-modal.md)
