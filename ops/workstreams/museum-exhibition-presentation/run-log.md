# Museum exhibition presentation run log

## 2026-08-11 - construction and validation

- Added an image-led Curated Acquisition layout with a featured opening work,
  a natural-aspect gallery, curatorial reading, and a collapsed accession
  record.
- Added reviewed responsive Keys and Gates media resolution through exact
  source-record identifiers and the public presentation manifest.
- Added the five exact Conflict at Its Edges presentation images to acquisition,
  artist, and Work routes while retaining their Wave source, credit, and rights
  notice.
- Kept accessioned Casey pages on their established accession presentation.
- Split the acquisition and artist route implementations into focused
  components. React Doctor reports 100/100.
- Focused validation: 3 suites, 11 tests passed.
- Broad Museum validation: 42 suites, 315 tests passed; 17 intentional skips.
- Changed-file lint, changed-file typecheck, and whitespace checks passed.
- The first hosted Museum mobile job failed closed because the Museum surface
  registry did not yet own four new artist-route support files and five new
  acquisition components. The registry now assigns them to `museum.artist` and
  `museum.acquisition`; the deterministic registry reports no unmapped files.
- Source PR #53 Candidate A passed an independent exact-head review, the full
  325-test source suite, the focused catalog gate, and both public-publication
  platform checks. Reviewed Candidate B is the direct child
  `2da150eacf951d977f6c430b1e21c118687a0c32`; active catalog Candidate C is
  the signed direct child
  `459cdfd41145f0ea55ec5687508222de6b673252`. The activated immutable catalog
  has SHA-256
  `sha256:00c7db156a67c3f7712aa6cd5b008fc1cd322a7aac4f299a8b582a99892e28bf`.
- Thread-aware review of frontend PR #3716 identified valid accessibility,
  localization, eager-loading, anchor, media-admission, attribution, and
  duplicate-rendering findings. The follow-up commits added keyboard focus,
  plural-aware counts, empty-section suppression, exact section anchors,
  non-empty reviewed-derivative admission, shared document rendering, and a
  shared reviewed-program-media figure whose credit must match the same exact
  source record as the displayed image.
- The integrated follow-up also fails closed when reviewed image media has no
  matching metadata credit: it omits the credit instead of using an unrelated
  metadata entry. The Museum surface registry owns the new shared component.
- Integrated local review validation: object page 8/8, acquisition page 5/5,
  typed artist routes 2/2, surface registry contract 8/8; registry counts 22
  surfaces, 57 routes, 8 support files, 48 components, and 6 E2E specs.
  Changed-file lint, changed-file typecheck across 1,535 files, and whitespace
  checks passed.
- Hosted exact-head App CI run 31551730393 failed at the shared Knip gate only:
  `MuseumReviewedProgramMediaMatch` did not need to be exported. The interface
  is now module-private. Downstream App jobs were cancelled by that shared
  preflight and did not report independent product failures.
- Hosted follow-up run 31552007147 passed Knip and changed-source typecheck, then
  failed the Jest typecheck ratchet on one new test fixture: a reviewed
  derivative used `null` where `MuseumProgramMedia` requires a string SHA-256.
  The fixture now carries a deterministic valid test digest; production code
  was not implicated.

## Release identities

- Reviewed source Candidate B: `2da150eacf951d977f6c430b1e21c118687a0c32`
- Active publication catalog Candidate C: `459cdfd41145f0ea55ec5687508222de6b673252`
- Canonical Museum merge: `43596a5185efa72efad30be228953ebd6296b66d`
- Frontend PR: #3716; reviewed runtime head before this release-ledger update:
  `2fd87afcebce235fc805d996230161a7aed3bd15`
- Frontend merge: pending
- Staging deployment and E2E: pending
- Production deployment and E2E: pending
- Final exact-tree inspection caught a still-present featured-work class-token defect despite the earlier resolved review thread: `tw-min-w-0` and the featured centering/width utilities were concatenated. The follow-up restores the separator and adds an exact component assertion for the four featured-layout classes. The focused acquisition suite passes 5/5, changed lint passes, and whitespace passes. A fresh exact-head CI run is required.
- Retained hosted screenshots then exposed a deeper false-green gate: the
  Museum browser lane was pinned to the pre-media catalog/source pair and its
  contracts explicitly required zero images on the Keys and Gates program and
  Work routes and on the Conflict at Its Edges Work route. The protected
  fixture now advances to catalog Candidate C `459cdfd41145f0ea55ec5687508222de6b673252`
  and reviewed source Candidate B `2da150eacf951d977f6c430b1e21c118687a0c32`.
  Browser contracts now require all 16 reviewed Keys and Gates images, all five
  signed-Wave Conflict images, representative Work images, natural art-first
  acquisition pages, curatorial reading, a collapsed accession-processing record, and
  retained desktop/mobile evidence.
