# Wallet Auth Session V2 Contract

Status: implementation contract
Owner: 6529 frontend and backend
Updated: 2026-06-17

## Goals

- Use the backend session-v2 wallet auth flow for first-party web and native clients.
- Stop using legacy nonce/login/refresh-token auth in the frontend auth flow.
- Keep web refresh state in the backend-owned HttpOnly `6529_session` cookie.
- Keep native refresh state in secure storage and rotate it on every refresh.
- Support connection sharing from an authenticated web session to a native client with a short-lived one-time code.
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

The backend returns `access_token`, `access_token_expires_at`, `address`, `role`, and `client_type`, and sets the HttpOnly `6529_session` cookie.

### POST `/api/auth/session-refresh`

Web refresh sends cookies and this body:

```json
{
  "client_type": "web"
}
```

Browser fetch calls must use `credentials: "include"` and axios calls must use `withCredentials: true`. The frontend continues using the returned access token and does not try to read the HttpOnly cookie.

### POST `/api/auth/session-logout`

Web logout sends cookies and:

```json
{
  "client_type": "web",
  "all_sessions": false
}
```

`all_sessions=true` revokes all wallet auth sessions for the address when the backend supports that scope.

## Native Session Flow

Native callers use the same endpoints with `client_type: "native"`.

Native nonce requests:

```text
/api/auth/session-nonce?signer_address=<wallet>&client_type=native&chain_id=1
```

Native login sends `client_type`, `client_address`, `client_signature`, `server_signature`, and optional `role`. The response includes `native_refresh_token` and `refresh_token_expires_at`.

Native refresh sends:

```json
{
  "client_type": "native",
  "client_address": "<wallet>",
  "native_refresh_token": "<current native refresh token>"
}
```

Native refresh rotates `native_refresh_token`; clients must replace the stored token and must not reuse the previous token.

Native logout sends:

```json
{
  "client_type": "native",
  "client_address": "<wallet>",
  "native_refresh_token": "<current native refresh token>",
  "all_sessions": false
}
```

Native refresh tokens are stored only in secure OS-backed storage.

## Connection Sharing

Connection sharing creates an additional native session from an authenticated web session. It does not transfer, move, or disconnect the original session.

### POST `/api/auth/connection-share`

The caller must send bearer access-token auth. The request body is:

```json
{
  "target_client_type": "native"
}
```

The response is:

```json
{
  "connection_share_code": "...",
  "expires_at": "...",
  "address": "...",
  "role": null,
  "target_client_type": "native",
  "deep_link_path": "/accept-connection-sharing?connection_share_code=..."
}
```

The frontend uses `connection_share_code` from `deep_link_path` or the query string. It must not use the obsolete transfer-code query name.

### POST `/api/auth/connection-share/redeem`

The native client redeems:

```json
{
  "target_client_type": "native",
  "connection_share_code": "<code>"
}
```

The response is a native session response. The native client persists the returned `native_refresh_token` in secure storage and then uses the native session-v2 refresh flow.

Connection-share codes are short-lived, one-time use, and consumed atomically by the backend. Disabled-backend responses should be handled as a clean feature-unavailable state.

## Origin Behavior

- Browser code must not manually set the `Origin` header.
- The backend derives web domain and client origin from the browser request.
- First-party web origins must be allowed by backend configuration.
- Web refresh/logout remain bound to the same origin that created the session.

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
- Web refresh/logout include credentials.
- Native refresh token rotation updates secure storage.
- Connection sharing uses `/auth/connection-share`, `/auth/connection-share/redeem`, and `connection_share_code`.
- Frontend contains no active obsolete connection sharing predecessor flow.
