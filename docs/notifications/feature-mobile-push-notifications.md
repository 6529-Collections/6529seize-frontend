# Mobile Push Notifications

Parent: [Notifications Index](README.md)

## Overview

Mobile-only push notifications are initialized from the app provider layer and
use a stable device-id, profile-scoped registration, and notification type
toggles that control what arrives on a specific device.

## Location in the Site

- App shell sidebar: `Push Notifications` item inside `AppUserConnect`.
- Notification tap routing and unread-clearing behavior in app background handlers.
- Delivery settings API: `push-notifications/settings/{deviceId}`.

## Entry Points

- Open the app sidebar and tap `Push Notifications` while connected.
- Receive a push notification while logged in to the app and tap the notification.
- Change identity/profile inside the app (re-registers app push binding for new
  profile).

## Feature Details

- Push setup runs only when running in Capacitor shell (`isCapacitor === true`).
- `Connect / notifications` setup is tied to active app lifecycle:
  - If app becomes active and profile changes, setup runs again for that profile.
  - Existing listeners are removed before each setup to avoid stale callbacks.
- Registration flow:
  - Requests permission before attempting registration.
  - Applies a short iOS warm-up delay before registration.
  - Retries iOS delegate registration with exponential backoff (`1s`, `2s`, `4s`)
    for up to 3 attempts.
- Registration payload includes stable device id, device platform, auth profile
  id, and push token.
- The device id is persisted in secure storage and reused across sessions.
- Settings dialog behavior:
  - Loads existing settings for device ID on open.
  - Treats `404` as all-notifications-enabled defaults.
  - Enables per-event toggles including identity, mention/reply/react/vote/boost,
    quoted drop, and wave invite notifications.
  - `Save Changes` activates only when at least one toggle changed.
- Tap/open behavior:
  - Tapping a delivered push tries to resolve redirect target and open the
    matching route.
  - Taps with `profile_id` for a different connected profile are ignored.
  - Supported redirect targets include:
    - profile pages
    - `/path` routes
    - /the-memes, /6529-gradient, /meme-lab deep links
    - wave route by `wave_id` + optional `drop_id`
  - Delivered notification rows are removed from tray on open.
- Delivered notification cleanup also runs when:
  - a notifications list item is handled as read in feed flow, and
  - the Notifications tab has no unread count in navigation state.

## Failure and Recovery

- If permissions are not granted, push registration is not attempted.
- Unknown redirect types or missing redirect data result in no navigation.
- Registration errors are logged and sent to Sentry, but the app still remains
  usable for non-push flows.

## Limitations / Notes

- Not surfaced in web browser flows; mobile app shell behavior only.
- Unsupported events are silently ignored rather than surfaced as global failure
  banners.

## Related Pages

- [Notifications Feed](feature-notifications-feed.md)
- [Notifications Feed Browsing Flow](flow-notifications-feed-browsing.md)
- [Notifications Feed Troubleshooting](troubleshooting-notifications-feed.md)
- [Navigation Sidebar](../navigation/feature-sidebar-navigation.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
