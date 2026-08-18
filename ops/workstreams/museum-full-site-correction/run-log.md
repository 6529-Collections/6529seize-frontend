# Run log

## 2026-08-13

- Confirmed frontend base and `origin/main` are exact
  `95ffe58506f7df9884786b42a9faa4c72ee2e346`.
- Merged canonical Museum correction PR #58 as
  `a5b64f7eb586a5a07024b56a0604d8b8ae0ea574`; its tree matches the independently
  reviewed release tree.
- Confirmed canonical post-merge run `31657649972` SUCCESS across Museum
  validation, deterministic Ubuntu, deterministic Windows, focused catalog,
  and public-publication Ubuntu and Windows jobs.
- Full Museum frontend Jest matrix: 67 suites passed, 1 intentionally skipped;
  441 tests passed, 17 intentionally skipped.
- Changed-files TypeScript ratchet: PASS, 1,636 files.
- Changed-files lint: PASS.
- Focused media and acquisition suites: PASS.
- Removed the stale cross-worktree `node_modules` junction and completed a
  frozen, repository-local dependency install so local build/render evidence
  is bound to this worktree.
- Started two independent Luna max read-only audits: Museum factual/semantic
  correctness and UX/accessibility/runtime correctness.
- Independent UX audit found one nested-interactive-control blocker in media
  cards. Removed the media-area link, retained explicit caption navigation, and
  added a 16.9 MB proposal-disclosure regression. Re-review approved the fix;
  focused validation passed 4 suites / 10 tests.
- Updated the rendered E2E contract to require 12 Collection works, Magnum as
  accessioned, Keys and Gates as selected/unminted, five visible Magnum images,
  and the art-led acquisition-section label instead of the discarded “three
  ways” copy.
- Final Museum Jest matrix after the fix: 67 suites passed, 1 intentionally
  skipped; 442 tests passed, 17 intentionally skipped.
- React Doctor diff: 99/100. Its two non-blocking findings are the deliberate
  raw-image renderer needed for governed external media and a pre-existing long
  dynamic program route.
- Independent factual review found three release blockers and they were fixed:
  frontend graph contracts now match entity inventory 1.6 and relation
  inventory 1.5; Casey and Magnum are labeled as gifts using an approved gift
  pathway rather than program selections; and Magnum artist/project cards state
  the Museum's credited institutional-display interpretation while preserving
  copyright and reuse limits.
- Refreshed the exact reviewed-source fixture from the prior 793-entry release
  to the active 888-entry release, including its catalog, commitments, 12
  accessioned works, five Magnum presentation records, and current lifecycle
  assertions. Focused canonical-source and UI validation passed 4 suites / 31
  tests.
- Production build and rendered-route qualification remain in progress.
- Opened ready frontend PR #3730 on a signed, DCO-compliant head; exact-head
  hosted review and CI are running.
- Completed a clean production build: compile 80 seconds, TypeScript 74
  seconds, 3,675 static pages generated in 24.9 seconds, sitemap postbuild
  successful.
- Accepted the valid 6529bot review findings without changing the approved
  visual composition: Collection counts now derive from the active holdings
  and acquisition index; remaining Collection and project labels moved to the
  locale catalog; and media cards now use their governed media credit as the
  single source of presentation credit.
- Diagnosed the superseded-head mobile CI failure before browser startup: the
  Museum surface registry did not yet own the new governance presentation
  support module or the shared acquisition, directory, landing, and research
  components. Registered the complete inventory under its actual surfaces,
  removed one unused landing component, and updated the exact-count sentinel.
- Hosted Knip then identified seven internal functions/constants and four
  internal types that were unnecessarily exported. Made them module-private
  and changed the two affected tests to exercise public rendered components
  instead of test-only exports.
