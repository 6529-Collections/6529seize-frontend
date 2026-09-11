# Active context

## Current state

- The smallest complete rescue implementation is finished on
  `codex/museum-art-first-rebuild`, based on frontend main
  `2d310e05b886263e868eae3e06073ad20fe760df`.
- Core routes load one exact-commit, manifest-bounded publication through the
  strict runtime facade. Activation is atomic; in-flight loads are deduplicated;
  current, last-valid stale, and unavailable states are explicit.
- The art-led home, holdings collection, Casey artist/project/gift/object pages,
  onsite public dossier, still-first/live viewer, explicit credit/rights, and
  Keys and Gates status distinction are implemented in the native 6529 shell.
- The static presentation overlay is joined by exact object/project/media
  identity and fails closed on mismatch. It does not claim retained bytes or
  IIIF completion.
- Owning visual review passed home, gift, object, artist, project, true 390 px
  layout, live behavior, dossier completeness, rights, and native-design gates.
- Fresh retained screenshots and full-content stitched captures are in
  `evidence/`; only visually verified release files are acceptance evidence.
- Format, `lint:changed`, `typecheck:ci`, 19 new focused tests, 80 existing
  Museum regression tests, production build, Help sync, React Doctor, and
  whitespace checks are green. PR #3550 is in exact-head bot/CI iteration.

## Decisions

1. Runtime code lives only in `6529seize-frontend`.
2. The owning Museum task is the final product/curatorial reviewer.
3. `Collection` means accessioned holdings, never approved donation scopes.
4. `selected_unminted` remains a program outcome and never a holding.
5. The adapter resolves a moving ref to one exact commit and reads only from that
   commit; components never read `main` directly.
6. A candidate publication activates atomically or not at all.
7. Art Blocks still/generator URLs are temporary, governed upstream
   source/fallback media and must be labeled as such.
8. No retained bytes or IIIF completion are claimed until the Museum publishes
   them.
9. Native 6529 design tokens, shell, focus treatment, breakpoints, and primitives
   are the baseline. Museum-specific visual differentiation is compositional.
10. The owner has reviewed and accepted the rendered product boundary. Release
    still requires ready PR, exact-head bots/CI, staging qualification/E2E, and
    exact-candidate production E2E.

## Current upstream facts

- Canonical Museum commit: `390200112363970686cf180863cec9a111b9b8e7`
- Release inventory: 199 entries
- Manifest SHA-256:
  `sha256:3a756de6ef89e391ef7a5a50f825ff3870e7c2fadf86e12e69261b0c8d4bf2b2`
- Manifest Keccak:
  `0xfd24dd7a70be4175c1dac97c8eadf451f81c1f2d5361516a7cf8253c1b2b3f42`
- Casey package SHA-256:
  `sha256:2b2e7ce8897688fa8fde9137cf8f0c361e420d0799b6fbb9b6bfb5fa4d7c6299`
- Casey gift status: accepted and accessioned; seven objects.
- Credit line: `Gift of punk6529`.
- Presentation rights basis recorded upstream: CC BY-NC 4.0.
- Retained public artwork bytes: not yet published.
- IIIF completion: not yet published.
- Keys and Gates: 16 outcomes with status `selected_unminted`; not minted,
  purchased, held, or accessioned.

## Immediate next actions

1. Resolve PR #3550 review-bot and CI findings in one focused signed follow-up.
2. Repeat exact-head review bots, CI, and unresolved-thread audit to green.
3. Follow `ops/docs/developer/deployment.md` within the authorized release
   scope, fetching current shared refs and preserving other developers' work.
4. Merge the development branch into `1a-staging` and follow automatic
   deployment/E2E. With production authorization, merge into `main`, dispatch
   `Web Deploy - PROD`, and follow its automatic E2E.

## Dependencies and open release blockers

- The complete immutable publication catalog and retained media/IIIF described in
  the replacement standard are not yet on canonical Museum main. The frontend
  can ship the contract and strict legacy projection, but must not represent
  upstream-only media as retained preservation assets.
- Curatorial replacement prose is still active. Foundational IA and layout can
  use only governed existing public text; final prose landing remains an owner
  review dependency.
- Local `seize-local-dev bootstrap` found all assigned ports 3101–3199 occupied.
  This does not affect code work. Before visual QA, use a verified free isolated
  port without disturbing other worktrees.

## Internationalization fallback debt

- Surface: `/museum/network/*` and the Museum visitor components.
- Current behavior: UI strings use the Museum message catalog, with `en-US`
  as the only authored Museum locale; governed titles, names, credits, and
  manuscript text are publication content and are not translated.
- User impact: visitors selecting another locale receive the `en-US`
  fallback for Museum interface copy.
- Owner: frontend internationalization workstream.
- Remediation: thread the active locale through Museum routes and components,
  then add reviewed locale dictionaries without translating governed records.

## Resume checklist

1. Read this file and `README.md`.
2. Confirm branch and exact base/current remote state.
3. Inspect `git status` and preserve unrelated work.
4. Check the owning task for content or acceptance updates.
5. Continue the first incomplete phase; do not merge/deploy without owner review.
