# Wave Creator Badge

## Overview

The wave creator badge is shown beside an author's identity when that profile is
marked as a wave creator. In the chat feed, V2 author badge data can render this
as a square profile-wave picture badge.

Selecting the compact water-drop button opens the shared created-waves viewer
(`Waves by {profile}`), so users can jump into waves that author created.
Selecting the chat-feed profile-wave badge opens that author's profile-wave
preview. The preview keeps `Open profile wave` as the primary-colored link,
uses `Show all waves` to expand a created-waves list inside the preview, and
shows `Show all brain activity` as the explicit link to the author's
`/{user}/brain` surface.

## Location in the Site

- Profile headers on `/{user}` routes that reuse the shared profile header:
  `/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`,
  `/{user}/subscriptions`, and `/{user}/proxy`.
- Wave and direct-message drop headers:
  `/waves/{waveId}` and `/messages/{waveId}`.
- Single-drop overlays opened with `drop={dropId}` in the current route.
- Meme participation and meme leaderboard drop rows.
- Desktop profile hover cards that reuse the shared author badge cluster.

## Entry Points

- Find the creator badge beside the author's handle, level badge, and other
  author-status badges.
- Select the water-drop button, or the profile-wave badge in the chat feed.
- On non-mobile layouts, hover tooltip text is `View created waves` for the
  compact button and `{wave}` for the chat-feed profile-wave badge; the
  profile-wave hover card includes a primary-colored `Open profile wave` link
  and a neutral `Show all waves` disclosure.

## User Journey

1. Open a profile header, wave drop, direct-message drop, or supported author
   hover card.
2. If the author is a wave creator, the water-drop badge or profile-wave badge
   appears in the author identity row.
3. Select the badge.
4. The shared `Waves by {profile}` viewer opens, or the profile-wave preview
   lets the user open the featured wave or select `Show all waves`.
5. If the viewer opened, review created-wave rows, then select a row to open
   that wave at `/waves/{waveId}`.
6. If `Show all waves` is selected in the profile-wave preview, the preview
   expands in place to show created-wave rows. Select a row to open that wave,
   or select `Show all brain activity` to open the Brain tab at
   `/{user}/brain`.

## Common Scenarios

- The badge can appear on its own or beside the artist-activity badge.
- In tighter thread layouts, the author row can wrap onto multiple lines
  instead of forcing horizontal overflow.
- The opened viewer uses the same created-waves surface as the Profile Brain
  tab overflow flow.
- The profile-wave preview fetches the expanded created-waves list only after
  the user selects `Show all waves`.
- On desktop, the hover card expands horizontally into a second panel when
  space allows. On mobile and touch layouts, the sheet stacks the created-waves
  panel below the preview.
- The expanded panel is scrollable for longer created-wave lists and includes
  `Show all brain activity` for the full Brain tab.
- Viewer rows show a wave picture when available, otherwise a wave/chat icon
  fallback.
- Viewer title uses the profile handle when available, or a shortened wallet
  address otherwise.

## Edge Cases

- If `is_wave_creator` is false or missing and no `profile_wave_id` is present,
  the badge is hidden.
- If chat-feed profile-wave picture data is missing or fails to load, the badge
  falls back to the water-drop icon.
- Touch/mobile layouts do not rely on hover tooltip copy; tapping the badge
  still opens the viewer or the profile-wave preview sheet.
- The created-waves viewer excludes direct-message threads from authored-wave
  results.
- If both creator and artist-activity badges are present, each keeps its own
  action and tooltip behavior.

## Failure and Recovery

- If the created-waves request fails, the opened viewer shows
  `Unable to load waves right now. Please try again.`; close and reopen it to
  retry. The expanded profile-wave preview panel uses the same failure message;
  collapse and reopen the panel to retry.
- If no created waves are returned, the viewer or expanded panel shows
  `No waves created yet.`.

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
