# Back Button Behavior

## Overview

The app-header back button is context-aware. It appears only when the app has a
predictable in-app backward action and runs route-specific logic before falling
back to navigation-history behavior.

## Location in the Site

- App header on wave/detail contexts.
- Create routes: `/waves/create` and `/messages/create`.
- Wave/message thread contexts that include an active wave.
- Profile routes (`/{user}`) when in-app history provides a valid back target.

## Entry Points

- Open a wave thread.
- Open a create route.
- Open a route with an active `drop` query parameter.
- Open a profile route after navigating from another in-app route.

## User Journey

1. Header shows `Back` when one of these conditions is true:
   - active wave context is present,
   - current route is `/waves/create` or `/messages/create`,
   - current route is a profile route and history can go back.
2. User selects `Back`.
3. The app applies the first matching rule:
   - `/waves/create` -> `/waves`
   - `/messages/create` -> `/messages`
   - active `drop` query -> remove `drop` while keeping current thread context
   - active wave context -> clear active wave and return to section home
     (`/waves` or `/messages`)
4. If no route-specific rule matches, the app falls back to navigation-history
   `goBack`.

## Common Scenarios

- Leave create flow:
  use `Back` from `/waves/create` or `/messages/create` to return to the
  section list.
- Close a focused drop:
  when `?drop=` is present, `Back` removes that query state and stays in the
  same route context.
- Leave active wave/thread:
  `Back` clears the active thread and returns to `/waves` or `/messages`
  depending on wave type.
- Leave a profile route:
  if a prior in-app route exists, `Back` returns there.

## Edge Cases

- Repeat clicks during fallback history loading are ignored.
- Profile routes do not show `Back` when in-app history has no valid prior
  target.
- If active wave metadata disappears while viewing a thread, wave state is
  cleared and routing falls back to section-home behavior.

## Failure and Recovery

- If drop query cleanup does not apply immediately, retry once; the route rule
  still removes `drop` in-place.
- If no in-app history target exists, use sidebar/bottom-navigation controls to
  return to the desired section root.
- If route transition stalls, reload the current route and retry the action.

## Limitations / Notes

- Back behavior is intentionally context-aware and is not a strict one-to-one
  wrapper over browser history.
- A loading spinner appears only during fallback history navigation.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Navigation and Shell Controls Troubleshooting](troubleshooting-navigation-and-shell-controls.md)
- [App Header Context](feature-app-header-context.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
