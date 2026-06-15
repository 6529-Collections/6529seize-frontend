# Wallet Auth Final Structure And Merge Rationale

Status: reviewer guide for frontend PR #2556 and backend PR #1616
Date: 2026-06-15
Audience: 6529 frontend and backend developers

## Purpose

This document explains the final wallet-auth structure after the latest frontend
and backend changes to the auth PRs.

It is meant to answer four questions:

1. What changed on the frontend and backend.
2. How the changes resolve the external integration concern.
3. What the final auth structure is.
4. Why these PRs are worth merging instead of staying on current `main`.

The short version:

- Structured wallet signatures are still the right security direction.
- Cookie-based wallet session v2 is not the right model for arbitrary unknown
  third-party browser frontends.
- The final PR split makes that explicit.
- First-party web and native app clients can use session v2.
- Unknown community clients and server-side integrations use structured
  signatures with non-cookie bearer-token auth.
- The frontend domain allowlist remains only a first-party web cookie-session
  trust boundary.
- Baseline community/API integrations do not need domain registration just to
  use structured-signature auth.

## PRs Covered

Frontend:

- Repository: `6529-Collections/6529seize-frontend`
- PR: #2556
- Branch: `codex/wallet-security-hardening`

Backend:

- Repository: `6529-Collections/6529seize-backend`
- PR: #1616
- Branch: `codex/wallet-security-hardening`

## The Concern We Needed To Resolve

The concern was that the new structured signing flow includes a `Domain` field
and the backend had a narrow allowed-domain set, primarily `6529.io` and
`app.6529.io`.

If that allowlist became mandatory for every structured signature, then unknown
external integrations could break.

That would create two practical problems:

1. Existing community-built integrations might fail without warning because we
   do not have a complete inventory of domains, backends, scripts, tools, and
   clients using 6529 auth.
2. Every future external integration would need a domain/client registration
   process before it could authenticate.

There was also a separate browser-platform issue:

- Cookie-based web session v2 relies on browser cookies.
- Cookies require credentialed CORS for third-party browser frontends.
- Credentialed CORS cannot safely use wildcard origins.
- Therefore unknown third-party browser frontends cannot be treated like
  first-party web clients unless we explicitly register and allow their origins.

So the right answer was not "make the domain allowlist bigger".

The right answer was to split two concepts that had been accidentally coupled:

1. Structured signatures as a universal signing/security format.
2. Cookie-based first-party web sessions as a narrower browser session model.

## Final Decision

The final model is:

- All structured signatures bind to an API audience, normally `api.6529.io`.
- `Domain` remains in the signed message as useful context.
- The backend enforces the frontend domain allowlist only for
  `Session Type: first_party_web`.
- `/auth/session-login` creates session-v2 sessions only for:
  - `first_party_web` web clients
  - `native` native clients
- `/auth/session-login` does not create cookie sessions for
  `external_client`.
- External clients use `/auth/login` with structured signatures and receive
  bearer-token auth, not cookie session-v2 auth.
- Native app auth uses session v2, but with native refresh tokens stored in
  secure storage, not browser cookies.

This is not a temporary migration state. This is the intended final split.

## What Changed On The Frontend

### 1. Structured Signature Messages Now Carry API Audience

The frontend structured-message builder includes:

- `Version: 2`
- `Audience: <api host>`
- `Domain: <signing client host>`
- optional `Client Origin: <origin>`
- optional `Session Type: <first_party_web | external_client | native>`
- `Wallet`
- `Chain ID`
- `Issued At`
- `Expiration Time`
- `Nonce`
- `Action`
- optional `Payload Hash`
- `Purpose`

The important new field for the integration question is `Audience`.

The audience binds the signature to the 6529 API, not to a frontend domain
registry. That means an external integration can sign for:

```text
Audience: api.6529.io
Session Type: external_client
```

without needing to pretend it is `app.6529.io`.

### 2. The Frontend Classifies Auth Session Type

The frontend now derives a structured auth session type before login:

- Native runtime: `native`
- Localhost / `127.0.0.1`: `external_client`
- Electron-like runtime: `external_client`
- Normal deployed web app: `first_party_web`

The core rule in the frontend is:

```text
Use session-v2 login only when:
  AUTH_SESSION_V2_ENABLED is true
  AUTH_STRUCTURED_SIGNATURES_ENABLED is true
  session_type is not external_client
```

So:

