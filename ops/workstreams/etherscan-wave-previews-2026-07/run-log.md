# Run Log

## 2026-07-26 — Autonomous implementation and release ownership opened

- Selected autonomous-manager implementation, PR-review, and release-manager
  modes under the user's explicit merge, staging, and production authority.
- Re-read the autonomous-manager, PR, deploy, release-bus, design, WCAG,
  localization, React Doctor, Sonar, and docs-update instructions.
- Reconfirmed Release Bus v2 mode `PRODUCTION`; all three controls are running.
- Updated spec PR #3460 onto current `origin/main`, pushed reviewed head
  `1aedc314c8a7e44f60ddc39dc02e12e27d3360e9`, and enabled rule-respecting
  auto-merge.
- Confirmed CodeRabbit, 6529bot, DCO, CodeQL, Snyk, SonarCloud, and completed
  repository checks have no blocking findings.
- Confirmed the current ruleset requires one latest-push approval from
  `6529seize-maintainers`; requested the team and `GelatoGenesis`.
- Created clean implementation worktree and branch
  `codex/etherscan-wave-preview-implementation` from the reviewed spec head.
- Read the version-matched Next.js 16.2.6 route-handler, caching, and data
  fetching documentation before touching the open-graph route.

## 2026-07-26 — Provider, card, and focused coverage implemented

- Added an exact Etherscan network host registry, exhaustive route catalog,
  strict client-safe parser, canonical chain-qualified cache keys, and bounded
  server-only RPC clients for Ethereum, Sepolia, and Hoodi.
- Added transaction, address, token, NFT, and block acquisition with explicit
  completeness, provenance, cache, finality, and graceful partial-card
  behavior. Retired explorers and route-only pages perform no live RPC work.
- Moved Etherscan ownership ahead of ENS and Compound in both markdown
  detection and the OpenGraph resolver. Compound event decoding remains an
  evidence-based enrichment inside Etherscan transaction cards.
- Added localized responsive cards with semantic status text/icons, stable
  chat sizing, visible partial/legacy state, safe copy/open actions, and
  locale-aware dates and numbers.
- Added parser coverage across every cataloged route family and current/legacy
  host, plus service, resolver precedence, handler, card, ENS regression, and
  Compound regression tests.
- Strict changed-file TypeScript validation passes. The first focused run
  passed 223 of 227 assertions; four stale expectation values were corrected,
  and their rerun passed all eight affected assertions.

## 2026-07-26 — Local quality and integration evidence completed

- Passed the complete focused matrix: 9 suites and 227 assertions covering
  parsing, provider acquisition, resolver precedence, ENS and Compound
  ownership boundaries, markdown handling, shared card routing, and card
  rendering.
- Passed strict full-repository TypeScript validation after preserving the
  response envelope expected by existing generic preview consumers.
- Passed changed-file ESLint, Help Bot index sync (197 records), React Doctor
  at 100/100 with no findings, whitespace validation, and the complete
  production base build (compile, type validation, static generation, and
  route output).
- Exercised the local OpenGraph route against live Ethereum data for a recent
  transaction, an account, USDC, BAYC token 1, a route-only gas page, and a
  retired Goerli account. Every response was owned by the Etherscan provider
  and returned the expected structured or route-only shape.
- The local interactive shell could not progress beyond access control because
  the shared backend on port 3000 was offline. Full visual interaction remains
  an explicit staging and production release gate.
- `check:changed` passed its TypeScript phase but its quality phase widened to
  historical changes because the stacked branch's local `main` reference is
  stale. Its formatter-only edits were isolated and removed; the focused
  changed-file lint and build gates remain green.

## 2026-07-26 — Implementation PR and first CI iteration

- Published review-ready implementation PR #3464, requested the maintainers,
  `GelatoGenesis`, and `prxt6529`, and armed rule-respecting merge auto-merge.
- Refreshed the implementation branch from the latest `origin/main` before any
  human approval and passed the exact full production build on the refreshed
  head.
- Diagnosed the first installed-app failure as Knip-only: module-internal
  Etherscan and Compound symbols had unnecessarily remained public exports.
