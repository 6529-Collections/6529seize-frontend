# Home Landing and Section Navigation Flow

Parent: [Home Index](README.md)

## Overview

This flow covers the standard path from landing on `/` to opening deeper routes
from latest-drop, coming-up, and discovery sections.

## Location in the Site

- Entry route: `/`
- Main destinations from home:
  - `/network/health`
  - `/the-memes/{id}`
  - `/the-memes/{id}/distribution`
  - `/the-memes/mint`
  - `/waves/{waveId}` or `/waves/{waveId}?drop={dropId}`
  - `/messages?wave={waveId}` (direct-message waves)
  - `/waves`

## Entry Points

- Open `/` directly.
- Use any in-app Home navigation action.

## User Journey

1. Open `/` and wait for latest-drop data resolution.
2. Read the top context (header and mission block).
3. Use `Latest Drop`/`Next Drop` actions for meme card or wave context.
4. Open `Coming up` cards for queued winner/leader routes.
5. Open boosted or most active waves cards for wave discovery.
6. Use section `View all` actions (`Coming up` or `Most active waves`) to continue in
   the waves area.

## Common Scenarios

- Landing-to-mint:
  - Open `/` -> open latest drop -> select `Mint`.
- Landing-to-wave:
  - Open `/` -> select a coming-up, boosted, or most active waves card.
- Landing-to-health:
  - Open `/` on desktop/tablet -> select heart shortcut -> `/network/health`.

## Edge Cases

- Sections can be hidden when backing data is empty or unavailable.
- Some wave cards route to `/messages` when the target wave is a direct-message
  thread.

## Failure and Recovery

- If expected cards do not appear, refresh `/` and retry.
- If a section link is unavailable, open `/waves` and navigate from list views.
- If latest-drop actions fail, open `/the-memes/mint` or `/the-memes/{id}`
  directly.

## Limitations / Notes

- Home aggregates multiple independent data sources, so sections can resolve at
  different times.

## Related Pages

- [Home Index](README.md)
- [Home Header and Mission Block](feature-home-header-and-mission.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Navigation Entry and Switching Flow](../navigation/flow-navigation-entry-and-switching.md)
- [Docs Home](../README.md)