- Removed the inherited rule that suppressed Keys and Gates imagery until
  accession. Reviewed display authority and accession state are separate
  facts: the images are public while the lifecycle labels continue to say that
  minting and accession are pending. Conflict Work pages likewise no longer
  place a metadata-only placeholder before an available reviewed Wave image.
- Downstream accession work is the governing boundary for scholarship, media,
  rights, provenance, technical review, accessibility, preservation, and
  public-catalogue construction. The public experience is produced from that
  accession package; it is not a separate ungoverned presentation layer.
- Corrective local validation: 4 focused suites and 69 tests passed; changed
  lint, changed typecheck across 1,535 files, and whitespace checks passed.
  Local full-route rendering remains dependent on the shared local backend;
  the authoritative exact-catalog browser qualification is the fresh hosted
  desktop/mobile lane.
- Corrected downstream-accession source Candidate A
  `943ec3856ec40dada9503b848a6ab7adf82934a4` passed all six hosted source
  checks and independent exact-head review by
  `codex-review:independent-reviewer`. Reviewed Candidate B
  `6cef42ab590f35f035ae4858770d880925ad3085` is its direct child; active
  catalog Candidate C `cc8465764a55309d3eca5d3477b0f3993ef5a48c` is the
  direct child of B. The accession-processing records carry the five exact historical
  Wave image byte sizes and publication parts. The visitor projection still
  excludes the raw Wave receipt and unrelated token-source locators.
- Frontend head `c522baeab53ba68bb0738a3216ce4d843c38ebb6` passed Knip,
  the surface registry, changed lint/typecheck, and the Playwright smoke lane.
  Its Museum browser lanes failed closed at publication assembly because they
  were intentionally pinned to the pre-correction catalog/source generation,
  which lacks the newly required accession-media fields. The fixture now
  binds exact C `cc8465764a55309d3eca5d3477b0f3993ef5a48c` and exact B
  `6cef42ab590f35f035ae4858770d880925ad3085`; no compatibility fallback was
  added.
- Visitor status copy now follows the accession-processing record exactly: "Selected by
  Museum Wave; accession processing in progress." It does not describe a
  second acquisition review after the Wave's selection.
- Exact-head App CI run 31563371788 stopped at the help-index publication
  consistency check: the canonical production help corpus carried the revised
  accession status, while `public/help-index.json` still carried the prior
  wording. Every parallel browser/build job was subsequently cancelled by the
  matrix fail-fast policy. Regenerating the published help index produces one
  expected line change and restores the source-to-publication invariant; it
  does not alter the Museum runtime implementation or accession records.
- Exact-head App CI run 31563661368 then reached the rendered Museum contract.
  Its retained page snapshot showed the Palmyra image correctly integrated
  into the canonical `The work` region with the deliberate 16.9 MB view
  control. The browser assertion still expected the former separate
  `Historical Wave proposal presentation` heading and no view control. The
  contract now follows the downstream accession model: it verifies the work
  region, intentional large-image reveal, credit, rights and publication
  source, plus five acquisition figures (four initially loaded images and one
  intentional large-image control). Retained acquisition evidence now covers
  both the opening composition and the works gallery.
- Exact-head App CI run 31564282063 reached the corrected exhibition contract.
  The mobile lane found one ambiguous accessibility-role selector, not a
  rendered-product defect: the acquisition H1 and the governed essay H3 both
  read `Conflict at Its Edges`. The contract now selects the page title at
  heading level 1. The page snapshot showed the intended art-first acquisition
  route; no runtime, copy, catalogue, or visual code changed for this fix.
- Visual inspection of the retained mobile gallery evidence found that centering
  the full, tall works section placed the viewport between lazy-loaded cards.
  The DOM contained all 16 governed images, but the screenshot did not show
  decoded art. Evidence capture now enters at the works heading and proves the
  first image has decoded pixels before capture. This changes the qualification
  evidence only, not visitor runtime behavior.
- Final review tightened the presentation-media trust boundary so an Arweave
  token/source locator is evidence only and cannot enter the display projection;
  only the reviewed Wave CloudFront image form can be emitted as presentation
  media. The help corpus now describes the reviewed Keys and Gates surrogates
  and the exact Conflict accession-processing status, removing the obsolete
  text-only and acquisition-review statements.
- The CloudFront-only display rule above was superseded by the downstream
  accession media-continuity review recorded below. The historical Wave
  CloudFront locator remains provenance; the fixity-verified Arweave original
  is the active exhibition media URL.
