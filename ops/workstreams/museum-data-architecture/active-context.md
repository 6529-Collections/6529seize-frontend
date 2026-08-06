# Active context

## Museum data architecture

- Goal: publish the Museum's ontology and digital-preservation architecture as
  public education: readable first encounters for artists and collectors,
  exact technical profiles for specialists and machines, and a worked mapping
  of the seven Casey Reas accessions.
- Canonical Museum source PR #30 merged the architecture at
  `ad8ea4338659e0825dc5a79295e824eadec876e6`. Copy-edit PR #32 subsequently
  merged the requested punctuation pass into canonical `main` at
  `6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73`.
- Current canonical release: 345 manifest entries;
  `sha256:7758e2f183c3df23016f99cf2e66f77518457f45931557155bbd8c7980577872`;
  Keccak-256
  `0xefd12f26d44350738a9653c241f114d60e2474da70d617c000de3d5161aae952`.
- Publication boundary: one Museum-native overview, eleven standards essays,
  the complete machine profile, one Casey Reas implementation essay, and the
  exact seven-object machine schedule. Spectrum, CIDOC CRM, LIDO, PREMIS,
  PROV-O, Getty AAT/ULAN, IIIF, C2PA, BagIt, OCFL, and CAIP-19 retain their
  distinct roles. Stream convergence is deferred and non-normative.
- Product boundary: a restrained reading room below Methodology, individual
  standard routes, one worked-example route, exact source/contribution panels,
  and explicit machine-readable disclosures. No primary-navigation expansion.
- Trust boundary: every architecture document is required atomically from one
  verified source commit. Missing documents, profile drift, malformed official
  references, incorrect implementation states, Stream becoming normative, or
  any mismatch between the Casey schedule and accession objects causes
  publication to fail closed.
- Canonical source qualification: the core validator and deterministic Linux
  and Windows lanes passed on PR #32. CodeRabbit was rate limited, and two
  exact-head 6529bot follow-up requests produced no response; the maintainer
  disposition records those advisory lanes accurately.
- Frontend validation: 74 Museum suites / 249 tests, the focused final 48-test
  publication/route/pack run, changed lint and typecheck, React Doctor 100/100,
  help-index sync (202), and the exact-source optimized production build passed.
  The dedicated read-only browser pack passed all six desktop/mobile cases,
  including all eleven standard routes, both machine disclosures, exact-source
  links, and 390 px overflow checks. Frontend PR #3629 merged as
  `a888054589e7311848278c53b187033d96b1f5fb`; production serves the release in
  deployed main `81ddbf2a6dce7df785c87d9a3192d3ed7a74f1cf`.
- Frontend PR #3629 opened at initial exact head
  `eebd8a48fda872a89b16373654bbcdef3225c91a`. The first 6529bot general review
  requested consistent unknown-slug metadata, source-exact machine
  disclosures, and one shared standard registry; the i18n lane requested an
  explicit fallback-debt record. Those corrections pass focused and full
  Museum regression, and the new pack is included in the combined manual
  production-safe read-only suite. The exact release-pack counts, workflow
  choice input, and Museum PR-lane ownership now agree and pass their 32-test
  contract suite. The adapter now accepts the canonical rights registry v1.1
  that merged independently during this release; an exact-source probe returns
  73 documents, 11 architecture standards, and 22 rights expressions.
- Production qualification found one harness-only discrepancy: the ontology
  pack treated a known Cross-Origin-Opener-Policy browser fetch diagnostic as
  actionable in deployed environments even though another Museum pack already
  classifies that exact message as non-actionable. The narrow classification
  is aligned without suppressing any other console, page, or HTTP error. The
  corrected production replay passed all six desktop and mobile cases against
  live `https://6529.io`.
