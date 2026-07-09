# Wallet Auth Session V2 Implementation Notes

Status: frontend implementation guide
Date: 2026-06-17
Audience: 6529 frontend and backend developers

## Purpose

This document records the current frontend wallet-auth structure after the session-v2 migration. It intentionally documents the implemented first-party web and native flows, not a rollout fallback plan.

## Final Decision

The frontend auth flow uses backend session-v2 endpoints for normal web and
native auth:

- `GET /api/auth/session-nonce`
- `POST /api/auth/session-login`
- `POST /api/auth/session-refresh`
- `POST /api/auth/session-logout`

Normal frontend auth does not use the legacy wallet-auth nonce, login, or
refresh-token redemption endpoints.

The temporary exception is 6529 Desktop connection sharing. Desktop remains on
legacy auth during this rollout, so the web frontend can create or reuse a
legacy refresh-token handoff only for the Desktop connection target.

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

### Frontend Refresh Telemetry

The frontend records privacy-safe Sentry logger events named
`auth_session_refresh` around `/api/auth/session-refresh` attempts. Use these
events to separate expected expiration and frontend control-flow noise from
real disruption.

Useful fields:

- `source=refreshSessionV2`
- `refresh_source=refreshSessionV2`
- `client_type=web|native|desktop`
- `refresh_client_type=web|native|desktop`
- `refresh_result=started|success|unauthorized|aborted|network_error|backend_error|cooldown_used_empty|cooldown_used_retry|deduped_in_flight`
- `refresh_status_bucket=not_applicable|aborted|network_error|http_401|http_4xx|http_5xx|http_other`
- `refresh_status_code`, when a backend HTTP status is known
- `refresh_duration_bucket_ms`, on terminal backend request outcomes after `started`
- `auth_refresh_outcome=started|success|unauthorized|aborted|network_error|backend_error|cooldown_used_empty|cooldown_used_retry|deduped_in_flight`
- `outcome`, `status_code`, and `duration_bucket_ms`, kept for compatibility
  with older query examples

`unauthorized` includes backend 401 responses and native refresh attempts that
cannot find a local native refresh token. The latter has no `status_code`.
Prefer the `refresh_*` fields in new Sentry Logs queries because the legacy
`auth_refresh_outcome` field name can match sensitive-key scrub rules. Saved
Sentry Logs URLs must put the search expression in `logsQuery=...`; `query=...`
does not restore the Logs search correctly.

Example Sentry log queries:

```text
message:"auth_session_refresh" refresh_result:unauthorized refresh_client_type:web
message:"auth_session_refresh" refresh_result:aborted
message:"auth_session_refresh" refresh_result:network_error OR refresh_result:backend_error
message:"auth_session_refresh" refresh_status_bucket:http_401 OR refresh_status_bucket:http_5xx
message:"auth_session_refresh" refresh_result:cooldown_used_empty OR refresh_result:cooldown_used_retry OR refresh_result:deduped_in_flight
```

These events intentionally do not include wallet addresses, JWTs, cookies,
refresh tokens, native refresh tokens, request bodies, profile ids, or raw error
objects/messages.

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

The feature is connection sharing, not transfer. It creates an additional
session and does not move or disconnect the original web session.

Mobile/native connection sharing uses session-v2 one-time codes.

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

### 6529 Desktop Compatibility

6529 Desktop remains on legacy auth during this rollout. The `6529 Desktop`
connection target uses a legacy refresh-token link:

```text
core6529://navigate/accept-connection-sharing?token=...&address=...
```

If the active web account still has a stored legacy refresh token, the frontend
uses it directly for the Desktop link. If the active account is v2-only, the
frontend calls:

```text
POST /api/auth/connection-share/legacy-desktop
```

The backend requires bearer auth and the matching active session-v2 web cookie,
then returns a legacy Desktop `deep_link_path`. Desktop accepts the link through
its existing `/auth/redeem-refresh-token` path. This compatibility path should
be removed only after Desktop ships a v2 auth receiver.

## Frontend Configuration

The frontend no longer gates this implementation behind session-v2, legacy-refresh, or structured-signature rollout flags. Backend settings from `/api/settings.auth` decide when legacy v1 sessions should prompt for migration, and backend environment controls still decide which origins are allowed, whether connection sharing is explicitly disabled server-side, and when structured signatures become mandatory.

## Reviewer Checklist

- Session login requests `ApiSessionNonceResponse.signable_message` and never `nonce`.
- Session nonce calls do not send `structured_signature`, `domain`, `client_origin`, or `session_type`.
- Web refresh/logout requests include cookies and the active `client_address`.
- Native refresh token rotation updates secure storage.
- Connection sharing uses `/auth/connection-share`, `/auth/connection-share/redeem`, and `connection_share_code`.
- Desktop connection sharing remains on the legacy refresh-token handoff while
  Desktop remains on legacy auth.
- Active frontend auth code has no legacy nonce/login/refresh-token redemption
  for normal web or native auth. Legacy refresh-token redemption is retained
  only for accepting Desktop connection-sharing links.
