# Authenticated Live Updates

Parent: [Realtime Index](README.md)

## Overview

Authenticated live updates keep websocket-powered features in sync with the current
login state so users do not need a full page refresh after login, logout, or token
changes.

## Location in the Site

- App-wide provider layer mounted in `components/providers/Providers.tsx`.
- User-visible impact is most noticeable where wave/store contexts and marketplace
  preview sync consume websocket events.

## Entry Points

- Open the app with an auth token (`wallet-auth` cookie set).
- Connect wallet, authenticate, or re-authenticate.
- Switch auth token state while keeping one or more browser tabs open.

## User Journey

1. Open the app and authenticate.
2. Auth bootstrap runs a websocket health check immediately.
3. If a token exists and the socket is disconnected, the app connects using that
   token as a query parameter.
4. If token state changes (login, logout, re-auth, refresh), health checks rerun
   and the session disconnects or reconnects to match the new token state.
5. Connected surfaces consume subscribed websocket events without needing a manual
   page reload.

## Common Scenarios

- Sign in and immediately resume live updates on supported realtime surfaces.
- Logout or token loss stops authenticated live updates.
- Re-authentication or token refresh restarts updates without page refresh.
- Auth changes can propagate to other tabs via cookie-store listeners or fallback
  broadcast channel messages (`auth-token-updates`).
- Temporary disconnects retry automatically while authentication is still valid,
  using deterministic exponential backoff timing (starting at `2s` and capping at
  `30s`).

## Edge Cases

- Browser support differs for cookie-change listeners; when available, auth events are
  observed directly.
- On clients without cookie-change listeners, auth convergence can rely on the
  fallback broadcast channel and periodic health checks.
- Tabs that are backgrounded can appear delayed until the browser schedules
  queued work.
- Reconnect delays are deterministic (not randomized): multiple tabs can retry in
  near lockstep when their attempt counters match.
- During prolonged instability, retry spacing increases between attempts, so
  recovery can be noticeably delayed.

## Failure and Recovery

- If live updates disconnect unexpectedly while auth is still valid, the app retries
  automatically.
- A reconnect cycle allows up to `20` attempts by default (`2s`, `3s`, `4.5s`
  style progression, capped at `30s`).
- If those attempts fail, periodic health checks (every `10s`) continue to probe the
  token+status state and can re-open a fresh session.
- If auth becomes invalid, updates remain unavailable until re-authentication.
- If updates appear stale or silent, refreshing or revisiting the route triggers a
  fresh health-check pass and can reinitialize the session.

## Limitations / Notes

- This behavior governs authenticated websocket connectivity, not guaranteed
  delivery of every individual realtime event.
- The app maintains authenticated live updates while a valid auth token is present.
- Routes that do not render websocket-backed UI may not show obvious visual
  change even when connection state changes.
- Clients with limited event APIs or noisy browser scheduling can show slower token
  convergence.
- Deterministic reconnect timing can make multiple tabs recover in near-lockstep
  instead of spreading retries randomly.

## Related Pages

- [Realtime Index](README.md)
- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [Wave Chat Scroll Behavior](../waves/chat/feature-scroll-behavior.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