- Removed those exports and the obsolete Compound transaction-target helper.
  Knip, changed-file lint, changed-file TypeScript, and 148 focused provider
  assertions pass for the follow-up.
- Addressed all three first-pass inline findings: removed an unused ENS test
  binding and routed hostname examples through a typed test helper so CodeQL
  does not misclassify object-method calls as `String.match` regular
  expressions. Both affected suites (7 assertions) and targeted lint pass.

## 2026-07-26 — Correctness, security, i18n, and WCAG bot iteration

- Fixed pending transactions so a missing receipt/block number produces an
  explicit short-lived `pending` card instead of throwing into `unknown`.
- Fixed current-network client-unavailable fallbacks to retain the short
  30-second partial TTL while legacy explorers keep the 24-hour route-only TTL.
- Isolated untrusted ENS lookups onto dedicated public default transports;
  entity reads can still use the bounded first-party mainnet fallback without
  sending arbitrary ENS names to it.
- Canonicalized NFT token IDs to decimal and included secondary identities in
  cache keys, removing a contract-level collision between different NFTs.
- Added runtime block-hash validation, defensive exact-length EIP-7702
  delegation parsing, and case-normalized duplicate search handling.
- Localized block gas quantities and recorded the permitted fallback debt for
  less-common Etherscan titles/facts/contexts.
- Added stable copy action names, polite success/failure announcements, visible
  failure feedback, robust full-value assistive text, and regression evidence
  that chat layouts retain the keyboard-operable open-link action.
- The expanded focused matrix passes 9 suites and 235 assertions. Targeted
  lint, changed-file TypeScript, Knip, and React Doctor 100/100 also pass.

## 2026-07-26 — Final-head build and CI ratchet iteration

- Passed the complete production build again on the post-review head: lint,
  compile, full TypeScript, 265-page static generation, and sitemap output.
- Fresh Sonar analysis reports zero open issues. CodeQL, Snyk, DCO, secret
  scanning, and the debt ratchet are green on the same head.
- The installed-app job identified two obsolete `React` imports in new Jest
  suites. Removed them and committed the earlier ENS test cleanup as a
  one-diagnostic reduction in the repository's Jest typecheck baseline.
- The exact `typecheck:tests` gate now passes, including the Jest ratchet and
  Playwright TypeScript; both affected suites pass 7 assertions.

## 2026-07-27 — Exact staging validation and shared-environment handoff

- Merged spec PR #3460 after its refreshed exact merge-tree checks passed, then
  merged the resulting `main` into implementation PR #3464 at signed head
  `94634025d1654879ae79cb6e865f4e322e01fcec`.
- Passed all 15 current-head PR checks, including the dual-profile artifact,
  related Jest, both Playwright packs, CodeQL, CodeRabbit, DCO, SonarCloud,
  Snyk, secret scanning, and the debt and public-review ratchets. 6529bot
  reported no new findings on the exact head.
- Registered Release Bus v2 candidate
  `f1367301-114b-4f27-ae89-1179252d7bcd`. Staging train
  `496de9ad-deb4-42cd-8aa3-065792e5d50c` reused artifact digest
  `d17b5b1b988c8ae604d4337c31620e2e7b29b756b2985ca027540a8db9517380`
  and deployed composed frontend SHA
  `10217eac49aa970f82c98b3827137437a15e87e6`.
- Manifest `e756147f-d8bf-47de-b56a-fd1ab517c314` reached
  `STAGING_VALIDATED` after manifest-bound E2E workflow `30240372732` passed.
- While that exact staging composition was live, the Etherscan-specific API
  matrix passed for transaction, account, token, NFT, block, gas tracker, ENS
  search, legacy Goerli, and overview URL families.
- A subsequent staging train claimed the shared environment immediately after
  the lock was released and deployed unrelated SHA
  `48909f822ffb224b07c386e3f2b7dae2ad6ee038`. The later rendered-card probe
  correctly detected the changed `/api/version`; its legacy Compound result is
  not evidence against the validated candidate. Production readiness remains
  held until the rendered Wave card is exercised while an exact Etherscan
  candidate owns staging.
