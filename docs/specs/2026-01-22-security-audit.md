# 6529seize Frontend — Security Audit Report (FE + Crypto)

Date: 2026-01-22  
Audience: Lead engineers / tech leads / security owners  
Repository: `/tmp/evoticketresolver_4lm2fvzm/repo` (Next.js app-router web + Next route handlers)

## Executive Summary

This codebase has several **Critical** issues that materially increase the blast radius of any XSS/supply-chain compromise and create real risk of **credential exposure**:

- Multiple **DOM XSS** primitives exist via `dangerouslySetInnerHTML` fed by **untrusted / remotely fetched HTML** and **unescaped strings**.
- The site’s **CSP is effectively non-protective** (`'unsafe-inline'`, `'unsafe-eval'`, `connect-src *`, `img-src *`, `object-src data:`), significantly increasing exploitability and post-exploitation capability.
- Several **secrets / credentials are shipped to the browser bundle** via Next `env` (e.g., `STAGING_API_KEY`, `DEV_MODE_AUTH_JWT`, `FARCASTER_WARPCAST_API_KEY`), enabling easy extraction by any user and increasing the probability of auth bypasses / third-party API key leakage.
- **Auth tokens are stored in JS-accessible storage** (cookie set from JS + `localStorage` refresh token), so any XSS becomes an account-takeover vector.

There are also **High** severity concerns around un-sandboxed iframes, unauthenticated “proxy” API routes that can be abused (SSRF-adjacent / cost & availability risk), and Sentry configuration that can capture PII and potentially sensitive content.

## Scope & Methodology

### In scope
- Frontend (Next.js app router, React components)
- Next route handlers (`app/api/**`)
- Auth/token storage patterns, security headers, and client-side crypto usages
- Dependency vulnerability scan (`npm audit`)

### Not in scope (not performed here)
- Black-box penetration testing against a live deployment
- Full backend/API security review (the external `API_ENDPOINT` services are not in this repo)
- Mobile app deep-link handler security (only the website side is reviewed)

## Threat Model (what we’re protecting against)

- **XSS → token theft / admin action abuse / wallet phishing**
- **Supply-chain compromise** (3p scripts/CSS/HTML fetched at runtime)
- **Abuse of server-side proxy routes** (cost and availability attacks; external fetch amplification)
- **Credential leakage** (keys bundled to clients, logged, or sent to monitoring)
- **Crypto-specific risks** (blind signing, unsafe storage of mnemonics/private keys)

## Prioritized Fix List (Severity × Ease)

Sorted by **Severity**, then **Ease** (Easy → Medium → Hard).

| ID | Recommendation | Severity | Ease | Primary Files |
|---:|---|:--:|:--:|---|
| C-1a | Remove/escape Timeline `dangerouslySetInnerHTML` (DOM XSS) | Critical | Easy | `components/timeline/Timeline.tsx:60` |
| C-1b | Fix emoji rendering: never put raw user strings into `innerHTML` | Critical | Easy | `components/address/WalletAddress.tsx:145`, `helpers/Helpers.ts:337` |
| M-2 | Bound all in-memory caches (LRU/TTL) to prevent memory DoS | Medium | Easy | `app/api/open-graph/route.ts:130`, `app/api/farcaster/route.ts:66`, `services/api/link-preview-api.ts:77` |
| L-1 | Remove/gate the always-throwing Sentry example API route | Low | Easy | `app/api/sentry-example-api/route.ts:10` |
| L-2 | Disable public production source maps | Low | Easy | `config/nextConfig.ts:11` |
| Dep-1 | Upgrade `lodash` to patched version | Medium | Easy | `package.json` / lockfile |
| H-1 | Sandbox untrusted HTML iframes + validate URLs | High | Medium | `components/timeline/TimelineMedia.tsx:27` |
| C-1c | Sanitize/allowlist YouTube oEmbed HTML before injection | Critical | Medium | `components/drops/view/part/dropPartMarkdown/youtubePreview.tsx:119` |
| C-3 | Stop shipping secrets to client bundle (move to server-only env) | Critical | Medium | `next.config.ts:65`, `config/env.schema.ts:47` |
| H-2 | Add abuse controls (rate limits, size limits) to external-fetch API routes | High | Medium | `app/api/open-graph/route.ts:296`, `app/api/alchemy/**` |
| H-3 | Reduce Sentry PII + replay risk; add scrubbing | High | Medium | `instrumentation-client.ts:143`, `sentry.server.config.ts:14` |
| X-1 | Replace “blind signing” with EIP-712 + server nonce + expiry | High | Medium | `components/nextGen/admin/NextGenAdminUploadAL.tsx:85` |
| X-2 | Harden app-wallet crypto (salt handling, password policy, UI) | High | Medium | `components/app-wallets/app-wallet-helpers.ts:5`, `components/app-wallets/AppWalletModal.tsx:13` |
| C-1d | Remove remote HTML injection (About/Delegation) or isolate via sandboxed iframe + separate origin | Critical | Hard | `components/about/AboutHTML.tsx:41`, `components/delegation/html/DelegationHTML.tsx:72` |
| C-2 | Tighten CSP (remove `unsafe-*`, remove wildcards) using nonces/hashes | Critical | Hard | `config/securityHeaders.ts:8` |
| C-4 | Move auth/refresh token storage to HttpOnly cookies | Critical | Hard | `services/auth/auth.utils.ts:29` |