- Exact-head App PR CI run `31662585392` exposed two independent qualification
  defects. The Museum browser lanes were still pinned to superseded catalog
  `970ac8b6...` and source `dfb70240...`, so every route correctly failed
  closed. The current catalog fixture also carried a mistyped, nonexistent
  `975f04d3...` SHA. Rebound CI and the adapter fixture to existing active
  catalog `975f041aed7e2f402ab26d4fb2bb266e07db4974` and reviewed source
  `9aea66c07d59f890e366dde6552a304580ba789a`; CI now verifies both immutable
  commits exist remotely before browser startup.
- The same hosted run found 21 Linux-only TypeScript diagnostics in seven new
  test fixtures. Corrected exact optional properties, template-literal SHA
  types, stale entity-inventory 1.5 fixtures, one unused import, and one source
  narrowing. A clean Linux Node 22.17.1 / TypeScript 5.9.3 ratchet now passes
  at the existing baseline: 2,120 diagnostics in 870 legacy files, with no new
  type debt.
- Exact-head App PR CI run `31664803660` reached the corrected publication
  resolver and failed before browser startup because the new immutable-commit
  existence probes invoked `gh api` without a scoped token. Added
  `GH_TOKEN: ${{ github.token }}` only to that read-only resolver step and a
  workflow-contract assertion; no install, build, application runtime, or
  browser step inherits the token.
- Exact-head App PR CI run `31665044549` passed the immutable resolver and
  reached the rendered Network Museum. The desktop IA gate exposed three stale
  browser expectations for the older Keys and Gates lifecycle phrase
  `acquisition pending`; the approved public presentation and component
  contracts say `unminted`, matching the selected work's actual condition.
  Updated those E2E assertions only; no runtime copy or rendering changed.
- Exact-head App PR CI run `31665399033` then reached the accessioned Magnum
  Work route on mobile and proved that the 16.9 MB intentional-view gate still
  hid the canonical photograph behind a button. Acquisition exhibition pages
  already render the same governed sources as art. Removed that gate on the
  canonical Work presentation as well: accessioned Magnum Works now display
  their governed image immediately while preserving exact credit, rights,
  source link, no-download behavior, and the upstream file unchanged.
- Exact-head App PR CI run `31665927006` passed the complete mobile Network IA
  gate, including the now-immediate Magnum Work image, then found one stale
  data-architecture browser label. Updated the assertion from the superseded
  `Read the machine application profile` to the public museum copy already
  rendered by the page, `Read the publication profile`; runtime content is
  unchanged.
- A direct removed-copy scan then found two further institutional-practice E2E
  expectations for the superseded Keys and Gates qualifier `Not yet minted or
accessioned.` Updated both to the already-approved public sentence `Minting
comes first; acquisition and accession follow.` before the next hosted lane
  reached them; no runtime copy changed.
- PR #3730 passed all exact-head review, security, desktop/mobile Museum,
  production-build, shell, smoke, and quality gates and merged as frontend main
  `89fd86d3dae0fce64435ff03d9ae3e53260d86be`.
- First staging composition `0334d0c93b544dfd9ff5e0076da66ecc38e3d14e`
  deployed successfully in run `31667595266`; automatic staging E2E run
  `31668157351` also passed.
- Three independent post-deploy audits inventoried 668 accepted Museum request
  paths and found four narrow corrections before production: stale public help
  facts, a program-to-Work lifecycle label that treated accessioned gifts as
  selections, Magnum Photos described as publisher rather than originator, and
  two process-sounding landing sentences. A claimed mobile image-width issue
  was rejected because the rendered image already carries `tw-w-full` and
  `tw-h-auto` under the site's responsive image contract.
- Opened a follow-up branch from exact merged main. Corrected those factual and
  editorial defects with targeted regressions; focused validation passed five
  suites / 19 tests, help-index sync, Museum surface registry, changed lint,
  changed typecheck, and the Windows-safe diff check.
- Follow-up exact-head run `31670163257` passed build, quality/contracts,
  shell, smoke, and all external checks. Its desktop Museum lane then found
  one stale browser assertion for the corrected acquisition-program heading.
  Runtime and component tests used the approved heading, while the
  institutional-practice E2E still expected the previous wording. Updated
  that assertion only; no
  runtime, source, rights, relation, layout, or public-copy behavior changed.
