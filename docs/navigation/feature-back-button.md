# Back Button Behavior

## Overview

The header back button is context-sensitive. It appears only where a predictable,
in-app backward action is available and performs different actions based on the
current state.

## Location in the Site

- Header across the app shell.
- Wave routes such as `/waves/{waveId}`.
- Message routes such as `/messages`, `/messages?wave={id}`.
- Create flows at `/waves/create` and `/messages/create`.
- Profile route contexts where browser history is available.

## Entry Points

- Open a wave page.
- Open a create flow.
- Open a wave drop with an open `drop` query parameter.
- Open a profile page with valid browser back context.

## User Journey

1. Header renders the back button when one of these contexts is active:
   - inside a wave,
   - on a create route,
   - on a profile route with prior history.
2. User selects `Back`.
3. The app applies the matching action:
   - Create route: returns to the base route for that section (`/waves` or
     `/messages`).
   - Open drop: removes the `drop` parameter and keeps you in the same thread.
   - Inside a wave: clears the active wave and returns to `/waves` for public
     waves or `/messages` for direct messages.
   - Otherwise, falls back to browser back history.
4. The button shows loading feedback while navigation is in progress.

## Common Scenarios

- Leaving wave detail back to list: select `Back` from `/waves/{waveId}` or
  `/messages?wave={id}` and return to the section root.
- Exiting create flow: select `Back` from `/waves/create` or `/messages/create` to
  return to the corresponding section list.
- Dismissing an open drop panel: select `Back` while `?drop=` is present to close
  the panel and return to the same wave thread context.
- Returning from profile pages: back appears when your navigation stack has a prior
  in-app state and hides when it does not.

## Edge Cases

- A second click while navigation is loading is ignored.
- On profile routes, back is only shown when history is available.
- In-app wave list back navigation uses the wave type (public/group vs. direct
  message) to determine the right section target.
- If the current wave disappears from server responses, returning clears active
  state and drops you to the related section home route.

## Failure and Recovery

- If `drop` closing fails to apply instantly, the route cleanup still removes the
  `drop` parameter and keeps the context.
- If navigation fails, the button re-renders and users can retry with another
  back action or browser controls.

## Limitations / Notes

- Back behavior is route-aware and does not always mirror the browser history stack
  one-to-one; wave exits are intentionally section-aware (`/waves` vs
  `/messages`).
- In the deepest fallback case, browser history handles the step when no in-app
  rule is matched.

## Related Pages

- [Navigation Index](README.md)
- [App Header Context](feature-app-header-context.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