- Staging qualification of frontend main `9354f35f8ed1e5932a1a32bad0ae6f564b2c5b3e`
  passed, but retained mobile accession evidence showed that the canonical first
  Conflict work is the 16.9 MB Palmyra master. Its intentional load control left
  the opening gallery field without an immediately visible photograph. The
  downstream accession projection now leads the public exhibition sequence with
  the first reviewed, immediately viewable work and otherwise preserves canonical
  order. Palmyra remains in the selected acquisition and retains its explicit high-resolution
  control. Focused component and browser contracts require both properties before
  the corrected release can advance.
- The corrected frontend release reached staging at main
  `b175c5341aaba7db7aa08da7d867cfc33d0e30c5`; deploy run `31573272295`
  and automatic E2E run `31573922198` passed. Retained real-browser review then
  found the first Conflict image blocked by the browser at the historical Wave
  CDN boundary. Production was held. This is downstream accession technical
  review after Wave selection, not a second curatorial decision or a task for
  Wave voters.
- Source candidate A `1702717e9ad05d9291c723b7521429199daf1cae`
  preserves the five historical Wave locators as provenance and separately
  designates the five fixity-verified Arweave originals as active exhibition
  sources. A schema-validated append-only accession amendment binds the prior
  machine records and Media payloads. Two independent Luna reviewers approved
  the exact candidate; hosted source run `31581341454` passed all six Ubuntu,
  Windows, publication, Stream/catalog, and Museum-validation jobs.
- Reviewed source B is
  `47aefd48dc94db274cad77d7b707f8d5668e815f`. Its activated catalogue is
  `6529NM-PUBCAT-47aefd48dc94db274cad77d7b707f8d5668e815f`; source release C is
  `7e379e6ae3ee92caeda060b7784b92a81ba4650c`. The reviewed-release manifest
  is `sha256:b5e33e09274f92d530268d6726d0778f30b75f8140016c3c959fdcfa5c7a99b6`
  / `0xe293001df58dca7ea8343e962e118acce9c6247824b60ab693587512164981b0`.
- Frontend adapter commit `8f61525f445760e90d04878cc297aac79997db4d`
  requires Work and Media identity, historical Wave locator, exact Arweave
  display source, SHA-256 fixity, byte size, dimensions, display policy, and
  active downstream accession amendment as one fail-closed projection. It
  changes no accession, title, custody, rights, preservation, or Collection
  claim. Focused validation passed 238 tests, changed lint/typecheck and a clean
  production build; independent Luna review also approved the exact commit.

## 2026-08-12 stage-boundary review follow-up

- The Museum Wave is the acquisition decision. Rights, technical, source,
  accessibility, preservation, catalogue and exhibition review are downstream
  accession work after selection; the Wave does not administer those tasks.
- Public and implementation wording uses `accession-processing record` when
  Conflict at Its Edges is discussed. A formal accession record does not yet
  exist, and no title, custody, accession number or Collection membership is
  implied.
- Independent adapter review found that inline Media facts alone did not bind
  each Arweave display source to the canonical continuity amendment. The source
  publication now includes that amendment atomically, and the adapter verifies
  each Work mapping before rendering.

## 2026-08-12 canonical downstream accession source

- Museum PR #56 merged as canonical main
  `970ac8b6a3f1c51b21090cee71365bf9aa4bcd42`.
- Constructed source Candidate A is
  `c326825445ce1c2ea70623cb75d721164be36619`; its governed manifest is
  `sha256:0b4f8a83095ce3496524f6bd9196fde813aa6754c6d18714633c7b217c34c01b`
  / `0xac73dfbdff1e299ebcb5c6d1bb6e190d5900b4d58d10019562f3092743773eda`.
- Independently reviewed source B is
  `dfb7024075efd0cedf63eebd4f4e87b7ce84808f`; its governed manifest is
  `sha256:a6a374b2ca651ff96aefda43c006f871554eaca28aa242f72cf7bacc4cd68ef0`
  / `0x7d528d03251cbd804b07e6f96ca003f2b3cec5692f06263b95eb4f7dd457a354`.
- Immutable catalog C is
  `859c99b2a586c2e7d9d3f329b150da12a95eab46`; its catalog file SHA-256 is
  `sha256:7920ef017ad74b21feeb3df92836c2356fc251219aa230897f49075bd7dd8c9d`
  and its envelope content hash is
  `0xb77ab37c3b95ede86b021c4c9b8e5271a4985e9ab67896ee97ef8014f527d299`.
- Exact Catalog C passed the required Museum validation, focused
  Stream/catalog, both public-publication jobs, and deterministic Ubuntu before
  merge. The slower deterministic Windows portability lane had no failure and
  was not the required merge check.
- The current catalog tool repeatedly spawns Git processes per accepted blob
  during construction and validation. On this Windows host, activating the
  340-record corpus took about 41 minutes. A later control-plane optimization
  should validate the committed manifest commitments first and use one
  `git cat-file --batch` stream for optional full-blob verification. This is a
  performance defect, not a reason to weaken the hash or exact-tree boundary.
