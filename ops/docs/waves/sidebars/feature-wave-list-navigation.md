# Wave List Navigation

## Overview

Wave and DM rows in the left list control which thread is open.

- Click the body of an inactive row to open that thread.
- In the native app, opening a wave from the Waves list uses a brief fade and
  slight scale into the content. The header and bottom navigation do not move.
  Supported app browsers briefly preserve the outgoing list as the wave appears;
  the app Back button reverses this handoff. Reduced Motion disables the animation.
  Older app browsers use a simpler entry transition. Navigation does not wait for
  the animation to finish.
- Click the body of the active row to clear selection and return to section
  home.
- Row pin and subwave expand/collapse buttons remain separate controls.
- On expanded rows, pin/unpin sits in the trailing metadata cluster before the
  wave score instead of beside the wave name, keeping the score at the far
  right.
- In `Worth Checking Out`, each avatar and its overlaid score shield form one
  wave navigation link. Hovering or focusing the combined link shows score
  details without creating a competing click target.
- `Worth Checking Out` is an overlapping discovery view: every recommended
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
- `All`, `Pinned`, and `Joined` are peer collections in one sticky row, with
  a separate search icon on the right. The collection group matches the search
  button height, including the larger touch controls. Switch directly without
  scrolling through pinned waves.
  Each collection remembers its scroll position; selecting another wave enables
  active-row reveal again. Signed-out visitors see an `All Waves` label on the
  left and the same search icon on the right, without personal collection controls.
- The `Waves` heading is plain text. Header actions sit at the far right:
  feed, then create on desktop; feed only in the mobile list.
  The app keeps create in its top bar.
- Select the feed icon to open Profile Waves Feed. On desktop, it clears the
  selected wave; on mobile web and in the native app, it opens
  `/waves?view=profile-feed`. The feed's `Waves` link returns to the list.
- The feed tooltip reads `Profile Waves Feed`. Create keeps a compact white
  button with a dark plus. Both have visible keyboard focus and larger touch
  targets. The feed content header has a `Discover Waves` link with a compass
  to `/discover`; the sidebar keeps the two section-specific `View all` links.
  The collapsed rail retains its icon-only feed link.
- Browser back/forward keeps the active row and URL in sync.
- In the native app, swipe right from the left edge of a standard wave detail
  view to return to the Waves list.

## Discovery and wave search

The discovery sections have independent heights. Expanding and collapsing uses
a short reveal and rotating chevron.
Reduced-motion preferences disable these transitions. The feed icon is blue
when the desktop feed is active or its button is hovered or keyboard-focused.

- `Worth Checking Out` appears first, followed by `Active Votes`, as independently
  collapsible sections above the wave collections. Both start expanded.
- Active Votes has a scrollable window three compact rows tall, with named
  TDH votes and their voting end or next decision. Scroll to browse the list;
  more pages load near the bottom, with a `Load more` button as a fallback.
  A thin scrollbar and bottom fade indicate more content below. The count stays
  visible when collapsed. The description and view-all link stay outside the list.
- Each expanded section starts with its own short explanation, available to
  signed-in and signed-out visitors. Active Votes says “Community decisions
  powered by TDH.” Worth Checking Out says “Highly rated waves you don’t follow.”
  Signed-out visitors see “Highly rated waves.”
- Empty Active Votes shows `No active TDH votes right now.` in a compact area.
  Loading and request failures are separate states; failed pages can be retried
  without discarding previously loaded votes. Both view-all links remain available.
- Each heading toggles only its own section. The chevron points down when open
  and right when closed. Both collapse preferences persist locally in this browser
  across visits, including signed-out visits, and are shared across profiles on
  the same browser/device. The old shared tab preference is no longer used.
- Announcements keeps its megaphone, timestamp, unread state and score shield in a compact row.
- Active Votes rows include the wave score shield; select it for score details without opening the wave.
- Worth Checking Out shows up to six spaced previews, with fewer on narrow screens,
  with score shields overlapping the bottom-right corner of each avatar.
  The section keeps its own compact height independently of the vote list.
- Create wave has a visible label in the expanded desktop Waves panel and mobile Waves list, including signed-out visits. The collapsed sidebar keeps the plus icon and accessible Create wave name.
- Each heading has a separate `View all` link before the chevron, available
  even when collapsed. Active Votes opens `/discover?view=active-votes`;
  Worth Checking Out opens `/discover?view=recommendations&sort=QUALITY`.
  Selecting the link navigates without toggling the section.
- Select the search icon beside the collection controls to reveal and focus
  `Find a wave…`. Search replaces the controls while open. Close it with the
  close button or Escape to return to the selected collection.
  On touch devices, the focused field scrolls into view when the keyboard opens.
  In the native app, the Waves list also resizes above the keyboard so the input
  and results stay reachable; dismissing the keyboard restores the list height.
  While search is open, sidebar scores stay visible but their details cards
  are temporarily unavailable, including when the search field is empty.
  Closing search restores score hover, focus, and selection. Recommendation
  links remain available while searching.
  `Find a wave…` searches all accessible non-DM waves, independently of the
  selected collection. Type at least three characters. Results show name,
  creator, and joined/pinned status, with `Load more` for additional matches.
- Search replaces the lower list and keeps the query while opening a result.
  Signed-out and auth-loading views omit the redundant `All Waves` heading below
  the search input; personal collection tabs appear when available.
  A small spinner replaces the search icon while results are loading; one close
  button resets the query and hides search. Closing restores the collection
  and its scroll position. Queries are kept separately for each viewer only
  while the page is running. Refresh starts with an empty search and restores
  the last selected All / Pinned / Joined collection. The list area below the tabs shows a small centered spinner only while the
  selected collection has no rows and is loading. Existing rows refresh silently;
  an empty message appears only after loading finishes.
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
- From the Profile Waves Feed content header, open `Discover Waves` for the
  `/discover` route.
- On mobile web, select the feed icon to scan recent
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

- The current wave also highlights in Active Votes when it appears there,
  including when the same wave is highlighted in the collection list below.
- Wave rows open `/waves/{waveId}`.
- Direct-message rows open `/messages/{waveId}`.
- `Worth Checking Out` avatars and their overlaid score shields open the wave
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
- `Worth Checking Out` keeps the avatar and overlaid score in one keyboard and
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
