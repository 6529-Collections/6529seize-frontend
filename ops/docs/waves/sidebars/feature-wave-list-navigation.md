# Wave List Navigation

## Overview

Wave and DM rows in the left list control which thread is open.

- Click the body of an inactive row to open that thread.
- Click the body of the active row to clear selection and return to section
  home.
- Row pin and subwave expand/collapse buttons remain separate controls.
- On expanded rows, pin/unpin sits in the trailing metadata cluster before the
  wave score instead of beside the wave name, keeping the score at the far
  right.
- In `Worth a Look`, each avatar and its overlaid score shield form one
  wave navigation link. Hovering or focusing the combined link shows score
  details without creating a competing click target.
- `Worth a Look` is an overlapping discovery view: every recommended
  wave also appears in the `All` list at its recent-activity position. The
  `Joined` list normally includes only waves the user has joined, so
  discovery-only recommendations stay out of that bottom list.
- A wave opened from a direct link is temporarily added to the sidebar route
  context when it is outside the loaded list, including in `Joined`. This does
  not pin or join the wave.
- When the direct link targets a subwave, its visible root parent is surfaced,
  its subwaves are loaded, the parent opens, and the active child row is
  highlighted.
- Navigating to a wave scrolls its active row into the nearest visible position.
- `All`, `Pinned`, and `Joined` are peer collections below one sticky search
  and collection control. Switch directly without scrolling through pinned waves.
  Each collection remembers its scroll position; selecting another wave enables
  active-row reveal again. Signed-out visitors see `All Waves` without personal
  collection controls.
- The expanded web Waves panel header includes a secondary `Discover Waves`
  link to `/discover`.
- Select the `Waves` heading and its small feed icon to open Profile Waves Feed.
  On desktop, this clears the selected wave; on mobile web, it opens
  `/waves?view=profile-feed`. The feed's `Waves` link returns to the list.
  Hover or focus the heading for `Waves Feed`. The collapsed rail
  retains an icon-only feed link; there is no separate feed row in the expanded panel.
- Browser back/forward keeps the active row and URL in sync.
- In the native app, swipe right from the left edge of a standard wave detail
  view to return to the Waves list.

## Discovery and wave search

Both discovery panels keep the same height when switching. Content fades gently
between tabs; expanding and collapsing uses a short reveal and rotating chevron.
Reduced-motion preferences disable these transitions. The feed icon is blue
when the desktop feed is active or the heading is hovered or keyboard-focused.

- `Active Votes` appears first, followed by `Worth a Look`, as independently
  collapsible sections above the wave collections. Both start expanded.
- Active Votes has a scrollable window approximately two rows tall, with named
  TDH votes and their voting end or next decision. Scroll to browse the list;
  more pages load near the bottom, with a `Load more` button as a fallback.
  A thin scrollbar and bottom fade indicate more content below. The count stays
  visible when collapsed. The description and view-all link stay outside the list.
- Each expanded section starts with its own short explanation, available to
  signed-in and signed-out visitors. Active Votes says “Community decisions
  powered by TDH.” Worth a Look says “Highly rated waves you don’t follow.”
  Signed-out visitors see “Highly rated waves.”
- Empty Active Votes shows `No active TDH votes right now.` in a compact area.
  Loading and request failures are separate states; failed pages can be retried
  without discarding previously loaded votes. Both view-all links remain available.
- Each heading toggles only its own section. The chevron points down when open
  and right when closed. Both collapse preferences persist locally in this browser
  across visits. The old shared tab preference is no longer used.
- Worth a Look shows up to six spaced previews, with fewer on narrow screens,
  and uses its own compact height independently of the vote list.
- The compact plus button retains its light colour and shows `Create wave` on hover or keyboard focus.
- `View all active votes` opens `/discover?view=active-votes`.
  `View all recommendations` opens `/discover?view=recommendations&sort=QUALITY`.
- `Find a wave…` searches all accessible non-DM waves, independently of the
  selected collection. Type at least three characters. Results show name,
  creator, and joined/pinned status, with `Load more` for additional matches.
- Search replaces the lower list and keeps the query while opening a result.
  A small spinner replaces the search icon while results are loading; one clear
  button resets the query. Clearing restores the collection
  and its scroll position. Queries are kept separately for each viewer.
