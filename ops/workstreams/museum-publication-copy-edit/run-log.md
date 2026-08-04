# Run log

## 2026-08-03 — editorial implementation

- Audited institutional, Casey curatorial, and frontend copy in three parallel
  review lanes, followed by an owning sentence-level edit.
- Preserved adopted proposal text, source transcriptions, legal rights
  distinctions, accession evidence, and deployment status.
- Reordered About to lead with mission and founding principles.
- Removed duplicate Open Museum, transition, and research-source explanations.
- Recast the shared source contribution area as a publication colophon.
- Replaced full visitor rendering of repository specifications with a curated
  methods and provenance index whose cards link to the complete source.
- Added focused route and component coverage. Full validation and release
  evidence will be appended after exact-source and frontend heads are frozen.

## 2026-08-03 — local validation and base-build isolation

- Focused Museum publication validation passes three suites and twelve tests.
- `typecheck:changed` passes its 1,257-file ratchet; `lint:changed`,
  `codex-diff-check`, help-index sync, and React Doctor 100/100 pass.
- The full optimized build compiled the complete application, then exposed an
  unchanged defect on exact frontend main: the production Next type surface
  permits `usePathname()` to return `null`, while the Network Nerd focus helper
  accepted only `string`.
- The release blocker was isolated in frontend PR #3566 rather than added to
  the Museum editorial diff. Its two Network Nerd suites pass eight tests;
  changed typecheck, changed lint, diff integrity, and the complete optimized
  production build pass.
- A monolithic path-filtered Museum regression run produced no failure output
  but did not complete within its practical 15-minute bound and was terminated.
  It is not counted as evidence. The final rebased head will use smaller bounded
  regression groups before PR publication.

## 2026-08-03 — canonical source activation

- Museum source PR #21 merged as
  `4534f0e036488cf7daf942c083a5813fc01a0f57` after CodeRabbit review, eight
  resolved review threads, Museum validation, and deterministic Ubuntu and
  Windows checks.
- The merged manifest remains 213 entries with SHA-256
  `sha256:02c0c65f48017156094221aed490915c853dbbcac12b713b43d8aebece2da0fa`
  and Keccak-256
  `0x9c276bcbfcc142e6933aa3c3f337425398b3e2c1fde059351f6221debad7a4e3`.
- A live strict source probe resolved exact canonical main and atomically
  assembled one artist, five projects, one accessioned gift, seven artworks,
  twenty-six public documents, and seven object entries. The artist title is
  `Casey Reas: The Conditions for an Image`; the collection title is
  `The System in Seven States`.

## 2026-08-03 — release-base qualification

- Canonical Museum main run `30862120506` completed successfully: full Museum
  validation, deterministic Ubuntu, and deterministic Windows all passed.
- Frontend prerequisite PR #3566 merged as
  `a178928ecc8a2bc50831c7081f361f5665c07c16`. Its exact merge tree passed the
  optimized production build, the small Playwright smoke pack, the critical
  route-shell pack, all required status checks, and review-thread readback.
- The Museum publication copy edit rebased cleanly onto that exact frontend
  main. No conflict or editorial change was introduced by the rebase.

## 2026-08-03 — rebased frontend qualification

- The live strict adapter resolved canonical Museum main
  `4534f0e036488cf7daf942c083a5813fc01a0f57`, all 213 manifest entries, the
  exact SHA-256 and Keccak commitments above, one artist, five projects, one
  gift, seven artworks, twenty-six public documents, and seven object entries.
- Seventy-five bounded Museum suites passed. This covers 73 publication and
  data tests, 10 Markdown tests, 14 shared-component tests, 54 app-route tests,
  66 legacy page tests, and 18 root Museum page tests; the six network-route
  tests also passed independently.
- One incorrectly scoped Jest command expanded to the repository's complete
  4,944-test TypeScript corpus. It passed 4,894 tests and failed only known
  Windows/platform release-control harnesses. That overbroad run is not counted
  as Museum evidence and prompted the exact-path bounded rerun above.
- Changed lint and the 1,258-file typecheck ratchet pass. Debt ratchet,
  formatting, help-index sync, `codex-diff-check`, and React Doctor 100/100 on
  the eight changed source files pass.
