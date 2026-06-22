# Wallet Auth Session V2 Implementation Notes

Status: frontend implementation guide
Date: 2026-06-17
Audience: 6529 frontend and backend developers

## Purpose

This document records the current frontend wallet-auth structure after the session-v2 migration. It intentionally documents the implemented first-party web and native flows, not a rollout fallback plan.

## Final Decision

The frontend auth flow uses backend session-v2 endpoints only:

- `GET /api/auth/session-nonce`
- `POST /api/auth/session-login`
- `POST /api/auth/session-refresh`
- `POST /api/auth/session-logout`

The frontend auth flow does not use the legacy wallet-auth nonce, login, or refresh-token redemption endpoints.

The generated OpenAPI client may still contain legacy models or endpoints for backend compatibility, but they are not part of the frontend wallet-auth implementation.

## Web Auth

Web login requests a session nonce with:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=web&chain_id=1
```

The backend returns:

```json
{
  "signable_message": "6529 Authentication\n...",
  "server_signature": "..."
}
```

The frontend signs `signable_message` exactly as returned. It does not sign a `nonce` field, rebuild the message, trim it, normalize it, JSON-stringify it, or send client-controlled origin/session fields.

Web login posts:

```json
{
  "client_type": "web",
  "client_address": "<wallet>",
  "client_signature": "<wallet signature over signable_message>",
  "server_signature": "<server_signature>",
  "role": "<optional profile id>"
}
```

The backend returns the short-lived access token and sets HttpOnly web session
cookies: a compatibility `6529_session` cookie plus an address-scoped
`6529_session_<address-hash>` cookie. The frontend keeps using `access_token`
for bearer-auth API calls and never reads or stores those cookies.

Web refresh and logout use the browser-sent cookie and must include credentials:

```json
{ "client_type": "web", "client_address": "<active wallet>" }
```

```json
{
  "client_type": "web",
  "client_address": "<active wallet>",
  "all_sessions": false
}
```

The active `client_address` keeps multi-account web refresh/logout bound to the
address-scoped cookie for the selected profile instead of whichever account last
wrote the compatibility cookie.

## Native Auth

Native login requests a session nonce with:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=native&chain_id=1
```

The native client signs `signable_message` exactly as returned and posts the same session-login shape with `client_type: "native"`.

The native response includes:

- `access_token`
- `access_token_expires_at`
- `native_refresh_token`
- `refresh_token_expires_at`

Native refresh sends `client_type: "native"`, `client_address`, and the current `native_refresh_token`. The backend rotates the refresh token on every refresh, so secure storage must be updated with the newest token before the old token is discarded.

Native logout sends the current native refresh token and `all_sessions`.

## Connection Sharing

The feature is connection sharing, not transfer. It creates an additional native session and does not move or disconnect the original web session.

Web creates a share with bearer auth:

```json
{
  "target_client_type": "native"
}
```

via:

```text
POST /api/auth/connection-share
```

The response includes `connection_share_code` and `deep_link_path`. The frontend uses the connection-share code query name only.

Native redeems:

```json
{
  "target_client_type": "native",
  "connection_share_code": "<code>"
}
```

via:

```text
POST /api/auth/connection-share/redeem
```

The response is a native session response. The redeemed client stores the returned `native_refresh_token` in secure storage and uses native session-v2 refresh from that point forward.

## Frontend Configuration

The frontend no longer gates this implementation behind session-v2, legacy-refresh, or structured-signature rollout flags. Backend settings from `/api/settings.auth` decide when legacy v1 sessions should prompt for migration, and backend environment controls still decide which origins are allowed, whether connection sharing is explicitly disabled server-side, and when structured signatures become mandatory.

## Reviewer Checklist

- Session login requests `ApiSessionNonceResponse.signable_message` and never `nonce`.
- Session nonce calls do not send `structured_signature`, `domain`, `client_origin`, or `session_type`.
- Web refresh/logout requests include cookies and the active `client_address`.
- Native refresh token rotation updates secure storage.
- Connection sharing uses `/auth/connection-share`, `/auth/connection-share/redeem`, and `connection_share_code`.
- Active frontend auth code has no legacy nonce/login/refresh-token redemption or obsolete connection sharing predecessor flow.
