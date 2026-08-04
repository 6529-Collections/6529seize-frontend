# Active context

- Goal: publish the Museum's institutional-practice study on 6529.io and carry
  it through source and frontend review, staging, production, and retained E2E.
- Frontend release PR: `6529-Collections/6529seize-frontend#3569`, merged.
- Reliability follow-up PR: `6529-Collections/6529seize-frontend#3573`, merged.
- Qualified production runtime:
  `88a4f19885f9ff70a1632bda7255b8091263ee86`.
- Museum source PR: `6529-Collections/6529networkmuseum#22`, merged.
- Canonical Museum source commit:
  `f5080e1873a3b86280c5a92e1fbe6cbd7fea38a4`.
- Canonical 230-entry manifest SHA-256:
  `sha256:7ae561a27b5c3494d3bc81035af506ba5c49501ebb5c73a5535a3a2898c1b416`.
- Canonical manifest Keccak-256:
  `0xe71d1d744b2bccf1e2c724ab907a5bcc8e53bbf9befdc8f93b21ff89e76dd93c`.
- Source paths: `records/institutional-practice/a-field-of-practice.md`,
  `records/institutional-practice/profiles/*.md`, and
  `records/institutional-practice/source-register.md`.
- Product boundary: a quiet, text-led study inside the native Museum shell;
  no copied institutional marks or unlicensed third-party images.
- Trust boundary: all sixteen public manuscripts are required atomically from
  one exact canonical source commit. Partial or malformed content does not
  render as current Museum scholarship.
- Internationalization fallback debt: new navigation, metadata, source-label,
  and accessible interface strings are authored in `museum.en-US.json` and
  fall back to English in other locales. The governed manuscripts remain
  English-language scholarship. Professional translation must preserve titles,
  citations, institutional names, and correction history rather than machine-
  translating the source record.
- Local publication probe: exact canonical source main resolves to the commit
  and commitments above, 42 public documents, 14 institutional profiles, the
  comparative study, and the primary-source register.
- Local qualification: production build passed; 79 Museum suites / 282 tests,
  changed lint and application/test typechecks passed; the read-only browser
  pack passed all 32 desktop/mobile cases after one product correction added an
  onsite source-register route to every profile.
- Retained visual evidence: `ops/workstreams/museum-institutional-practice/evidence/`.
  Final desktop and mobile captures cover the study, long-name profile, source
  register, and the mobile Stories & Research directory at their layout
  extremes.
- Staging qualification: composition
  `bc9f46cd52e2437595a3d1131371525f9cb28b3c`, deploy run `30894880378`,
  automatic E2E run `30896314276`, and independent Museum 32/32 all passed.
- Production deployment: run `30897509037`; runtime and announced version both
  read exact `88a4f19885f` with `stale:false`; rendered desktop/mobile review
  passed.
- Production qualification: strict Museum 32/32, full read-only inventory
  89/89, applicable surface matrix 28/28 with 22 intentional native-project
  skips, WCAG/i18n 3/3, and final endpoint/version watch 60/60 all passed.
- Hardening disposition: speculative Museum prefetch is disabled, silent
  first-party 5xx responses fail the acceptance pack independently of console
  output, and only the exact known blocked Coinbase analytics transport is
  classified as benign. The original first-party prefetch failure did not
  recur in staging or production qualification.
- Status: complete. Future scholarship, source, or presentation changes begin
  as new governed source and frontend revisions; this workstream has no open
  release action.
