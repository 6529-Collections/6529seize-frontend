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