- The authenticated whole-site crawler expanded all 57 accepted route patterns
  into 668 concrete Museum URLs. Against the first staging composition, all
  668 returned successful Museum-bound responses with no visible soft-404 or
  publication-unavailable state. This preliminary result will be repeated
  against the corrected staging and production releases.
- PR #3733 merged as frontend main
  `d438a57eb58d3abaf4d7fc549441c9a5af253190`. Staging deploy run
  `31681902527` and automatic staging E2E `31682667244` passed. The repeated
  authenticated crawl passed all 668 routes; a separate decoded-media audit
  confirmed all 12 permanent Collection works, all five Magnum works, and all
  16 Keys and Gates selections painted nonzero images.
- Independent post-staging editorial, IA, media, and visual audits found
  release-blocking document association and presentation defects: sibling
  object and artist manuscripts could be inherited through shared parent IDs;
  document IDs containing slashes or colons produced broken Research routes;
  the Collection hero left the first desktop viewport blank; portrait project
  media clipped; wide tables were unusable on mobile; and complete technical
  manuscripts produced 100,000–300,000-pixel continuous pages.
- PR #3735 exact head `17e6fb8e2fdfbc30318fa6b16656775d3627b917`
  corrects those defects and adds plain museum-language accession channels.
  Local qualification passed 78 focused/regression tests, changed lint,
  changed typecheck, formatting, and the Windows-safe diff check. Hosted
  exact-head review and CI are in progress.
- PR #3735 passed its final exact-head review and CI gates and merged as
  frontend main `3bf97fb98a330e9fd42bcef40b0ffaec1d415aaf`.
- Staging composition `025db98989f8b2150323d860a9c9f22e98005900`
  deployed successfully in run `31689338698`. Independent qualification
  passed all 651 current Museum routes, all 12 permanent Collection images,
  all five Magnum images, all 16 Keys and Gates images, and 12 retained
  desktop/mobile overflow and visual checks.
- Automatic staging E2E run `31690074532` passed 16 of 17 packs. The sole
  failing pack exposed four stale assertions: two expected long manuscripts
  to remain permanently expanded and two counted every contextual Work link
  as a unique artwork card. The runtime, route crawl, media paint, layout, and
  public copy all passed.
- Updated the institutional-practice browser contract to open semantic
  disclosure ancestors before checking tiered manuscript content and to count
  artwork figures rather than unrelated contextual links. The exact failing
  pack now passes 70/70 against staging across desktop and mobile. Changed
  lint, changed typecheck, formatting, and the Windows-safe diff check pass.
- PR #3737 passed all hosted review and CI gates and merged as
  `3fe402fc2e0c13be5ffb18bf16785c6560d7f7a2`. Staging composition
  `e1be20a52eb197f0b2dc6ca3332a79ebb7c35e78` deployed in run
  `31693491032`; automatic staging E2E run `31694252972` passed all 17 packs.
- Two unrelated profile-interface PRs merged to protected main while the
  Museum staging gates ran. The final production candidate therefore became
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0`; neither intervening change
  touched Museum runtime, tests, publication code, or routes. The unchanged
  Museum release had already passed staging twice, and the final production
  E2E exercised the complete exact candidate.
- Production deploy run `31697156091` succeeded. Three consecutive live
  `/api/version` checks returned exact version and announced version
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0` with `stale:false`.
- Automatic production E2E run `31698559323` succeeded: the read-only pack
  job passed and the isolated verifier accepted the resulting evidence.
- Independent live qualification expanded the current Museum surface
  registry and publication into 651 concrete routes. All 651 passed with no
  HTTP failure, soft 404, publication-unavailable state, or redirect outside
  the Museum boundary. Report:
  `C:\Users\Administrator\.codex\artifacts\museum-full-site-correction\production-6c7914a4-651-routes.json`.
