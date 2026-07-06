# API Authentication

## Overview

`/tools/api/authentication` is the external-client authentication guide for the
6529 REST API.

- It explains session-v2 wallet authentication for scripts, services, and other
  external clients.
- It documents the native/script flow:
  `session-nonce -> sign -> session-login -> bearer access_token`.
- It covers refresh and logout for long-running native/script clients.
- It names legacy auth endpoints as compatibility endpoints, not the preferred
  path for new integrations.
- It intentionally avoids first-party app flows that are not useful for normal
  external API clients.

## Location in the Site

- Route: `/tools/api/authentication`
- Parent route: `/tools/api`
- Linked from `/tools/api`
- Linked from `/about/tech/wallet-authentication` for builders

## Entry Points

- Open the `V2 API authentication` callout on `/tools/api`.
- Open the full-guide link in the `/tools/api` authentication quickstart.
- Open the builder-facing link on `/about/tech/wallet-authentication`.
- Open `/tools/api/authentication` directly.

## User Journey

1. Open `/tools/api/authentication`.
2. Confirm that new external clients should use session-v2 auth and
   `client_type=native`.
3. Follow the login flow:
   `GET /api/auth/session-nonce`, sign `signable_message`, then
   `POST /api/auth/session-login`.
4. Use the returned `access_token` as
   `Authorization: Bearer <access_token>`.
5. For long-running clients, store the returned `native_refresh_token` securely.
6. Refresh through `POST /api/auth/session-refresh` and replace the stored
   native refresh token after every successful refresh.
7. Logout through `POST /api/auth/session-logout` when the client should revoke
   the current native/script session.
8. Follow the full API reference for endpoint-level request and response
   schemas beyond the examples on the page.

## Page Structure and Behavior

- The page is static content. It does not execute API calls.
- It has sections for:
  - what auth flow to use
  - login flow
  - refresh and logout
  - browser-client caveat
  - security rules
  - Node.js login, refresh, and logout example
  - related links
- It includes one copyable Node.js session snippet covering login,
  bearer-token usage, refresh, and logout.

## External Client Login Flow

1. Request a native session nonce:
   - `GET https://api.6529.io/api/auth/session-nonce?signer_address=<address>&client_type=native&chain_id=1`
2. Read `signable_message` and `server_signature`.
3. Sign `signable_message` exactly with the wallet that owns
   `signer_address`.
4. Login:
   - `POST https://api.6529.io/api/auth/session-login`
   - Body: `client_type`, `client_address`, `client_signature`,
     `server_signature`, and optional `role`.
5. Use `access_token` for protected API calls.

### Refresh and Logout

- Native/script login returns `native_refresh_token` and
  `refresh_token_expires_at`.
- Refresh sends `client_type=native`, `client_address`, and the current
  `native_refresh_token` to `POST /api/auth/session-refresh`.
- A successful refresh rotates the native refresh token. Clients must persist
  the new token and stop using the old one.
- Logout sends `client_type=native`, `client_address`, the current
  `native_refresh_token`, and `all_sessions=false` to
  `POST /api/auth/session-logout`.
- Use `all_sessions=true` only when the user intends to revoke every session for
  that wallet.

## Security Notes

- Sign only `signable_message` exactly as returned.
- Do not trim, normalize, rebuild, JSON-stringify, or sign a `nonce` field.
- Do not log private keys, access tokens, refresh tokens, signatures, or raw
  authentication responses.
- Store refresh tokens in an environment-appropriate secret store.
- Check response status before trusting response JSON.
- Treat authentication errors as requiring a clean refresh, new signature, or
  re-login.

## Legacy Compatibility

The older `GET /api/auth/nonce`, `POST /api/auth/login`, and
`POST /api/auth/redeem-refresh-token` endpoints remain compatibility endpoints
for older clients. New external integrations should start on session-v2
endpoints instead.

## Common Scenarios

- Build a command-line script that signs with a wallet and calls protected API
  endpoints.
- Maintain a service that needs to refresh an API session without asking the
  wallet owner to sign on every run.
- Confirm whether an older integration should move away from legacy nonce/login
  endpoints.
- Review security constraints before storing bearer and refresh credentials.

## Edge Cases

- The page does not confirm live API health, account permissions, or wallet
  ownership.
- The page does not include a browser-auth implementation. First-party browser
  sessions use HttpOnly cookies, credentialed requests, and origin checks.
- A role can be sent during login only when the backend recognizes that wallet
  as authorized for the requested profile role.
- Refresh can fail if the refresh token is expired, already rotated, revoked,
  mismatched to the wallet address, or otherwise invalid.

## Failure and Recovery

- If nonce creation fails, retry after checking API availability and request
  parameters.
- If the user rejects signing, stop and ask them to retry the login flow.
- If login fails after signing, request a fresh session nonce before retrying.
- If refresh fails, discard the stale refresh token and perform a fresh login.
- If logout succeeds, remove local bearer and refresh credentials for that
  session.

## Limitations / Notes

- Examples are Node.js-oriented and use `client_type=native`.
- The examples include placeholders for wallet address and private key handling.
- Production clients should use wallet and secret-management practices suitable
  for their environment.
- Use the external API reference for complete endpoint schemas.

## Related Pages

- [API Tool Index](README.md)
- [API Authentication and Media Drop Flow](feature-api-authentication-and-media-drop-flow.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Docs Home](../README.md)