## Findings (Prioritized by Severity × Ease)

Legend for **Ease**:
- **Easy**: isolated fix, low coordination, ≤1–2 days
- **Medium**: changes across multiple areas, coordination needed, ~days–1 week
- **Hard**: architectural / cross-system change, multi-week

### Critical

#### C-1 — DOM XSS via `dangerouslySetInnerHTML` with **unescaped/untrusted** content

**Impact:** Account takeover (JWT/refresh token theft), session replay, arbitrary actions as the user, and broad compromise due to permissive CSP.  
**Ease:** Medium → Hard (depends on which call sites are removed vs sanitized).

Highest-risk instances:

- **Unescaped values injected as HTML** in Timeline:
  - `components/timeline/Timeline.tsx:60` → `:68` (`dangerouslySetInnerHTML` from `numberWithCommasFromString(value)` which returns raw input for non-numeric strings).  
  - `helpers/Helpers.ts:75` → `:84` shows the “return raw string” behavior.

- **Remote HTML fetched from S3 and injected into DOM** (supply-chain XSS surface):
  - `components/about/AboutHTML.tsx:13` → `:46` and `components/about/about.helpers.ts:1` → `:6`
  - `components/delegation/html/DelegationHTML.tsx:26` → `:78`
  - These currently trust whatever HTML is served from `https://6529bucket.s3.eu-west-1.amazonaws.com/...`.

- **Third-party HTML injected** (YouTube oEmbed):
  - `components/drops/view/part/dropPartMarkdown/youtubePreview.tsx:12` → `:120` uses `preview.html` from `https://www.youtube.com/oembed` (`services/api/youtube.ts:17` → `:32`).

- **Emoji display helper used with innerHTML without full escaping**:
  - `helpers/Helpers.ts:337` → `:342` (`parseEmojis`) does not escape `< > &` etc.
  - Used with `dangerouslySetInnerHTML` in `components/address/WalletAddress.tsx:145` and `components/address/WalletAddress.tsx:177`.
  - If any display string can contain both “emoji markers” *and* HTML characters, this becomes a DOM XSS primitive.

Recommended remediation:
- Eliminate `dangerouslySetInnerHTML` wherever possible (render as React nodes).
- Where HTML is unavoidable:
  - Enforce strict sanitization (allowlist tags/attributes; disallow event handlers and `javascript:` URLs).
  - Treat **remote HTML** as untrusted: render it in a **sandboxed iframe** on a separate origin, or pre-render at build time and ship as static React/MD content.
- For YouTube embeds: parse returned HTML and only allow `<iframe>` pointing to `https://www.youtube.com/embed/...` or `https://www.youtube-nocookie.com/embed/...` with an allowlisted attribute set.

#### C-2 — CSP is overly permissive, enabling XSS and post-exploitation

**Impact:** Reduces XSS difficulty and increases post-XSS capabilities (e.g., arbitrary script execution, data exfil).  
**Ease:** Hard (requires removing inline scripts/styles and third-party sprawl).

