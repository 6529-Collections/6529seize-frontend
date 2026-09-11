# Vera Molnár accession release log

## 2026-08-23

- Bound the accepted Wave proposal, formal gift acceptance, finalized Ethereum
  custody, stable accession/Work identifiers, six public manuscripts, source
  records, responsive 640/1280/2400 WebP derivatives, and the official Art
  Blocks generator into one fail-closed publication unit.
- Added Vera Molnár and Martin Grasser profiles, _Themes and Variations_
  project and acquisition presentation, Work page, Collection/home/Research
  integration, responsive media selection, and an opt-in sandboxed live work.
- Focused frontend tests passed (35 tests), changed lint and changed typecheck
  passed, and the optimized base build generated 3,675 routes successfully.
- The exact source-to-frontend compatibility probe rejected the first source
  candidate because the Work used a descriptive URL. Source correction
  `def27e6e7d31e7d685cfea08f7cbe01099a03895` now uses stable Work route
  `/museum/network/works/6529NM-W-0029`; independent exact-commit review is in
  progress before reviewed publication and visual QA.
- Independent curatorial review approved the 380-file reviewed public
  publication at `92966f2836ebf2af06edfe0fe2cff25041307c92`. The release
  keeps 377 unrelated reviewable records pending and publishes only the
  complete Vera accession panel; catalog and later test/manifest commits are
  separate from that reviewed boundary.
- Corrected the collaborator join so Martin Grasser's artist page resolves the
  shared Work, acquisition, project, and permanent-Collection relationship.
  Focused regression coverage now requires every credited creator to receive
  the Work rather than grouping solely by the primary artist.
- Final browser capture covered home, Collection, Artists, Vera Molnár, Martin
  Grasser, project, acquisition, Work, and Research at 1440 x 1000 and
  390 x 844. No route reported document scroll width greater than client width.
  Viewport evidence was submitted for independent Museum, UX, and copy review
  before the frontend PR.
- Independent UX review approved the final current pixels after direct DOM
  readback confirmed Martin Grasser's full profile and shared Work. Independent
  copy review challenged generic status summaries and an ambiguous raw
  `donation` label; the final release now uses `Gift`, names the works and
  acquisition units directly, and removes generic process language. The copy
  reviewer approved the corrected visitor text.
- Source PR #68 merged as
  `2545700a6eebecae51af6877e1dfcc82ead6ee7b` with every hosted source check
  green. A post-merge curatorial audit found that the reviewer actor ID named a
  Vera-only scope despite covering the full regenerated publication graph.
  Source PR #69 corrects that attribution and deterministic hashes without
  changing approved content; the frontend remains bound to the same public
  entity and accession substance.
- Source correction PR #69 passed the complete Museum validator, deterministic
  Ubuntu and Windows suites, focused catalog checks, and public-publication
  suites before merging as
  `3926d78faacf67a62b8d9b48e15d26c43b52eae9`. Independent readback found 377
  records with the accurate whole-publication reviewer actor, 25 unchanged
  legacy reviewers, and no old Vera-only actor occurrences.
- Rebound the frontend's exact-source qualification to reviewed publication B
  `92966f2836ebf2af06edfe0fe2cff25041307c92` and immutable catalog C
  `858d3ebc049b59219d6fa639dbd325b6adc7345a`. The fixture now models the two
  commits separately, as production does, instead of reading a post-catalog
  manifest through the reviewed-source ref. All 18 exact graph/catalog/runtime
  tests pass.
- Re-ran the final browser qualification with a standard Chrome user agent so
  the governed CloudFront derivatives traverse the same delivery path as a
  visitor. All nine routes passed at 1440 x 1000 and 390 x 844: HTTP 200,
  non-zero images, no fail-closed publication state, and no horizontal
  overflow. Both viewport and full-page evidence were regenerated for the
  independent pre-PR Museum, UX, copy, and Luna adversarial review.
- Independent final review approved the complete 36-capture desktop/mobile
  set. Two copy findings on the Work page were corrected before release: the
  project byline now names Martin Grasser as collaborator, and the live-work
  section uses the canonical Work credit with one complete linked CC BY-NC 4.0
  statement. Fresh normal-Chrome captures confirm decoded art, exact
  credit, the live-work control, and no horizontal overflow at 1440 and 390.
