# Home Boosted Drops and Most Active Waves

## Overview

After `Coming up` on `/`, home shows two discovery sections:

- `Boosted Drops` with subtitle `Community-boosted right now`
- `Most active waves` under the headline
  `Tired of bot replies? Join the most interesting chats in crypto`

Use this page to verify what these grids show, where each action routes, and
why a section can disappear.

## Location in the Site

- Route: `/`
- Boosted card actions:
  - Card click: `/waves/{waveId}?serialNo={serialNo}` or
    `/messages?wave={waveId}&serialNo={serialNo}` for direct-message waves
  - Author link: `/{handle}` when a handle exists
  - Author fallback: shows `Anonymous`; no profile route is available
  - Wave link: `/waves/{waveId}`
- Most active waves actions:
  - Card click: `/waves/{waveId}` or `/messages?wave={waveId}` for
    direct-message waves
  - `View all`: `/waves`

## Entry Points

- Open `/` and scroll below `Coming up`.

## User Journey

1. `Boosted Drops` loads from the boosted feed:
   - While loading: section stays visible with `Loading...`.
   - When data is ready: cards render in a responsive grid.
   - If the request fails or returns no cards: section is hidden.
2. Users select a boosted card to open that drop in wave chat context.
3. `Most active waves` loads hot waves:
   - While loading: six skeleton cards render.
   - When data is ready: up to six cards render with wave metadata.
   - If the request fails or returns no waves: section is hidden.
4. Users select a wave card to open that wave, or use `View all` to open
   `/waves`.

## Common Scenarios

- Boosted grid card limits:
  - Mobile (`<640px`): up to 6 cards
  - Tablet (`640px-1023px`): up to 6 cards
  - Desktop (`>=1024px`): up to 9 cards
- Boosted card with profile fallback:
  - Footer shows `Anonymous` when the author has no handle.
- Most active waves card with recent activity:
  - Shows relative last-drop time and drops count.
  - Shows a compact latest-drop preview text/media snippet.
- Most active waves card with no activity:
  - Shows `No drops yet`.

## Edge Cases

- Most active waves preview snippets are read-only; links are not clickable in
  the compact preview row.
- If latest-drop preview data for a wave is unavailable, the card still opens
  the wave route.
- Cards can route to `/messages` for direct-message waves.

## Failure and Recovery

- If either section is missing, refresh `/` to re-run section queries.
- If card navigation is unavailable, open `/waves` and navigate from there.
- If a boosted deep-link fails, open `/waves/{waveId}` or
  `/messages?wave={waveId}` and find the drop in chat history.

## Limitations / Notes

- `Boosted Drops` has no `View all` action on the homepage.
- `Most active waves` is capped to six cards on home.
- Boosted ranking uses a recent boost window and updates while the page stays open.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Waves Index](../waves/README.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../README.md)
