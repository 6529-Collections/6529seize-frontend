# Wave Create Dialog Entry Points

## Overview

Web wave creation uses URL mode `?create=wave`.
When that mode is active, the `Create Wave` flow opens above the current page
context. It uses a centered modal on desktop and the standard bottom sheet on
mobile viewports.

## Route Coverage

- Web routes where `?create=wave` opens the wave-create dialog:
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages/{waveId}`
- App create uses `/waves/create`.

## Entry Points

- `/waves` and `/waves/{waveId}`: click the labeled Create wave button in the
  Waves panel, including the mobile Waves list. Collapsed sidebars keep the plus icon.
- Global Search: find Create wave, New wave, or Start a wave. Search opens
  `/waves/create`, which is also a direct link on web and in the app.
- `/waves`: click `Create Wave` in the empty-content placeholder.
- `/messages`: open by URL only (`?create=wave`).
- Open a supported web route URL with `?create=wave`.

## URL and Modal Behavior

1. Open a web waves or messages route. Create wave is available while signed out.
2. Start create-wave from an available control, or from a URL that already has
   `create=wave`.
3. The current URL keeps the same path/context and sets `create=wave`.
4. While signed out, Connect to create a wave explains wallet connection. The
   create URL remains open after connecting. If the identity has no profile
   handle, a compact `Create your
   profile first` dialog opens instead. `Go to Identity` starts profile setup;
   closing returns to the current page. Completing profile setup returns to
   `/waves/create` for a standalone wave; subwave entry returns to its parent wave.
5. With a profile handle, the `Create Wave` dialog opens above the current page
   context while the underlying list/content view remains visible. At widths
   below `768px`, it uses the mobile bottom sheet; wider viewports retain the
   centered modal.
6. Use the header `Close` button, click or tap outside the form, or press `Escape`
   to leave. An untouched form closes immediately. If you have entered work,
   `Discard your changes?` asks you to choose `Keep editing` or `Discard changes`.
   Keeping the form open preserves its settings, picture, description, and step.
   This also applies when creating a subwave.
7. Closing removes the `create` query value while keeping the rest of the URL
   context.
8. Successful submit navigates to the new wave route.

## Common Scenarios

- Start a new wave from `/waves` and keep waves-list context behind the modal.
- Start a new wave from desktop waves sidebar while browsing existing waves.
- Open `/messages?create=wave` or `/messages/{waveId}?create=wave` to open
  create-wave inside messages layout.
- Reopen the modal by using a URL that already includes `create=wave`.
- Open create-wave from `/waves` placeholder before selecting an active wave.

## Access and Edge Cases

- Existing query parameters (for example `wave` or `drop`) are preserved while
  opening and closing create-wave mode.
- If the URL mode is `create=dm`, direct-message creation opens instead.
- In collapsed sidebar mode, the create control remains icon-first; tooltip
  labels appear only on hover-capable devices.
- On non-hover devices, tooltip labels are not shown for the create icon.
- If an authenticated identity has no profile handle, create-wave controls stay
  available but open the profile-required dialog instead of the multi-step
  create dialog.
- Desktop `/messages` layout has no dedicated `Create Wave` button; opening
  wave-create there is URL-driven.

## Recovery

- If a stale `create=wave` URL opens the modal unexpectedly, closing the modal
  clears the create state and returns to the underlying page context.
- Confirming `Discard changes` closes the form and loses unsaved work. Existing
  saved drafts remain; reopening starts at Setup.
- Named standalone waves save settings and first-post text to Saved Drafts for
  the current wallet and profile on this device, including edits on the first
  Chat screen. Saving depends on browser storage and is delayed briefly after
  edits. Pictures and attachments must be added again. Older drafts restore
  settings only. Restoring opens the first screen; subwaves have no draft resume.
- On mobile, the sheet keeps its header and close control visible while the
  multi-step form scrolls within the available viewport.
- Keyboard users can Tab to `Close` and activate it with Enter or Space, or press
  Escape. Dismissing the discard confirmation keeps the form open and returns
  focus to it. Nested controls keep their own Escape behavior.

## Scope Notes

- This page documents responsive web waves/messages shell behavior.
- App create actions route to `/waves/create` instead of this responsive web
  dialog.
- The creation form requires a profile handle. Signed-out entry shows connection
  guidance; an identity without a handle shows profile setup guidance.
- Web wave/message layouts are expected to render one create-wave overlay at a
  time.

## Related Pages

- [Waves Index](../README.md)
- [Direct Message Creation](feature-direct-message-creation.md)
- [Wave List Navigation](../sidebars/feature-wave-list-navigation.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Schedule](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Docs Home](../../README.md)
