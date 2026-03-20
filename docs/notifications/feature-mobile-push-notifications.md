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
  - Device ID is read from secure storage and reused when the stored value is
    present and non-empty.
  - If secure storage returns an empty value, the key is missing, or known
    keychain/keystore decrypt-style read errors occur, a new `device_id` is
    generated and persisted, then registration continues.
  - Concurrent setup calls share a single in-flight `device_id` resolution to
    avoid duplicate parallel secure-storage reads/writes.
  - Registration uses up to three attempts for transient failures (including
    `429`, `408`, `5xx`, and network-failure patterns).
  - Retry delay uses `Retry-After` headers or retry-hint text when available;
    otherwise delay uses bounded exponential backoff with jitter.
  - Duplicate registration callbacks with the same
    (`device_id`, token, profile) fingerprint are skipped when already
    completed in-session or already handled by an in-flight attempt.
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
  - Tap handling accepts only payloads that include
    `notification_id`, `redirect`, `target_profile_id`, and
    `target_profile_handle`.
  - Device-push redirect types are `profile` and `waves`.
  - `profile` redirects can include `subroute` (`rep` or `identity`);
    unknown subroutes fall back to profile root.
  - `waves` redirects use `wave_id` with optional `drop_id`.
  - Before navigating, the app resolves the target profile to a currently
    connected account (by profile ID, role alias, or profile handle) and
    switches to the matched account/profile when needed.
  - Invalid payload shape, missing target profile metadata, target profiles not
    found in connected accounts, or profile-switch settlement failures all
    result in ignored taps (no navigation).
  - Missing usable redirect data does not navigate.
- iOS delivered-notification cleanup:
  - Tapped pushes are removed from iOS delivered notifications after successful
    registration.
  - Delivered notifications are also cleared during notifications read flows
    (feed read actions, grouped reaction read actions, wave read actions).
  - When notification unread count reaches zero in nav state, delivered
    notifications are cleared.

## Failure and Recovery

- If push permission is not granted, registration is skipped.
- If secure-storage read fails with a known recoverable pattern (missing key or
  known decrypt/keystore errors), setup regenerates `device_id` and continues.
- If secure-storage read/write fails with an unrecoverable error, that setup
  pass stops before registration; the error is captured to Sentry and a later
  setup pass can retry.
- If registration hits transient failures (`429`, `408`, `5xx`, or network
  errors), it retries automatically up to three attempts in the same setup
  pass.
- If rate-limit responses continue after retries, that setup pass stops push
  registration without a blocking app-state change; a later setup pass can
  retry.
- If settings load/save fails, toast feedback is shown; reopen the modal and
  retry.
- If push payload target profile metadata does not resolve to a connected
  account, tap is ignored.
- If account/profile switching for a push target does not settle in time, tap
  is ignored.
- If redirect data is missing or unsupported, tapping the push does not
  navigate.
- Non-transient setup/registration errors are captured to Sentry; rate-limit
  outcomes are tracked as breadcrumbs. The rest of app usage stays available.

## Limitations / Notes

- Native-app behavior only; browser runtime does not run push registration.
- Delivered-tray cleanup logic is iOS-specific.
- Device push tap redirects currently support `profile` and `waves` payload
  types.
- Push receive/tap issues do not surface a global blocking banner.
- Registration retries run in the background; there is no per-attempt retry
  status UI in the settings modal.

## Related Pages

- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Navigation Sidebar](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
