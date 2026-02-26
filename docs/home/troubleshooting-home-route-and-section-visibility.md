# Home Route and Section Visibility Troubleshooting

## Overview

Use this page when homepage sections at `/` are missing, stale, or routing to
unexpected targets.

## Location in the Site

- Route: `/`
- Related recovery routes:
  - `/network/health`
  - `/the-memes/mint`
  - `/the-memes/{id}`
  - `/waves`

## Entry Points

- Open `/` and verify latest-drop, coming-up, boosted, and most active waves sections.

## User Journey

1. Open `/` and wait for initial loading placeholders to finish.
2. Check whether the missing area is `Latest Drop`, `Coming up`,
   `Boosted Drops`, or `Most active waves`.
3. Use the matching recovery path below.

## Common Scenarios

- `Latest Drop` is missing:
  - A current meme card may be unavailable after data load.
- `Next Drop` never appears:
  - It only replaces latest-drop when the current mint has ended and a next
    winner exists.
- `Coming up` is missing:
  - The memes wave setting may be unavailable, or no cards are ready.
- `Boosted Drops` is missing:
  - Boosted feed returned empty.
- `Most active waves` is missing:
  - Hot-waves request failed or returned no waves.
- `Mint` button missing in latest-drop countdown:
  - Hidden on iOS outside the US.
- Health heart shortcut missing:
  - Hidden on small-width layouts.

## Edge Cases

- `Coming up` can show fewer cards when `NEXT MINT` is included (two leaders
  instead of three).
- Discovery cards may open `/messages` for direct-message waves instead of a
  `/waves/{waveId}` route.
- Most active waves preview text does not make URLs clickable in the compact snippet.

## Failure and Recovery

- Refresh `/` to re-run homepage queries.
- Open fallback routes directly when a section is unavailable:
  - `/the-memes/mint` for mint access
  - `/waves` for wave discovery
  - `/network/health` for health view
- If a specific card route fails, retry from `/waves` list views.

## Limitations / Notes

- Home section rendering is data-dependent; hidden sections are often a valid
  empty/error behavior, not a full page failure.

## Related Pages

- [Home Index](README.md)
- [Home Latest Drop and Coming Up](feature-home-latest-drop-and-coming-up.md)
- [Home Boosted Drops and Most Active Waves](feature-home-discovery-grids.md)
- [Navigation and Shell Controls](../navigation/troubleshooting-navigation-and-shell-controls.md)
- [Media Routes and Minting](../media/troubleshooting-media-routes-and-minting.md)
- [Wave Navigation and Posting](../waves/troubleshooting-wave-navigation-and-posting.md)
