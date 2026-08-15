# Run log

## 2026-08-14T11:29:00Z

- User authorized complete autonomous PR, review, staging, production, and E2E
  release and requested aggressive Luna fan-out.
- Estimated a three-hour minimum with a four-hour external-latency ceiling.

## 2026-08-14T11:31:00Z

- Fetched current frontend main
  `bfb7f04643f02e9ff8204d56eda660ef71add71b` and created clean integration
  branch `codex/museum-public-site-final`.
- Dispatched four Luna xhigh worktrees with disjoint runtime and test scopes.
- Dispatched read-only integration and release-path subagents.

## 2026-08-14T11:36:00Z

- Read-only integration audit proved the three earlier Luna commits are already
  integrated or superseded by current main. Abandoned cherry-pick replay without
  changing the tree.
- Confirmed production runtime
  `962e6882648d0b3cb3c28820c553a99f16c8c17d` is behind the current-main Museum
  visual merge.
- Began the captain-owned compact source and contribution treatment and removed
  the redundant Museum-specific footer.

## 2026-08-14T13:05:00Z

- Integrated the four parallel lanes on current main: Home, Collection and
  Acquisitions; Acquisition Programs and About; Research; deterministic release
  acceptance.
- Corrected the root box defect: directional Tailwind borders paired with
  `border-solid` were producing implicit side borders. Explicit zero-width
  counterparts now protect 18 Museum surfaces, and browser geometry acceptance
  checks long rails, nested framed surfaces, narrow editorial columns, copy
  floors, and overflow.
- Collection now presents all seven Casey and five Magnum works as permanent
  holdings, with native image proportions and reviewed derivatives. Keys and
  Gates remains a selected, unminted acquisition in progress and is excluded
  from permanent holdings.
- Research now uses reviewed presentation media when retained work media is not
  published. The Magnum study therefore presents a Magnum photograph through
  its 1280 px derivative instead of a Casey image or the 16.9 MB source.
- Local qualification passed: 14 focused suites / 72 assertions; changed-file
  lint; changed-file typecheck across 1,715 files; diff hygiene; deterministic
  browser acceptance for Collection, Acquisitions, and Research; desktop route
  sweep with no horizontal overflow or broken visible images.

## 2026-08-14T13:00:00Z

- Hosted App PR CI run `31802132247` stopped at the Museum surface registry
  before browser execution. The registry identified one exact omission: the new
  Research media aspect-ratio helper was absent from the component inventory.
- Added the helper to the `museum.research` surface. Exact local registry replay
  now passes with 65 components, 57 routes, 22 surfaces, no unmapped files, and
  no unresolved imports.
- Disposed the first advisory bot review on substance. Moved the remaining
  Research labels into the Museum message catalog, made image readiness checks
  concurrent within the release timeout, and made an unclassified acquisition
  program fail closed instead of silently disappearing. The Collection program
  media path is already non-null and type-safe through
  `MuseumReviewedProgramMediaMatch`; no runtime change was required there.
- Follow-up validation passed: focused Programs and Research suites, four
  assertions; changed-file lint; and changed-file typecheck across 1,715 files.
- Browser replay caught and corrected a lazy-image race in the first concurrent
  implementation. Release acceptance now triggers lazy media in document order,
  then waits for all decoded images concurrently. Exact desktop acceptance for
  Collection, Acquisitions, and Research passes in 33.7 seconds.
- A stale-head hosted quality job identified two module-local symbols exported
  unnecessarily. Removed both exports; full Knip now passes with no dead-code
  findings introduced by the release.
- Exact-head quality then reached the registry contract and caught its stale
  component-count literal. Updated the contract expectation from 64 to the
  registry's verified 65 components.
- The optimized build proved the former exported acquisition media-card helper
  was wholly unused, not merely module-local. Deleted the dead component rather
  than suppressing the lint finding.
- Mobile Network IA exposed an assertion that counted every work link while
  claiming to measure the permanent Collection. Scoped the lifecycle contract
  to the permanent-holdings section and added an independent assertion for the
  16 selected, in-progress Keys and Gates works. The sections remain visually
  unchanged and are now machine-distinguishable.

## 2026-08-14T13:35:00Z

- Exact-head App PR CI run `31804454944` reached the mobile Network IA gate and
  exposed a real media-path defect on the Lorenzo Meloni Work page: the page
  offered the 16.9 MB historical original instead of resolving the reviewed
  responsive derivative through the Work's explicit proposal alias. Fail-fast
  canceled the sibling jobs after this first failure.