- The first hosted PR run identified two structural repository contracts. The
  live-viewer component is now declared in the Museum surface registry, and
  the Work-page model plus entity-graph aliases were separated from two files
  that had crossed the 800-line ceiling. The debt ratchet, registry verifier,
  changed lint, changed typecheck, exact source/runtime graph suite, live-viewer
  suite, credit regression, whitespace check, and 26 focused tests pass.
- The final review batch binds contributor credits to a shared localized
  formatter, handles empty artist arrays without losing the primary creator,
  moves live-work labels into the message catalog, requires presentation
  accession identity to match its repository path, and verifies retained media
  fixity before publication. Exact-source, media, Vera activation, and live
  viewer tests pass (53 tests); changed lint, changed typecheck, Knip, debt
  ratchet, surface registry, and whitespace gates pass.
- The release acceptance contract now covers the expanded corpus: thirteen
  permanent holdings, four acquisitions, twenty-three artists, the Vera/Martin
  studies, and Work 6529NM-W-0029. Its complete Chromium suite passes locally,
  including the 1440/820/390 Collection, Acquisitions, and Research geometry
  matrix (6 tests). Vera and Martin receive separate, clearly credited public-
  domain editorial illustrations on Research; only the acquisition essay and
  the Work study share the acquired Work image.
- Hosted PR run 32655204675 found one stale assertion in the surface-registry
  unit test: the verified registry contains 69 Museum components after adding
  the Vera Work model and live generator, while the test still expected 67.
  The assertion now matches the validated registry and passes locally (8
  tests). Workflow fail-fast canceled the desktop and mobile browser jobs
  during server startup, before either reached a product assertion; the next
  exact-head run is the browser authority.
- Corrected exact-head run 32655521378 then reached the desktop browser gate
  and proved that the workflow still supplied the pre-Vera reviewed B/catalog
  C pair. The page correctly rendered that older publication, so the new Vera
  assertion was absent. PR browser qualification now uses reviewed B
  `92966f2836ebf2af06edfe0fe2cff25041307c92` and catalog C
  `858d3ebc049b59219d6fa639dbd325b6adc7345a`, matching the locally qualified
  release boundary; the workflow contract test pins the same immutable pair.
- The same exact-head quality lane selected two broader existing component
  suites whose assertions still named the pre-Vera homepage and completed-gift
  copy. The tests now assert the final approved introduction and the complete
  Casey Reas, Magnum Photos, Vera Molnár/Martin Grasser gift sentence; visitor
  copy is unchanged.
- Direct rerun exposed one adjacent preexisting count assertion that expected
  the homepage to repeat the featured Casey work in the supporting grid. The
  finished page intentionally presents each of the seven works once; the test
  now asserts seven rendered figures rather than eight duplicate placements.
- Exact-head run 32656273574 passed planning, security, quality, production
  build, smoke, critical shell, and the complete mobile Museum suite. The
  desktop Museum job reached later institutional-practice routes without a
  product assertion, then the remaining-coverage wrapper terminated it at its
  exact 15-minute bound (exit 124). The same complete suite passes locally and
  on mobile. The remaining-coverage bound is therefore increased to 20 minutes
  for both Museum browser projects; the 10-minute release gate and all test
  scope, assertions, runtime code, visitor copy, and pixels remain unchanged.
- Final review-thread reconciliation restored the immutable source link in the
  art-first acquisition context and registered the opt-in live generator on
  both Work and Object qualification surfaces. A focused component regression
  proves the acquisition source link resolves to its exact repository commit;
  no curatorial copy or visual composition changed.
- The intermediate-width visual gate now retains full-page 820 x 1000 captures
  for all nine release routes under `evidence/adversarial-820-*-full.png`, plus
  `evidence/adversarial-820-route-scan.json`. Every route returned HTTP 200,
  every main-content image decoded, every document reported equal client and
  scroll widths (820/820), and no console or page error was observed. Direct
  visual readback found no clipped boxes, collapsed columns, stranded labels,
  or artwork distortion.