- `first_party_web` uses `/auth/session-login`.
- `native` uses `/auth/session-login`.
- `external_client` uses `/auth/login`.

This matters because `localhost` and other unknown clients should not be forced
into a cookie-session/CORS model.

### 3. `/auth/nonce` Requests Include Structured Auth Context

When structured signatures are enabled, the frontend passes additional query
params to `/auth/nonce`:

- `structured_signature=true`
- `audience=<api host>`
- `domain=<client host>`
- `client_origin=<client origin>`, when available
- `session_type=<first_party_web | external_client | native>`
- `chain_id=1`

The server then puts those values into the message that the wallet signs.

This gives the backend the context needed to verify the signature without
guessing what kind of client initiated auth.

### 4. External Clients Fall Back To Bearer Auth

When the computed session type is `external_client`, the frontend does not call
`/auth/session-login`.

It still requests a structured nonce and still signs the structured message, but
it submits the result to `/auth/login`.

That gives the client the existing token response:

- access token
- refresh token

This preserves compatibility for community tools and integrations that are not
first-party cookie-session clients.

### 5. First-Party Web Session V2 Remains Single-Profile

Cookie-based web session v2 represents one web session cookie. That cookie is
not a good fit for simultaneously storing multiple active authenticated
profiles in the same browser session.

The frontend therefore blocks adding a second profile when the current login
path is first-party web session v2.

It does not apply that same restriction to `external_client` bearer-token auth,
where the existing multi-account storage model still applies.

### 6. Session Login Request Contract Was Tightened

The frontend session-v2 login request now sends:

- `client_type`
- `server_signature`
- `client_signature`
- `client_address`
- optional `role`
- `wallet_kind_hint`
- `signature_version: 2`

The frontend no longer sends `is_safe_wallet` to `/auth/session-login`.

That field was a legacy auth hint and is not the authority model for session v2.
The remaining `wallet_kind_hint` is explicitly only a hint. The backend still
does the real wallet-signature verification.

### 7. Frontend Contract Docs And Tests Were Updated

The frontend contract docs now explain:

- audience-based structured signatures
- first-party web cookie-session constraints
- external-client bearer-token auth
- native session-v2 auth
- the session-login request shape

Relevant tests cover:

- first-party web uses session v2 when enabled
- native uses session v2 when enabled
- localhost/external clients use non-cookie `/auth/login`
- first-party web session v2 blocks second account addition
- session-login sends `signature_version: 2`
- session-login no longer sends `is_safe_wallet`

## What Changed On The Backend

### 1. Structured Signature Verification Now Separates Audience And Domain

The backend parser/verifier understands:

- `Audience`
- `Domain`
- `Client Origin`
- `Session Type`

Audience validation answers:

```text
Is this signature intended for the 6529 API?
```

Domain validation answers:

```text
Is this first-party web cookie-session client one of the domains allowed to
receive first-party web session behavior?
```

Those are different security checks.

Before this final split, there was a risk that the domain check would be
applied too broadly. After the change, domain allowlist enforcement is scoped
to `first_party_web`.

### 2. Allowed Audience Is The Main API Boundary

The backend has a default structured-signature audience of:

```text
api.6529.io
```

Local development audiences are also allowed for local testing.

The audience is the stable verifier for API-bound structured signatures. It is
what allows external clients to authenticate safely without being in the
first-party frontend domain list.

### 3. Domain Allowlist Applies Only To `first_party_web`

The backend structured-signature verifier accepts a `requireAllowedDomain`
option.

For auth messages, that is now set based on session type:

```text
requireAllowedDomain = parsedMessage.sessionType === "first_party_web"
```

That means:

- `first_party_web` must use an allowed domain.
- `external_client` does not need allowed-domain registration.
- `native` does not need allowed-domain registration.

This directly resolves the community-integration concern.

### 4. `/auth/nonce` Builds Structured Challenges With Session Type

The backend `/auth/nonce` endpoint now accepts structured-signature query
fields:

- `structured_signature`
- `domain`
- `audience`
- `client_origin`
- `session_type`
- `chain_id`

For structured auth, it builds a signed challenge message that includes those
fields.

If no `session_type` is supplied, the backend defaults to `external_client`.
That default is intentional because it is the least surprising and least
privileged structured-auth mode.

It does not silently grant first-party cookie-session semantics.

### 5. `/auth/login` Accepts Structured External Auth

The existing `/auth/login` endpoint can now verify structured auth messages.

This is the compatibility path for:

