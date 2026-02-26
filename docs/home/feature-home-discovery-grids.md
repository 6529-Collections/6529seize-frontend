# Home Boosted Drops and Most Active Waves

## Overview

Below the mission block, `/` shows two discovery sections:

- `Boosted Drops`
- `Most active waves` (headline: `Tired of bot replies? Join the most interesting chats in crypto`)

## Location in the Site

- Route: `/`
- Boosted card destinations:
  - Wave route: `/waves/{waveId}` (with `serialNo={serialNo}` when available)
  - Direct-message wave route: `/messages?wave={waveId}` (with
    `serialNo={serialNo}` when available)
- Most active waves card destinations:
  - Wave route: `/waves/{waveId}`
  - Direct-message wave route: `/messages?wave={waveId}`
- `Most active waves` `View all`: `/waves`

## Entry Points

- Open `/` and scroll below `Coming up`.

## User Journey

1. `Boosted Drops` resolves first:
   - While loading: section stays visible with a `Loading...` placeholder.
   - When data is ready: cards render in a responsive grid.
2. Users select a boosted card to open that drop in its wave context.
3. `Most active waves` resolves with up to six hot waves:
   - While loading: six skeleton cards.
   - When data is ready: wave cards with metadata and latest-message preview.
4. Users select a wave card to open that wave, or use `View all` to open `/waves`.

## Common Scenarios

- Boosted grid card limits:
  - Mobile: up to 6 cards (1 column x 6 rows)
  - Tablet: up to 6 cards (2 columns x 3 rows)
  - Desktop: up to 9 cards (3 columns x 3 rows)
- Most active waves card with recent activity:
  - Shows relative last-drop time and drops count.
  - Shows latest drop preview text/media snippet.
- Most active waves card with no activity:
  - Shows `No drops yet`.

## Edge Cases

- If boosted data is empty, `Boosted Drops` is hidden.
- If hot-waves fetch fails or returns empty, `Most active waves` is hidden.
- Most active waves previews show plain text snippets; links are not clickable
  inside the compact preview row.
- Cards can route to `/messages` for direct-message waves.

## Failure and Recovery

- If either section is missing, refresh `/` to re-run section queries.
- If card navigation is unavailable, open `/waves` and navigate from there.

## Limitations / Notes

- `Boosted Drops` has no `View all` action on the homepage.
- `Most active waves` is capped to six cards on home.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Wave Discovery Index](../waves/discovery/README.md)
- [Wave List Navigation](../waves/sidebars/feature-wave-list-navigation.md)
- [Docs Home](../README.md)
