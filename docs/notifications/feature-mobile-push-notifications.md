# Mobile Push Notifications

Parent: [Notifications Index](README.md)

## Overview

In the native app, push notifications are device-scoped. Connected users can
choose which notification types arrive on this device, then tap a delivered
push to open the matching app route.

## Location in the Site

- App sidebar account footer: `Push Notifications` (connected account only).
- Native app push registration and push-tap handling.
- Settings API: `push-notifications/settings/{deviceId}`.
- Registration API: `push-notifications/register`.

## Entry Points

- Open the app sidebar, then select `Push Notifications`.
- Receive a push notification and tap it.
- Switch the connected profile while the app is active (push setup reruns for
  that profile).

## Feature Details

- Setup and registration:
  - Push setup runs only in Capacitor runtime and only while app state is
    active.
  - Existing push listeners are removed before each setup pass.
  - Setup requests push permission first; denied permission stops registration.
  - iOS registration waits briefly, then retries delegate-style failures
    automatically.
  - Successful registration sends stable `device_id`, platform, push token, and
    the connected `profile_id` when available.
  - Device ID is stored in secure storage and reused.
- Settings modal:
  - On open, settings load for this device ID.
  - `404` settings response defaults all toggles to enabled.
  - Toggles include follows, mentions, REP/NIC updates, quoted/replied drops,
    votes/reactions/boosts, and wave invites.
  - Footer states: `No Changes`, `Save Changes`, `Saving...`.
  - Successful save shows `Notification settings updated` and closes the modal.
  - Save failure shows `Failed to save notification settings` and keeps the
    modal open.
  - Load failure shows `Failed to load notification settings`; the modal can be
    closed and reopened to retry.
- Push tap routing:
  - Tap handling resolves a redirect target from push payload data.
  - If payload `profile_id` exists and does not match the connected profile,
    tap is ignored.
  - Supported targets: profile routes, `path` routes, `/the-memes/{id}`,
    `/6529-gradient/{id}`, `/meme-lab/{id}`, and wave routes from `wave_id`
    with optional `drop_id`.
  - Unknown profile subroutes fall back to profile root.
  - Missing redirect data or unknown redirect types do not navigate.
- iOS delivered-notification cleanup:
  - Tapped pushes are removed from iOS delivered notifications after successful
    registration.
  - Delivered notifications are also cleared during notifications read flows
    (feed read actions, grouped reaction read actions, wave read actions).
  - When notification unread count reaches zero in nav state, delivered
    notifications are cleared.

## Failure and Recovery

- If push permission is not granted, registration is skipped.
- If settings load/save fails, toast feedback is shown; reopen the modal and
  retry.
- If redirect data is missing or unsupported, tapping the push does not
  navigate.
- Setup and registration errors are logged and sent to Sentry; the rest of app
  usage stays available.

## Limitations / Notes

- Native-app behavior only; browser runtime does not run push registration.
- Delivered-tray cleanup logic is iOS-specific.
- Push receive/tap issues do not surface a global blocking banner.

## Related Pages

- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Navigation Sidebar](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
