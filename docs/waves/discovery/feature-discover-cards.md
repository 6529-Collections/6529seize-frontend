# Wave Discover Cards

## Overview
Wave cards on discovery-style grids use a full-card interaction model: the
entire card opens the target wave, while embedded profile and follow controls
stay independently actionable. Cards surface core wave context at a glance
(title, author, level, participant count, and drop count) without requiring a
separate `View` action button. Cards also keep a subtle outer frame and a light
content-to-footer divider so metadata and actions stay visually distinct. On
narrow layouts, cards use a slightly shorter hero-media area to keep wave
metadata and actions visible earlier in the viewport.

## Location in the Site
- `/discover` wave overview sections (`Latest`, `Most Followed`, and related
  sections)
- `/discover` and `/waves` search result grids
- `/{user}/waves` profile tab wave grid

## Entry Points
- Open `Discover` from main site navigation.
- In mobile app mode, open `Discover` from the fixed bottom app navigation.
- Open `/waves` and browse or search for waves.
- Open a profile and switch to the `Waves` tab.

## User Journey
1. Users open a wave grid and see cards with a hero image/gradient, title,
   author identity block, and wave stats split from footer actions by a thin
   divider.
2. Users activate the card surface (click/tap) to open the wave destination.
3. If the card represents a direct-message wave, routing opens
   `/messages?wave=<waveId>`; otherwise it opens `/waves/<waveId>`.
4. Users can open author/contributor profiles or follow/unfollow directly from
   the same card without leaving through accidental card navigation.
5. Keyboard users focus the card and press `Enter` or `Space` to navigate.

## Common Scenarios
- Click anywhere on the non-interactive part of the card to open the wave.
- Use `Cmd/Ctrl` click or middle-click on the card to open the wave in a new
  tab.
- Select `Follow` / `Following` from the card footer to change subscription
  status.
- Select the author row to open the author profile.
- Use `Cmd/Ctrl` click or middle-click on the author row to open the profile in
  a new tab.
- Select contributor avatars (when shown) to open contributor profiles.
- Use `Cmd/Ctrl` click or middle-click on contributor avatars to open
  contributor profiles in a new tab.

## Edge Cases
- Wave has no cover image: the card still renders with a gradient hero.
- Author handle is unavailable: author information renders without profile
  navigation.
- Contributor avatar image is missing: initials fallback is shown.
- Very narrow cards hide overlapping contributor avatars while preserving the
  drop count text.
- On narrow cards, hero-media height is slightly reduced before returning to
  the standard taller aspect at larger breakpoints.
- Unauthenticated/proxy contexts show follow controls in a disabled state.
- Clicking author rows, contributor avatars, and follow controls does not
  trigger the card-level wave navigation action.

## Failure and Recovery
- Follow/unfollow request fails: the card keeps prior follow state and shows an
  error toast.
- Auth check fails before follow/unfollow: mutation is canceled and the button
  returns to idle.
- Hover-only helper affordances (for example tooltip hints) are unavailable on
  touch-first input; core labels remain visible in-card.

## Limitations / Notes
- Cards show summary metadata only (`Chat`, joined count, drop count) rather
  than last-message previews.
- Contributor avatar stacks are capped to a subset of contributors in compact
  display.
- This page documents grid cards, not the left-sidebar Brain/DM wave list rows.

## Related Pages
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](../create/feature-modal-entry-points.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Brain Wave List Last Drop Indicator](../sidebars/feature-brain-list-last-drop-indicator.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
