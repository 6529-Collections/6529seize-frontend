# Wave Drop Link Preview Toggle

Parent: [Link Previews Index](README.md)

## Overview

Drop authors can switch link previews on or off for their own drops.

The control is shown as link-level actions on the same row as each parsed link.
When previews are visible, the action is `Hide link previews`; when previews are
hidden, the first hidden link shows a compact `Show link previews` control next to
it. The change is applied optimistically and then synchronized with the backend.

For temporary (unsent or optimistic) drops, the control is visible in a disabled
state until the drop is fully saved.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Chat and message drop card content where links are rendered
- The compact home link-preview card variant does not expose this control

## Entry Points

- Open a thread and locate one of your authored drops containing at least one
  `http://` or `https://` URL.
- Use the preview toggle control that appears with the link actions:
  - `Hide link previews` while previews are currently visible
  - `Show link previews` next to the first hidden link when previews are disabled

## User Journey

1. Open a wave or direct-message thread.
2. Locate a drop that you authored and that contains one or more links.
3. When a supported action bar is visible, tap/click `Hide link previews` next to
   the link to hide all link previews for that drop.
4. If previews are hidden, tap/click the `Show link previews` control shown
   next to one of the hidden links to restore previews for that drop.
5. The drop updates optimistically to reflect the new state.
6. If the server persists the change, the state remains visible.
7. If persistence fails, the UI returns to the prior state and an error message
   is shown.

## Common Scenarios

- Authors can hide link previews when a published drop should show plain links.
- Authors can re-enable previews on the same drop.
- Hidden preview state applies to all preview types in the drop, including generic
  and provider-specific preview cards.
- On successful toggles, users can continue reading the same thread without
  additional navigation.
- If a drop has multiple links and previews are hidden, `Show link previews` appears
  once next to the first hidden link to avoid repeating the control.

## Edge Cases

- Non-authors do not see the control.
- Drops without links do not show the control.
- Drops currently showing no link-preview actions (for example home-page compact
  preview cards) do not surface the toggle control.
- Temporary (unsent) drops show a disabled toggle state and cannot be changed.
- Repeated taps/clicks while the request is in flight are ignored.
- When hidden, only one inline `Show link previews` control is displayed, even for
  drops with multiple plain links.

## Failure and Recovery

- If the network call fails, the toggle returns to its prior value and users can
  try again.
- If the user is offline or server validation blocks the action, the toast
  feedback explains that the toggle failed.
- Temporary drops remain disabled until they are fully synchronized.

## Limitations / Notes

- The action is not available for proxy profile context and non-author users.
- The toggle controls preview visibility only for the selected drop.
- The action is not available from the desktop `More` menu or touch action menu; it
  is only available from link-level actions and inline hidden-link controls.
- The action label indicates current visibility, not provider type.

## Related Pages

- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Link Previews Index](README.md)
- [Docs Home](../../README.md)
