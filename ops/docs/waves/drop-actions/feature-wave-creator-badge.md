# Wave Creator Badge

## Overview

The wave creator badge is shown beside an author's identity when that profile is
marked as a wave creator. In the chat feed, V2 author badge data can render this
as a square profile-wave picture badge.

Selecting the compact water-drop button opens the shared created-waves viewer
(`Waves by {profile}`), so users can jump into waves that author created.
On touch devices or in windows narrower than 1024px, selecting the profile-wave
badge opens that author's profile-wave preview sheet. On wider desktop windows,
hover to open the preview or click the badge to open the profile wave directly.
The preview shows artwork, the wave
name and description, and `Open profile wave`. Select `Show all waves` to expand
the author's created-waves list, or `Hide waves` to collapse it. The expanded
section includes `Show all brain activity`, which opens `/{user}/brain`.

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
- On mouse and trackpad devices, the compact button's tooltip says
  `View created waves`. In desktop windows at least 1024px wide, hovering the
  profile-wave badge shows a preview with
  a primary-colored `Open profile wave` link and a neutral `Show all waves`
  disclosure.

## User Journey

1. Open a profile header, wave drop, direct-message drop, or supported author
   hover card.
2. If the author is a wave creator, the water-drop badge or profile-wave badge
   appears in the author identity row.
3. Select the compact water-drop button to open the shared
   `Waves by {profile}` viewer. For a profile-wave badge, tap on touch or click
   in a window narrower than 1024px to open the sheet. On wider desktop windows,
   hover to preview or click to open the profile wave directly.
4. From the profile-wave preview, select `Open profile wave` to open the
   featured wave or `Show all waves` to expand the created-waves list.
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
- Mouse and trackpad devices use the hover card in windows at least 1024px wide.
  It expands into a second panel when space allows, growing from the badge-side
  edge while remaining inside the viewport.
- Windows narrower than 1024px use the sheet, including on mouse and trackpad
  devices. Touch devices, including tablets, use the sheet at every window width.
  `Open profile wave` is a full-width button above the centered
  `Show all waves` / `Hide waves` disclosure.
- The sheet fits shorter content. Longer content scrolls together, including the
  header, artwork captions, actions and created-wave rows. The close button floats
  above the sheet, and the drag handle remains available.
- Desktop created-wave lists scroll within their panel and include
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
- Touch devices do not rely on hover tooltip copy; tapping the badge
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
