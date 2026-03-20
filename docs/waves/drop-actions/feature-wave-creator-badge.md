# Wave Creator Badge

## Overview

The wave creator badge is a compact water-drop button shown beside an author's
identity when that profile is marked as a wave creator.

Selecting it opens the shared created-waves viewer (`Waves by {profile}`), so
users can jump into waves that author created.

## Location in the Site

- Profile headers on `/{user}` routes that reuse the shared profile header:
  `/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`,
  `/{user}/subscriptions`, and `/{user}/proxy`.
- Wave and direct-message drop headers:
  `/waves/{waveId}` and `/messages?wave={waveId}`.
- Single-drop overlays opened with `drop={dropId}` in the current route.
- Meme participation and meme leaderboard drop rows.
- Desktop profile hover cards that reuse the shared author badge cluster.

## Entry Points

- Find the creator badge beside the author's handle, level badge, and other
  author-status badges.
- Select the water-drop button.
- On non-mobile layouts, hover tooltip text is `View created waves`.

## User Journey

1. Open a profile header, wave drop, direct-message drop, or supported author
   hover card.
2. If the author is a wave creator, the water-drop badge appears in the author
   identity row.
3. Select the badge.
4. The shared `Waves by {profile}` viewer opens.
5. Review created-wave rows, then select a row to open that wave at
   `/waves/{waveId}`.

## Common Scenarios

- The badge can appear on its own or beside the artist-activity badge.
- In tighter thread layouts, the author row can wrap onto multiple lines
  instead of forcing horizontal overflow.
- The opened viewer uses the same created-waves surface as the Profile Brain
  tab overflow flow.
- Viewer rows show a wave picture when available, otherwise a wave/chat icon
  fallback.
- Viewer title uses the profile handle when available, or a shortened wallet
  address otherwise.

## Edge Cases

- If `is_wave_creator` is false or missing, the badge is hidden.
- Touch/mobile layouts do not rely on hover tooltip copy; tapping the badge
  still opens the viewer.
- The created-waves viewer excludes direct-message threads from authored-wave
  results.
- If both creator and artist-activity badges are present, each keeps its own
  action and tooltip behavior.

## Failure and Recovery

- If the created-waves request fails, the opened viewer shows
  `Unable to load waves right now. Please try again.`; close and reopen it to
  retry.
- If no created waves are returned, the viewer shows `No waves created yet.`.

## Limitations / Notes

- The badge is a read-only navigation entry point; it does not create, edit, or
  manage waves.
- This page covers the creator-badge entry behavior. The shared created-waves
  list content is also used by the Profile Brain tab flow.

## Related Pages

- [Wave Drop Actions Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Artist Preview Modal](feature-artist-preview-modal.md)
- [Profile Header Summary](../../profiles/navigation/feature-header-summary.md)
- [Profile Brain Tab Wave Sidebar](../../profiles/tabs/feature-brain-wave-sidebar.md)
- [Docs Home](../../README.md)
