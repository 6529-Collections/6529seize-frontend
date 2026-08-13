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
  one stale browser assertion for the corrected acquisition-program heading:
  runtime and component tests correctly rendered `Works acquired or selected
  through this program`, while the institutional-practice E2E still expected
  `Works selected through this program`. Updated that assertion only; no
  runtime, source, rights, relation, layout, or public-copy behavior changed.
- The authenticated whole-site crawler expanded all 57 accepted route patterns
  into 668 concrete Museum URLs. Against the first staging composition, all
  668 returned successful Museum-bound responses with no visible soft-404 or
  publication-unavailable state. This preliminary result will be repeated
  against the corrected staging and production releases.
- Final correction PR #3731 passed all exact-head checks at
  `dc02cb29898fd6a39c9be916aa014b5f3a86eb10` and merged as frontend main
  `aa9a33f2e90efcb50e9a6fc2e704788406d83802`.
- Final staging composition `a4b5d26f140096adade71627e715aa9c5e1b37d9`
  deployed successfully in run `31672717558`. The authenticated final staging
  crawl passed all 668 Museum routes. Automatic staging E2E run `31673246237`
  passed every Museum pack but failed one unrelated mobile Memes mint test on
  a transient Server Components error; isolated read-only media rerun
  `31674047260` passed without a source change.
- Production deploy run `31674231646` completed successfully on exact main
  `aa9a33f2e90efcb50e9a6fc2e704788406d83802`. Eight consecutive live version
  reads returned that exact version and announced version with `stale:false`.
- Automatic Production E2E run `31675378896` passed, including isolated
  evidence verification. The final production crawl passed all 668 Museum
  routes. Retained production desktop/mobile pixels confirm Magnum's status as
  accessioned into the permanent Collection and Keys and Gates as selected,
  unminted, and pending acquisition.
- Final canonical Museum source remains
  `a5b64f7eb586a5a07024b56a0604d8b8ae0ea574`, with active catalog
  `975f041aed7e2f402ab26d4fb2bb266e07db4974` and reviewed publication source
  `9aea66c07d59f890e366dde6552a304580ba789a`.
