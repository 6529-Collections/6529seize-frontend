# Active context

- Goal: publish the Museum's institutional-practice study on 6529.io and carry
  it through source and frontend review, staging, production, and retained E2E.
- Frontend release PR: `6529-Collections/6529seize-frontend#3569`, merged.
- Released frontend main: `655b5408b68bbdac79249f4531c196349eff7d52`.
- Follow-up branch: `codex/museum-institutional-practice-closeout`.
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
- Staging qualification: composition `6d3ceba25b2d`, deploy run `30883469768`,
  automatic E2E run `30884413504`, and independent Museum 32/32 all passed.
- Production deployment: run `30885146909`; runtime and announced version both
  read exact `655b5408b68b` with `stale:false`; rendered desktop/mobile review
  passed.
- Production hardening finding: speculative Museum link prefetches can produce
  unrelated first-party RSC 502 console failures. The follow-up disables those
  prefetches, records exact failed-response URLs, and narrowly classifies only
  the known blocked Coinbase analytics transport as benign.
- Immediate next actions: publish the tested follow-up PR, iterate exact-head
  bots and CI, merge, redeploy staging and production, and require a strict
  green 32-route production pass with first-party 5xx handling unchanged.
