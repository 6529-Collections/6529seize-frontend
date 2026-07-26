# Active Context

## Goal

Deliver the reusable public contract review system and the 6529 Stream review
instance to staging today for community demonstration.

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
- It contains approximately fourteen editorial pages plus generated contract
  reference pages.
- Feedback posts to a dedicated Stream review subwave under Follow the Wave.
- Feedback carries structured review and source context.
- The implementation is reusable for future permanent-contract reviews.
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

## Next Actions

1. Complete focused architecture discovery.
2. Resolve independent review findings against the draft specification.
3. Validate and open the specification PR.
4. Iterate with available review bots and CI.
5. Merge the approved specification.
6. Start disjoint feature branches from the merged specification.