- This uses the existing name matching. Typo tolerance and relevance changes
  are outside this redesign. Unread state, pin controls and subwaves remain on
  normal collection rows; the DM list retains its existing behavior.

## Location in the Site

- Web left sidebar on:
  - `/waves` and `/waves/{waveId}`
  - `/messages` and `/messages/{waveId}`
- Mobile/app Waves and Messages list views that reuse the same row behavior.

## Entry Points

- Open the `Waves` or `Messages` shell with the left list visible.
- From the expanded web Waves panel header, open `Discover Waves` for the
  `/discover` route.
- On mobile web, select the `Waves` heading to scan recent
  posts across public Profile Waves.
- Select an inactive wave or DM row from the list by clicking the row body.
- In the native app, open a standard wave and swipe right from the left edge of
  the main content.
- Use browser back/forward after navigating between rows.

## User Journey

1. Open a waves or messages shell with the row list visible.
2. Select an inactive row body to open that thread.
3. The app updates the active highlight and URL together.
4. Select the active row body again to clear selection and return to section
   home.
5. In the native app, an edge swipe right from a standard wave also clears the
   active wave and restores the Waves list at its saved scroll position.
6. Use browser back/forward to revisit row selections while keeping the list
   and URL in sync.

## Common Scenarios

- Wave rows open `/waves/{waveId}`.
- Direct-message rows open `/messages/{waveId}`.
- `Worth a Look` avatars and their overlaid score shields open the wave
  on the first activation; hovering or focusing either visual shows score
  details.
- Active-row re-click returns to `/waves` or `/messages`.
- Native-app edge swipe from `/waves/{waveId}` returns to `/waves`.
- Inside the `/waves` or `/messages` shell, row changes update URL/history in
  place and keep row highlight aligned.
- Opening `/waves/{waveId}` directly keeps that wave visible and highlighted
  even when it is not followed, pinned, or present in the current overview
  page.
- Opening a subwave directly shows its root parent while children load, then
  expands the parent and reveals the selected subwave row.
- On signed-out desktop web `/waves`, clearing the active row returns to
  `/waves` and leaves the shell visible with a `Select a Wave` placeholder plus
  a connect-wallet CTA in the thread pane.
- Outside those shells, row click performs normal route navigation into the
  selected thread.

## Edge Cases

- Direct-message navigation uses `/messages/{waveId}`; legacy query links are redirected.
- If first unread is known, row navigation can add `divider={serialNo}`.
- Row pin/unpin and subwave expand/collapse buttons do not trigger row
  navigation.
- Long wave names truncate before the trailing score and visible pin controls;
  idle desktop rows do not reserve the hidden pin width.
- Non-touch devices can prefetch an inactive row on hover.
- Touch devices do not use hover prefetch.
- `Worth a Look` keeps the avatar and overlaid score in one keyboard and
  touch target, so the score cannot intercept wave navigation. The link's
  accessible name includes the score; hover or keyboard focus exposes the score
  details card, while touch activation opens the wave.
- Edge-swipe navigation applies only to native-app standard wave details. It is
  disabled on web, direct messages, list routes, create overlays, and focused
  drop views.
- The gesture starts from the left edge and ignores sliders, editors, media
  controls, and horizontally scrollable content so those interactions keep
  their normal touch behavior.
- Browser-default behavior is kept for modified clicks such as Cmd/Ctrl-click,
  Shift/Alt-click, middle-click, and right-click/context menu.
- The mobile Profile Waves Feed link is a normal browser link, so opening it,
  entering a Wave from a post, and using Back preserve browser history.
- Route-context rows keep their server-returned pin and join state. Their
  temporary visibility does not change account preferences.
- A private or inaccessible parent is never synthesized: only parent metadata
  included in the resolved active-wave response can be surfaced.

## Failure and Recovery

- If the selected thread no longer resolves, the app returns to section home
  (`/waves` or `/messages`).
- While direct-linked subwave children are loading, the parent row remains the
  visible fallback. When the active child arrives, the same sidebar moves the
  reveal target to that child.
- Recovery removes stale `wave` query values when present.
- After recovery, users can select another row immediately.

## Limitations / Notes

- This page owns row selection/navigation only.
- The visible app-header `Back` control remains available as the non-gesture
  way to return to the Waves list.
- Row metadata (`Last drop`, badges, tooltips) is owned by the row-metadata
  page.
- Pin and mute controls are owned by their sidebar control pages.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