- Frontend PR #3812 merged as
  `59ccd83442c3dca207b06701395b11878906f804`. Staging composition
  `1a083eceaf0e3865312f72470f3f9d9ac1236f3b` passed deploy run 32660459394,
  automatic dispatch 32660997762, and Staging E2E 32661001514. Production
  deploy 32662032108, authority completion 32662902084, automatic Production
  E2E 32662908738, and its isolated verifier all passed on exact main.
- The mandatory installed-Chrome production readback then caught a defect the
  hosted pack had missed: direct browser requests for approved CloudFront
  accession derivatives were rejected with `ERR_BLOCKED_BY_ORB`, and the Vera
  image component displayed its fallback. The corrective implementation maps
  only exact `6529NM` WebP derivative paths on the approved host to
  `/api/museum/media`, uses the existing DNS-pinned public URL guard, rejects
  redirects outside the exact path grammar, limits responses to 16 MiB, and
  serves the unchanged bytes from the site origin. Local installed Chrome
  decodes 640, 1280, and 2400 pixels with no request failure. Their SHA-256
  values exactly match reviewed manifest B: `a53b0dbd...bcbc1`,
  `3e9a68c8...42555`, and `0ec810b0...dc436`.
- Corrective PR #3813 review required direct route coverage before merge. The
  route now distinguishes a genuinely oversized declared response from a
  malformed `content-length` and relies on the streaming ceiling for the
  latter. Six route tests cover the immutable WebP success path, URL and
  redirect rejection, content-type rejection, upstream and missing-body
  failures, declared and streamed overage, malformed lengths, timeout, and
  fetch-failure mapping. The focused corrective set passes 16 tests; changed
  lint, changed typecheck, and the Windows-safe diff check pass.
- CodeRabbit identified that HTML `srcset` also permits a tab between a URL and
  its descriptor. The parser now recognizes every permitted ASCII whitespace
  separator and a regression test proves a tab-delimited accession derivative
  still traverses the same-origin delivery route.
- Sonar's passing quality gate reported three instances of the same minor
  regex-style issue. The accession path grammar now uses the concise ASCII
  digit class for year, accession sequence, and Work sequence; behavior and
  the exact allowed path boundary are unchanged.
- Corrective exact-head CI run 32665361257 rendered the Vera Work and its image
  successfully in the mobile browser, but the Network IA test queried the
  retired `canonical-work-presentation-title` section ID. The live DOM and
  retained Playwright snapshot place canonical media under
  `canonical-work-media-title`, so the Vera image assertion now uses that
  public semantic boundary. Exact-head rerun 32665959639 passed the Vera check
  and reached the existing Magnum Work assertion. Its retained DOM confirms
  that the historical Wave image remains, correctly, in the distinct
  `canonical-work-presentation-title` section. That Magnum selector therefore
  remains presentation-specific. These are test-only corrections and do not
  alter runtime code, copy, media, or pixels.
- Corrective PR #3813 passed exact-head App PR CI run 32666363626, CodeQL,
  Sonar, Snyk, secret scan, DCO, trust, debt, and review-thread reconciliation,
  then merged as `d8646201aec183a569b18efe0f061223ed3185ee`.
- Staging composition `76590cafa3cdefeb73519f53e33b687e1f0f3c21`
  passed deploy run 32667636938 and automatic Staging E2E 32668149067. A
  separate credentialed Chromium run exercised the complete Museum hub,
  lifecycle, link, overflow, and media-intent contract on desktop and mobile;
  both projects passed, including decoded Vera media and absence of fallback.
- Production deploy 32669010834 acquired exact authority, built the immutable
  artifact in 32669023260, verified it independently in 32669550952, and
  published exact main `d8646201aec183a569b18efe0f061223ed3185ee`.
  `/api/version` matched that SHA in three consecutive reads. Automatic
  Production E2E 32669902960 passed its complete read-only pack and isolated
  evidence verifier.
- Final public browser readback covered Vera Molnár's artist record,
  *Themes and Variations*, the gift acquisition, and Work 6529NM-W-0029 at
  1440 x 1000 and 390 x 844. Every primary Museum image decoded through the
  strict same-origin endpoint, the pages showed no temporary-unavailable
  fallback, all mobile documents reported equal client and scroll widths, and
  the browser reported no warnings or errors. Representative viewport and
  full-page captures are retained under the local release evidence directory
  `vera-molnar-production-d864`.
