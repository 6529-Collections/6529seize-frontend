# Run log

## 2026-08-05 canonical source release

- Built and independently reviewed a Museum-native architecture around eleven
  complementary standards. Each essay opens in ordinary museum language,
  follows with the Museum's use and limits, and ends with precise expert and
  machine implementation material.
- Added schemas and a fail-closed semantic validator for the profile and Casey
  schedule. The schedule binds exactly seven Museum objects to CAIP-19 identity,
  custody evidence, metadata and generator fixity, accession state,
  preservation state, and retention state.
- Corrected technical boundaries during review, including CIDOC CRM's physical
  domains and software-agent limits, LIDO resource-set rights, PREMIS
  conformance, PROV bundle typing, IIIF Canvas/AnnotationPage/Annotation and
  rights URIs, C2PA created/gathered assertions, and OCFL version inventories.
- Museum source PR #30 passed all deterministic validation lanes and an exact-
  head 6529bot follow-up with no findings. It merged as canonical commit
  `ad8ea4338659e0825dc5a79295e824eadec876e6` with 345 manifest entries,
  SHA-256
  `sha256:258a2aa6a970cc84d036de511902cbc1d5fbb5141067cc146fe83ac879d20544`,
  and Keccak-256
  `0x9ccca279ca25f1d0b65b2430168dd192a87dee77b682f63db25de44fc899ea26`.

## 2026-08-05 frontend candidate

- Extended the strict Museum publication assembler with the architecture
  profile, all eleven essays, the Casey implementation essay, and the complete
  machine schedule.
- Added a Methodology reading room, individual standards pages, the Casey
  worked example, canonical relative-link projection, exact source panels, and
  machine disclosures.
- Local publication and route tests cover atomic omission, profile drift,
  official-source constraints, implementation-state vocabulary, CAIP/hash/
  transaction shape, exact object identity and title binding, source links,
  Markdown links, page routes, and full disclosure fidelity.
- Initial local validation passed 74 Museum suites / 248 tests, changed lint
  and typecheck, React Doctor 100/100, help-index sync, whitespace checks, and
  an optimized build. The first browser preview was blocked by a stopped shared
  local API; a read-only production-API preview restored the route. Final visual
  evidence will be taken from the exact merged source build and release stages.
- The final optimized build against exact canonical source
  `ad8ea4338659e0825dc5a79295e824eadec876e6` passed in 300.8 seconds. Its
  standalone preview initially served HTML for static chunk requests because
  the generated static directory had been mounted after server boot; mounting
  it before boot corrected the harness without a product change.
- Added a manifest-declared Museum-only E2E pack for local, staging, and
  production. The pack verifies the overview, all eleven standards through
  client-side reading-room navigation, the Casey audit, both full machine
  disclosures, one immutable source edition, desktop and mobile layout, and
  console/response cleanliness. Local production-build replay passed 6/6 in
  29.3 seconds. Local-only shell allowances cover the known production-API
  cross-origin and rate-limit noise; staging and production retain zero such
  allowances.
- Frontend PR #3629 opened at exact signed head
  `eebd8a48fda872a89b16373654bbcdef3225c91a`. Exact-head 6529bot review found no
  security or i18n defect, and raised two valid publication concerns: unknown
  profile metadata did not share the page's 404 boundary, and the machine
  disclosures reconstructed governed JSON instead of presenting the verified
  source bytes. The correction shares one standards contract across assembly,
  Markdown routing, completeness, source mapping, and E2E; makes metadata fail
  unknown slugs closed; retains the validated profile and schedule source JSON;
  renders those exact strings; and tests source-byte identity. The requested
  Museum data-architecture locale fallback record is also added.
- The full Museum regression after these corrections passed 74 suites / 249
  tests. The dedicated pack remains in pull-request CI by design: its
  `changeScope: "museum"` trigger limits the 29-second browser suite to changes
  that touch Museum surfaces. It is also included in the combined manual
  production-safe read-only pack, so the aggregate and the parallel
  post-deployment release packs cover the same Museum surface.
- The public adapter deliberately follows canonical Museum `main`. Every
  architecture route must expose the same verified, immutable source commit,
  while the release test does not hard-code a commit that would become stale
  when the separately governed source repository advances. This moving-source,
  exact-edition boundary is an explicit product invariant rather than an
  omitted deployment pin.
- After merging frontend `main` commit `67068d87c` into the candidate, the
  optimized production build passed in 590.6 seconds; the About-page copy
  change merged without conflict. Four focused post-merge suites passed 27
  tests before the build.
- The superseded initial-head App PR CI exposed four release-contract
  assertions that still described the six-pack Museum inventory. The release
  manifests now declare nine Museum packs across local, staging, and
  production; staging and production post-deploy counts are 15 and 14; the
  staging workflow offers the new pack; the Museum PR lane runs it; and the
  manual production aggregate contains it. Both affected contract suites now
  pass all 32 tests.
- The complete 17-suite release-contract replay passed 15 suites / 259 tests.
  Its two local failures are unrelated Windows capability boundaries already
  enforced by the repository: the policy-bundle suite fails closed where
  Node does not provide POSIX `O_NOFOLLOW`, and the status-helper suite's
  isolated test `PATH` cannot locate the Windows `gh` wrapper. Hosted Ubuntu
  remains authoritative for those two suites; no product or release assertion
  introduced by this change failed.
