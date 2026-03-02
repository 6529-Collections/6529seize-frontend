# Wave Create Modal Entry Points

## Overview

Desktop wave creation uses URL mode `?create=wave`.
When that mode is active, the `Create Wave` modal opens above the current page
context.

## Route Coverage

- Desktop routes where `?create=wave` opens the wave-create modal:
  - `/discover`
  - `/waves`
  - `/waves/{waveId}`
  - `/messages`
  - `/messages?wave={waveId}`
- App create uses `/waves/create`.

## Entry Points

- `/discover`: click list-header `Create Wave`.
- `/waves` and `/waves/{waveId}`: click `+` in the left-sidebar `Waves`
  section.
- `/waves`: click `Create Wave` in the empty-content placeholder.
- `/messages`: open by URL only (`?create=wave`).
- Open a supported desktop route URL with `?create=wave`.

## URL and Modal Behavior

1. Open a desktop discover, waves, or messages route with an authenticated
   profile.
2. Start create-wave from an available control, or from a URL that already has
   `create=wave`.
3. The current URL keeps the same path/context and sets `create=wave`.
4. The `Create Wave` modal opens above the current page context while the
   underlying list/content view remains visible.
5. Close from the header close button, backdrop click, or `Escape` (when focus
   is not in an input, textarea, or select).
6. Closing removes the `create` query value while keeping the rest of the URL
   context.
7. Successful submit navigates to the new wave route.

## Common Scenarios

- Start a new wave from `/discover` and keep discover list context behind the
  modal.
- Start a new wave from desktop waves sidebar while browsing existing waves.
- Open `/messages?create=wave` or `/messages?wave={waveId}&create=wave` to open
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
- If no eligible connected profile is available, create-wave controls are not
  shown and modal content is not mounted.
- Desktop `/messages` layout has no dedicated `Create Wave` button; opening
  wave-create there is URL-driven.

## Recovery

- If a stale `create=wave` URL opens the modal unexpectedly, closing the modal
  clears the create state and returns to the underlying page context.
- If the modal is dismissed before submission, users can reopen create-wave
  from either entry point and continue from the start of the flow.
- If the close icon is not convenient on a narrow viewport, clicking the modal
  backdrop also closes the modal.

## Scope Notes

- This page documents desktop discover/waves/messages shell behavior only.
- App create actions route to `/waves/create` instead of this desktop modal.
- Create-wave visibility depends on the URL create mode and connected-profile
  availability.
- Desktop wave/message layouts are expected to render one create-wave overlay
  at a time.

## Related Pages

- [Waves Index](../README.md)
- [Direct Message Creation](feature-direct-message-creation.md)
- [Wave Discover Cards](../discovery/feature-discover-cards.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Docs Home](../../README.md)