- external browser frontends
- server-side integrations
- scripts
- bots
- tools that are not registered first-party web origins

Those integrations can use structured signatures with:

```text
Audience: api.6529.io
Session Type: external_client
```

and continue receiving bearer-token auth from `/auth/login`.

### 6. `/auth/session-login` Is Restricted To Session-V2 Clients

The backend now requires structured auth for `/auth/session-login`.

It also checks that the structured message session type matches the requested
session client type:

- `client_type=web` requires `Session Type: first_party_web`
- `client_type=native` requires `Session Type: native`

So `/auth/session-login` cannot be used with:

```text
Session Type: external_client
```

That is correct. External clients should not get first-party web cookies or
native refresh-token sessions.

### 7. Client Origin Is Checked Against Request Origin

When a structured nonce request includes `client_origin`, the backend validates
that it is a valid origin.

If the HTTP request has an `Origin` header and the structured request also
provides `client_origin`, they must match.

This prevents a browser client from asking the server to mint a challenge that
claims a different origin from the request that is actually being made.

### 8. Session Login Schema Was Tightened

The backend session-login request schema now:

- removes `is_safe_wallet`
- accepts `signature_version`, defaulting to `2`
- rejects unknown properties
- keeps `wallet_kind_hint` only as a hint

This aligns the generated API contract with the frontend request body.

### 9. OpenAPI And Generated Models Were Updated

Backend OpenAPI and generated models were regenerated/updated for:

- `AuthNonceStructuredQuery`
- `AuthNonceUnstructuredQuery`
- `AuthNonceQuery`
- `ApiSessionLoginRequest`
- generated serializer imports/exports

This matters because CI checks generated files and because frontend/backend
developers should see the same wire contract in generated code.

## How This Resolves The Original Concern

The original concern assumed that:

```text
structured signature requires domain allowlist
```

The final design changes that to:

```text
structured first-party web cookie session requires domain allowlist
structured external API auth requires API audience, not domain registration
```

That distinction is the whole fix.

### Before The Fix

A community-built frontend at:

```text
https://example-community-tool.xyz
```

could sign a structured message with:

```text
Domain: example-community-tool.xyz
```

If all structured signatures required the domain allowlist, the backend would
reject it unless we had pre-registered that domain.

That would break unknown integrations.

### After The Fix

The same community tool can use:

```text
Audience: api.6529.io
Domain: example-community-tool.xyz
Session Type: external_client
```

The backend verifies:

- the message is intended for `api.6529.io`
- the signature is valid for the wallet
- the nonce has not been replayed
- the message has not expired
- the action is `login`
- the chain and wallet fields match expectations

But it does not require `example-community-tool.xyz` to be in the
first-party web domain allowlist.

The tool receives bearer-token auth through `/auth/login`.

### What Still Requires Registration

If a third-party browser frontend wants first-party-style cookie sessions, it
still needs explicit backend support:

- credentialed CORS allowed origin
- cookie semantics that work for that browser context
- a trust decision that this origin can receive session-v2 browser behavior

That is not something wildcard CORS can safely solve.

So registration remains necessary only for browser-cookie session semantics,
not for baseline structured API auth.

## Final Structure

### Auth Client Categories

| Client category             | Session type      | Login endpoint        | Refresh model                          | Domain allowlist?    |
| --------------------------- | ----------------- | --------------------- | -------------------------------------- | -------------------- |
| 6529 first-party web        | `first_party_web` | `/auth/session-login` | HttpOnly `6529_session` cookie         | Yes                  |
| Native app                  | `native`          | `/auth/session-login` | Native refresh token in secure storage | No                   |
| Unknown browser integration | `external_client` | `/auth/login`         | Bearer/legacy refresh token model      | No                   |
| Server-side integration     | `external_client` | `/auth/login`         | Bearer/legacy refresh token model      | No                   |
| Localhost dev client        | `external_client` | `/auth/login`         | Bearer/legacy refresh token model      | No for external flow |

### Structured Authentication Message

Authentication messages look conceptually like:

```text
6529 Authentication
Version: 2
Audience: api.6529.io
Domain: app.6529.io
Client Origin: https://app.6529.io
Session Type: first_party_web
Wallet: 0x...
Chain ID: 1
Issued At: 2026-06-15T00:00:00.000Z
Expiration Time: 2026-06-15T00:05:00.000Z
Nonce: ...
Action: login
Purpose: Sign this message to authenticate with 6529.
```

For an external client, the important difference is:

