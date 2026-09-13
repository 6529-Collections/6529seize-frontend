# Ethereum RPC provider portability

Status: Implemented in [frontend PR #3911](https://github.com/6529-Collections/6529seize-frontend/pull/3911);
implementation does not imply merge or deployment.

The cross-repository architecture decision and complete migration plan are
owned by the backend repository:

- [Canonical Ethereum RPC provider portability plan, backend PR #1979](https://github.com/6529-Collections/6529seize-backend/pull/1979).
  The record is `docs/ethereum-rpc-provider-portability.md` in that PR; use the
  PR while the document is not yet merged into backend `main`.

## Objective

Route frontend-owned, server-side ordinary Ethereum mainnet reads through one
server-only `ETHEREUM_RPC_URL`. Initially that URL will point to Alchemy. A
later ordinary-RPC provider replacement must require a configuration change and
redeploy, not application-code changes.

Ordinary calls in this workstream are block, log, transaction, receipt, ENS,
and contract reads. Alchemy NFT REST APIs are indexed-product dependencies and
remain explicitly Alchemy-backed until separately replaced.

## Current frontend state

- This PR routes server-owned ordinary mainnet Open Graph reads through the
  shared lazy Viem client configured by `ETHEREUM_RPC_URL`.
- Active `/api/alchemy/*` routes and Open Graph NFT metadata fallbacks call
  Alchemy NFT REST APIs through the server-only `ALCHEMY_API_KEY`.
- The unused `services/alchemy-api.ts` facade,
  `services/alchemy/{index,collections,owner-nfts,tokens}.ts`, and their orphaned
  test were removed in merged frontend PR #3915.
- `services/alchemy/types.ts` and `services/alchemy/utils.ts` are active and
  must be retained while their production importers remain.

## Frontend implementation scope

1. [x] Delete the unused Alchemy service facade, four unused implementation
   modules, and their orphaned test
   ([frontend PR #3915](https://github.com/6529-Collections/6529seize-frontend/pull/3915)).
2. [x] Keep the active Alchemy types and utilities; remove only exports made
   obsolete by the cleanup in frontend PR #3915.
3. [x] Add `ETHEREUM_RPC_URL` to server-side environment validation, samples, and
   deployment configuration. Do not expose it through `NEXT_PUBLIC_*` or any
   browser runtime configuration.
4. [x] Provide one server-only construction path for ordinary mainnet reads.
5. [x] Migrate server-owned Open Graph block, ENS, and contract reads from default
   and hard-coded transports to that shared boundary.
6. [x] Keep active Alchemy NFT routes and metadata fallbacks on
   `ALCHEMY_API_KEY`.
7. [x] Add focused configuration and provider-boundary tests, including proof that
   the RPC URL is not included in browser-visible configuration.

## Deployment configuration

- Production uses the `ETHEREUM_RPC_URL` GitHub Actions secret and installs it
  as a server runtime environment value in Elastic Beanstalk.
- Staging uses the `STAGING_ETHEREUM_RPC_URL` GitHub Actions secret and passes
  it into the PM2 runtime secret store.
- Both values should initially be Alchemy Ethereum mainnet HTTPS JSON-RPC URLs.
  A later ordinary-RPC provider change requires updating only the corresponding
  secret and redeploying.
- NFT REST APIs and metadata fallbacks separately require `ALCHEMY_API_KEY` at
  runtime. Production continues using the `ALCHEMY_API_KEY` GitHub Actions
  secret; staging requires `STAGING_ALCHEMY_API_KEY`, passed into the private
  PM2 runtime store as `ALCHEMY_API_KEY`. Staging deployment fails early if this
  secret is missing or empty. The old EC2 repo-root `.env` is not loaded by the
  standalone release; add the staging secret before deploying this change.

## Out of scope

- Replacing Alchemy NFT REST APIs.
- Removing `ALCHEMY_API_KEY` while indexed NFT features require it.
- Changing browser wallet connectors, wallet-selected transports, or
  transaction submission.
- Treating one mainnet endpoint as valid for Sepolia, Hoodi, or another chain.

## Completion criteria

- Frontend server-owned ordinary mainnet reads use `ETHEREUM_RPC_URL`.
- Switching their provider is a configuration-only change.
- No ordinary-read module constructs an Alchemy hostname.
- Alchemy-specific NFT code remains isolated and functional.
- The unused service layer is gone without removing its active shared types or
  utilities.
- The canonical backend record reflects any decisions made while implementing
  the frontend portion.