Evidence:
- `config/securityHeaders.ts:1` → `:46`:
  - `script-src 'unsafe-inline' ... 'unsafe-eval'`
  - `connect-src *`
  - `img-src ... *`
  - `object-src data:`
  - `style-src ... 'unsafe-inline' ... http://cdnjs.cloudflare.com ...`

Recommended remediation (target state):
- Remove `'unsafe-eval'` and `'unsafe-inline'` for `script-src` using **nonces/hashes** and `next/script`.
- Replace `connect-src *` with explicit allowlists (include `API_ENDPOINT`, WalletConnect endpoints, etc.).
- Replace `img-src ... *` with scheme/host allowlists (at minimum: `https: data: blob: ipfs:`).
- Set `object-src 'none'`, add `base-uri 'none'`, and add `frame-ancestors 'self'` (in addition to `X-Frame-Options`).
- Ensure no `http:` sources are allowed.

#### C-3 — Secrets/credentials shipped to the browser bundle

**Impact:** Any user can extract keys/tokens; increases chance of auth bypass or third-party API abuse.  
**Ease:** Medium (requires separating server-only env and refactoring call sites).

Evidence:
- Next config exposes runtime env into `env` (client-visible):
  - `next.config.ts:65` → `:100` (`STAGING_API_KEY`, `DEV_MODE_AUTH_JWT`, `FARCASTER_WARPCAST_API_KEY`, etc.)
- “Public env” schema includes these as public:
  - `config/env.schema.ts:47` → `:88`
- Client code uses these values directly:
  - `services/auth/auth.utils.ts:58` → `:67` (fallback to `STAGING_API_KEY` / `DEV_MODE_AUTH_JWT`)
  - `app/api/farcaster/route.ts:27` → `:35` (Warpcast API key read from `publicEnv`)

Recommended remediation:
- Move anything resembling a secret to **server-only** env (similar to `SSR_CLIENT_SECRET` pattern in `config/serverEnv.schema.ts:1` → `:7`).
- Remove `STAGING_API_KEY`, `DEV_MODE_AUTH_JWT`, `FARCASTER_WARPCAST_API_KEY`, `TENOR_API_KEY` from the client bundle unless explicitly intended to be public.
- Add build-time guardrails: fail CI if “secret-like” env keys are placed in `publicEnvSchema` / Next `env`.

#### C-4 — Auth tokens stored in JS-accessible storage (XSS → takeover)

**Impact:** Any XSS can steal refresh tokens/JWTs; increases severity of C-1/C-2.  
**Ease:** Hard (requires backend support and auth flow changes).

Evidence:
- Wallet JWT stored in JS-set cookie and refresh token in `localStorage`:
  - `services/auth/auth.utils.ts:29` → `:55` and `services/auth/auth.utils.ts:69` → `:82`
- Access “password” cookie set from JS:
  - `app/access/page.client.tsx:36` → `:53`

Recommended remediation:
- Prefer **HttpOnly, Secure, SameSite** cookies set by the server for session tokens/refresh tokens.
- If you must keep a token in the browser, avoid refresh tokens in `localStorage`; consider short-lived access tokens + rotating refresh via HttpOnly cookie.

---

### High

#### H-1 — Untrusted HTML rendered in iframes **without sandbox**

**Impact:** Untrusted content can attempt top-level navigations/phishing overlays; increases user risk.  
**Ease:** Easy → Medium.

Evidence:
- `components/timeline/TimelineMedia.tsx:27` → `:31` renders an `<iframe src={props.url}>` for HTML animations with no sandbox or URL validation.
- A safer pattern exists elsewhere:
  - `components/common/SandboxedExternalIframe.tsx:6` → `:172` (strong sandbox + URL canonicalization)

Recommended remediation:
- Use `SandboxedExternalIframe` (or equivalent) for any user/metadata-sourced HTML.
- Validate `src` scheme/host (disallow `javascript:`, credentials, non-HTTPS).

#### H-2 — Public “proxy” API routes can be abused (cost/availability + external fetch amplification)

**Impact:** Attackers can drive cost (Alchemy), cause resource exhaustion (CPU/memory), or abuse the platform as a fetch proxy.  
**Ease:** Medium.

Evidence:
- Alchemy proxy routes (publicly callable):
  - `app/api/alchemy/collections/route.ts:17` → `:65`
  - `app/api/alchemy/contract/route.ts:19` → `:70`
  - `app/api/alchemy/owner-nfts/route.ts:14` → `:69`
  - `app/api/alchemy/token-metadata/route.ts:102` → `:162`