```text
Session Type: external_client
```

For native:

```text
Session Type: native
```

### First-Party Web Flow

1. Frontend detects a first-party web context.
2. Frontend requests `/auth/nonce` with:
   - `structured_signature=true`
   - `audience=api.6529.io`
   - `domain=app.6529.io` or equivalent first-party host
   - `client_origin=https://app.6529.io`
   - `session_type=first_party_web`
3. Backend returns a server-signed structured challenge.
4. Wallet signs that exact message.
5. Frontend submits to `/auth/session-login`.
6. Backend verifies:
   - audience
   - domain allowlist
   - origin match
   - session type
   - nonce/expiry/action/wallet/chain
   - wallet signature
7. Backend creates a web session and sets `6529_session`.
8. Browser JS receives only short-lived access-token material, not a long-lived
   web refresh token.

### Native Flow

1. Frontend detects native runtime.
2. Frontend requests `/auth/nonce` with `session_type=native`.
3. Wallet/native signer signs the structured challenge.
4. Frontend submits to `/auth/session-login`.
5. Backend verifies structured auth with the `native` session type.
6. Backend creates a native session.
7. Native client receives a native refresh token.
8. Native client stores that refresh token in secure storage.
9. Refresh rotates native refresh tokens.

### External Client Flow

1. Client requests `/auth/nonce` with structured signing fields.
2. Client uses:
   - `Audience: api.6529.io`
   - `Session Type: external_client`
3. Wallet signs the structured challenge.
4. Client submits to `/auth/login`.
5. Backend verifies structured auth.
6. Backend does not require frontend domain registration.
7. Backend returns bearer-token auth.

### Action Signature Flow

Structured action signatures continue to bind high-risk actions to:

- action name
- wallet
- chain
- audience
- domain/client origin where applicable
- nonce
- expiry
- payload hash

Examples include:

- `create_drop`
- `add_rememe`
- `nextgen_admin`

The `Payload Hash` prevents a signature over one payload from being reused for
another payload.

### Safe / Contract Wallet Authority

The final model does not rely on frontend-provided Safe hints as authority.

Hints such as `wallet_kind_hint` can help the backend choose a path, but the
backend must verify the actual signature authority.

The backend signature verifier supports:

- EOA personal-sign recovery
- EIP-1271 verification for contract wallets

That means a client cannot become authoritative simply by setting a boolean
like `is_safe_wallet`.

## Why Not Just Keep Current Main?

Current `main` without these PRs keeps the older auth posture.

The old posture is easier to understand because it has fewer concepts, but it
has weaker security boundaries and worse long-term platform properties.

### 1. Current Main Does Not Bind Signatures To An API Audience

Legacy wallet auth signs a looser message.

It proves wallet control, but it does not cleanly encode:

- this signature is for the 6529 API
- this signature is for a specific auth/action purpose
- this signature is for a specific payload hash
- this signature expires soon
- this signature belongs to a specific session category

Structured signatures make those boundaries explicit.

That reduces replay and cross-context ambiguity.

### 2. Current Main Keeps Long-Lived Secrets More Exposed

Session v2 improves secret handling:

- first-party web gets HttpOnly cookie-backed server-side sessions
- browser JS does not need to hold a web refresh token for session v2
- native gets opaque refresh tokens stored in secure storage
- native refresh rotates
- transfer flows do not need to put refresh tokens in URLs or QR payloads

This is materially better than keeping long-lived bearer refresh material in
places browser JS, URLs, logs, or copied links can reach.

### 3. Current Main Does Not Have The Final External Integration Split

Without these final changes, there are two bad options:

1. Do not require structured signatures, and keep weaker legacy auth for longer.
2. Require structured signatures too broadly, and risk breaking unknown
   integrations because of the domain allowlist.

The final PRs give us the better third option:

```text
Require stronger structured signatures where appropriate,
without forcing all integrations into first-party cookie-session registration.
```

This lets 6529 improve auth security without closing the open integration
surface.

### 4. Current Main Blurs Cookie Sessions And API Auth

Cookie sessions are a browser session mechanism.

Bearer/API auth is an API integration mechanism.

Those should not be treated as the same product surface.

The final PRs draw the line:

- first-party web: cookie session
- native: native secure refresh session
- external/API: bearer-token auth

This is easier to reason about operationally and safer for future integrations.

### 5. Current Main Does Not Give Reviewers A Clear Contract

These PRs update:

