# Profile Privacy and Notification Preferences

## Overview

Authenticated profiles can open `Profile Preferences` from the app sidebar,
the desktop profile menu, or the settings action beside the `/notifications`
heading to control who may start new direct-message conversations and which
in-app notifications are created.

## Direct Messages

`Who can start a direct message with me?` offers:

- `Everyone`
- `People I follow`
- `Nobody`

The policy applies only when a new exact participant set is created. Existing
one-to-one and group conversations remain available even if one of their
participants would not pass the current policy. A new group conversation must
be accepted by every recipient; otherwise the creator sees the recipient's
admission-policy error.

## Notifications

Profiles can choose `All` or `Essential only`:

- `All` creates essential notices and notifications from enabled optional
  categories.
- `Essential only` keeps critical security, account-access, and account notices
  enabled while pausing optional notification creation. Direct messages still
  arrive; only their alerts are paused.

Optional categories cover direct messages and wave activity; mentions, replies,
and quotes; reactions, votes, and boosts; new followers; REP and NIC updates;
and subscription coverage.

When `Essential only` is selected, the category rows show `Paused` instead of
disabled-on switches. Their values are preserved and restored when the profile
switches back to `All`.

Device-level push settings remain separate. Push delivery can only happen after
an in-app notification is created, so a notification suppressed by these
profile preferences cannot trigger a push.

## Compatibility

Profiles without stored preferences use `Everyone`, `All`, and all optional
categories enabled. This preserves existing behavior when the backend is
deployed before the frontend.

## Related Pages

- [Notifications](README.md)
- [Mobile Push Notifications](feature-mobile-push-notifications.md)
- [Direct Message Creation](../waves/create/feature-direct-message-creation.md)