- Open-graph fetch proxy:
  - `app/api/open-graph/route.ts:296` → `:356` (arbitrary URL fetch; guarded against private IPs but still abusable)
- Pepe resolver fetches arbitrary URLs found in scraped descriptions (SSRF-adjacent amplification):
  - `app/api/pepe/resolve/route.ts:335` → `:390`

Recommended remediation:
- Add **rate limiting** and/or bot protection to all `app/api/**` endpoints that fetch external resources.
- Add request bounds: maximum URL length, maximum response size, and concurrency limits.
- For Alchemy routes: require auth or move to backend; otherwise you are effectively donating your Alchemy quota to the internet.

#### H-3 — Sentry configuration can capture PII and potentially sensitive data (plus session replay risk)

**Impact:** Potential leakage of identifiers, request context, and user content to a third party; privacy compliance risk.  
**Ease:** Medium.

Evidence:
- `sendDefaultPii: true` on client and server:
  - `instrumentation-client.ts:143` → `:181`
  - `sentry.server.config.ts:14` → `:39`
  - `sentry.edge.config.ts:16` → `:39`
- Replay enabled:
  - `instrumentation-client.ts:147` → `:157`

Recommended remediation:
- Default to `sendDefaultPii: false` unless there is a documented, reviewed need.
- Add `beforeSend` and `beforeBreadcrumb` sanitizers to scrub tokens/headers/body fields.
- Ensure session replay is opt-in and explicitly reviewed for PII (or disabled).

---

### Medium

#### M-1 — Access-control middleware appears implemented but not active

**Impact:** If this is intended to gate content, enforcement may be missing.  
**Ease:** Easy (but confirm intent first).

Evidence:
- `proxy.ts:258` → `:289` implements `enforceAccessControl(...)`.
- No Next middleware file present (expected `middleware.ts` at repo root or under `src/`).

Recommended remediation:
- Confirm whether access control is supposed to run at the edge. If yes, migrate `proxy.ts` to `middleware.ts` and add route matchers.
- If not intended, delete dead code to avoid a false sense of security.

#### M-2 — Unbounded in-memory caches (Map) can lead to memory DoS

**Impact:** High-entropy keys can grow memory without bound; attackers can force OOM.  
**Ease:** Easy.

Evidence:
- `app/api/open-graph/route.ts:130` → `:134` (`new Map()` cache with no max)
- `app/api/farcaster/route.ts:66` → `:75` (multiple `new Map()` caches)
- `app/api/tiktok/route.ts:59` → `:61` (cache maps)
- `app/api/wikimedia-card/route.ts:29` (cache map)
- Client cache:
  - `services/api/link-preview-api.ts:77` → `:122` (promise cache without eviction)

Recommended remediation:
- Replace `Map` caches with a bounded LRU/TTL cache (you already have `LruTtlCache` in `app/api/pepe/resolve/route.ts:98` → `:101`).
- Add global max sizes and evict old entries.

#### M-3 — Cookie flags inconsistent for preference cookies

**Impact:** Lower but unnecessary risk (cookie leakage/cross-site behavior).  
**Ease:** Easy.

Evidence:
- Consent cookies set without explicit `secure`/`sameSite`:
  - `components/cookies/CookieConsentContext.tsx:125` → `:128`, `:140` → `:157`

Recommended remediation:
- Set `secure: true` (in HTTPS contexts) and `sameSite: 'lax'|'strict'` as appropriate.

---

### Low

#### L-1 — Debug endpoint can be abused to generate errors

**Impact:** Error spam/cost; noisy monitoring.  
**Ease:** Easy.

Evidence:
- `app/api/sentry-example-api/route.ts:10` → `:13` intentionally throws on every request.

Recommended remediation:
- Remove or gate behind a build-time flag and require auth in non-prod.

#### L-2 — Production source maps enabled

**Impact:** Increases attacker ergonomics; can expose internal logic details.  
**Ease:** Easy.

Evidence:
- `config/nextConfig.ts:11` → `:18` sets `productionBrowserSourceMaps: true`.

Recommended remediation:
- Disable public source maps in production, or ensure they’re only uploaded to Sentry and not served to clients.