- frontend contract docs
- backend OpenAPI
- generated backend models
- tests for each client category

That gives future frontend, backend, native, and community integration work a
specific contract to target.

Without that, the next auth change would likely reopen the same ambiguity.

## Why This Is Better Than A Registration-Only Model

A registration-only model would say:

```text
Every structured-signature client must be registered first.
```

That would be too strict for baseline 6529 ecosystem auth.

It would create:

- operational overhead for every new community integration
- unknown breakage for existing integrations
- a support queue before developers can experiment
- pressure to add wildcard exceptions later, which would be worse

The final model allows:

- open baseline API auth through `external_client`
- stronger first-party browser sessions through `first_party_web`
- native long-lived sessions through `native`
- future registration only where it adds value, such as privileged quotas,
  abuse controls, analytics, or credentialed-CORS cookie sessions

## Why This Is Better Than Keeping Legacy Auth Forever

Keeping legacy auth forever would avoid the migration question, but it would
leave the system with weaker security primitives.

Structured signatures provide durable benefits:

- signatures say what they are for
- signatures say who they are for
- signatures expire
- signatures bind to nonce and action
- action signatures bind to payload hashes
- backend verification is explicit
- session category is visible in the signed message

That is a better base for high-risk actions and future auth changes.

The final model preserves compatibility without giving up those benefits.

## Important Non-Goals

These PRs do not make arbitrary third-party browser origins eligible for
credentialed cookie sessions.

They do not remove the need for CORS/origin registration when a browser client
wants first-party-style cookies.

They do not make `Domain` irrelevant. `Domain` remains useful context and is
still enforced for `first_party_web`.

They do not turn `wallet_kind_hint` into authority.

They do not require a client-id system for baseline external integrations.

## Operational Notes

### Flags

Important frontend flags:

- `AUTH_SESSION_V2_ENABLED`
- `AUTH_TRANSFER_CODES_ENABLED`
- `AUTH_LEGACY_REFRESH_ENABLED`
- `AUTH_STRUCTURED_SIGNATURES_ENABLED`

Important backend flags:

- `AUTH_SESSION_V2_ENABLED`
- `AUTH_TRANSFER_CODES_ENABLED`
- `AUTH_LEGACY_REFRESH_ENABLED`
- `AUTH_LEGACY_WS_QUERY_TOKEN_ENABLED`
- `AUTH_STRUCTURED_SIGNATURES_REQUIRED`

The key point for reviewers:

```text
AUTH_STRUCTURED_SIGNATURES_REQUIRED should not imply that every client needs
domain registration.
```

It should mean structured messages are required. The structured message can be
`external_client`.

### External Integration Guidance

For baseline community integrations:

- request a structured nonce
- use `Audience: api.6529.io`
- use `Session Type: external_client`
- sign the returned message exactly
- submit to `/auth/login`
- use bearer-token auth

Do not use `/auth/session-login` unless you are implementing an explicitly
supported first-party web or native session-v2 client.

### First-Party Web Guidance

For 6529 web:

- use `Session Type: first_party_web`
- use `/auth/session-login`
- send credentials for session refresh/logout where needed
- expect one browser session-cookie auth context

### Native Guidance

For native:

- use `Session Type: native`
- use `/auth/session-login`
- store native refresh tokens only in secure storage
- use native refresh rotation

## Reviewer Checklist

When reviewing the PRs, the most important questions are:

- Does `first_party_web` still enforce the domain allowlist? It should.
- Does `external_client` avoid the domain allowlist? It should.
- Does `/auth/session-login` reject `external_client`? It should.
- Does `/auth/login` accept structured `external_client` auth? It should.
- Does native session-v2 require `Session Type: native`? It should.
- Does web session-v2 require `Session Type: first_party_web`? It should.
- Does `client_origin` match the request `Origin` header when both exist? It
  should.
- Does the frontend avoid session-v2 login for localhost and Electron-style
  external clients? It should.
- Does session login send `signature_version: 2` and avoid `is_safe_wallet`? It
  should.
- Are generated OpenAPI/models committed? They are.

## Final Recommendation

Merge both PRs.

They improve wallet-auth security while preserving the open external
integration model.

The critical design point is that structured signatures are not the same thing
as cookie sessions:

```text
Structured signature = safer universal proof format.
Cookie session = first-party/registered browser session mechanism.
Bearer token = external/API integration mechanism.
Native refresh token = native app session mechanism.
```

That split resolves the concern without weakening the auth hardening.