- Expanded reviewed-media resolution with the publication's typed Work aliases.
  Magnum Work pages now render the derivative first, retain the Wave publication
  link and rights credit, and suppress the duplicate large-original panel. The
  bounded original-only fallback remains available when no reviewed derivative
  exists.
- The exact local optimized build independently found that the canonical Gift
  Acquisitions entity `6529NM-AP-ENT-0001` was omitted from the newly fail-closed
  framework classifier. Added the canonical entity ID and slug while retaining
  the legacy alias.
- Focused component tests pass, 15 assertions. Changed-file lint and typecheck
  pass. The full Network IA replay passes in both desktop and 390 px mobile
  Chromium, including derivative-first Magnum media and the permanent versus
  in-progress Collection boundary.

## 2026-08-14T13:42:32Z

- Exact-head review on `9463659f195596f61f0105feb415165e0c036345`
  identified four valid bounded issues: duplicate in-progress work IDs across
  acquisitions, UTF-16 excerpt slicing, an overactive live result count, and
  remaining Research interface strings outside the Museum message catalog.
- Added a cross-acquisition work-ID guard; made excerpts Unicode- and
  word-boundary-safe; separated the immediate visible count from a 350 ms
  debounced live announcement; and moved all Research controls, count forms,
  selected-publication copy, and source labels into the message catalog.
- Also closed the two recurring review advisories: About now selects Casey by
  stable artist slug, and internal work IDs cannot become About figure titles
  or alt fallbacks.
- Exact local follow-up gates pass: four focused suites / 23 assertions,
  changed lint, changed typecheck across 1,715 files, and diff hygiene.

## 2026-08-14T13:55:00Z

- Exact-head App PR CI run `31806044674` used the immutable Museum catalog/source
  fixture pair `975f041a` / `9aea66c0` and exposed one remaining Work-page media
  defect. The accessioned Lorenzo Meloni page still rendered the 16.9 MB source
  behind an intent button because this historical fixture contains no preserved
  responsive derivative.
- Reproduced the hosted failure locally against those exact commits. Added a
  bounded runtime web-derivative path using Next's image optimizer only when the
  Work is accessioned into the permanent Collection through the Magnum
  acquisition and carries the recorded institutional-display rights basis.
  The governed source URL remains the optimizer input and source of record.
- The Work page now presents one responsive image in the canonical Work region;
  source credit, rights language, and the Wave publication link remain intact.
  Large non-accessioned proposal originals retain their explicit-load gate.
- Focused `MuseumProposalImage` and `MuseumObjectPage` suites pass, 17 assertions.
  Changed typecheck passes across 1,715 files. The optimized production build
  completes successfully, including sitemap generation.
- Exact fixed-fixture Network IA replay passes in desktop and 390 px mobile
  Chromium, including one responsive image in the canonical Work region and no
  16.9 MB intent button for the accessioned Magnum Work.

## 2026-08-14T14:18:00Z

- Exact-head App PR CI run `31808053149` found two TypeScript errors confined to
  the new Playwright acceptance helper: a destructured `srcset` width needed an
  explicit undefined guard, and the evaluated Museum root has an HTML/SVG union
  type that requires `textContent` rather than `innerText`.
- Corrected both without changing runtime behavior or rendered pixels. The full
  Jest typecheck ratchet and exact Playwright TypeScript check pass locally.

## 2026-08-14T14:28:00Z

- Exact-head desktop Museum CI on run `31808802608` proved that Collection cards
  for the five accessioned Magnum works still lacked responsive derivative
  candidates, even though their full-size source images rendered.
- Centralized the rights-bounded Magnum institutional-display predicate and
  applied the Next image-optimizer delivery path to both Work pages and
  Collection cards. The governed source remains the input and source of record.
- Replayed the exact CI catalog/source fixture pair `975f041a` / `9aea66c0` in
  desktop Chromium. Collection media, lifecycle, derivative, and geometry
  acceptance now passes. Focused component tests pass, 19 assertions; changed
  lint, changed typecheck, and Playwright typecheck pass.

## 2026-08-14T14:39:00Z

- Exact-head desktop CI run `31809806346` confirmed that Collection cards now
  expose responsive candidates and an accurate `sizes` hint. Its remaining
  failure was an invalid acceptance assumption that Next's fallback `src`
  attribute must equal the smallest `srcset` candidate.
- Corrected the acceptance gate to inspect the browser-selected `currentSrc`,
  require that it matches a declared derivative candidate, and bound the
  selected candidate width to twice the active viewport. This verifies the
  resource the browser actually requests without fighting Next's standards-based
  responsive-image fallback behavior.
