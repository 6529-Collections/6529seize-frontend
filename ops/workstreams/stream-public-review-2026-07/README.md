# Stream Public Review Workstream

## Charter

Ship a staging-only, community-ready 6529 Stream contract review section on
6529.io. The workstream owns the product specification, reusable public-review
frontend, deterministic Solidity-derived technical reference, Stream editorial
content, Wave feedback integration, validation, reviewed pull requests, and
staging deployment.

## Success Criteria

- A reviewed and merged specification precedes feature implementation.
- The review experience is reusable for future 6529 contract reviews.
- Stream is the first configured review instance.
- Human-authored explanations and deterministic Solidity-derived reference data
  are visibly distinguished.
- Readers can submit structured, context-bound feedback to a Stream review
  subwave under Follow the Wave.
- Feedback can reference a review version, page, section, contract, function,
  source file, and exact code lines.
- Public security findings are supported while the contract is pre-deployment.
- The full experience is accessible, responsive, documented, tested, and
  deployed to staging only.

## Owned Paths

- `ops/docs/specs/` for the approved specification
- `ops/workstreams/stream-public-review-2026-07/`
- Future review routes, components, configuration, content, scripts, tests, and
  user-facing documentation selected by the merged specification
- Help index records for the new public routes and workflows

## Forbidden Scope

- Production deployment
- Onchain actions
- Changes to unrelated Waves, collections, profiles, or release infrastructure
- Rewriting unrelated user or agent changes
- Treating generated technical inventory as human-authored editorial truth

## Evidence Standard

- Fixed Git commits for frontend and Solidity inputs
- Signed commits and reviewed pull requests
- Deterministic generation and drift checks
- Focused tests, changed-file checks, React Doctor, build validation, and
  desktop/mobile browser evidence
- Current review-bot and CI status on every merged head
- Exact staging candidate SHA and staging validation evidence

## Reload Order

Follow the root and applicable nested `AGENTS.md` load order first:

1. applicable repository instructions
2. current request, issue, or PR context
3. `git status --short --branch` and the relevant diff
4. implementation sources and tests
5. relevant repository documentation, package metadata, and local skills

Then reload the workstream-specific state:

1. `active-context.md`
2. `run-log.md`
3. the merged specification
4. current PR, deployment workflow results, and `ops/docs/developer/deployment.md`

## Escalation Triggers

- Production access or deployment is requested.
- Required credentials are unavailable after checking local credential tooling.
- A destructive or irreversible operation outside the approved staging scope is
  required.
- The ordinary deployment workflow fails or the required environment is
  unavailable.
- A contract source revision cannot be identified or deterministically pinned.
