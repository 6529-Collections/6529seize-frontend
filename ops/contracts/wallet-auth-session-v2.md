# Wallet Auth Session V2 Contract

Status: draft contract
Owner: 6529 frontend and backend
Created: 2026-06-09

## Goals

- Keep long-lived web and mobile sessions.
- Stop putting refresh tokens in URLs, QR codes, browser history, logs, and JS-readable web storage.
- Support web-to-mobile authentication by transferring authority with a short-lived one-time code.
- Keep legacy wallet auth available during rollout behind explicit flags.
- Provide structured, purpose-bound wallet signatures for login and high-risk actions.
- Remove WebSocket bearer tokens from query strings.

## Non-Goals

- Do not remove wallet-based authentication.
- Do not shorten mobile session lifetime below product requirements.
- Do not require mobile users to reconnect daily.
- Do not break existing clients during the rollout window.

## Rollout Flags

Backend flags:

- `AUTH_SESSION_V2_ENABLED`: enables v2 session endpoints.
- `AUTH_TRANSFER_CODES_ENABLED`: enables web-to-mobile transfer-code issuance and redemption.
- `AUTH_LEGACY_REFRESH_ENABLED`: keeps `/auth/redeem-refresh-token` working during migration.
- `AUTH_LEGACY_WS_QUERY_TOKEN_ENABLED`: keeps WebSocket `?token=` fallback during migration.
- `AUTH_STRUCTURED_SIGNATURES_REQUIRED`: rejects legacy unstructured signatures after rollout.

Frontend flags:

- `AUTH_SESSION_V2_ENABLED`: enables v2 browser/native auth flows.
- `AUTH_TRANSFER_CODES_ENABLED`: uses transfer-code QR/deep links.
- `AUTH_LEGACY_REFRESH_ENABLED`: allows old localStorage refresh-token fallback until migration is complete.
- `AUTH_STRUCTURED_SIGNATURES_ENABLED`: uses structured message builders for login and actions.

All flags default to legacy-safe behavior until explicitly enabled in the target environment.

## Storage Model

### Browser Web

- The browser receives an opaque server-side session cookie named `6529_session`.
- `6529_session` is `HttpOnly`, `Secure`, `SameSite=Lax`, and scoped to the API host.
- Browser JS does not read or write refresh tokens.
- Browser JS may hold short-lived access JWTs in memory.
- During compatibility rollout only, the existing `wallet-auth` JS-readable cookie may continue to mirror the access JWT.
- Browser localStorage must not store v2 refresh tokens.
- Cookie-based web sessions are for first-party or explicitly registered browser origins. Unknown third-party browser frontends must not depend on these cookies because credentialed CORS requires an explicit allowed origin and cannot use wildcard `Access-Control-Allow-Origin: *`.

### Native Mobile

- Native clients receive a separate `native_refresh_token`.
- Native refresh tokens are stored only in Capacitor secure storage or equivalent OS keychain/keystore storage.
- Native refresh tokens are opaque bearer secrets.
- The server stores only hashes of native refresh tokens.
- Refresh redemption rotates the native refresh token and invalidates the previous token.

## Session Endpoints

The OpenAPI wire contract lives next to this file in `wallet-auth-session-v2.openapi.yaml`.

### POST `/api/auth/session-login`

Authenticates a wallet signature and starts a browser or native session.

Request highlights:

- `client_type`: `web` or `native`
- `client_address`: wallet address being authenticated
- `server_signature`: server-signed nonce or structured challenge token
- `client_signature`: wallet signature
- `role`: optional profile/proxy role
- `wallet_kind_hint`: optional `eoa`, `contract`, or `unknown`; this is only a hint

Response:

- Always returns a short-lived `access_token`.
- For `web`, sets `6529_session` and does not return a refresh token.
- For `native`, returns a rotated `native_refresh_token`.
- V2 session login requires a structured authentication challenge: `web` requires `Session Type: first_party_web`, and `native` requires `Session Type: native`.
- `Session Type: external_client` uses non-cookie bearer-token/API-client auth and must not create a v2 wallet session.

### POST `/api/auth/session-refresh`

Refreshes access.

- Web clients send credentials with the `6529_session` cookie.
- Native clients send `client_type=native`, `client_address`, and `native_refresh_token`.
- Native redemption rotates `native_refresh_token`.
- Web refresh may rotate the server-side browser session id.

### POST `/api/auth/session-logout`

Revokes the current session.

- Web revocation clears `6529_session`.
- Native revocation invalidates the supplied native refresh token.
- `all_sessions=true` revokes all sessions for the authenticated wallet/profile when supported.

### POST `/api/auth/connection-transfer`

Creates a short-lived web-to-mobile transfer code.

Requirements:

- Caller must be authenticated with a v2 browser session or a valid legacy JWT during migration.
- Server creates a random one-time code with at least 128 bits of entropy.
- Server stores only a hash of the transfer code.
- Transfer code expires within 5 minutes.
- Transfer code is consumed exactly once.
- Transfer code is bound to wallet address, role, and intended target client.

Response:

- `transfer_code`
- `expires_at`
- `address`
- `target_client_type`
- `role` (optional; string or null)
- `deep_link_path`

The QR/deep link may contain `transfer_code`, `address`, and `role`. It must never contain refresh tokens or access tokens.

### POST `/api/auth/connection-transfer/redeem`

