# Etherscan Wave Previews Workstream — 2026-07

## Charter

Implement the approved Etherscan Wave link-preview specification, preserve
correct ENS and Compound ownership, and carry the exact merged frontend SHA
through local validation, review, staging, production, and deployed
environment verification.

## Reload order

1. `AGENTS.md`
2. This file
3. `active-context.md`
4. `run-log.md`
5. `ops/docs/specs/2026-07-25-etherscan-wave-link-preview-cards.md`
6. `ops/skills/6529-autonomous-manager/SKILL.md`
7. `ops/skills/write-prs/SKILL.md`
8. `ops/skills/deploy-6529/SKILL.md`
9. `ops/docs/developer/deployment.md`

## Owned paths

- `lib/link-preview/etherscan/`
- `app/api/open-graph/etherscan/`
- `components/waves/etherscan/`
- Etherscan-specific Wave link handler and shared preview integration
- Focused Etherscan, ENS, Compound, open-graph, and Wave-preview tests
- Etherscan link-preview localization messages
- Etherscan link-preview user documentation and Help Bot records
- This workstream folder

## Boundaries

- Exact approved Etherscan hosts only; unknown subdomains remain ordinary
  external links.
- No Etherscan HTML scraping and no client-side explorer or RPC secrets.
- Fixed, chain-specific server RPC transports only; never query mainnet for a
  testnet or retired-network URL.
- Route-only and partial cards remain useful when live data is unavailable.
- Etherscan owns Etherscan URLs. ENS owns bare ENS and ENS-app URLs. Compound
  owns Compound-app URLs and appears on an Etherscan transaction only when
  event evidence supports the protocol interpretation.
- Cards are read-only and never connect a wallet, request a signature, or
  initiate a transaction.
- Preserve unrelated worktree and release-lane changes.

## Evidence standard

- Table-driven parser coverage for every documented route family and host.
- Focused service, handler-precedence, component, localization, and
  accessibility tests.
- Changed-file lint, typecheck, React Doctor, Help Bot sync, full build, and
  whitespace validation.
- Desktop and mobile browser evidence, keyboard/focus checks, and visible
  loading/partial/live states.
- Latest-head bot review, resolved threads, required checks, and maintainer
  approval for every merged PR.
- Exact candidate, merge, staging validation, and production deployment SHAs.

## Completion gates

1. The specification PR is merged.
2. The implementation is complete, documented, locally validated, and review
   ready.
3. Latest-head review bots, CI, DCO, required approval, and review-thread gates
   pass.
4. The implementation merges without bypassing repository rules.
5. Merge the implementation into `1a-staging` and follow its automatic
   deployment, E2E, and Etherscan-specific staging validation.
6. When production is authorized, merge into `main`, dispatch the production
   workflow, and pass its automatic and Etherscan-specific smoke/E2E checks.

## Escalation triggers

- Required maintainer approval remains unavailable after direct review request.
- Another deployment conflicts with the requested environment work.
- A newer `main` change conflicts with Etherscan ownership or the release set.
- The deployed change cannot be verified from its workflow and runtime result.
- A required RPC/network capability would require a new secret or paid service
  not already approved.
