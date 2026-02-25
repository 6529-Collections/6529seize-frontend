# Authenticated Live Updates

Parent: [Realtime Index](README.md)

## Overview

Authenticated live updates keep websocket-powered features in sync with the
current login state so users do not need to refresh after login, logout, or
session-token refresh events.

## Location in the Site

- App-wide provider layer used across routes.
- User-visible impact is most noticeable in wave/chat and other live-update
  surfaces that consume websocket events.

## Entry Points

- Open the app while signed in.
- Connect wallet and complete authentication from navigation controls.
- Keep one or more browser tabs open while auth state changes.

## User Journey

1. Open the app and authenticate.
2. The app starts authenticated live updates automatically.
3. Continue browsing; live-update surfaces can react without full-page reloads.
4. If auth token state changes (for example logout, re-authentication, or token
   refresh), the app re-checks connection health and reconnects/disconnects as
   needed.
5. Other open tabs converge to the same auth-aware live-update state.

## Common Scenarios

- Sign in and immediately resume live updates on supported realtime surfaces.
- Logout or session loss stops authenticated live updates.
- Re-authentication restarts live updates without requiring a manual page
  refresh.
- Auth changes in one tab propagate to other tabs so they do not stay on stale
  session state.
- Temporary websocket disconnects retry automatically while authentication is
  still valid, using deterministic exponential backoff timing (about `2s`,
  `3s`, `4.5s`, and up to `30s` between attempts).

## Edge Cases

- Browser support differs for cookie-change events and cross-tab sync signals,
  so update timing can vary by client.
- On clients without direct cookie-change listeners, auth-state convergence may
  rely on periodic health checks.
- Tabs that are backgrounded can appear delayed until the browser schedules
  queued work.
- Reconnect delays are not randomized, so multiple open tabs can retry at
  nearly the same moments.
- Recovery after an unexpected disconnect is not immediate and can appear
  slower during prolonged instability because retry spacing grows between
  attempts.

## Failure and Recovery

- If live updates disconnect unexpectedly while auth is still valid, the app
  retries connection automatically.
- During sustained connectivity issues, live data can pause until one of the
  retry attempts succeeds.
- One reconnect cycle uses up to the configured retry cap (default `20`
  attempts). If all attempts fail, the app stays disconnected until a
  follow-up health check/auth update or a page refresh starts a fresh
  connection cycle.
- If auth becomes invalid, live updates remain unavailable until the user
  re-authenticates.
- If updates appear stale, refreshing the page forces a full re-initialization
  of the live-update session.

## Limitations / Notes

- This behavior governs authenticated websocket connectivity, not guaranteed
  delivery of every individual realtime event.
- The app only maintains authenticated live updates while a valid auth token is
  present.
- Routes that do not render websocket-backed UI may not show obvious visual
  change even when connection state changes.
- Clients without modern browser event APIs can have slower convergence to auth
  changes.
- Deterministic reconnect timing can make multiple tabs recover in near-lockstep
  instead of spreading retries randomly.

## Related Pages

- [Realtime Index](README.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
