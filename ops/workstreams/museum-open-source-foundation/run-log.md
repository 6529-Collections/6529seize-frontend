# Run log

## 2026-08-03 - kickoff and audit

- Fetched frontend `origin/main`, verified exact head
  `472da902945bfeab51cde4439da6dbafa90ecb90`, and created clean branch
  `codex/museum-open-source-foundation` before tracked edits.
- Audited the shared Museum layout and shell, all visitor and legacy routes,
  strict publication identity, immutable URL builder, i18n catalog, help corpus,
  route tests and the prior visual-fidelity contract.
- Confirmed one shared shell insertion covers the complete Museum route tree and
  can reuse the already-loaded atomic publication identity.
- Fetched canonical Museum main and verified exact source head
  `92429032013b9dfdb626ff6860e272191a89dfc4`. Existing design sources are
  `docs/onchain-design.md`, `docs/external-works-registry.md` and
  `specs/onchain/contract-migration-v1.md`; no contributor guide or public Open
  Museum/transition manuscript is present at that release.
- Coordinated the missing source contract with the owning Museum task. It fixed
  the governed paths as `CONTRIBUTING.md`, `docs/open-museum.md` and
  `docs/onchain-transition.md`, all destined for the release manifest, with the
  first two visitor manuscripts and preferably all three files required by the
  atomic publication.
- Recorded the approved Fall 2026 goal and the mandatory adjacent
  not-deployed/not-activated qualifier. No backend, contract address,
  deployment, activation, migration, audit or on-chain write is claimed.

## 2026-08-03 - implementation and canonical activation

- Bootstrapped the isolated frontend on port 3206 and installed frozen
  dependencies. Read the repository's Next.js 16 documentation before changing
  the async server layout and shared shell.
- Added three strict governed publication paths and document kinds, atomic
  assembler requirements, fixed-origin immutable/source-main GitHub link
  builders, shared source/contribution strip, full About treatment and compact
  Sources context. All interface copy is in Museum en-US i18n; governed
  manuscripts remain exact sanitized source.
- Updated the Museum help source and generated public help index. Added route,
  component, security and fail-closed publication tests.
- Candidate QA used source branch `codex/museum-open-record` only in an
  uncommitted local preview. It rendered exact candidate head
  `7fdba8312b1433c1e5466cf07c4154c42ba78049`; the override was removed before
  canonical activation.
- Museum PR #20 merged. A strict `main` probe resolved exact commit
  `bd853b483f807aad6d737305a9f78b1273bb2356`, 213 entries, manifest SHA-256
  `sha256:a403df4d775def50abf22e45829c4c47f8c239f98adb72a0375e589425f4c2cf`
  and Keccak
  `0x9e3eb6b11197c67ad4c92106213568e0af33018b8bd9fd312f2b5376c0d399c4`.
  It assembled 26 public documents and verified all three required files.
- Canonical-main browser QA passed at 1280x720 and 390x844: one H1, native 6529
  shell, black/Montserrat/iron/primary-blue tokens, exact source links, canonical
  contribution action and no horizontal overflow. The home strip renders once
  and remains subordinate to artwork.
- Focused tests passed 24/24, broad Museum regression passed 124/124, changed
  lint and changed/test typechecks passed, React Doctor scored 100/100,
  whitespace/path scrubs passed, and the production build completed
  successfully. Final exact-head gates will be rerun after ledger freeze.
- Final frozen validation passed 8 focused suites / 49 tests, 63 Museum suites /
  124 tests, changed lint/typecheck, Jest and Playwright test typechecks, React
  Doctor 100/100, help sync, public-artifact path scrub and `codex-diff-check`.
  The first final build compiled but a force-stopped preview had left one
  malformed ignored `.next/dev` validator comment; after repairing only that
  generated cache line, a clean production build completed successfully in
  405.7 seconds.
- Retained production-build visual evidence under this workstream's `evidence/`
  directory: About desktop/mobile, home source strip, object mobile and Sources
  mobile. Desktop measured `1280/1265/1265` and mobile `390/375/375` for
  inner/client/scroll width respectively, proving no horizontal overflow.

## 2026-08-03 - owning-review correction

- Responded to two release blockers on PR #3554: the shared strip no longer
  links to a repository tree or claims one file is the exact source of a
  mixed-content page, and embedded Open Museum/transition manuscripts no longer
  repeat their recognized leading title/status front matter.
- Added a closed route-source projection from the active publication's 213
  manifest-admitted paths. It maps all 57 currently rendered Museum routes,
  rejects unknown/unsafe paths, and intentionally leaves the server-only
  `/collections` redirect family unmapped so the destination owns the claim.
- Each mapped route now exposes `View primary source` at
  `blob/<exact commit>/<primary path>`, `Suggest an improvement` at the same
  path on `edit/main`, and a separate maintained contributor guide. Related
  records use exact immutable hrefs with closed visitor labels and exact paths
  in accessible context.
- The About source readback used canonical source commit
  `bd853b483f807aad6d737305a9f78b1273bb2356`: primary
  `docs/open-museum.md`, related `docs/onchain-transition.md` and
  `policies/founding-and-operating-principles.md`. The page contained one H1,
  one designed operating-status label and zero raw duplicated status labels.
- Focused validation passed 5 suites / 50 tests; the complete Museum regression
  passed 64 suites / 144 tests; changed lint and changed typecheck passed;
  React Doctor scored 100/100. A clean optimized production build completed in
  434 seconds.
- Production-build browser QA passed at exact 1280 x 720 and genuine 390 x 844
  viewports. Both measured equal inner, client and scroll widths. Retained
  About and complete source-strip pixels are indexed in `evidence/README.md`.
- Hosted Sonar analysis on the first correction head reported no issues but
  failed its duplication threshold: 55 duplicated new lines, all inside the
  related-source label switch in `MuseumSourceContribution`. Replaced that
  switch with a closed typed label-to-message-key record and one translation
  call. The refactor changes no element, copy, href or CSS; focused component
  tests, changed lint/typecheck and whitespace checks passed, so the approved
  production-build pixels remain representative.
- Fresh review then identified three valid fail-closed/documentation gaps.
  `invalid` and `partial` legacy source states now suppress immutable/edit
  claims exactly like unavailable state; the client component imports only
  client-safe publication modules instead of the server-capable barrel; and
  adversarial tests prove a changed title or added status caveat returns the
  governed manuscript untouched. The active context now records the completed
  canonical Museum validation workflow from its correct repository.
- Exact-head App PR CI run `30798033364`, job `91637388328`, stopped at Knip on
  three introduced dead API surfaces: one unused publication-path constant and
  two interfaces exported despite being module-internal. The runtime-neutral
  correction deletes the constant and makes both interfaces private while
  retaining the catalog and label types imported by callers. Full Knip against
  exact merge tree `35a0a8f6732b4d606762b472ad1cd20948e9791c` no longer reports
  those symbols; the Windows run still reports the repository's unrelated
  platform baseline (7 script files and 95 legacy exports), so the fresh hosted
  Linux merge-tree run remains the authoritative zero-introduced-debt gate.
- Follow-up validation passed 3 focused suites / 28 tests, changed lint,
  changed typecheck, React Doctor 100/100, targeted Prettier, public-artifact
  path scrub and `codex-diff-check`. No runtime, JSX, CSS, copy, href or retained
  visual evidence changed, so the approved production-build pixels remain
  representative pending renewed exact-head approval.
