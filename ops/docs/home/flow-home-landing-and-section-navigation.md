# Home Landing and Section Navigation Flow

Parent: [Home Index](README.md)

## Overview

This flow covers how users land on `/` and move from each home section to the
next route.

## Location in the Site

- Entry route: `/`
- Authenticated section order on `/`: `Header` -> `Latest Drop` or `Next Drop`
  -> mission block -> `Coming up` -> `Boosted Drops` -> `Most active waves`
- Logged-out section order on `/`: `Header` -> compact newcomer actions ->
  `Latest Drop` or `Next Drop` -> mission block -> `Coming up` ->
  `Boosted Drops` -> `Most active waves`

### Route map by section

- Header:
  - Health shortcut: `/network/health`
- Logged-out newcomer actions:
  - `Start here`: `/join-6529`
  - `Connect wallet`: opens the wallet connection flow
- `Latest Drop`:
  - Title: `/the-memes/{id}`
  - Artist pills: `/{handle}` (one or more)
  - `Edition Details` -> distribution link: `/the-memes/{id}/distribution`
  - `Mint` action: `/the-memes/mint` (when countdown shows the button)
- `Next Drop` (top slot replacement):
  - Title: `/waves?wave={waveId}&drop={dropId}`
  - Wave row: `/waves/{waveId}`
  - Artist: `/{handleOrPrimaryAddress}`
- `Coming up`:
  - Card title: `/waves/{waveId}?drop={dropId}`
  - Author: `/{handleOrPrimaryAddress}`
  - `View all`: `/waves/{waveId}`
- `Boosted Drops`:
  - Card: `/waves/{waveId}?serialNo={serialNo}`
  - Card for direct-message waves:
    `/messages/{waveId}?serialNo={serialNo}`
  - Wave pill: `/waves/{waveId}`
- `Most active waves`:
  - Card: `/waves/{waveId}`
  - Card for direct-message waves: `/messages/{waveId}`
  - `View all`: `/waves`

## Entry Points

- Open `/` directly.
- Use app Home navigation from any route.

## User Journey

1. Open `/`.
2. If logged out, use the compact newcomer actions to either:
   - Select `Start here` to continue through `/join-6529`.
   - Select `Connect wallet` to begin connecting immediately.
   - Keep browsing without a wallet and continue into current activity.
3. Open `/network/health` from the heart shortcut when needed.
4. Wait for the top slot to resolve:
   - `Latest Drop` when the current mint is active, or no next winner is ready.
   - `Next Drop` when the current mint has ended and a next winner exists.
5. Continue to the mission block (informational only).
6. Use `Coming up`:
   - Open ranked queue and leader cards.
   - Use `View all` to open the source wave.
7. Continue with discovery:
   - Open `Boosted Drops` for drop-first chat entry.
   - Open `Most active waves` for wave-first entry.
8. Use final `View all` to continue in `/waves`.

## State and Visibility Rules

- Top slot shows a loading skeleton first, then resolves to `Latest Drop`,
  `Next Drop`, or hidden when no eligible card exists.
- The newcomer actions stay hidden while wallet state is initializing or
  connecting. They appear when that state settles without valid authentication.
  Authenticated visitors keep the dashboard-first order.
- `Coming up` can show:
  - up to 3 leaderboard cards, or
  - `NEXT MINT` plus up to 2 leaderboard cards.
- `Coming up` can stay hidden when `memes_wave_id` is unavailable or no cards
  are ready.
- `Boosted Drops` shows `Loading...` while fetching, then hides on empty data.
- `Most active waves` shows skeleton cards while fetching, then hides on error
  or empty data.
- Home uses mixed wave route styles:
  - Top `Next Drop` title uses query style (`/waves?wave=...&drop=...`).
  - Top `Next Drop` wave row uses path style (`/waves/{waveId}`).
  - Lower home sections also use path style (`/waves/{waveId}`).
- On touch devices, interactive HTML cards in `Coming up` can show `Tap to
  load` before media activation.
- The health shortcut stays available on `/`, but placement changes by layout
  (hero region on larger layouts, header actions on small/mobile layouts).

## Failure and Recovery

- If a section is missing, refresh `/` and wait for that section to refetch.
- If a section link is unavailable, open `/waves` and continue from list views.
- If latest-drop actions fail, open `/the-memes/mint`, `/the-memes/{id}`, or `/the-memes/{id}/distribution` directly.
- If a direct-message route fails, open `/messages/{waveId}` and continue
  from the thread.

## Limitations / Notes

- Home sections use independent data sources, so loading and visibility timing
  is not synchronized.
- Public home activity has no auth or wallet gate; only the newcomer actions
  wait for wallet-state resolution. Visible cards still depend on available data.

## Related Pages

- [Home Index](README.md)
- [Home Header and Mission Block](feature-home-header-and-mission.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Navigation Entry and Switching Flow](../navigation/flow-navigation-entry-and-switching.md)
- [Docs Home](../README.md)
