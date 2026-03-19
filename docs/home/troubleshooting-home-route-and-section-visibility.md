# Home Route and Section Visibility Troubleshooting

## Overview

Use this page when `/` loads but one home section is missing or routes from that
section look wrong.

This page covers:
- `Latest Drop` or `Next Drop`
- `Coming up`
- `Boosted Drops`
- `Most active waves`
- The health-heart shortcut to `/network/health`

## Location in the Site

- Route: `/`
- Related recovery routes:
  - `/network/health`
  - `/the-memes/mint`
  - `/the-memes/{id}`
  - `/the-memes/{id}/distribution`
  - `/waves`
  - `/messages`

## Entry Points

- Open `/`.
- Wait for initial loading placeholders to settle.
- Verify section order: header -> top slot (`Latest Drop` or `Next Drop`) ->
  mission block -> `Coming up` -> `Boosted Drops` -> `Most active waves`.

## User Journey

1. Open `/` and identify the missing section or broken route.
2. Match the issue in `Common Scenarios`.
3. Confirm any expected edge behavior in `Edge Cases`.
4. Use direct recovery routes if the section still does not render.

## Common Scenarios

- `Latest Drop` or `Next Drop` missing:
  - Top slot starts with a loading placeholder while mint/status and
    next-winner checks resolve.
  - After load, it resolves to `Latest Drop`, `Next Drop`, or hidden.
  - `Next Drop` shows only when the current mint is ended and a next winner
    exists.
  - If there is no current mint and no eligible next winner, the top slot stays
    hidden.
- `Coming up` missing:
  - Hidden until settings load with a valid memes wave id.
  - Hidden after load when no cards are ready.
  - While leaderboard data is still loading, the section can render with only
    the `NEXT MINT` card.
- `NEXT MINT` card missing in `Coming up`:
  - It is hidden when the current mint is ended.
  - It is hidden when next-winner title matches current mint title.
- `Boosted Drops` missing:
  - While loading, section shows `Loading...`.
  - Hidden after load when boosted feed is empty or request fails.
- `Most active waves` missing:
  - While loading, section shows skeleton cards.
  - Hidden when hot-waves is empty or request fails.
- `/discover` was opened instead of `/`:
  - `/discover` is a dedicated active-wave discovery route, not the home page.
  - Use `/` for `Latest Drop`, `Coming up`, `Boosted Drops`, and home
    `Most active waves`.
- Health heart shortcut missing:
  - It appears only on `/`.
  - Larger layouts: fixed in the hero region.
  - Small/mobile/app layouts: shown in header actions.
- `Mint` button missing in latest-drop countdown:
  - Hidden when device is iOS and country is not `US`.

## Edge Cases

- `Coming up` leader count changes with `NEXT MINT`:
  - With `NEXT MINT`: up to 2 leaders.
  - Without `NEXT MINT`: up to 3 leaders.
- Top `Next Drop` uses mixed route styles:
  - drop title: `/waves?wave={waveId}&drop={dropId}`
  - wave row: `/waves/{waveId}`
- Lower home sections use path-style wave routes (`/waves/{waveId}` with
  optional query params).
- Discovery cards can route to `/messages` for direct-message waves.
- Most active waves preview text is compact display only; links in that snippet
  are not clickable.

## Failure and Recovery

- Refresh `/` to rerun home queries.
- Open `/network/health` directly if the heart shortcut is unavailable.
- Open `/the-memes/mint` if latest-drop mint actions are unavailable.
- Open `/the-memes/{id}` or `/the-memes/{id}/distribution` when latest-drop
  card links fail.
- Open `/waves` when `Coming up`, `Boosted Drops`, or `Most active waves`
  routes fail.
- Open `/discover` when you need the dedicated 20-card discovery surface;
  return to `/` for the full home route.
- For direct-message wave targets, retry from:
  - `/messages?wave={waveId}`
  - `/messages?wave={waveId}&serialNo={serialNo}` for boosted-drop deep links.

## Limitations / Notes

- Home sections use independent data sources and can appear or disappear at
  different times.
- A hidden section is often a valid empty/error result, not a full route
  outage.
- Viewing home content has no auth or wallet gate.

## Related Pages

- [Home Index](README.md)
- [Home Landing and Section Navigation Flow](flow-home-landing-and-section-navigation.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Network Routes and Health](../network/troubleshooting-network-routes-and-health.md)
- [Navigation and Shell Controls](../navigation/troubleshooting-navigation-and-shell-controls.md)
- [Media Routes and Minting](../media/troubleshooting-media-routes-and-minting.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