- The exact-source desktop/mobile Museum IA suite passed 6/6 on production.
  It verified the two completed accessions in the permanent Collection,
  Keys and Gates as selected and unminted, all five Magnum images, all 16
  Keys and Gates images, canonical Work relations, responsive overflow,
  keyboard/touch navigation, and automated WCAG A/AA checks.
- Research release pre-PR visual gate: an exact 27-capture corpus from
  frontend candidate `17d777a0a9675eccd0d7f0007e296b32344a1ce2` and source
  `e5b9c0e1e39e910baf10f93490b541685ec460fb` received copy PASS but museum
  and UX BLOCK. The blockers were long unedited manuscript pages, repeated
  generic diagrams, incomplete hero credit/status context, and insufficient
  acquisition-work display. No PR was opened.
- Corrective implementation added exact-heading reading projections, complete
  manuscript disclosures, separate supporting-record disclosures, all-work
  acquisition galleries, complete qualifier plus credit rendering, distinct
  Met Open Access public-domain images with local responsive derivatives and
  a hash-checked media manifest, focused regressions, and the permanent
  screenshot/adversarial-review gate in repository instructions.
- Three pre-capture static Luna audits ran in parallel. Media and progressive-
  reading audits blocked the first correction on responsive gallery sources,
  incomplete legacy-asset hash coverage, prefix/fenced/duplicate heading
  ambiguity, a failed-projection full-manuscript fallback, source-matrix
  truncation, and heading depth. The corrected candidate carries responsive
  source sets through related Work cards; verifies every manifest file hash;
  selects one exact unfenced heading per request; fails required acquisition
  readings closed; keeps generic long studies collapsed; preserves the full
  source matrix; and nests manuscript headings beneath the editorial section.
- Frontend PR #3753 exact-head hosted run `31931078978` failed its desktop
  Museum gate because the protected Playwright fixture still used superseded
  reviewed source `9aea66c07d59f890e366dde6552a304580ba789a`; the stricter
  Research publication contract correctly rendered the fail-closed state.
  Advanced the immutable CI fixture and its workflow contract test to exact
  reviewed publication `f9253968389f97f62eaea79ab7880d1daafbc00c`. The same
  local IA reproduction then exposed two stale assertions from the discarded
  Research landing: an old prefixed Keys and Gates essay title and a six-card
  Museum-practice count. The acceptance contract now names the final essay
  title and all four final Museum-practice entries. Exact desktop IA passed
  6/6; exact mobile IA passed 3/3 with three desktop-only checks skipped; the
  fixture/workflow contract suites passed 71/71. Runtime, visual composition,
  public copy, media, and routes were unchanged.

## 2026-08-16T08:49:00Z - Mobile architecture navigation contract corrected

- Exact-head hosted run `31937137281` reached the mobile Museum browser lane
  and found two matching DOM links for the first data-architecture standard:
  one in the selected reading and one inside the complete-record disclosure.
  The test had asserted one link in the whole document rather than one visible
  visitor control.
- Restricted the navigation locator to the visible link. The exact failed test
  now passes against the optimized local visitor build, and the complete data-
  architecture suite passes 6/6 across desktop and 390 px mobile. No runtime,
  copy, media, route, or visual output changed.

## 2026-08-16T09:25:00Z - Smithsonian date roles disambiguated

- Exact-final curatorial review found that the _Museums to learn from_ source
  image visibly labels the depicted Gallery of Art `ca. 1860`, while the page
  caption used the Smithsonian object-record date `1857` without explaining
  the relationship.
- The Smithsonian Open Access API record for `siris_arc_401640` identifies the
  object as _Gallery of Art, Smithsonian Institution Building, or Castle_,
  dates it `1857` and `1857 (copied 1950s)`, and describes it as an engraving
  interior view. Revised the visible credit to retain the institutional date,
  identify the later copy, and transcribe the source mount's `ca. 1860` label
  as a distinct depicted-scene label.

