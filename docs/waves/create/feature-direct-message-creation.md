# Direct Message Creation

## Overview

Direct-message creation lets users start a new DM thread by selecting identities.
On desktop routes, this flow opens in a modal using URL mode `create=dm`.
In app mode, it opens on `/messages/create`.

## Location in the Site

- Desktop wave/message shells: `/discover`, `/waves`, `/waves/{waveId}`,
  `/messages`, and `/messages?wave={waveId}`.
- App create route: `/messages/create`.
- Success destination: `/messages?wave={waveId}`.

## Entry Points

- Click `Create DM` in discover/waves list headers.
- Click the direct-message create action (paper-plane icon) in messages sidebar
  sections.
- Open a desktop route that already includes `?create=dm`.
- Use app-shell create actions that route to `/messages/create`.

## User Journey

1. Open a supported route with an authenticated profile.
2. Start DM creation.
3. Desktop keeps current route context and sets `create=dm`; app opens
   `/messages/create`.
4. Search identities in the `Identity` field.
5. Search results load after at least 3 typed characters and show
   `Loading...`/`No results` states when applicable.
6. Select one or more recipients; selected identities appear as removable chips.
7. Click `Create`; the action switches to `Creating...` while submission runs.
8. On success, the app opens the new thread at `/messages?wave={waveId}`.

## Common Scenarios

- Start a DM from `/messages` without leaving messages layout context.
- Start from `/discover` or `/waves`, then move directly into the created DM
  thread.
- Reopen the flow from a route URL that already carries `create=dm`.

## Edge Cases

- Selecting your own identity shows
  `You are included by default in a Direct Message!` and does not add a
  duplicate recipient row.
- Removing your own identity is blocked with
  `You cannot remove yourself from the DM`.
- `Create` stays disabled until at least one recipient is selected.
- Closing the desktop modal clears only `create` mode and preserves the rest of
  current query state.

## Failure and Recovery

- If identity search returns no rows, refine the query and keep typing.
- If DM creation fails, the UI shows `Failed to create Direct Message: ...`;
  retry from the same flow.
- If a stale `create=dm` link opens unexpectedly, close the modal to clear
  create mode.

## Limitations / Notes

- This page owns direct-message creation form behavior.
- Route-shell behavior for `/messages/create` (header and back rules) is
  documented in Navigation docs.
- Identity search targets profile-owner results.

## Related Pages

- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [Wave List Navigation Behavior](../sidebars/feature-wave-list-navigation.md)
- [App Header Context](../../navigation/feature-app-header-context.md)
- [Back Button Behavior](../../navigation/feature-back-button.md)
