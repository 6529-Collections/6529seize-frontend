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

## Release identities

- Reviewed source Candidate B: `2da150eacf951d977f6c430b1e21c118687a0c32`
- Active publication catalog Candidate C: `459cdfd41145f0ea55ec5687508222de6b673252`
- Canonical Museum merge: pending
- Frontend PR: #3716; exact review follow-up head pending signed commit
- Frontend merge: pending
- Staging deployment and E2E: pending
- Production deployment and E2E: pending
