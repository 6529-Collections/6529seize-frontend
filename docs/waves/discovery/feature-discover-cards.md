# Wave Discover Cards (Legacy Route Removed)

## Overview

The dedicated discover-card grids on `/discover` were removed with the
`/discover` route.

Current wave-entry cards are documented in:

- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Wave List Navigation](../sidebars/feature-wave-list-navigation.md)

## Location in the Site

- Legacy route removed: `/discover`
- Current non-DM wave destination: `/waves/{waveId}`
- Current DM wave destination: `/messages?wave={waveId}`

## Entry Points

- Open `/` and use home wave cards (`Boosted Drops`, `Most active waves`).
- Open `/waves` and select a wave from the waves list.

## User Journey

1. Open a current wave-entry surface (`/` home cards or `/waves` list).
2. Select a wave entry.
3. The app opens `/waves/{waveId}` for non-DM waves or
   `/messages?wave={waveId}` for DM waves.

## Common Scenarios

- Open a home card to jump directly into wave chat context.
- Open a DM-targeting card to jump into `/messages?wave={waveId}`.
- Use wave list rows in `/waves` to enter active threads.

## Edge Cases

- `/discover` no longer hosts card grids.
- Auth/profile requirements still apply to `/waves` and `/messages` content.
- DM waves continue to use query-style thread routes (`/messages?wave={waveId}`).

## Failure and Recovery

- If a wave entry route fails, retry from `/waves` or `/messages` root routes.
- If a stale shared link points to `/discover`, navigate using `/` or `/waves`
  instead.

## Limitations / Notes

- This page is a legacy reference for removed `/discover` card surfaces.
- Active card behavior should be documented in the current owning pages linked
  above.

## Related Pages

- [Wave Discovery Index](README.md)
- [Waves Index](../README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Home Boosted Drops and Most Active Waves](../../home/feature-home-discovery-grids.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
