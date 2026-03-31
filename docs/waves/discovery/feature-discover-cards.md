# Wave Discover Cards

## Overview

`/discover` renders a dedicated grid of active-wave cards.

- It uses the same card component as home `Most active waves`.
- The dedicated route expands the list to 20 cards.
- The route requests discovery data with `exclude_followed=true`.
- There is no `View all` footer because `/discover` is already the expanded
  surface.

Use this page to verify card loading, routing, and route-specific differences
from home discovery.

## Location in the Site

- Discovery route: `/discover`
- Non-DM card destination: `/waves/{waveId}`
- Direct-message card destination: `/messages?wave={waveId}`
- Home comparison surface: `/`

## Entry Points

- Open `/discover`.
- Open `Discovery` from web/app shell navigation.

## User Journey

1. Open `/discover`.
2. While loading, the route renders discovery skeleton cards.
3. When data resolves, up to 20 cards render in a responsive grid.
4. Select a wave entry.
5. The app opens `/waves/{waveId}` for non-DM waves or
   `/messages?wave={waveId}` for DM waves.

## Common Scenarios

- Open a discovery card to jump directly into wave chat context.
- Open a DM-targeting card to jump into `/messages?wave={waveId}`.
- Review the compact preview row when a wave description drop has usable text
  or media content.
- Use `/discover` as the larger browse surface when home six-card discovery is
  not enough.

## Edge Cases

- Discovery cards share the same metadata, preview, and route mapping as home
  `Most active waves` cards.
- Preview content comes from the wave description drop rather than the latest
  chat message.
- If a wave description drop is empty, whitespace-only, or media-free, the card
  still opens the target wave route without rendering the compact preview row.
- Auth/profile requirements still apply after entering `/waves` or `/messages`
  content from a card.
- DM waves continue to use query-style thread routes (`/messages?wave={waveId}`).

## Failure and Recovery

- If discovery cards never appear, refresh `/discover` to rerun the query.
- If a wave entry route fails, retry from `/waves` or `/messages` root routes.
- If the dedicated discovery page is empty, compare against home discovery on
  `/` to confirm whether the data source is empty or filtered.

## Limitations / Notes

- `/discover` intentionally omits the home subtitle and footer link.
- Home still caps its `Most active waves` section to six cards.

## Related Pages

- [Wave Discovery Index](README.md)
- [Waves Index](../README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
