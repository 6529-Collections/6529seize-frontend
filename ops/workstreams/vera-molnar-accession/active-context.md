# Vera Molnár accession release

## Objective

Publish the accepted and delivered gift of *Themes and Variations* #210 as a
complete Museum accession: Collection, acquisition, artist/collaborator,
project, Work, and Research surfaces, with the official still, responsive
Museum delivery copies, live generator, rights, provenance, and source links.

## Release gates

- Canonical Museum source must pass its complete validators and the frontend's
  exact-commit compatibility probe before the frontend PR opens.
- The Vera publication is atomic. A partial, pending, unreviewed, or
  route-incompatible source release must fail closed.
- Public copy follows the Museum scholarship and writing standards. Visitor
  pages must not contain release-process, governance-performance, or generic
  AI prose.
- Visual acceptance follows
  `ops/standards/museum-visual-release-acceptance.md`: full-page 1440, 820, and
  390 pixel captures, deterministic image/overflow checks, and independent
  Museum, UX, and copy review before PR.
- Staging and production qualification repeat the changed-route browser sweep
  against the exact deployed frontend commit and canonical Museum source.

## Current state

- Source PR #68 merged as
  `2545700a6eebecae51af6877e1dfcc82ead6ee7b`; the immutable reviewed public
  publication boundary is `92966f2836ebf2af06edfe0fe2cff25041307c92`.
  Source PR #69 merged as
  `3926d78faacf67a62b8d9b48e15d26c43b52eae9`, correcting the whole-publication
  reviewer attribution without changing approved visitor content. Every PR
  and post-merge source-validation job passed.
- All nine changed Museum routes render from the reviewed boundary at 1440 x
  1000 and 390 x 844. The final deterministic browser sweep reports HTTP 200,
  no horizontal overflow, and complete non-zero governed images on every
  route. It preserved viewport and full-page screenshots for home, Collection,
  Artists, Vera Molnár, Martin Grasser, project, acquisition, Work, and
  Research. Independent Museum, UX, and Luna review approved those exact
  captures. Copy review findings on collaboration wording, live-work access,
  and credit display were corrected and recaptured in normal Chrome.
- The focused release suites pass 83 tests. The exact reviewed B/catalog C
  compatibility suite passes a further 18 tests, including 29 works, 23
  artists, seven projects, four acquisitions, all catalog commitments, and the
  complete Vera media boundary. Changed lint, changed typecheck, and the
  optimized 3,675-route production build pass. Frontend PR #3812 is open; its
  amended exact head includes the final review fixes, debt-ratchet split,
  Museum surface-registry entry, and DCO sign-off. No staging or production
  mutation has occurred.
