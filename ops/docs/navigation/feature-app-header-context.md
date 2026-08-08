# App Header Context

## Overview

In the app layout, the header adapts to route and thread state. It controls:

- left control (`Back` or `Open menu`)
- title
- right action row (`Create Wave`/`Create DM`, home health shortcut,
  mobile page share, `Search`)

## Location in the Site

- App routes rendered through `AppLayout` (native app shell).
- Common route families: `/`, `/waves*`, `/messages*`,
  `/network*`, `/drop-forge*`, collection routes, tool routes, and profile
  routes.
- Excluded routes: `/access*` and `/restricted*` (no layout wrapper).

## Entry Points

- Open any app-shell route.
- Open a thread (`/waves/{waveId}`, `/waves?wave={waveId}`, or
  `/messages/{waveId}`).
- Open create routes (`/waves/create`, `/messages/create`).
- Return to `/` to access the home-only health shortcut.

## User Journey

1. Header renders for the current app route.
2. Left control resolves:
   - `Back` appears when an active wave exists, on `/waves/create` or
     `/messages/create`, or on profile routes with valid in-app history.
   - Otherwise a menu/avatar button appears.
3. Menu/avatar button state:
   - Disconnected: menu icon.
   - Connected: profile avatar when available, otherwise a circle placeholder.
     If another connected account has unread notifications, the avatar shows a
     small unread dot.
   - Tap opens [App Sidebar Menu](feature-app-sidebar-menu.md).
4. Title resolves in this order:
   - `/waves/create` -> `Waves`
   - `/messages/create` -> `Messages`
   - `/waves*` with no active wave -> `Waves`
   - `/messages*` with no active wave -> `Messages`
   - active wave -> loading spinner, then wave name
   - `/the-memes|6529-gradient|meme-lab|nextgen/{numericId}` ->
     `{Collection} #{id}`
   - `/drop-forge/craft` -> `Drop Forge - Craft`
   - `/drop-forge/craft/{id}` -> `Drop Forge - Craft #{id}`
   - `/drop-forge/launch` -> `Drop Forge - Launch`
   - `/drop-forge/launch/{id}` -> `Drop Forge - Launch #{id}`
   - `/rememes/{contract}/{tokenId}` ->
     `Rememes {shortContract} #{shortToken}`
   - fallback -> last path segment (normalized and center-truncated)
5. Center action:
   - In active-wave context, chat/gallery toggle appears unless the wave is
     rank, memes, or DM.
6. Right action row:
   - `Create Wave` appears in waves list context with no active wave (including
     `?view=waves`).
   - `Create DM` appears in messages list context with no active wave
     (including `?view=messages`).
   - On `/`, network-health heart shortcut appears.
   - In the native app and small-screen web header, `Share page` appears
     immediately before `Search` on pages outside `/`, `/messages*`, and
     `/notifications*`. In the native app, it is also hidden while an active
     wave is open because that wave keeps its share action in `More`.
   - `Search` is always available.
7. More actions:
   - Wave-specific actions can appear in the overflow menu. The wave share
     action uses the arrow-style share icon there.
   - If the only overflow action is the wave link share/copy action, it renders
     as a direct icon button instead of a one-item overflow menu.

## Common Scenarios

- Open `/waves/{waveId}`: left control switches to `Back`; title moves from
  spinner to wave name.
- Return to `/waves` or `/messages`: title resets to section name and
  menu/avatar button returns.
- Open `/the-memes/123`: title is `The Memes #123`.
- Open `/drop-forge/craft/42`: title is `Drop Forge - Craft #42`.
- Open `/drop-forge/launch/42`: title is `Drop Forge - Launch #42`.
- Open `/rememes/{contract}/{tokenId}`: title uses shortened contract/token.
- Open `/`: health heart shortcut appears in the action row.
- Open a native app or small-screen web page such as `/the-memes/123`: the
  share button opens the platform share sheet directly with the exact public
  page URL.

## Edge Cases

- If active-wave metadata is still loading (or does not match active wave ID),
  title remains a spinner.
- Profile routes show `Back` only when in-app history can resolve a target.
- Menu/avatar unread dot appears only when a non-active connected account has
  unread notifications.
- Mobile page share is hidden on `/`, `/messages*`, and `/notifications*`, and
  also while the native app or small-screen web header is showing the Messages
  context from query-state navigation. Waves routes and the Waves query context
  remain shareable, but the native app hides the general page-share button once
  a wave is active and uses that wave's `More` menu instead.
- Rememes formatting applies only when both `contract` and `tokenId` are
  present.
- Drop Forge title formatting applies only on `craft` and `launch` route
  families; `/drop-forge` landing uses normal fallback title handling.
- Fallback title uses the last segment only and truncates long values.

## Failure and Recovery

- If title stays in loading state, use `Back` or open menu and go to `/waves`
  or `/messages`.
- If create action is missing, verify you are in waves/messages list context
  and not inside an active thread.
- If page share is missing on mobile, verify the route is not `/`, under
  `/messages` or `/notifications`, rendered in the Messages query view, or an
  active wave in the native app. Active waves share from `More`.
- If menu does not open, retry from the same top-left control.
- If the menu/avatar unread dot looks stale, open account controls and switch
  to the target account, then revisit `/notifications`.
- If search closes unexpectedly, reopen it from the header search button.

## Limitations / Notes

- This page primarily covers app-layout header behavior; the page-share notes
  also apply to the small-screen web header.
- Native page share uses the configured public web endpoint plus the exact
  current route state so recipients receive a normal web URL rather than an
  internal native-app URL. Small-screen web sharing preserves the exact
  current browser URL.
- Back execution order is documented in
  [Back Button Behavior](feature-back-button.md).
- Sidebar route groups and account actions are documented in
  [App Sidebar Menu](feature-app-sidebar-menu.md).

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [App Sidebar Menu](feature-app-sidebar-menu.md)
- [Back Button Behavior](feature-back-button.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Page Sharing and Device Connection](feature-share-modal.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Chat and Gallery View Toggle](../waves/header/feature-chat-gallery-toggle.md)
