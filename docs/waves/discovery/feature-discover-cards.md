# Wave Discover Cards

## Overview
Discover cards on `/discover` use full-card thread navigation.

- Click or tap the card surface to open the thread.
- Focus the card and press `Enter` or `Space` to open the thread.
- Nested controls stay independent: author row, contributor avatars, and
  `Follow` / `Following` do not trigger card navigation.
- Cards show summary context: hero media (or gradient fallback), wave title,
  author + level, joined count, and drop count.

## Location in the Site
- `/discover` section grids (`Latest`, `Most Followed`, and related sections)
- `/discover` search results grid
- Card destination for non-DM waves: `/waves/{waveId}`
- Card destination for direct-message waves: `/messages?wave={waveId}`

## Entry Points
- Open `Discover` from sidebar or mobile bottom navigation.
- Browse section cards on `/discover`.
- Use `Search waves` or `By Identity` to switch to search results, then open
  cards there.

## User Journey
1. Open a discover grid and review card summary data.
2. Activate the card surface (click/tap, `Enter`, or `Space`) to open the wave.
3. If the card is a direct-message wave, routing opens
   `/messages?wave={waveId}`; otherwise it opens `/waves/{waveId}`.
4. Use author row and contributor avatars for profile navigation without
   triggering card routing.
5. Use `Follow` / `Following` to subscribe or unsubscribe without leaving the
   card unintentionally.

## Common Scenarios
- Use `Cmd/Ctrl` click or middle-click on the card to open the wave in a new
  tab.
- Select the author row to open the author profile.
- Use `Cmd/Ctrl` click or middle-click on the author row to open the profile in
  a new tab.
- Select contributor avatars to open contributor profiles when identity is
  available.
- Toggle `Follow` / `Following` from the card footer.

## Edge Cases
- Wave has no cover image: card hero renders with a gradient fallback.
- Author handle is unavailable: author row is not profile-navigable.
- Contributor avatar image is missing: initials fallback is shown.
- Very narrow cards hide overlapping contributor avatars while preserving the
  drop count text.
- Clicking author rows, contributor avatars, and follow controls does not
  trigger card-level wave navigation.
- Unauthenticated, proxy, or no-profile sessions do not render discover cards;
  they see route-level connect/setup/unavailable states before card UI.

## Failure and Recovery
- Follow/unfollow request fails: the card keeps prior follow state and shows an
  error toast.
- Auth check fails before follow/unfollow: mutation is canceled and the button
  returns to idle.

## Limitations / Notes
- Cards show summary metadata only (`Chat`, joined count, drop count) rather
  than last-message previews.
- Contributor avatar stacks show up to five contributors.
- Canonical direct-message thread route is `/messages?wave={waveId}` (no
  `/messages/{waveId}` route).
- This page documents grid cards, not the left-sidebar Brain/DM wave list rows.

## Related Pages
- [Wave Discovery Index](README.md)
- [Wave Discover Sections and Search](feature-discover-sections-and-search.md)
- [Waves Index](../README.md)
- [Wave Participation Flow](../flow-wave-participation.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Brain Wave List Last Drop Indicator](../sidebars/feature-brain-list-last-drop-indicator.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
