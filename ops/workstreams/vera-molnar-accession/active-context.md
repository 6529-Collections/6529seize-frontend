# Vera Molnár accession release

## Objective

Publish the accepted and delivered gift of _Themes and Variations_ #210 as a
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
  optimized 3,675-route production build pass. Frontend PR #3812 merged as
  `59ccd83442c3dca207b06701395b11878906f804`; staging deployment and automatic
  E2E passed, production deployment and automatic isolated E2E passed, and the
  exact commit is live.
- Final installed-Chrome readback found that the Museum CloudFront origin
  returned browser subresource requests as blocked responses, despite serving
  the exact derivative bytes to server-side clients. This affected the new
  Vera still and older accession derivatives. The corrective branch preserves
  the governed source URI and exact bytes while delivering approved accession
  derivatives through a strict same-origin Museum endpoint. Local Chrome
  decodes all 640, 1280, and 2400 variants, and their SHA-256 values match the
  reviewed presentation manifest. Corrective PR #3813 merged as
  `d8646201aec183a569b18efe0f061223ed3185ee`. Staging composition
  `76590cafa3cdefeb73519f53e33b687e1f0f3c21` passed deployment
  32667636938, automatic Staging E2E 32668149067, and an independent exact-
  source desktop/mobile Museum route test. Production deployment 32669010834,
  artifact builder 32669023260, artifact verifier 32669550952, automatic
  Production E2E 32669902960, and its isolated evidence verifier all passed.
  Public readback resolved the exact production version three times and found
  decoded governed media, no fallback, no browser warnings or errors, and no
  horizontal overflow on the artist, project, acquisition, and Work routes at
  1440 x 1000 and 390 x 844. The corrected accession is live and qualified.