- The complete optimized production build passed in 431 seconds, including
  generation, full lint, Next compilation, TypeScript, route generation,
  sitemap generation, and postbuild.

## 2026-08-03 — rendered copy-desk finding

- The first rendered About review found that the page still opened the complete
  founding transcription, including archival metadata, and reproduced the full
  operating and migration manuscripts below it. The records were accurate but
  the visitor experience remained archival and process-heavy.
- The source records remain unchanged and available at their immutable links.
  About now presents an edited account of the Museum's mission, obligations,
  public catalogue, and planned on-chain record. The complete founding,
  operating, migration, rights, and design documents remain one link away.
- CodeRabbit's two workstream-language findings were accepted and applied. The
  valid advisory test suggestions were also applied: partial source releases,
  unsafe source URLs, stale-release language, and suppression of raw governed
  text and archival metadata now have explicit coverage.
- The revised About page passed a local rendered review at 1280px and 390px.
  The mobile document remained within its viewport, no browser errors were
  emitted, and the archival `Source HTML observed` field was absent. Methods
  passed the same 390px overflow and browser-error checks.
- The complete optimized production build passed again after the rendered
  copy-desk correction in 416 seconds, including generation, full lint, Next
  compilation, TypeScript, route generation, sitemap generation, and postbuild.

## 2026-08-04 — staged and production release

- Frontend PR #3567 passed exact merge-tree App PR CI, the optimized production
  build, security and quality checks, configured review bots, and zero
  unresolved review threads. It squash-merged as
  `7132db738d4235b49b5c52512e78529b2bfd2519`.
- Staging composition
  `2b7189ad070a32503a1b5fa3602a378a169f40ae` contains that exact main.
  Staging deployment run `30866516284` passed, followed by automatic staging
  E2E run `30867368339`.
- Production deployment run `30867768961` passed on exact main. Elastic
  Beanstalk health, deployed-version validation, three consecutive HTTP
  version matches, announced version, and durable workflow evidence all
  passed. Three independent post-workflow reads also returned exact runtime and
  announced SHA with `stale:false`.
- The manual fallback lane correctly created no manifest-bound Production E2E
  workflow, because there was no Release Bus v2 train or manifest identity to
  supply. No identity was invented. The complete 11-pack production-safe
  inventory ran read-only against `https://6529.io` and passed 73/73 tests.
- The independent desktop/mobile core smoke matrix passed 16/16. The full
  public surface matrix passed 28 tests, skipped 22 intentional project cases,
  and failed none. The WCAG/i18n matrix passed 6/6.
- The retained Museum production audit passed eight representative routes at
  390 by 844 pixels. It verified abbreviated source SHA `4534f0e03648`, final copy,
  visible media, zero horizontal overflow, absence of raw archival metadata,
  and no actionable browser console or page errors. Owning desktop and mobile
  pixel review covered the Museum home, About, Methods, gift, artist, CENTURY
  project, CENTURY #31 object, and sources-and-chronology routes.

## 2026-08-04 — production closeout

- The required 30-minute post-deploy watch ran from
  `2026-08-04T01:30:46.276Z` through `2026-08-04T02:00:54.149Z`. Twenty-three
  exact-version observations, including the workflow's original three-match
  evidence, recorded no mismatch. The final watch readback passed all eight
  representative Museum routes at HTTP 200 with the expected publication copy
  and source SHA.
- Required core-smoke, surface-matrix, and WCAG/i18n reports; the optional
  11-pack production-readonly evidence; the Museum mobile report; and the
  post-deploy watch were uploaded under the release's approved durable artifact
  prefix with verified-redacted metadata.
- The completed release report is `ready`: no auto-hold criterion fired and no
  warning remains. The final manifest is retained at
  `s3://6529reviewbot-prod-artifacts/frontend-deployment/fe-production-20260804T010754Z-7132db738d42/release-closeout/20260804T020200Z/deployment-bus-manifest.json`
  with SHA-256
  `dfc3ce89cb592ce682074d52ef56b3d5046bff2e1ed022ca7b50b272a2fa5c95`.
  The companion report is retained beside it as
  `deployment-release-report.md` with SHA-256
  `74abe758a13d8047970f994e3065ec7298da95c03cb75ac221217fce85200ad1`.
