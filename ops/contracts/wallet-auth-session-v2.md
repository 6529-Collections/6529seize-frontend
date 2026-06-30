# Wallet Auth Session V2 Contract

Status: implementation contract
Owner: 6529 frontend and backend
Updated: 2026-06-17

## Goals

- Use the backend session-v2 wallet auth flow for first-party web, native, and desktop clients.
- Stop using legacy nonce/login/refresh-token auth in the frontend auth flow.
- Keep web refresh state in backend-owned HttpOnly cookies: a compatibility
  `6529_session` cookie plus address-scoped `6529_session_<address-hash>`
  cookies for multi-account web sessions.
- Keep native and desktop refresh state in secure storage and rotate it on every refresh.
- Support connection sharing from an authenticated web session to native and
  desktop clients with a short-lived one-time code.
- Keep the legacy 6529 Desktop refresh-token handoff documented for older
  Desktop builds during the rollout.
- Keep access JWTs available for bearer-auth API calls.

## Web Session Flow

### GET `/api/auth/session-nonce`

Web callers request:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=web&chain_id=1
```

The response is:

```json
{
  "signable_message": "6529 Authentication\n...",
  "server_signature": "..."
}
```

The frontend signs `signable_message` exactly as returned. It must not sign a `nonce` field, rebuild the message, trim it, normalize it, stringify it, or add client-controlled fields such as `structured_signature`, `domain`, `client_origin`, or `session_type`.

### POST `/api/auth/session-login`

Web login sends:

```json
{
  "client_type": "web",
  "client_address": "<wallet>",
  "client_signature": "<wallet signature over signable_message>",
  "server_signature": "<server_signature from session-nonce>",
  "role": "<optional profile id>"
}
```

The backend returns `access_token`, `access_token_expires_at`, `address`, `role`, and `client_type`, and sets the HttpOnly compatibility `6529_session` cookie plus an address-scoped session cookie. The frontend never reads either cookie.

### POST `/api/auth/session-refresh`

Web refresh sends cookies and this body:

```json
{
  "client_type": "web",
  "client_address": "<active wallet>"
}
```

Browser fetch calls must use `credentials: "include"` and axios calls must use `withCredentials: true`. Current web clients include `client_address` so the backend refreshes the matching address-scoped cookie first and falls back to the compatibility cookie only when it belongs to that address. The frontend continues using the returned access token and does not try to read the HttpOnly cookie.

### POST `/api/auth/session-logout`

Web logout sends cookies and:

```json
{
  "client_type": "web",
  "client_address": "<active wallet>",
  "all_sessions": false
}
```

`all_sessions=true` revokes all wallet auth sessions for the verified target address. Supplying `client_address` prevents logout from revoking whichever account last wrote the compatibility cookie.

## Native And Desktop Session Flow

Native callers use the same endpoints with `client_type: "native"`.
Desktop callers use the same endpoints with `client_type: "desktop"`.

Native nonce requests:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=native&chain_id=1
```

