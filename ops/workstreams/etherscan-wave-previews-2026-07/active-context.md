# Active Context

## Current goal

Ship user-friendly Etherscan cards for every documented Etherscan URL family
in Waves, with structured live summaries for core entities and safe route-only
coverage for lists, analytics, tools, unknown routes, and retired networks.

## Current state

- Specification PR #3460 is latest-head clean and set to auto-merge.
- Its branch was updated with current `origin/main` at
  `1aedc314c8a7e44f60ddc39dc02e12e27d3360e9`.
- All spec checks are green. The required `6529seize-maintainers` latest-push
  approval remains pending after requests to the team and directly to
  `GelatoGenesis`; auto-merge is armed.
- The implementation branch
  `codex/etherscan-wave-preview-implementation` starts at that reviewed spec
  head and will be refreshed from the resulting merged `origin/main` before
  publication.
- Deployment follows `ops/docs/developer/deployment.md`; this dated
  implementation record does not establish current environment state.

## Constraints

- Use the existing Wave card frame and `tw-` Tailwind visual language.
- Meet WCAG 2.2 AA and the progressive localization standard for every touched
  surface.
- Keep route parsing client-safe and pure; keep RPC acquisition server-only.
- Cap upstream work and return partial data rather than leaking provider
  errors.
- Use decimal strings for blockchain quantities that may exceed safe integer
  precision.
- Deploy the implementation change; the spec-only PR needs no runtime
  deployment.

## Open decisions

- Prefer the fixed viem mainnet, Sepolia, and Hoodi chain transports already
  present in the dependency rather than introducing a new Etherscan API key.
- Keep specialized uncle, blob, and verified-signature previews route-aware
  and partial until documented structured sources provide bounded data.
- Reuse Compound event decoding as an evidence-based transaction adapter.

## Recorded localization debt

- Component: `EtherscanCard`.
- Surface: specialized route titles, fact labels, context labels, entity kinds,
  and the less-common proposed/future states.
- Current fallback: the complete `en-US` catalog is used where `en-GB`,
  `de-DE`, `es-ES`, or `fr-FR` does not yet provide a localized key.
- Owner and follow-up: frontend i18n maintainers should complete parity before
  the next Etherscan provider expansion; core actions, status, fallback, and
  error messages are translated in this workstream.

## Next actions

1. Merge refreshed `origin/main` after spec PR #3460 lands.
2. Publish the implementation PR and drive all review/CI/release gates.
3. Complete visual E2E against representative entity and route-only cards in
   staging, where the full backend is available.
4. Merge the implementation to `1a-staging` and validate its automatic deploy
   and E2E; with production authorization, merge to `main` and dispatch the
   production workflow, following its automatic validation.
