# Active Context

## Goal

Deliver the reusable public contract review system and the 6529 Stream review
instance to staging on July 26, 2026, for community demonstration.

## Current Phase

Specification review and validation.

## Branch

`codex/stream-public-review-spec`, based on current `origin/main`.

## Current Constraints

- Specification must be reviewed and merged before feature PRs.
- Feature work should use disjoint parallel lanes where practical.
- Stream contract source will continue changing during implementation.
- Technical reference must be generated deterministically from exact Solidity
  source and release artifacts; LLM review is not an inventory mechanism.
- Feedback is public during the pre-deployment review, including potential
  security vulnerabilities.
- Staging deployment is authorized. Production is not authorized.
- The user is AFK; proceed using repository evidence and reversible product
  defaults without waiting for nonessential choices.

## Established Product Decisions

- The review section is a public protocol-review system, not a marketing page.
- It uses progressive disclosure for community, artist, and technical readers.
- It contains fourteen editorial pages plus generated contract
  reference pages.
- Feedback posts to a dedicated Stream review subwave under Follow the Wave.
- Feedback carries structured review and source context.
- The implementation is reusable for future public-contract reviews.
- Stream-specific content and configuration must not be embedded in shared
  review components.

## Evidence

- Frontend `origin/main` at workstream start:
  `7093cf30383c598f494b15b1c6aa9eb38cc847d9`
- Simple Release Bus v2 at workstream start:
  `PRODUCTION`, with `ALL`, `STAGING`, and `PRODUCTION` running
- Staging must therefore use the v2 exact-candidate route.
- Existing Waves support subwaves, structured required metadata, Markdown code
  blocks, deep links, replies, reactions, and independent subwave activity.
- 6529Stream already publishes deterministic release artifacts including a
  protocol surface report and ABI/release evidence.
- Independent Wave review confirmed that staging feedback can use the existing
  authenticated Chat-drop API without backend changes. The first ledger must be
  described as a bounded frontend projection because the API cannot filter by
  review metadata or enforce idempotency/dispositions.
- Independent Solidity review found 107 protocol, 90 test, and 5 deployment
  script Solidity files at the reviewed current main, while the current release
  catalog covers 20 contracts and 33 interfaces. The generator must enumerate
  and classify the full source universe and set-cross-check the release ABI.
- Independent frontend review recommended canonical
  `/reviews/6529-stream` routes with `/stream` redirect, server-rendered static
  pages, narrow client interaction islands, and a navigation item outside
  strictly live-collection-only components.

## Next Actions

1. Validate and push the independent-review follow-up.
2. Iterate PR #3462 with available review bots and CI.
3. Bring the branch current with `main`.
4. Obtain the required latest-head maintainer approval and merge.
5. Start disjoint feature branches from the merged specification.
