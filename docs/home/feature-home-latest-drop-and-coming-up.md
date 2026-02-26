# Home Latest Drop and Coming Up

## Overview

The top content on `/` is driven by The Memes and waves data. It resolves into
two sections:

- `Latest Drop` (or `Next Drop` when a mint has ended and next-winner data is ready)
- `Coming up` (next in queue plus current wave leaders)

## Location in the Site

- Route: `/`
- Latest-drop links:
  - Current drop page: `/the-memes/{id}`
  - Distribution plan: `/the-memes/{id}/distribution`
  - Mint action: `/the-memes/mint`
  - Next-drop deep links: `/waves?wave={waveId}&drop={dropId}`
- Coming-up links:
  - Per-card drop context: `/waves/{waveId}?drop={dropId}`
  - Section `View all`: `/waves/{waveId}`

## Entry Points

- Open `/` directly.
- Return to `/` from any route and let homepage data refresh.

## User Journey

1. Open `/`.
2. The latest-drop block starts with a loading placeholder while current-mint
   state and next-mint data resolve.
3. Once ready, the block chooses one of two modes:
   - `Latest Drop`: current mint details, stats, edition details, and countdown.
   - `Next Drop`: next winner preview with scheduled next-mint time.
4. In `Latest Drop`, users can open the card, artist profile, distribution plan,
   or mint route.
5. The `Coming up` section then resolves:
   - Optional `NEXT MINT` card (only while current mint has not ended, and only
     when next-winner title differs from the current mint title)
   - Top leaderboard cards from the configured memes wave
6. `View all` from `Coming up` opens the wave route for the same wave.

## Common Scenarios

- Current mint active:
  - `Latest Drop` shows current card details and live/upcoming countdown states.
  - `Coming up` can include one `NEXT MINT` card plus top leaders.
- Current mint ended and next winner exists:
  - Top block switches from `Latest Drop` to `Next Drop`.
  - `Coming up` removes the `NEXT MINT` card and keeps leaderboard leaders.
- `Coming up` initial load with no ready cards:
  - Three skeleton cards render until data is ready.
- `Latest Drop` countdown states:
  - Loading, countdown, mint complete (sold out/finalized), or error.

## Edge Cases

- If no current meme card is available after loading, `Latest Drop` does not render.
- In countdown error state, the next-drop status strip is not shown.
- On iOS outside the US, the countdown `Mint` button is hidden.
- On touch devices, interactive HTML media can require `Tap to load` before playback.
- `Coming up` does not render until app settings include a memes wave id.
- If `Coming up` has no cards after loading, the full section is hidden.

## Failure and Recovery

- If latest-drop or coming-up content looks stale, refresh `/`.
- If card actions fail from the homepage, open targets directly:
  - `/the-memes/mint`
  - `/the-memes/{id}`
  - `/the-memes/{id}/distribution`
  - `/waves/{waveId}`
- If `Coming up` is missing, retry later after wave data refresh.

## Limitations / Notes

- `Coming up` uses prediction leaderboard ordering, not chronological ordering.
- Leader count is capped:
  - With `NEXT MINT` card: up to 2 leader cards
  - Without `NEXT MINT` card: up to 3 leader cards
- `NEXT MINT` timestamps are displayed in the viewer's local timezone.

## Related Pages

- [Home Index](README.md)
- [Home Header and Mission Block](feature-home-header-and-mission.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Now Minting Countdown](../media/memes/feature-now-minting-countdown.md)
- [Latest Drop Stats Grid](../media/memes/feature-latest-drop-stats-grid.md)
- [Wave Sort and Group Filters](../waves/leaderboard/feature-sort-and-group-filters.md)
- [Docs Home](../README.md)