## 2026-08-18T13:28:00Z - Final Research source hierarchy correction

- The exact 33-capture v24 adversarial gate passed deterministic browser and
  product checks but correctly blocked release because the visitor spelling
  for Keys and Gates outcome `6529NM-AP-01-OUT-002` had been normalized only
  in frontend code. The media credit still exposed the submitted typo.
- Created Museum source PR #65 with append-only display-title authority. The
  change preserves the submitted outcome, verbatim statement, and Wave
  evidence while changing only the public Work and Media labels, derived
  hashes, and amendment references. Lifecycle, rights, accession, Collection
  membership, source media, and media fixity are unchanged.
- Reviewed source commit
  `df409fc28bd29c806887bf8ebe6007f5accfbfaf` passed all local publication,
  schema, replay, inventory, bundle, manifest, and diff checks plus an
  independent registrar review. Frontend focused tests pass after removal of
  the private title override and rebinding the CI source fixture to that exact
  reviewed publication.
- Source PR #65 merged with all seven hosted checks green as canonical Museum
  main `b583c5102faabd908e7a99cdf0343f3866d31c26`. It had no review threads or
  actionable bot findings; the generated-file volume exceeded the configured
  AI-review budgets, so the independent registrar review remains the material
  content review.

## 2026-08-18T14:30:11Z - Public scholarship projection sealed

- The v25 screenshot and editorial gate found that public manuscripts still
  exposed the archival submitted spelling after Work and Media labels had been
  corrected. Added a source-level projection across the nine current Keys and
  Gates visitor manuscripts and a regression test that rejects the archival
  spelling outside the archival outcome, selected-work record, and amendment.
- Independent registrar review passed candidate
  `b639c42ef5a37ac13cdc528434bd10f2c54ecea4` with no findings. Archival source
  blob identities were unchanged, and no lifecycle, rights, mint, acquisition,
  accession, Collection, media-locator, or media-byte fact changed.
- Museum PR #66 merged with all seven hosted PR checks green at canonical main
  `6fe93bf17f0c30b79889d3d7bfabaebae3369ef7`; reviewed source is
  `f52fe5513423d8049bb557749a9fce1070ace64b`. Frontend CI fixtures now bind
  those exact revisions. Post-merge Museum validation is running in parallel
  with the final frontend build and screenshot gate.

## 2026-08-18T15:30:00Z - Atomic publication and mobile diagrams corrected

- The v26 screenshot corpus exposed that canonical source had merged while the
  active publication pointer still referenced source
  `75171e81587c9da313e4e3967b12cfe0aa6bbf46`. Museum PR #67 activated the
  immutable catalog for reviewed source
  `f52fe5513423d8049bb557749a9fce1070ace64b` and merged as canonical main
  `a3977a8f020f58d0c9e79f23bc4f37245be65879` after all six validation jobs and
  CodeRabbit passed.
- Independent UX review also blocked the two 1600-by-1000 institutional
  diagrams at 390 pixels because their labels were unreadable. Both routes now
  use retained, fixity-recorded 640-pixel portrait diagrams below the `sm`
  breakpoint while preserving the original desktop compositions.

## 2026-08-18T16:02:00Z - Exact-final Research corpus accepted

- Merged current frontend main
  `1ded71fa7fe925dcb04956df92acbbd9d57fffb7` into the release branch. The
  merge was conflict-free and touched no Museum runtime, route, public copy,
  media, or Museum test file. The signed exact candidate became
  `2e87c0bbfc1f99a24063e5b9397d37b19a575a87`.
- Ran the complete optimized production build on that exact merge tree. Full
  repository lint, compilation, TypeScript, generation of 3,675 pages,
  sitemap generation, and postbuild passed.
