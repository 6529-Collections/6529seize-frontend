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

1. `active-context.md`
2. `run-log.md`
3. The merged specification
4. Current PR and release-bus state

## Escalation Triggers

- Production access or deployment is requested.
- Required credentials are unavailable after checking local credential tooling.
- A destructive or irreversible operation outside the approved staging scope is
  required.
- The live release bus is unavailable or reports an unsafe/unknown state.
- A contract source revision cannot be identified or deterministically pinned.