Redeems a transfer code on the target device.

Requirements:

- Validates code hash, expiry, target client, and single-use status.
- Consumes the transfer code before returning session material.
- Issues a new native refresh token distinct from the browser session and any legacy refresh token.

Response:

- `access_token`
- `access_token_expires_at`
- `native_refresh_token`
- `refresh_token_expires_at`
- `address`
- `role` (optional; string or null)

## Structured Signature Contract

Structured signatures are versioned text messages. EIP-712 may be introduced later, but v2 starts with wallet-compatible `personal_sign` text because the existing wallet matrix already supports it.

Every signed message must include:

- `6529 Authentication` or `6529 Action`
- `Version: 2`
- `Audience: <expected API host>`
- `Domain: <signing client host>`
- `Client Origin: <signing client origin>` when a browser or native runtime has a stable origin
- `Session Type: <first_party_web | external_client | native>` for authentication messages
- `Wallet: <0x address>`
- `Chain ID: <chain id or 1>`
- `Issued At: <ISO timestamp>`
- `Expiration Time: <ISO timestamp>`
- `Nonce: <server nonce>`
- `Action: <login | create_drop | add_rememe | nextgen_admin | ...>`
- `Payload Hash: <sha256 canonical payload hash>` when action data exists
- Human-readable purpose text

Backend verification:

- Reconstructs or parses the structured message.
- Verifies API audience, expiry, nonce uniqueness, address, role rules, and payload hash.
- Enforces the frontend domain allowlist only for `Session Type: first_party_web`.
- Treats `external_client` and `native` as audience-based flows; community clients and server integrations do not need domain registration for baseline structured-signature auth.
- Allows `/auth/session-login` only for `first_party_web` web sessions and `native` native sessions; `external_client` uses non-cookie auth.
- When a browser request supplies `client_origin`, it must match the request `Origin` header if both are present.
- EOAs verify by recovered signer.
- Contract wallets verify with EIP-1271 against the signing address.
- `wallet_kind_hint` and frontend Safe detection are never authority.

Legacy signatures remain accepted only while `AUTH_STRUCTURED_SIGNATURES_REQUIRED=false`.
During rollout, action endpoints that previously accepted only `signature` must also
accept request-only `signature_message` so the backend can verify the exact text
the wallet signed. Servers must not persist `signature_message`.

External integration model:

- `Audience: api.6529.io` binds signatures to the 6529 API, not to a registry of client domains.
- Client IDs or registered domains may be added later for higher-trust features, quotas, analytics, or abuse controls, but they are not required for baseline community integrations.
- Server-side integrations may omit `Client Origin` when there is no browser origin.
- Audience-based structured signatures do not make cookie-based v2 web sessions available to arbitrary browser origins.
- Unknown community browser frontends use non-cookie bearer-token/API-client auth through `/auth/login` or dedicated API-client auth.
- Cookie-based v2 web sessions are only for first-party web or browser integrations whose origins are explicitly registered for credentialed CORS.
- If structured signatures are required, external integrations use this audience-based structured message with non-cookie bearer/API-client auth; domain registration remains only a cookie-session/CORS trust boundary.

## WebSocket Auth Contract

Frontend must not append access tokens as `?token=`.

V2 client flow:

1. Open the WebSocket URL without token query parameters.
2. Immediately send:

```json
{
  "type": "AUTHENTICATE",
  "access_token": "<short-lived access jwt>"
}
```

3. Server validates the access token and upgrades the connection identity.
4. Server responds:

```json
{
  "type": "AUTHENTICATED",
  "identity_id": "<profile id or anonymous id>",
  "expires_at": "2026-06-09T00:00:00.000Z"
}
```

5. If authentication fails, server responds with `AUTHENTICATION_FAILED` and leaves the socket anonymous or closes it according to backend policy.

Legacy `?token=` support remains behind `AUTH_LEGACY_WS_QUERY_TOKEN_ENABLED` only.

## Backward Compatibility

- Existing `/auth/nonce`, `/auth/login`, and `/auth/redeem-refresh-token` continue during migration.
- Existing localStorage account records are read only for legacy migration.
- When v2 succeeds, frontend removes legacy refresh tokens for that account from web localStorage.
- Native clients may migrate legacy refresh tokens into secure storage only after successful v2 refresh or transfer-code redemption.
- Server must not invalidate all legacy refresh tokens until the rollout is complete.

## Security Requirements

- Never log raw refresh tokens, native refresh tokens, browser session IDs, transfer codes, client signatures, or access JWTs.
- Store only hashed long-lived server-side secrets.
- Use constant-time comparison for token hash checks where practical.
- Token and code creation must use cryptographically secure randomness.
- Transfer-code redemption must be atomic to prevent double-spend races.
- Rate-limit login, refresh, transfer-code creation, and transfer-code redemption.
- Return generic authentication errors to clients.

## Acceptance Criteria

- Web-to-mobile QR/deep links contain no bearer session secret.
- Browser web can stay logged in with HttpOnly session cookies.
- Native mobile can stay logged in with secure-storage refresh tokens.
- Access JWT refresh works after access-token expiry.
- Logout revokes the active browser or native session.
- WebSocket auth no longer requires token query parameters.
- Safe wallets work through EIP-1271 verification without trusting client metadata.
- Legacy clients still work while rollout flags allow them.