- A fresh-server replay against the exact branch and production API endpoints
  passed the corrected Collection acceptance gate. The first attempt timed out
  on one upstream Arweave image request; Playwright's automatic retry completed
  the same acceptance flow successfully.
- Exact-head mobile CI exposed a separate five-second media-settle timeout in
  the broader hub sweep. The card and image were present, but the derivative had
  not decoded before the default poll expired. Aligned this gate with the
  existing 20-second Museum media-settle budget used by the deterministic
  Collection acceptance test.
- The responsive-media hub sweep then passed on hosted mobile CI. The remaining
  mobile pack exposed a stale About locator: the rewritten page correctly uses
  `The 6529 Network Museum`, while the browser test still expected the discarded
  `A public museum for a network state` line. Updated the rendered contract to
  the current heading, collection-purpose section identifier, and compact source
  wording. Updated the same stale source wording in the institutional-practice
  browser contract and retained the 20-second route-readiness budget.
- Exact-head related Jest then exposed one stale Keys and Gates sentence. The
  page correctly states `Selected and unminted. Acquisition and accession remain
pending.`; its unit test still expected the discarded mint-first phrasing.
  Updated the assertion to the shipped lifecycle language.

## 2026-08-14T15:34:00Z

- Exact-head App PR CI run `31813319721` passed Plan, quality/contracts, smoke,
  critical shell, and the production build. The mobile corpus passed 44 tests
  through the complete About, data architecture, Inside the System, and
  institutional-practice routes before finding the same superseded Keys and
  Gates sentence in the browser-level contract.
- Updated both the 16-work program assertion and representative Work assertion
  to the public lifecycle language: `Selected and unminted. Acquisition and
accession remain pending.` No runtime code, copy, media, layout, or rendered
  pixels changed.

## 2026-08-14T23:03:00Z

- Rebased the release branch onto frontend main `1cd65c1d9` and preserved the
  armed squash auto-merge. The focused mobile Keys and Gates route replay passed.
- Resolved the fourteen remaining CodeRabbit threads in four parallel, disjoint
  lanes: reviewed research media and localized fallbacks; safe rendering of
  unclassified acquisition programs; optimized home delivery and unique Work
  media identifiers; and stricter browser acceptance contracts.
- Applied four additional verified review refinements: explicit Casey feature
  selection, removal of a contradictory border utility, restoration of the
  native Related Sources disclosure marker, and a live status region for the
  optimized proposal-image path.
- The combined focused regression set passes: 11 suites, 62 tests. Changed lint,
  changed typecheck across 1,717 files, Prettier, and the Windows-safe diff check
  pass on the integrated tree.

## 2026-08-14T23:16:16Z

- Diagnosed the preceding combined-head App CI failure as one unnecessary
  exported Research landing type. Made the interface module-private. Full Knip,
  changed lint, changed typecheck across 1,717 files, and the Windows-safe diff
  check pass on the corrected tree.

## 2026-08-14T23:28:54Z

- Exact-head mobile CI exposed one stale rendered contract on the permanent
  Magnum work route. The work correctly presents the governed Wave figure under
  the presentation heading; the test still queried the generic media heading.
  Updated the selector to the rendered presentation region. The exact focused
  390px Chromium route replay passes, 1 test in 42.9 seconds.

## 2026-08-14T23:51:00Z

- Exact-head desktop CI found that the Research launch sequence contained only
  two distinct visual sources. The Magnum study was inheriting Casey media from
  the broad Gift Acquisitions program before considering the study's directly
  associated Magnum work.
- Reordered Research media selection so a publication's direct Work or Artwork
  association takes precedence over acquisition and program context. Broad
  relations remain available as fallbacks.
- Added a regression proving direct subject media wins over a program-level
  fallback. The focused Jest suite passes, 6 tests; the exact desktop Research
  browser acceptance passes; changed lint, changed typecheck, Playwright
  typecheck, and the Windows-safe diff check pass.
- Hosted Jest typecheck then identified three fixture-only typing errors in that
  regression: an optional Work list, an optional indexed Work, and an invalid
  program-status literal. The fixture now uses an explicit Work fallback and the
  canonical `open` program status; its diagnostic count is back to zero.
- Exact-head mobile CI passed 44 of 46 remaining Museum routes before finding a
  stale rights test that searched a closed `Related works and context`
  disclosure for the immutable legal-text link. The public disclosure is
  intentional; the test now opens it before checking the exact-commit URL. The
  focused 390px Chromium replay passes.
