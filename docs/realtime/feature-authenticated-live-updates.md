# Authenticated Live Updates

Parent: [Realtime Index](README.md)

## Overview

Authenticated live updates keep the app websocket session aligned with wallet
authentication. When auth is valid, supported surfaces keep receiving push
updates. When auth is missing, the session disconnects and push updates pause.

## Location in the Site

- App-wide provider behavior mounted in `components/providers/Providers.tsx`.
- No dedicated websocket status route. Session health is global.
- Most visible on `/waves`, `/waves/{id}`, `/messages`, and routes showing
  marketplace preview cards from drop content.
- `/nft-activity` is request-driven and does not consume these websocket
  updates.

## Entry Points

- Open the app while signed in (`wallet-auth` cookie present).
- Sign in, sign out, or re-authenticate in the current tab.
- Change auth state in another open tab.
- Lose websocket transport while auth is still valid.

## User Journey

1. On app bootstrap, websocket health checks run immediately.
2. If a token exists and status is `disconnected`, the app connects with that
   token.
3. If no token exists and status is not `disconnected`, the app disconnects.
4. If token value changes while connected, the app reconnects with the new
   token.
5. While connected, subscribers apply `DROP_UPDATE`,
   `DROP_RATING_UPDATE`, `DROP_REACTION_UPDATE`, and `MEDIA_LINK_UPDATED`
   messages.

## Common Scenarios

- Sign in and resume live updates on waves and direct-message wave surfaces.
- Logout or token loss pauses authenticated push updates.
- Re-authentication or token refresh reconnects the socket with the new token.
- Auth changes converge across tabs through cookie-store listeners when
  available, with broadcast-channel fallback (`auth-token-updates`) when not.
- Temporary disconnects retry automatically while auth is still valid, using
  deterministic exponential backoff (`2s`, `3s`, `4.5s`, capped at `30s`).

## Edge Cases

- Browser support differs for cookie-change listeners.
- If cookie listeners are unavailable, convergence relies on broadcast messages
  (when supported) plus periodic health checks.
- If both cookie-listener and broadcast support are missing, convergence relies
  on periodic checks only (`10s`).
- Background tabs can apply retries and auth-change handling later due to
  browser scheduling.
- Reconnect timing is deterministic (no jitter), so multiple tabs can retry in
  near lockstep.

## Failure and Recovery

- Unexpected closes (non-`1000`) with a valid token trigger automatic retries.
- Retry scheduling allows up to `20` attempts by default (`2s`, `3s`, `4.5s`,
  capped at `30s`).
- After the cap is reached, scheduled reconnect retries stop; periodic health
  checks (`10s`) still attempt reconnect while token+status require it.
- If auth is missing or invalid, the session stays disconnected until
  re-authentication.
- There is no global websocket status banner or reconnect button. If updates
  stay stale after re-authentication, refresh the tab to remount providers.

## Limitations / Notes

- This behavior governs authenticated websocket session health, not guaranteed
  delivery of every individual event.
- Subscribers attach only while status is `connected`; missed messages during a
  disconnect window are not guaranteed to replay.
- Marketplace preview websocket patches only affect already-cached preview cards
  with matching canonical IDs.

## Related Pages

- [Realtime Index](README.md)
- [Realtime Connectivity Troubleshooting](troubleshooting-realtime-connectivity.md)
- [Wave Participation Flow](../waves/flow-wave-participation.md)
- [Web3 Preview Cards](../waves/link-previews/feature-web3-preview-cards.md)
- [Wallet and Account Controls](../navigation/feature-wallet-account-controls.md)
- [Docs Home](../README.md)
