# Direct Message Creation

## Overview

Use this flow to start a new direct-message thread by selecting recipient
identities.

- The **+** beside **Messages** opens **New message** at `/messages/new`.
  On desktop, the form opens in the main Messages pane beside the chat list.
  On small screens, the form fills the Messages view. It checks recipients as
  you select them. See [Starting a chat](../../encrypted-messages.md#starting-a-chat).
- On builds without encrypted chats, the paper-plane action opens a web dialog
  or sheet. The app uses `/messages/create`.
- 6529 deletes unencrypted direct-message
  content from its servers on 1 December 2026, except anything 6529 is
  legally required to keep
  ([Encrypted Messages](../../encrypted-messages.md#unencrypted-direct-messages)).

## Location in the Site

- Unified composer: `/messages/new`.
- On builds without encrypted chats, web DM-create mode (`?create=dm`)
  is supported in these layouts:
  - `/messages`
  - `/messages/{waveId}`
- Unencrypted chats open at `/messages/{waveId}`.
- Encrypted chats open at `/messages/encrypted/{group}`.

## Entry Points

- Select **+** beside **Messages** on web or in the app. On builds without
  encrypted chats, use the paper-plane action or **Create DM**.
- Open `/messages/new` directly.

## Access and Availability

- DM-create UI needs an authenticated connected profile.
- If profile context is missing, create controls are hidden and create content
  does not render.
- Recipient profile preferences can allow new conversations from everyone,
  only people the recipient follows, members of a group the recipient chose,
  or nobody. With the group option, people the recipient follows are also
  admitted unless the recipient turned that off.
- A profile the recipient has blocked can never start a new conversation with
  them. A profile you have blocked cannot be added to a new conversation until
  you unblock it.
- A new group direct message must be allowed by every recipient.
- Existing direct-message conversations are unaffected by later preference
  changes, including existing groups whose participants would not pass the
  current creation policy.

## User Journey

1. Open a supported route with a connected profile.
2. Start direct-message creation.
3. With encrypted chats available, **New message** opens at `/messages/new`.
4. Type a handle in the `To:` field on the **New message** screen.
5. Search starts at 3+ typed characters.
6. Exact handle matches appear first, followed by handles that start with the
   search text, handles that contain it, and finally ENS or auto-wallet matches.
   Results within each match group are ordered by profile level from highest to
   lowest.
7. While loading, the search list shows skeleton rows; when empty, it shows
   `No one found for “query”`. In the unified composer, selecting a result
   clears the search, and moving focus away dismisses the results.
8. Tap a result to toggle that person. Selected recipients have checked circles
   and appear as removable avatar chips inside the `To:` field.
9. On builds without encrypted chats, use **Message** followed by the handle
   or number of recipients. When encrypted chats are available, choose the
   action shown for the selected recipients.
10. The app opens the conversation.

## Common Scenarios

- Start a DM from `/messages` without leaving the messages layout.
- Start from `/waves` or `/messages`, then move directly into the created DM
  thread.
- Use the back arrow or **Cancel** to return to **Messages**.

## Edge Cases

- Selecting your own identity shows
  `You are already included in this direct message.` and does not add a
  recipient chip.
- In the app, the header prepares the full new-message screen in the background
  while its create action is visible. Once ready, opening skips the route-loading
  skeleton. An early tap or an account that is still loading can still show a
  loading state.
- Search requests do not run until at least 3 characters are typed.
- Before 3 characters, no results or instructional paragraph appears.
- Selecting the same recipient again removes them, including wallet aliases.
- Backspace in an empty `To:` field removes the last selected person.
- The `Message` action stays disabled until at least one recipient is selected
  and during submit. Recipient editing is disabled while creation runs.
- The app hides the floating tab bar and keeps the action above the keyboard and
  bottom safe area. Search results scroll independently of the action.
- Long handles truncate in chips and result rows. People without a profile photo
  have an initial avatar. Each result shows its level, and TDH when above zero.
- On builds without encrypted chats, closing the web create dialog or sheet
  clears only `create` and keeps other query values.

## Failure and Recovery

- If search returns no rows, refine the query and keep typing.
- If search fails, use `Retry search`. Selected recipients stay in place.
- The unified composer shows creation failures in the form and keeps the
  selection so it can be adjusted or retried.
- If a recipient does not accept a new direct message from the creator, the UI
  explains that recipient's policy, for example "@alice only accepts new direct
  messages from members of a group they chose". The group is named only when
  the recipient made it public. A recipient's block shows the same "doesn't
  accept new direct messages" notice as the Nobody setting and is never
  disclosed. Change the participant set or use an existing conversation.
- For other creation failures, the UI shows the server error when available;
  retry from the same flow.

## Limitations / Notes

- Identity search returns profile-owner results only.
- Recipient search ranks exact, prefix, and substring handle matches before ENS
  or auto-wallet matches, then orders each match group from highest to lowest
  profile level.
- New message copy uses the app message dictionary. Locales without translated
  messages currently fall back to English; levels, counts, and TDH use the
  browser locale. Translation coverage for this screen remains incomplete.
- Translation follow-up: frontend maintainers own the new `quickDm.*` creation
  and recipient-search messages for **New message**.
  `en-GB`, `fr-FR`, `es-ES`, and `de-DE` currently show the English fallback for
  this surface. Complete those dictionaries and repeat layout and accessible-name
  checks in each locale; no localized routes are required for this follow-up.
- This page owns direct-message creation form behavior.
- Route-shell behavior for `/messages/new` (header and back rules) is
  documented in Navigation docs.

## Related Pages

- [Wave and Direct Message Creation](README.md)
- [Waves Index](../README.md)
- [Wave Create Modal Entry Points](feature-modal-entry-points.md)
- [App Header Context](../../navigation/feature-app-header-context.md)
- [Back Button Behavior](../../navigation/feature-back-button.md)