- Captured all 11 Research routes at 1440 x 1000, 820 x 1000, and 390 x 844
  from the exact production build. The 33-image v28 report records HTTP 200 for
  every route and zero overflow, image failures, visible fallbacks, console
  errors, page errors, or deterministic blockers. Report SHA-256:
  `6c6bfc4fe7b0971829c62d71ffb73b8ee0758da49f418a93e4482f7ceb6d3ea6`.
- Compared every final screenshot hash with the preceding reviewed corpus.
  All 33 match exactly, proving that the unrelated main merge did not alter a
  Research pixel.
- Three independent full-corpus reviews passed:
  - museum/registrar review: PASS after checking the canonical append-only
    display-title amendment, preserved archival outcome, acquisition states,
    taxonomy, rights, sources, and Casey/Magnum/Keys and Gates balance;
  - visual/UX review: PASS across all widths, including mobile diagram
    legibility, hierarchy, density, spacing, cropping, and overflow;
  - copy/editorial review: PASS after original-resolution and rendered-HTML
    verification of all visible Research headings, summaries, labels, and
    calls to action.
- Museum canonical post-merge validation run `32154815623` is SUCCESS across
  Museum validation, deterministic Ubuntu and Windows, focused Stream catalog,
  and public-publication Ubuntu and Windows.
- The branch is ready for exact-head push, hosted review and CI, merge, staging
  qualification, production deployment, and live route-by-route acceptance.

## 2026-08-18T19:03:00Z - Research release shipped and live-qualified

- Merged frontend PR #3753 as exact main
  `336d3f9ed6839fd2fa97a677b25d5353aa4fc884` after all exact-head review and CI
  gates passed.
- Deployed and inspected staging with run `32165422116`. All selected Museum
  packs passed in staging E2E `32166673862`; its sole failure was the existing
  non-Museum profile route fault. The retained Research sweep passed 22/22
  desktop/mobile checks.
- Production authority, immutable artifact build, and independent verification
  passed in deploy `32170385482`, builder `32170437082`, and verifier
  `32171381138`. Production serves and announces exact main with `stale:false`.
- Automatic Production E2E `32171973579` never reached tests because its
  GitHub-hosted runner stalled in Playwright installation for 22 minutes. It
  was force-cancelled under the active owner-approved E2E waiver; authority
  completion `32174375703` successfully recorded the failed qualifier and
  released the lock.
- Ran the five exact Museum production packs directly against live production:
  101 passed and 3 intentional skips, with zero product failures. A first
  Data Architecture pass observed unrelated navigation-prefetch 502s for
  `/waves` and `/join-6529`; immediate rerun passed 6/6.
- Rechecked every Research route at 1440 and 390 pixels in the signed-in app
  browser. All 22 checks had the expected heading, intact media, bounded width,
  and no soft-404. Retained report SHA-256:
  `bb4c318d2a4a4432859f4a659b8a493a551c930e84cc2a1d8d824e2a1e845794`.

## 2026-08-18T20:10:00Z - Acquisitions and Artists balancing follow-up

- Audited the live Acquisitions and Artists indexes at desktop width. Native
  source aspect ratios caused visibly unequal image boxes and cascading row
  heights on both primary Museum pages.
- Implemented a fixed 4:5 desktop acquisition stage, a compact 4:3 responsive
  acquisition stage, and a 4:3 artist-directory stage, preserving complete
  images without cropping. Acquisition cards now share equal heights; the
  Works directory keeps its prior source-ratio behavior.
- Added component assertions and read-only browser contracts for exact stage
  counts and ratios. Focused unit tests, changed lint, and changed typecheck
  pass. Initial local browser checks at 1440 and 390 pixels show no horizontal
  overflow and the expected 3 acquisition and 21 artist stages.
- Completed the full-page visual sweep at desktop, tablet, and mobile widths.
  The responsive acquisition stage is 4:5 only with the three-column desktop
  composition and 4:3 below it; every artist stage remains 4:3. The deterministic
  release acceptance suite passes all three owned viewports.
