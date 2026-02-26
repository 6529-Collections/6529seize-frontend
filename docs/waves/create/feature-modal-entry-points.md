# Wave Create Modal Entry Points

## Overview

On desktop discover, wave, and message layouts, creating a wave opens one
shared `Create Wave` modal. Multiple create controls feed the same URL-based
modal state so the create flow opens consistently without replacing the
underlying page context.

## Location in the Site

- Desktop `/discover`, `/waves`, and `/waves/{waveId}` routes.
- Desktop `/messages` routes that reuse the same left-sidebar shell.
- `Waves` section `+` action in the desktop sidebar (expanded and collapsed
  modes).
- Discover/waves list header `Create Wave` action.
- Empty-wave placeholder panel in desktop wave content layouts.
- App-mode routes use dedicated create pages (`/waves/create`) instead of this
  desktop modal behavior.

## Entry Points

- Click the `+` create action in the desktop sidebar `Waves` section.
- Click `Create Wave` from the discover/waves list header.
- Click `Create Wave` from the desktop empty-wave placeholder panel.
- Open a desktop discover/wave/message route URL that includes `?create=wave`.

## User Journey

1. Open a desktop discover, waves, or messages route with an authenticated
   profile.
2. Start create-wave from a sidebar, header, or placeholder entry point.
3. The current URL keeps the same path/context and adds `create=wave`.
4. A single `Create Wave` modal opens above the current page context while the
   underlying list/content view remains visible.
5. Complete creation or close the modal from the header close button, backdrop,
   or create-flow back/success actions.
6. Closing removes the `create` query value while keeping the rest of the URL
   context.

## Common Scenarios

- Start a new wave directly from the sidebar while browsing existing waves.
- Start a new wave from `/discover` and keep the discover list visible behind
  the modal.
- Start a new wave from `/messages` without leaving the messages layout.
- Reopen the modal by using a URL that already includes `create=wave`.
- Open create-wave from the desktop empty-state panel before selecting any
  active wave.

## Edge Cases

- Existing query parameters (for example `wave` or `drop`) are preserved while
  opening and closing create-wave mode.
- If the URL mode is `create=dm`, the direct-message modal opens instead and
  the create-wave modal stays closed.
- In collapsed sidebar mode, the create control remains icon-first; tooltip
  labels appear only on hover-capable devices.
- On non-hover devices, tooltip labels are not shown for the create icon.
- If no connected profile is available, create-wave controls are not shown and
  modal content is not mounted.

## Failure and Recovery

- If a stale `create=wave` URL opens the modal unexpectedly, closing the modal
  clears the create state and returns to the underlying page context.
- If the modal is dismissed before submission, users can reopen create-wave
  from either entry point and continue from the start of the flow.
- If the close icon is not convenient on a narrow viewport, clicking the modal
  backdrop also closes the modal.

## Limitations / Notes

- This page documents desktop discover/waves/messages shell behavior only.
- App-mode create behavior uses dedicated create routes instead of this modal.
- Create-wave visibility depends on the URL create mode and connected-profile
  availability.
- Desktop wave/message layouts are expected to render one create-wave overlay
  at a time.

## Related Pages

- [Waves Index](../README.md)
- [Wave Discover Cards](../discovery/feature-discover-cards.md)
- [Wave Creation Group Access and Permissions](feature-groups-step.md)
- [Wave Creation Dates and Timeline](feature-dates-step.md)
- [Wave Creation Drop Settings](feature-drops-step.md)
- [Docs Home](../../README.md)
