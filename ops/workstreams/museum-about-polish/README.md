# Museum About polish

Status: Museum visual gate accepted, `judge-accepted (uncalibrated)`.

## Release intent

Fix two production defects on `/museum/network/about` that the FE polish judge
calibration verified on 2026-10-12:

- "Collection care" was the only section drawn as a framed box. A solid
  `tw-border-y` left the side borders at the browser's medium default width,
  with no side padding, so its text sat against an uneven frame.
- Three links to the Collection used three labels ("View the Collection",
  "Explore the Collection", "Explore the collection").

## Gate run

Run directory: `judge/2026-10-12-museum-about-polish/`. It used rubric
`fe-polish-judge/2.0`, the Museum profile, three independent lens judges per
round, a production build served locally, and full-page captures at 1440x1000,
820x1000 and 390x844 (a Pixel 7 profile).

| Round | Candidate    | Decision | Total | Required findings open               |
| ----- | ------------ | -------- | ----: | ------------------------------------ |
| 00    | `0fd7ba1d15` | repair   |  7.77 | 12 (4 P1, 8 P2)                      |
| 01    | `20d79da68d` | repair   |  8.54 | 2 (the same P1, filed by two lenses) |
| 02    | `a517ac2016` | accepted |  8.90 | 0                                    |

The baseline confirmed both release-intent fixes. It also found production
defects already on the page, which the gate required before a PR:

- The page named two completed gifts. The Collection holds three: Casey Reas,
  five Magnum photographers, and Vera Molnár with Martin Grasser.
- The featured works had no credit lines, including the All Rights Reserved
  David Seymour photograph, whose record limits display to the credited
  accession context.
- Insider terms (TDH, Meme Card, adopted effects, canonical,
  version-controlled), several names for one repository, and a next stage
  with no status.
- An empty tablet grid cell, uneven peer sections, misaligned captions, long
  reading lines, and a source disclosure that repeated links already on the
  page.

Round 01 introduced one regression. The Keys and Gates sentence said
"twenty-three" selected photographs, copied from
`museum.network.acquisitions.description`, but the publication records
sixteen. Round 02 dropped the count.

Optional P3 findings still open: C-006 (Molnár byline omits the collaborator;
the credit line names him), C-007 (generative stills are not labelled as
documentation stills, a section-wide habit), V-006 (portrait image centered
against a flush-left caption), V-007 and V-008 (shared footer chrome; the
separators are fixed separately), V-009 (caption heights differ with credit
lines), E-006 (document title), E-009 (TDH gloss detail), and E-010
(credit-line formats come from the records).

## Facts checked for the new copy

- Holdings and Keys and Gates status: publication edition `92966f2836`, which
  records 13 accessioned works from three gifts and 16 Keys and Gates works
  pending acquisition.
- Next-stage status: the Open Museum statement says that contract design is
  in progress and that deployment and activation remain pending.
- Planned custody: the founding principles' future signing policy.
- Custody today: the Museum Safe at `networkmuseum.6529.eth`
  (`0xbECf…178c`), read on-chain on 2026-10-12. It requires 2 of 7 owners,
  with no modules and no guard. The copy says only that more than one signer
  must approve.

The founding principles in the public record still describe the initial
signing policy as 3 of 5. The record and the chain should be reconciled in the
Museum repository. The page copy avoids both figures.

## Follow-ups outside this run

- `/museum/network/acquisitions` still says "twenty-three" Keys and Gates
  photographs; the record says sixteen.

## Evidence kept in git

- Round 02, the accepted candidate: full-page captures, viewport tiles,
  contact sheets, and `automated-checks.json`.
- Round 00: full-page captures and automated checks, as the before state, in
  `evidence/round-00/`.

Earlier rounds' tiles and contact sheets are not kept, so round 00 and 01
judge outputs cite tile paths that now hold round 02 captures.
`scripts/capture-about.mjs` regenerates every capture from a production build.
