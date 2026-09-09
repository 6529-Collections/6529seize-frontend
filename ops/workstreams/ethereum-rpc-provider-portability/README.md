# Ethereum RPC provider portability

Status: Implemented in [frontend PR #3911](https://github.com/6529-Collections/6529seize-frontend/pull/3911)

The cross-repository architecture decision and complete migration plan are
owned by the backend repository:

- [Canonical Ethereum RPC provider portability record](https://github.com/6529-Collections/6529seize-backend/blob/main/docs/ethereum-rpc-provider-portability.md)

## Objective

Route frontend-owned, server-side ordinary Ethereum mainnet reads through one
server-only `ETHEREUM_RPC_URL`. Initially that URL will point to Alchemy. A
later ordinary-RPC provider replacement must require a configuration change and
redeploy, not application-code changes.

Ordinary calls in this workstream are block, log, transaction, receipt, ENS,
and contract reads. Alchemy NFT REST APIs are indexed-product dependencies and
remain explicitly Alchemy-backed until separately replaced.

## Current frontend state

- Server-side Open Graph code creates multiple Viem clients using default,
  hard-coded `rpc1.6529.io`, and public-node transports.
- Active `/api/alchemy/*` routes and Open Graph NFT metadata fallbacks call
  Alchemy NFT REST APIs through the server-only `ALCHEMY_API_KEY`.
- `services/alchemy-api.ts` and
  `services/alchemy/{index,collections,owner-nfts,tokens}.ts` have no production
  importers. Their only importer is `__tests__/services/alchemy-api.test.ts`.
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