---

## Crypto-Specific Concerns

### X-1 — “Blind signing” for privileged actions (admin flows)

**Impact:** Users can be tricked into signing innocuous-looking messages that authorize high-impact actions; replay/phishing risk.  
**Ease:** Medium.

Evidence:
- UUID generated client-side and signed:
  - `components/nextGen/admin/NextGenAdminUploadAL.tsx:34` → `:88`
  - `components/nextGen/admin/NextGenAdminInitializeExternalBurnSwap.tsx:33` → `:91`
- JSON blob signed:
  - `components/rememes/RememeAddPage.tsx:292` → `:299`

Recommended remediation:
- Use EIP-712 typed data with:
  - `domain` (name, version, chainId, verifyingContract)
  - explicit `action` + parameters
  - server-provided nonce + expiry
- Display clear signing copy to the user and avoid generic UUID messages.

### X-2 — “App Wallet” feature: key custody and crypto hygiene

**Impact:** Handling mnemonics/private keys increases responsibility; compromise here is catastrophic for users.  
**Ease:** Medium.

Evidence:
- AES-256-GCM encryption + PBKDF2:
  - `components/app-wallets/app-wallet-helpers.ts:1` → `:65`
  - Salt parsed as hex: `Buffer.from(salt, "hex")` (`components/app-wallets/app-wallet-helpers.ts:5` → `:13`). Wallet addresses include `0x` and are not valid hex strings unless normalized; this can weaken or break the intended salt usage.
- Password minimum length is only 6:
  - `components/app-wallets/AppWalletModal.tsx:13` → `:71`
- Private key input uses `type="text"`:
  - `components/app-wallets/AppWalletImport.tsx:227` → `:236`

Recommended remediation:
- Strongly consider removing or isolating in-app key custody unless absolutely required.
- If kept:
  - Use a random per-wallet salt stored alongside ciphertext; normalize hex inputs (strip `0x`).
  - Increase password requirements (length + strength meter; consider passphrases).
  - Use platform-native secure enclaves/keychains where possible; minimize key material exposure in JS memory; avoid copying secrets to clipboard by default.

## Dependency / Supply Chain Scan

`npm audit` (run on 2026-01-22) reports:
- 1 **moderate** vulnerability in production deps: `lodash@4.17.21` (prototype pollution advisory GHSA-xxjr-mmjv-4gpg).  
  - Recommendation: upgrade lodash to a patched version (likely `4.17.22`), then re-run `npm audit`.

## 30/60/90-Day Remediation Plan (Suggested)

### 0–30 days (stop the bleeding)
- Remove/gate `app/api/sentry-example-api/route.ts:10`.
- Fix Timeline XSS by removing `dangerouslySetInnerHTML` (`components/timeline/Timeline.tsx:60`) or escaping.
- Replace un-sandboxed HTML iframes (`components/timeline/TimelineMedia.tsx:27`) with the sandboxed iframe component.
- Stop shipping secrets to clients (`next.config.ts:65`); remove `DEV_MODE_AUTH_JWT` / `STAGING_API_KEY` from public runtime.
- Bound all `Map` caches (LRU/TTL).
- Upgrade `lodash`.

### 30–60 days (reduce exploitability)
- Replace remote HTML injection (About/Delegation) with safe rendering (build-time content, markdown + sanitize, or sandboxed iframe on separate origin).
- Tighten CSP iteratively (remove `connect-src *`, remove `http:` allowances).
- Add rate limiting / abuse controls to external-fetch route handlers.

### 60–90 days (harden the platform)
- Move to nonce-based CSP for scripts and eliminate `'unsafe-inline'`/`'unsafe-eval'`.
- Redesign auth token storage to HttpOnly cookies.
- Adopt EIP-712/SIWE for all signing flows, especially admin operations.
- Re-evaluate Sentry PII and Replay settings; add robust scrubbing.

## Positive Notes (keep doing this)

- SSRF guardrails are thoughtfully implemented in `lib/security/urlGuard.ts` (DNS/IP blocking + redirect revalidation).
- `SandboxedExternalIframe` demonstrates a strong pattern for isolating untrusted interactive media.
- `parseNftDescriptionToHtml` properly escapes content before adding links (`helpers/Helpers.ts:809` → `:842`).
