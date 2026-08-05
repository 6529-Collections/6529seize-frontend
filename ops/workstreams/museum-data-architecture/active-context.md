# Active context

## Museum data architecture

- Goal: publish the Museum's ontology and digital-preservation architecture as
  public education: readable first encounters for artists and collectors,
  exact technical profiles for specialists and machines, and a worked mapping
  of the seven Casey Reas accessions.
- Canonical Museum source PR #30 merged as
  `ad8ea4338659e0825dc5a79295e824eadec876e6`.
- Canonical release: 345 manifest entries;
  `sha256:258a2aa6a970cc84d036de511902cbc1d5fbb5141067cc146fe83ac879d20544`;
  Keccak-256
  `0x9ccca279ca25f1d0b65b2430168dd192a87dee77b682f63db25de44fc899ea26`.
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
- Canonical source qualification: 141 repository tests passed with one expected
  Windows capability skip; full semantic and manifest validation passed on
  Windows and hosted Ubuntu/Windows. Exact-head 6529bot follow-up reported no
  findings.
- Frontend validation: 74 Museum suites / 249 tests, the focused final 48-test
  publication/route/pack run, changed lint and typecheck, React Doctor 100/100,
  help-index sync (202), and the exact-source optimized production build passed.
  The dedicated read-only browser pack passed all six desktop/mobile cases,
  including all eleven standard routes, both machine disclosures, exact-source
  links, and 390 px overflow checks. PR review, staging, and production
  qualification remain in progress.
- Frontend PR #3629 opened at initial exact head
  `eebd8a48fda872a89b16373654bbcdef3225c91a`. The first 6529bot general review
  requested consistent unknown-slug metadata, source-exact machine
  disclosures, and one shared standard registry; the i18n lane requested an
  explicit fallback-debt record. Those corrections pass focused and full
  Museum regression, and the new pack is included in the combined manual
  production-safe read-only suite. The exact release-pack counts, workflow
  choice input, and Museum PR-lane ownership now agree and pass their 32-test
  contract suite. A signed follow-up and fresh exact-head hosted review remain.
