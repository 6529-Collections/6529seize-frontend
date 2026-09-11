# Active Context

## Goal

Refine the reusable public contract review system and the 6529 Stream review
instance into a restrained, 6529-native protocol-reading experience and
redeploy the exact reviewed result to staging.

## Current Phase

Combined candidate PR iteration and staging redeployment.

## Branch

`codex/stream-public-review-reference`, PR #3475. The local worktree was
fast-forwarded to remote head `9800daff976d657f31714d9f850b70481fc7e161`
before the redesign began. The reviewed comment-rail branch was then integrated
with signed merge commit `1c821faee`.

## Current Constraints

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
- The review section must read as a 6529 protocol dossier, not as a generic
  dashboard: black canvas, strong typography, compact metadata, hairline
  dividers, and selective functional framing.
- Cards are reserved for content or controls that need containment. Lifecycle
  metadata, evidence labels, navigation, reading paths, and page sequencing
  should not use repetitive cards or pills.
- It uses progressive disclosure for community, artist, and technical readers.
- It contains fourteen editorial pages plus generated contract
  reference pages.
- Feedback posts to a dedicated Stream review subwave under Follow the Wave.
- Staging uses the existing dedicated Wave
  `19d4bbf5-86ec-4053-a5f2-bb28d7a2f780` ("Stream review (staging)").
- The future production destination is
  `06e69198-eea7-40c5-95d3-7c1bf5051aba`; it remains recorded but disabled
  until a separately authorized production release.
- Feedback carries structured review and source context.
- The implementation is reusable for future public-contract reviews.
- Stream-specific content and configuration must not be embedded in shared
  review components.

## Evidence

- The release-state observations in the dated run log are historical.
  Staging uses `ops/docs/developer/deployment.md`; no production action is
  authorized for this workstream.
- Browser comparison against `/about/mission`, `/waves`, `/the-memes`, and a
  Meme detail page confirmed that the current review overuses framed metadata
  panels and pill-shaped status labels relative to native 6529 surfaces.
- Local browser QA of the redesign at 1280 x 720 covered feedback open,
  feedback closed, audience paths, and long-form article hierarchy. A
  container-query defect that stacked feedback above the article at this
  viewport was corrected so the site rail, article, and a 20rem feedback rail
  coexist at ordinary desktop widths.
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

1. Push the combined candidate to PR #3475 and iterate current-head bots and CI.
2. Merge the reviewed development branch into `1a-staging` and follow its
   automatic deployment and Staging E2E.
3. Validate the exact staged SHA, the active review, current implementation and
   readiness, technical reference, feedback ledger, and staging Wave links.
4. Finalize the staging review in the user's browser with no production action.