- The acceptance suite exposed that a responsive Magnum derivative was visually
  hidden by overflow but retained bounds taller than its frame. Added an
  explicit full-height proposal-image container; all principal media now remain
  geometrically within their stages.
- Two clean-build attempts passed repository lint, optimized compilation,
  TypeScript, and page-data collection. Both encountered the same unchanged
  `/museum/network/about/governance` static-generation timeout; the second was
  stopped after the duplicate infrastructure condition. Hosted exact-head CI
  will provide the authoritative full-build result.
- PR #3780 review follow-up adds an explicit square fallback for dimensionless
  source media in the unchanged Works-card behavior, removes a hardcoded
  responsive-breakpoint expectation from the browser contract, and avoids an
  empty class-name suffix. No Acquisitions or Artists layout pixel changes.
- Hosted App PR CI exposed four Linux lint errors in the new fallback helper:
  nullable dimensions in a template literal and nested conditional branches.
  Replaced the conditional expression with explicit branches and string
  conversion. The focused 16 tests, changed lint, changed typecheck, formatting,
  and diff checks pass; there is no runtime or visual change.

## 2026-08-18T21:36:00Z - Acquisitions and Artists release live-qualified

- PR #3780 reached exact signed head
  `f2f59c1962846598fb2c1e939353f103a0742e35`. App PR CI
  `32181363168` passed quality, production build, smoke, desktop Museum, mobile
  Museum, and installed-app checks; all external review, policy, and security
  lanes were green. The PR merged as exact main
  `40a293406b6c04ca8057b02ccb8fbd5e05d192c7`.
- Composed exact main into staging as
  `80503176dacc334ba8132681486a138d660832c9`. Staging deployment
  `32183553695` passed artifact build, verification, deployment, and HTTP
  version checks. A direct desktop and 390-pixel mobile Museum sweep passed.
- Automatic staging E2E `32184698162` ran 17 read-only packs. The core pack and
  all selected Museum packs passed, as did publication provenance and immutable
  evidence validation. The aggregate failed solely in the unrelated media pack
  on `/the-memes/mint`; a direct rerun proved that failure transient and then
  exposed an existing mobile overflow in the Meme Lab activity table. The
  release proceeded under the recorded owner-approved temporary E2E waiver
  because the failure was outside the Museum diff and all scoped acceptance was
  green.
- Waiver record: the 6529 Collections repository owner authorized this one
  release under the live `STAGING: OFF` / `PRODUCTION: OFF`, `changeable: true`
  Release Bus manual fallback. Its stable identifier is immutable release main
  `40a293406b6c04ca8057b02ccb8fbd5e05d192c7`. The exception covered only the
  unrelated `/the-memes/mint` staging media-pack failure and the pre-existing
  Meme Lab activity-table overflow found on rerun. It covered no Museum check
  or acceptance finding. Its validity period began at the terminal result of
  staging E2E `32184698162` and expired on successful automatic Production E2E
  [`32187596393`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32187596393).
  Retained fallback evidence: staging deploy
  [`32183553695`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32183553695),
  staging E2E
  [`32184698162`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32184698162),
  and the manual-fallback procedure in `ops/skills/deploy-6529/SKILL.md`.
- Production deployment `32186095060` passed exact production authority,
  immutable artifact selection and verification, Elastic Beanstalk readiness,
  HTTP version verification, announced-version publication, terminal status,
  and durable release-report upload. Exact artifact build `32186126216` passed
  in 10m03s.
- Production returned exact main on three uncached `/api/version` reads with
  `stale:false`. Direct live Museum acceptance passed 2/2 viewport projects in
  20.2 seconds, including all hub routes, 21 artist stages at 4:3, three
  acquisition stages at the intended responsive ratio, no dead links, and no
  horizontal overflow.
- Automatic Production E2E `32187596393` passed the full production-safe
  read-only pack set, Museum selection, publication provenance, immutable
  evidence validation, authority evidence, and the isolated evidence verifier.

The exact production release is qualified and the follow-up is closed.