Desktop nonce requests:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=desktop&chain_id=1
```

Native and desktop login send `client_type`, `client_address`,
`client_signature`, `server_signature`, and optional `role`. The response
includes `native_refresh_token` and `refresh_token_expires_at`.

Native refresh sends:

```json
{
  "client_type": "native",
  "client_address": "<wallet>",
  "native_refresh_token": "<current native refresh token>"
}
```

Desktop refresh sends the same shape with `client_type: "desktop"`.
Native and desktop refresh rotate `native_refresh_token`; clients must replace
the stored token and must not reuse the previous token.

Native logout sends:

```json
{
  "client_type": "native",
  "client_address": "<wallet>",
  "native_refresh_token": "<current native refresh token>",
  "all_sessions": false
}
```

Desktop logout sends the same shape with `client_type: "desktop"`.
Native and desktop refresh tokens are stored only in secure OS-backed storage.

## Connection Sharing

Connection sharing creates an additional session from an authenticated web session. It does not transfer, move, or disconnect the original session.

Mobile/native and desktop connection sharing use session-v2 one-time codes.

### POST `/api/auth/connection-share`

The caller must send bearer access-token auth. The request body is:

```json
{
  "target_client_type": "native"
}
```

Desktop clients use `"target_client_type": "desktop"`.

The optional `role` field is accepted only when it matches the authenticated
session role. The web frontend normally omits it and lets the backend bind the
share to the authenticated role.

The response is:

```json
{
  "connection_share_code": "...",
  "expires_at": "...",
  "address": "...",
  "role": null,
  "target_client_type": "native",
  "deep_link_path": "/accept-connection-sharing?connection_share_code=...&address=..."
}
```

The frontend uses `connection_share_code` and `address` from `deep_link_path` or
the query string. It must not use the obsolete transfer-code query name.

### POST `/api/auth/connection-share/redeem`

The native client redeems:

```json
{
  "target_client_type": "native",
  "connection_share_code": "<code>"
}
```

Desktop clients redeem the same shape with `"target_client_type": "desktop"`.
The response is a refresh-token session response. The client persists the
returned `native_refresh_token` in secure storage and then uses the matching
native or desktop session-v2 refresh flow.

Connection-share codes are short-lived, one-time use, and consumed atomically by the backend. Disabled-backend responses should be handled as a clean feature-unavailable state.

### POST `/api/auth/connection-share/legacy-desktop`

Older 6529 Desktop builds used this legacy auth endpoint during the session-v2
rollout. New Desktop builds should use the session-v2 `desktop` client type and
connection sharing target.

The caller must send bearer access-token auth and session-v2 web cookies. The
request body is empty in normal frontend usage:

```json
{}
```

The response is:

```json
{
  "refresh_token": "...",
  "address": "...",
  "role": null,
  "deep_link_path": "/accept-connection-sharing?token=...&address=..."
}
```

The frontend builds a `core6529://navigate/accept-connection-sharing?...` link
from `deep_link_path`. Desktop redeems the legacy `token` with
`/api/auth/redeem-refresh-token` and continues using the legacy refresh flow.
This bridge must stay enabled until a separate Desktop v2 auth release is ready.

## Origin Behavior

- Browser code must not manually set the `Origin` header.
- The backend derives web domain and client origin from the browser request.
- First-party web origins must be allowed by backend configuration.
- Production web is expected to call `https://api.6529.io` directly from `https://6529.io`; staging similarly calls `https://api.staging.6529.io` from `https://staging.6529.io`.
- The frontend sends session-v2 cookie credentials to the configured `API_ENDPOINT`; it does not maintain a second credential-origin list.
- The backend enforces exact credentialed CORS for first-party web origins through `WEB_APP_ORIGIN`, `WEB_APP_ADDITIONAL_ORIGINS`, host-based defaults, and the deprecated `AUTH_WEB_CREDENTIAL_ORIGINS` compatibility alias.
- Web refresh/logout remain bound to the same origin that created the session.

Required rollout values:

- Production frontend: `API_ENDPOINT=https://api.6529.io`.
- Production backend: `WEB_APP_ORIGIN=https://6529.io` is recommended but not required because `api.6529.io` defaults to `https://6529.io`.
- Staging frontend: `API_ENDPOINT=https://api.staging.6529.io`.
- Staging backend: `WEB_APP_ORIGIN=https://staging.6529.io` is recommended but not required because `api.staging.6529.io` defaults to `https://staging.6529.io`.

## Security Requirements

- Never log raw refresh tokens, native refresh tokens, browser session IDs, connection-share codes, client signatures, or access JWTs.
- Store only hashed long-lived server-side secrets.
- Token and code creation must use cryptographically secure randomness.
- Rate-limit login, refresh, logout, connection-share creation, and connection-share redemption.
- Return generic authentication errors to clients.

## Acceptance Criteria

- Frontend auth uses `/auth/session-nonce`, `/auth/session-login`, `/auth/session-refresh`, and `/auth/session-logout`.
- Frontend auth does not call legacy wallet nonce, login, or refresh-token redemption endpoints.
- `signable_message` is signed exactly as returned.
- Web refresh/logout include credentials and the active `client_address`.
- Native refresh token rotation updates secure storage.
- Connection sharing uses `/auth/connection-share`, `/auth/connection-share/redeem`, and `connection_share_code`.
- Desktop connection sharing uses the session-v2 `desktop` client type. Older
  Desktop builds may continue to use `/auth/connection-share/legacy-desktop`
  only for compatibility.
- Frontend auth does not use legacy wallet nonce/login/refresh-token redemption
  for normal web or native auth. The `/auth/redeem-refresh-token` exception is
  limited to accepting legacy Desktop connection-sharing links.
