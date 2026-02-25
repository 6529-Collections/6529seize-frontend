# Navigation and Shell Controls Troubleshooting

## Overview

Use this page when navigation surfaces, search entry, back actions, or account
controls do not behave as expected across web and app layouts.

## Location in the Site

- Web sidebar and small-screen web overlay navigation.
- App header and app bottom-navigation controls.
- Search modal and header back button flows.
- Sidebar account/user controls.

## Entry Points

- A navigation item is missing or not opening expected route.
- Sidebar/menu appears stuck open or closed.
- Back button is missing when expected.
- Bottom navigation is hidden in app layout.
- Account controls or proxy actions look unavailable.

## User Journey

1. Confirm layout context first:
   - desktop/small-screen web layout, or
   - native app layout.
2. Confirm expected navigation surface for that context.
3. Check route/state prerequisites for the specific control.
4. Retry from canonical section roots if state appears stale.

## Common Scenarios

- `Back` button is missing:
  it only appears for active wave contexts, create routes, or profile routes
  with valid in-app back history.
- Sidebar link seems missing:
  expand the relevant section (`Network`, `Collections`, `Tools`, `About`) or
  open the collapsed flyout first.
- Search returns nothing too early:
  site-wide search requires at least 3 characters;
  in-wave search requires at least 2.
- `Share Connection` is missing in share modal:
  verify authenticated connection state is active.
- Sidebar `Profile` shortcut is missing:
  connect wallet first; profile shortcut is hidden for disconnected state.
- App bottom navigation is hidden:
  dismiss on-screen keyboard and confirm no focused composer/edit state is
  suppressing bottom-nav visibility.
- Pull-to-refresh does not trigger:
  start gesture from header area while page is at top.

## Edge Cases

- In collapsed desktop mode, section flyouts are separate overlays and can close
  on outside click or `Escape`.
- In small-screen web overlay mode, route changes auto-close the menu.
- Account actions vary by surface:
  desktop dropdown includes `Disconnect Wallet`; app sidebar exposes account
  actions in its footer section.

## Failure and Recovery

- If a route switch stalls, navigate to a known section root (`/`, `/discover`,
  `/waves`, `/messages`, `/notifications`, `/network`) and retry.
- If search panel enters error state, use `Try Again`; if persistent, close and
  reopen search.
- If wallet controls fail, use wallet error-boundary recovery actions (`Try
  Again`, then `Clear Storage & Reload` if needed).
- If overlay/menu state stays inconsistent after retries, refresh the current
  route.

## Limitations / Notes

- Navigation behavior is intentionally context-dependent by layout and route
  state.
- Search page results are constrained to cataloged navigation destinations.

## Related Pages

- [Navigation Index](README.md)
- [Navigation Entry and Switching Flow](flow-navigation-entry-and-switching.md)
- [Sidebar Navigation](feature-sidebar-navigation.md)
- [Header Search Modal](feature-header-search-modal.md)
- [Back Button](feature-back-button.md)
- [Wallet and Account Controls](feature-wallet-account-controls.md)
- [Route Error and Not-Found Screens](../shared/feature-route-error-and-not-found.md)
