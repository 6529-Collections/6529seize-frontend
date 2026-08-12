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
  being constructed from that exact tree.

## Release identities

- Reviewed source Candidate B: `2da150eacf951d977f6c430b1e21c118687a0c32`
- Active publication catalog Candidate C: pending
- Canonical Museum merge: pending
- Frontend PR and merge: pending
- Staging deployment and E2E: pending
- Production deployment and E2E: pending
