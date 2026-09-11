# Profile Privacy and Notification Preferences

## Overview

Authenticated profiles use Preferences to control who may start new
direct-message conversations, which in-app notifications are created, blocked
profiles, and submitted report history.

## Location in the Site

Preferences is a dedicated page at `/preferences`. It contains three tabs:
**Notifications & messages**, **Blocked Profiles**, and **Reports**.

## Entry Points

Users can open Preferences from the app sidebar, the desktop profile menu, or
the **Preferences** action in their own profile header. The profile-header
action sits in the far-right owner area on desktop. Touch-first and phone
layouts place an icon-only action beside **Edit profile**; smaller
fine-pointer layouts place the labeled action beside the identity.

Only the profile-header entry carries profile-return context. It shows **Back
to profile** on desktop and the standard app-header back arrow in the native
app. Sidebar, desktop profile-menu, and direct entries omit that return
control.

The profile-header action is hidden while an active profile proxy is in use.

## User Journey

1. Open your own profile and select **Preferences**.
2. Choose **Notifications & messages**, **Blocked Profiles**, or **Reports**.
3. Review or change the available settings for the active profile.
4. When Preferences was opened from the profile header, return to the active
   profile with **Back to profile** on desktop or the standard back arrow in
   the mobile app header.

## Common Scenarios

### Direct Messages

Preferences are profile-scoped. When a wallet is authenticated but does not
yet have a profile, `/preferences` offers **Create profile** instead of asking
the user to connect again. The preference controls become available after the
profile is created.

`Who can start a direct message with me?` offers:

- `Everyone`
- `People I follow`
- `Nobody`

The policy applies only when a new exact participant set is created. Existing
one-to-one and group conversations remain available even if one of their
participants would not pass the current policy. A new group conversation must
be accepted by every recipient; otherwise the creator sees the recipient's
admission-policy error.

### Notifications

Profiles can choose `All` or `Essential only`:

- `All` creates essential notices and notifications from enabled optional
  categories.
- `Essential only` keeps critical security, account-access, and account notices
  enabled while pausing optional notification creation. Direct messages still
  arrive; only their alerts are paused.

Optional categories cover direct messages and wave activity; mentions, replies,
and quotes; reactions, votes, and boosts; new followers; REP and NIC updates;
and subscription coverage.

When `Essential only` is selected, the optional category controls collapse out
of view. Their values are preserved and restored when the profile switches back
to `All`.

Device-level push settings remain separate. Push delivery can only happen after
an in-app notification is created, so a notification suppressed by these
profile preferences cannot trigger a push.

### Blocks and Reports

**Blocked Profiles** manages personal blocks. **Reports** tracks reports
submitted by the current profile and their public outcomes without exposing
internal moderation or AI detail.

## Edge Cases

- An authenticated wallet without a profile sees **Create profile** before
  profile-scoped controls become available.
- Preference controls remain tied to the active profile when multiple accounts
  are connected.
- Existing direct-message conversations remain available after the admission
  policy changes.

## Failure and Recovery

If Preferences opens without profile-scoped controls, confirm that the intended
profile is active and authenticated. Create the profile first when prompted,
then reopen Preferences.

The return control appears only when Preferences was opened from the active
profile and always targets that profile. Direct, sidebar, and desktop
profile-menu entries omit it and rely on the standard shell navigation.

## Limitations / Notes

Profiles without stored preferences use `Everyone`, `All`, and all optional
categories enabled. This preserves existing behavior when the backend is
deployed before the frontend.

## Related Pages

- [Notifications](README.md)
- [Mobile Push Notifications](feature-mobile-push-notifications.md)
- [Direct Message Creation](../waves/create/feature-direct-message-creation.md)
