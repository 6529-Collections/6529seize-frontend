# Home Latest Drop and Coming Up

## Overview

On `/`, home has two data-driven sections:

- `Latest Drop` (or `Next Drop` when mint is ended and a next winner exists)
- `Coming up` (next in queue plus top current leaders)

Use this page for visibility rules, state switches, and route targets.

## Location in the Site

- Route: `/`
- `Latest Drop` actions:
  - Drop title: `/the-memes/{id}`
  - Artist handles: `/{handle}` (can render multiple handle pills)
  - Distribution plan link (inside `Edition Details`): `/the-memes/{id}/distribution`
  - Mint action: `/the-memes/mint` (countdown state only)
- `Next Drop` actions (top-section replacement mode):
  - Drop title: `/waves?wave={waveId}&drop={dropId}`
  - Wave row link: `/waves/{waveId}`
  - Artist link: `/{handle}` (only when handle exists)
- `Coming up` actions:
  - Card title: `/waves/{waveId}?drop={dropId}`
  - Card author: `/{handle}` or `/{primaryAddress}`
  - Section `View all`: `/waves/{waveId}`

## Entry Points

- Open `/` directly.
- Return to `/` from any route.

## User Journey

1. Open `/`.
2. The top slot shows a loading placeholder while current mint data, claim
   status, and next-winner data resolve.
3. The top slot then chooses one mode:
   - `Latest Drop` when the current mint is not ended, or when no next winner
     is available.
   - `Next Drop` when the current mint is ended and a next winner exists.
4. `Latest Drop` shows artwork, stats, edition details, and countdown states:
   `Upcoming`, `Live`, `Mint Complete`, or `Error`.
5. `Coming up` resolves after app settings load and `memes_wave_id` is
   available.
6. `Coming up` then shows:
   - Optional `NEXT MINT` card (only when next winner exists, mint is not
     ended, and next-winner title differs from current mint title)
   - Top leaderboard cards from the same wave, sorted by prediction rating
7. `View all` opens `/waves/{waveId}` for that wave.

## Common Scenarios

- Mint active, next winner available:
  - Top slot: `Latest Drop`.
  - `Coming up`: `NEXT MINT` + top 2 leaders.
- Mint active, no next winner:
  - Top slot: `Latest Drop`.
  - `Coming up`: up to 3 leaders.
- Mint ended, next winner available:
  - Top section switches from `Latest Drop` to `Next Drop`.
  - `Coming up` hides `NEXT MINT` and shows up to 3 leaders.
- Leaderboard still loading while `NEXT MINT` is ready:
  - `Coming up` can render with only the `NEXT MINT` card.
- `Coming up` initial load with no ready cards and no `NEXT MINT` card:
  - Three skeleton cards render until data is ready.
- `Coming up` after load with no cards:
  - The full section is hidden.
- In `Coming up` leader cards:
  - first place can show `LEADING`
  - other positions use `CURRENT {ordinal} PLACE` (for example
    `CURRENT 2nd PLACE`)

## Edge Cases

- If no current meme card is available after load and `Next Drop` conditions
  are not met, the top slot is hidden.
- If next-winner title matches current mint title (case-insensitive and
  trimmed), `Coming up` suppresses the `NEXT MINT` card.
- On iOS outside the US, the countdown `Mint` button is hidden.
- In countdown error state, the `Next drop ...` status strip is not shown.
- On touch devices, interactive HTML media can require `Tap to load` before
  playback.
- If app settings do not include `memes_wave_id`, `Coming up` stays hidden.

## Failure and Recovery

- If latest-drop or coming-up content looks stale, refresh `/` to rerun home
  queries.
- If latest-drop actions fail, open routes directly:
  - `/the-memes/mint`
  - `/the-memes/{id}`
  - `/the-memes/{id}/distribution`
- If `Coming up` card links fail, open:
  - `/waves/{waveId}`
  - `/waves/{waveId}?drop={dropId}`
- If `Next Drop` links fail, open:
  - `/waves/{waveId}`
  - `/waves?wave={waveId}&drop={dropId}` (single-drop target)

## Limitations / Notes

- `Coming up` uses prediction leaderboard ordering, not chronological ordering.
- Leader count is capped:
  - With `NEXT MINT` card: up to 2 leader cards
  - Without `NEXT MINT` card: up to 3 leader cards
- `Next Drop` uses mixed route styles:
  - title link: `/waves?wave={waveId}&drop={dropId}` (single-drop target)
  - wave row link: `/waves/{waveId}` (canonical wave route)
- `Coming up` cards use path-style routes (`/waves/{waveId}?drop=...`).
- `NEXT MINT` timestamps are displayed in the viewer's local timezone/locale.
- No auth or wallet gate is required to view these sections.

## Related Pages

- [Home Index](README.md)
- [Home Landing and Section Navigation Flow](flow-home-landing-and-section-navigation.md)
- [Home Route and Section Visibility Troubleshooting](troubleshooting-home-route-and-section-visibility.md)
- [Home Header and Mission Block](feature-home-header-and-mission.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Now Minting Countdown](../media/memes/feature-now-minting-countdown.md)
- [Latest Drop Stats Grid](../media/memes/feature-latest-drop-stats-grid.md)
- [Wave Sort and Group Filters](../waves/leaderboard/feature-sort-and-group-filters.md)
- [Docs Home](../README.md)
