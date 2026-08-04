# Active context

## Current state

- Frontend work began from exact main
  `ff793a0ef14f91708f9477ae09f0d46ee4701dcf` and is now rebased onto exact
  main `a178928ecc8a2bc50831c7081f361f5665c07c16`.
- Canonical Museum source work began from exact main
  `bd853b483f807aad6d737305a9f78b1273bb2356`.
- Museum source PR #21 is merged at exact canonical main
  `4534f0e036488cf7daf942c083a5813fc01a0f57`. Its 213-entry manifest has
  SHA-256
  `sha256:02c0c65f48017156094221aed490915c853dbbcac12b713b43d8aebece2da0fa`
  and Keccak-256
  `0x9c276bcbfcc142e6933aa3c3f337425398b3e2c1fde059351f6221debad7a4e3`.
- The strict frontend source probe assembles that exact canonical edition: one
  artist, five projects, one gift, seven artworks, twenty-six public documents,
  and seven object entries.
- Frontend copy and structure are implemented. The Methods page now presents
  policy, standards, research, on-chain design, and technical archive sources
  as a curated index instead of rendering internal specifications in full.
- Museum main validation run `30862120506` passed the full validator and the
  deterministic Ubuntu and Windows suites.
- Prerequisite frontend PR #3566 merged as
  `a178928ecc8a2bc50831c7081f361f5665c07c16` after exact merge-tree CI,
  production build, browser packs, and review completed successfully.
- The Museum frontend rebased cleanly onto that head. Seventy-five bounded
  Museum suites, the live exact-source probe, changed lint/typecheck, debt
  ratchet, formatting, help sync, diff integrity, and React Doctor 100/100 are
  green. The complete optimized production build is also green.
- Frontend PR #3567 merged as
  `7132db738d4235b49b5c52512e78529b2bfd2519`. Staging deployment run
  `30866516284`, automatic staging E2E run `30867368339`, and production
  deployment run `30867768961` all passed.
- Production serves and announces exact frontend SHA
  `7132db738d4235b49b5c52512e78529b2bfd2519` with `stale:false`.
- The completed production release manifest is `ready`, with no holds or
  warnings. It is retained at
  `s3://6529reviewbot-prod-artifacts/frontend-deployment/fe-production-20260804T010754Z-7132db738d42/release-closeout/20260804T020200Z/deployment-bus-manifest.json`
  with SHA-256
  `dfc3ce89cb592ce682074d52ef56b3d5046bff2e1ed022ca7b50b272a2fa5c95`.

## Decisions

1. Preserve governed manuscripts and source transcriptions verbatim behind the
   existing fail-closed publication boundary.
2. Give About a concise editorial presentation of the mission, public
   catalogue, and on-chain transition, with immutable links to the complete
   governed documents.
3. Present source provenance once as a restrained colophon inherited by Museum
   routes.
4. Place the Museum's mission before repository mechanics on About.
5. Keep adopted policy wording and complete technical specifications in the
   public source archive. The site supplies separate editorial abstracts.
6. Record every Casey copy edit in the manuscript revision histories and keep
   retained draft and promoted public copies reproducible.

## Next work

- This workstream is complete. The institutional benchmark and scholarship
  research requested after release belongs in a separate Museum workstream.
