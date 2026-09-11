# Active context

## Current state

- Frontend PR #3733 merged at exact main
  `d438a57eb58d3abaf4d7fc549441c9a5af253190`; staging deploy `31681902527`
  and automatic staging E2E `31682667244` passed, including the complete
  668-route crawl and decoded Casey, Magnum, and Keys and Gates media checks.
- Follow-up PR #3735 merged as exact frontend main
  `3bf97fb98a330e9fd42bcef40b0ffaec1d415aaf`.
- The test-contract follow-up PR #3737 merged as
  `3fe402fc2e0c13be5ffb18bf16785c6560d7f7a2`; automatic staging E2E run
  `31694252972` passed all 17 packs.
- The final protected-main production candidate was
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0`. Production deployment run
  `31697156091` and automatic production E2E run `31698559323` passed,
  including isolated evidence verification.
- Three consecutive live `/api/version` readbacks matched exact production
  `6c7914a4eb270cb6acfa96eb7a8470106db91eb0` with `stale:false`.
- The independent production audit passed all 651 generated Museum routes,
  with zero HTTP, soft-404, or Museum-boundary failures. The exact live
  desktop/mobile Museum IA suite passed 6/6, including Collection membership,
  all five Magnum photographs, all 16 Keys and Gates selections, responsive
  layout, navigation, and WCAG A/AA checks.
- Canonical Museum source is merged at
  `a5b64f7eb586a5a07024b56a0604d8b8ae0ea574`; post-merge run
  `31657649972` passed all six Museum, portable, catalog, and public-publication
  jobs.
- The canonical moving-main release points to active catalog commit
  `975f041aed7e2f402ab26d4fb2bb266e07db4974`; its immutable reviewed source is
  `9aea66c07d59f890e366dde6552a304580ba789a`. The website reports the reviewed
  source identity while resolving the active pointer from canonical main.
- The canonical public record states 12 works in the permanent Collection:
  seven Casey Reas works in accession `6529NM.2026.001` and five Magnum Photos
  works in accession `6529NM.2026.002`.
- Keys and Gates is selected, unminted, and in process. It is outside the
  permanent Collection until mint, custody, and accession are complete.
- The follow-up corrects the independently audited publication join defects,
  broken Research URLs, Collection hero composition, portrait media framing,
  mobile tables, long-manuscript tiering, and the plain-language explanation
  of accession channels.
- The active Research-only release is based on frontend main
  `f5ab92357a5d8797313f88a436dcecc67b846e63` and reviewed Museum source
  publication `f9253968389f97f62eaea79ab7880d1daafbc00c`; canonical Museum main
  is `282ea630e6e27969b780d3984aa362c663aff8a9`.
- The first exact production-build screenshot corpus was rejected before PR:
  acquisition and institutional-practice details still read as long registry
  dumps; generic diagrams repeated across unrelated subjects; artwork credit
  and status context were incomplete on some acquisition essays.
- The corrected candidate presents authored reading sequences with complete
  manuscripts and supporting records in semantic disclosures, displays all
  works discussed by acquisition essays, preserves full credit and rights
  lines, and assigns distinct item-level public-domain illustrations to data
  architecture, rights, and source chronology.
- No Research PR may open until the corrected exact production build has been
  captured in full on all nine changed routes at 1440, 820, and 390 pixels and
  the complete corpus passes fresh independent museum, visual/UX, and copy
  reviews. The same route-by-route visual comparison is required on staging
  and production.
- Frontend PR #3753 exact head `c7f890abc17fc6b763f77309a646c0c808a4f119`
  passed the exact-final 33-page local screenshot corpus and all three
  independent adversarial reviews. Hosted run `31931078978` then proved the
  protected Playwright fixture was still pinned to superseded reviewed source
  `9aea66c07d59f890e366dde6552a304580ba789a`; the stricter Research adapter
  correctly failed that old package closed. The CI fixture now targets exact
  reviewed publication `f9253968389f97f62eaea79ab7880d1daafbc00c` without
  relaxing publication validation; the strict local desktop and mobile IA
  packs pass against it.

## Rights interpretation

The Museum may publish and display the five Magnum photographs with the
specified credits in its institutional Collection, accession, artist, Work,
and scholarship contexts. Copyright remains with the photographers and Magnum
Photos. The accession does not create a general commercial-reproduction,
print, derivative-work, licensing, downloadable-master, preservation-copy, or
AI-training permission.

## Release boundary

1. Present Collection holdings, acquisition histories, acquisition programs,
   artists, Works, projects, and research as distinct but connected entities.
2. Lead acquisition and research routes with art and interpretation; place
   machine records, process, and source provenance in supporting tiers.
3. Eliminate misleading labels such as “connected work,” proposal treatment
   for completed Magnum accession, and permanent-Collection treatment for
   Keys and Gates.
4. Require exact-source activation and fail closed where canonical publication
   records are incomplete.
5. Complete PR review, staging E2E, production E2E, and a route-by-route live
   desktop/mobile editorial and media audit before closeout.

## Next work

1. No release-critical work remains for this correction lane.
2. Treat later Museum content or presentation changes as a new scoped release.

## 2026-08-18 Research release state

- Frontend PR #3753 remains the active Research-only corrective release. The
  latest local candidate is rebased through frontend main
  `8f4bca010f49f3954c6899e21285de9ac6ac8f4d`; its remote head remains older
  until the final governed-source visual gate passes.
- The 33-capture v24 corpus found one real source-hierarchy defect: Work
  `6529NM-W-0009` and Media `6529NM-MED-0021` needed an append-only authority
  for the visitor-facing spelling _the Artist in the Open Sea_. Museum source
  PR #65 supplies that authority while preserving the submitted archival form
  _the Artist in teh Open Sea_ and all original Wave evidence.
- Museum source PR #65 merged as canonical main
  `b583c5102faabd908e7a99cdf0343f3866d31c26`. Reviewed source publication commit
  `df409fc28bd29c806887bf8ebe6007f5accfbfaf` passed independent registrar
  review and local deterministic validation. Its manifest is
  `sha256:c4e6a6f59b1acf3bded54d272fa806cf59dc019ad4867f9832ada9a663f5c2a3`
  / `0x5317866aebd7c6b30b493ae3f1ef7fc214768a34a7782735a72f4ff0de5c6d95`.
- The frontend-specific spelling override has been removed. The final visitor
  rendering must consume the governed Work and Media labels directly.
- Required next sequence: merge source PR #65 after exact-head checks; bind
  the frontend fixture to the source merge and reviewed commit; run a clean
  build; recapture all 11 Research routes at 1440, 820, and 390 pixels; obtain
  independent museum, UX, and copy PASS verdicts; then update PR #3753 and
  complete staging and production qualification.

## 2026-08-18 final Research source projection

- Museum source PR #66 merged as canonical main
  `6fe93bf17f0c30b79889d3d7bfabaebae3369ef7`. Reviewed source commit
  `f52fe5513423d8049bb557749a9fce1070ace64b` projects the authorized display
  title across all current visitor manuscripts while preserving the archival
  Wave outcome and selected-work records byte-for-byte.
- Independent registrar review passed with no findings. Candidate commitments
  were `sha256:d83c278672c707154006e38c9374471cb8ebb0bde40bfd5f9c7ba966a6fe75de`
  and `0x43e3bc5f4b22d7f3f5627d78c4d842d92182a930290475014e38e78b18e582ba`;
  final reviewed release commitments are
  `sha256:f278f368fc00f5452ca91588f0658f474d7fdc7f67d8023dee8e99383c4cdd56`
  and `0x033ca9c48a045dfd43d1ea892d9ca9fa2b50c9c4fbfa864dd2666057b88b41fd`.
- Museum PR #67 activated the reviewed publication catalog and merged as
  canonical main `a3977a8f020f58d0c9e79f23bc4f37245be65879`. The catalog remains
  bound to reviewed source `f52fe5513423d8049bb557749a9fce1070ace64b`.
- The first final screenshot corpus correctly blocked because the prior atomic
  pointer still served the archival title. Visual review also found that two
  desktop diagrams became illegible when reduced to 390 pixels. The frontend
  now binds the activated catalog and supplies purpose-built portrait diagrams
  for those mobile routes.
- The remaining release gate is a clean build, fresh 33-capture corpus, three
  independent PASS reviews, PR merge, staging, production, and live
  Research-route qualification.

## 2026-08-18 exact-final Research acceptance

- Frontend candidate `2e87c0bbfc1f99a24063e5b9397d37b19a575a87` merges current
  frontend main `1ded71fa7fe925dcb04956df92acbbd9d57fffb7` without a Museum
  conflict and remains bound to canonical Museum main
  `a3977a8f020f58d0c9e79f23bc4f37245be65879` and reviewed publication
  `f52fe5513423d8049bb557749a9fce1070ace64b`.
- The exact merge-tree optimized production build passed: repository lint,
  TypeScript, compilation, 3,675 generated pages, sitemap generation, and
  postbuild all completed successfully.
- The exact-final v28 corpus contains 33 full-page screenshots: all 11 Research
  routes at 1440 x 1000, 820 x 1000, and 390 x 844. All returned HTTP 200 with
  zero horizontal overflow, image failures, visible fallbacks, console errors,
  page errors, or deterministic blockers. Its report is
  `sha256:6c6bfc4fe7b0971829c62d71ffb73b8ee0758da49f418a93e4482f7ceb6d3ea6`.
- The intervening merge changed only Groups, identity-statement, help-index,
  and typecheck-baseline files. All 33 final PNG hashes are therefore
  pixel-identical to the v27 reviewed corpus; an independent hash comparison
  found zero mismatches.
- Three independent reviewers inspected all 33 original-resolution images.
  Museum/registrar accuracy, responsive visual/UX quality, and museum copy each
  returned PASS. The registrar confirmed that the visitor display title is
  authorized by the append-only amendment while the submitted outcome remains
  unchanged. The copy reviewer confirmed the complete compound subject
  `acquisition and accession remain pending` in the original rendering.
- Remaining sequence: push the exact signed PR head, complete exact-head bots
  and CI with zero unresolved threads, merge, qualify staging, deploy the exact
  staging-qualified revision to production, and repeat the 11-route
  desktop/mobile live audit.

## 2026-08-18 production release complete

- Frontend PR #3753 merged as exact main
  `336d3f9ed6839fd2fa97a677b25d5353aa4fc884`. Its runtime tree is identical to
  reviewed candidate `2e87c0bbfc1f99a24063e5b9397d37b19a575a87` and remains
  bound to Museum catalog commit
  `a3977a8f020f58d0c9e79f23bc4f37245be65879` and reviewed publication
  `f52fe5513423d8049bb557749a9fce1070ace64b`.
- Staging deploy `32165422116` succeeded. The automatic staging E2E run
  `32166673862` passed every selected Museum pack and failed only on the
  pre-existing non-Museum profile Server Components fault. A retained 22-check
  Research sweep found no heading, media, overflow, fallback, or soft-404
  failure at desktop or 390-pixel mobile widths.
- Production deploy `32170385482` succeeded after immutable builder
  `32170437082` and verifier `32171381138` passed. Three uncached
  `/api/version` reads returned exact main for both runtime and announced
  version with `stale:false`.
- Automatic Production E2E `32171973579` stalled for 22 minutes in the
  GitHub-hosted Playwright browser installer before executing any pack and was
  force-cancelled under the recorded temporary production E2E waiver. Isolated
  completion run `32174375703` released the exact authority as failed; no
  production byte changed during that infrastructure disposition.
- The same five fail-closed Museum production packs were run directly against
  exact live production. About passed 2/2, Rights 6/6, Inside the System 8/8,
  Data Architecture 6/6 on clean rerun, and Institutional Practice plus the
  complete public IA contract passed 79 with 3 intentional skips. Aggregate:
  101 passed, 3 skipped, 0 product failures. The first Data Architecture
  attempt saw two transient 502 responses from unrelated `Waves` and
  `Join 6529` navigation prefetches; the immediate exact rerun passed 6/6.
- Final live Research acceptance covered all 11 routes at 1440 and 390 pixels:
  22/22 correct H1s, no broken images, no horizontal overflow, and no
  soft-404s. Evidence report:
  `C:\Users\Administrator\.codex\artifacts\museum-research-production-336d3f9\report.json`,
  SHA-256 `bb4c318d2a4a4432859f4a659b8a493a551c930e84cc2a1d8d824e2a1e845794`.

The Research release is complete on production. No runtime work remains in
this workstream.

## 2026-08-18 Acquisitions and Artists image-stage balance

- This follow-up starts from frontend main
  `f3e3032725a87d30aca21cafb554a7a19a541549`; the completed Research release
  remains unchanged.
- Production inspection found that both index pages inherited every source
  image's native aspect ratio. Square, portrait, and landscape works therefore
  produced uneven image boxes, misaligned titles, and irregular rows.
- The Acquisitions index now gives all three curated acquisitions a consistent
  4:5 desktop art stage and a more compact 4:3 stage below the three-column
  breakpoint. The complete Casey, Magnum, and Keys and Gates images remain
  visible with `object-fit: contain`.
- The Artists index now uses a compact 4:3 directory stage for all 21 artists.
  The source-specific behavior of the separate Works directory is preserved.
- Initial rendered checks pass at 1440 and 390 pixels: all measured stages
  have the intended ratio, image and copy baselines are balanced, and neither
  page has horizontal overflow. Focused component, lint, and changed-TypeScript
  checks pass. The exact rendered acceptance contract also passes at 1440,
  820, and 390 pixels. Two local full-build attempts passed lint, compilation,
  TypeScript, and page-data collection but the unchanged Governance route
  exceeded the static export's 60-second limit; hosted CI is the authoritative
  full-build gate. Remaining sequence: ready PR and bots, staging
  qualification, production deployment, and live desktop/mobile readback.

## 2026-08-18 Acquisitions and Artists balance release complete

- Frontend PR #3780 merged as exact main
  `40a293406b6c04ca8057b02ccb8fbd5e05d192c7` after all exact-head hosted
  review, security, quality, desktop Museum, and mobile Museum checks passed.
- Staging composition `80503176dacc334ba8132681486a138d660832c9`
  deployed successfully in run `32183553695`. Direct staging acceptance passed
  on desktop and 390-pixel mobile: all 21 artist stages were 4:3; all three
  acquisition stages shared the responsive 4:5 desktop and 4:3 compact ratio;
  images loaded without fallback; navigation, links, and horizontal bounds
  passed.
- Automatic staging E2E `32184698162` passed the core pack, every selected
  Museum pack, publication provenance, and immutable evidence validation. Its
  aggregate result failed only because the unrelated media pack observed a
  Server Components error on `/the-memes/mint`. An immediate isolated rerun
  showed that route recovered and instead exposed the pre-existing mobile
  overflow of the Meme Lab activity table. The active owner-approved serialized
  fallback explicitly covered this non-Museum baseline; no Museum finding was
  waived.
- Waiver traceability: the 6529 Collections repository owner authorized a
  single-release manual fallback under the `STAGING: OFF` / `PRODUCTION: OFF`,
  `changeable: true` Release Bus control. Its stable identifier is immutable
  release main `40a293406b6c04ca8057b02ccb8fbd5e05d192c7`. Its scope was limited to the
  unrelated staging media-pack observations on `/the-memes/mint` and the Meme
  Lab activity table; it did not waive any Museum test or product finding. The
  validity period began when staging E2E `32184698162` reached its terminal
  result and expired when automatic Production E2E
  [`32187596393`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32187596393)
  succeeded. Retained fallback evidence is staging deploy
  [`32183553695`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32183553695)
  and staging E2E
  [`32184698162`](https://github.com/6529-Collections/6529seize-frontend/actions/runs/32184698162);
  the procedure at that historical release was the then-current deployment
  skill's manual-fallback section. Future releases follow
  `ops/docs/developer/deployment.md`.
- Production deploy `32186095060` succeeded on exact main after immutable
  artifact builder `32186126216` and independent artifact selection and
  verification passed. Three uncached `/api/version` reads returned exact main
  with `stale:false`.
- Automatic Production E2E `32187596393` passed all production-safe read-only
  packs, selected Museum packs, provenance validation, evidence upload, and the
  isolated evidence verifier. The live retained Museum matrix passed both
  desktop and 390-pixel mobile with no dead links or horizontal overflow and
  exact Acquisitions/Artists image-stage counts and ratios.

The Acquisitions and Artists balancing release is complete on production. No
runtime work remains in this follow-up.
