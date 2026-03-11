# Direct Message Creation

## Overview

Use this flow to start a new direct-message thread by selecting recipient
identities.

- Desktop web uses URL mode `create=dm`.
- App mode uses `/messages/create`.

## Location in the Site

- Desktop DM-create mode (`?create=dm`) is supported in these layouts:
  - `/messages`
  - `/messages?wave={waveId}`
- App create route: `/messages/create`.
- Success route after submit: `/messages?wave={waveId}`.

## Entry Points

- Click `Create DM` in the desktop `/messages` placeholder panel.
- Click the paper-plane create action in desktop messages sidebar layouts.
- Click app-header `Create DM` while in app `/messages` list context.
- Open a supported desktop route URL that already includes `?create=dm`.
- Open `/messages/create`.

## Access and Availability

- DM-create UI needs an authenticated connected profile.
- If profile context is missing, create controls are hidden and create content
  does not render.

## User Journey

1. Open a supported route with a connected profile.
2. Start direct-message creation.
3. Desktop keeps the current path/query context and opens `create=dm`; app
   opens `/messages/create`.
4. Type in the `Identity` search input.
5. Search starts at 3+ typed characters.
6. While loading, the search list shows `Loading...`; when empty, it shows
   `No results`.
7. Select one or more recipients; selected recipients appear as removable chips.
8. Click `Create`; the button switches to `Creating...` while submit runs.
9. On success, the app opens `/messages?wave={waveId}`.

## Common Scenarios

- Start a DM from `/messages` without leaving the messages layout.
- Start from `/waves` or `/messages`, then move directly into the created DM
  thread.
- Open `/messages/create` in app mode, then return to `/messages` with back.

## Edge Cases

- Selecting your own identity shows
  `You are included by default in a Direct Message!` and does not add a
  recipient chip.
- Search requests do not run until at least 3 characters are typed.
- Before 3 characters, the open list can still show `No results` while search
  is idle.
- Recipient selection is not de-duplicated client-side.
- `Create` stays disabled until at least one recipient is selected and during
  submit.
- Closing the desktop create modal (close icon, backdrop, or `Escape` outside
  `input`/`textarea`/`select`) clears only `create` and keeps other query
  values.
- In app mode, stale `create=dm` URL state can reopen the same create overlay
  on the current route; closing it removes `create`.

## Failure and Recovery

- If search returns no rows, refine the query and keep typing.
- If DM creation fails, the UI shows `Failed to create Direct Message: ...`;
  retry from the same flow.
- If stale `create=dm` opens unexpectedly, close the flow to clear `create`
  from the URL.

## Limitations / Notes

- Identity search returns profile-owner results only.
- This page owns direct-message creation form behavior.
- Route-shell behavior for `/messages/create` (header and back rules) is
  documented in Navigation docs.

## Related Pages

- [Wave and Direct Message Creation](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [App Header Context](../../navigation/feature-app-header-context.md)
- [Back Button Behavior](../../navigation/feature-back-button.md)
