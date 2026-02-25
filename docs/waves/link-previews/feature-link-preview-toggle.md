# Wave Drop Link Preview Toggle

Parent: [Link Previews Index](README.md)

## Overview

Drop authors can switch link previews on or off for their own drops.

The control appears as a compact action button on desktop and a labeled action on
mobile layouts. By default, toggling happens immediately in the feed and then
syncs to the backend.

For temporary (unsent or optimistic) drops, the control is still visible in a
disabled style and cannot be used until the drop is fully saved.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Drop action areas that include author actions, including desktop compact controls
  and mobile-expanded action stacks

## Entry Points

- Open a thread and select one of your authored drops containing at least one
  `http://` or `https://` URL.
- Use the link-preview action when the label or icon indicates current preview
  visibility.

## User Journey

1. Open a wave or direct-message thread.
2. Locate a drop that you authored and that contains one or more links.
3. On desktop, tap/click the preview icon.
4. On mobile, tap/click the `Hide Link Previews` or `Show Link Previews`
   action text/button.
5. The drop updates optimistically to reflect the new state.
6. If the server persists the change, the state remains visible.
7. If persistence fails, the UI returns to the previous state and an error
   message is shown.

## Common Scenarios

- Authors can hide link previews when a published drop should show plain links.
- Authors can re-enable previews on the same drop.
- Hidden preview state applies across supported preview types, including generic and
  provider-specific preview cards.
- On successful toggles, users can continue reading the same thread without
  additional navigation.

## Edge Cases

- Non-authors do not see the control.
- Drops without links do not show the control.
- Temporary (unsent) drops show a disabled toggle state and cannot be changed.
- Temporary drops do not render a tooltip for the action on desktop.
- Repeated taps/clicks while the request is in flight are ignored.

## Failure and Recovery

- If the network call fails, the toggle returns to its prior value and users can
  try again.
- If the user is offline or server validation blocks the action, the toast
  feedback explains that the toggle failed.
- If the drop is not fully synchronized yet (temporary state), users must wait
  for it to become persistent before the action becomes interactive.

## Limitations / Notes

- The action is not available for proxy profile context and non-author users.
- The toggle controls preview visibility only for the selected drop.
- The action label indicates current visibility, not provider type.

## Related Pages

- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Link Previews Index](README.md)
- [Docs Home](../../README.md)

