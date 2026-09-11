# Museum publication copy edit

## Charter

Bring the Network Museum's public writing to a consistent museum-publishing
standard. The work removes synthetic rhetorical habits, duplicated process
explanations, and software-product language while preserving factual,
curatorial, legal, and evidentiary precision.

The source repository remains authoritative for governed manuscripts. The
frontend supplies concise navigation, status, labels, and publication context.
Adopted policy text and source transcriptions remain verbatim.

## Editorial principles

- lead with art, mission, collection responsibility, and public value;
- state the subject directly and reserve contrast for meaningful distinctions;
- use museum terms for visitor copy and technical terms in technical sources;
- keep one qualification beside the claim it governs;
- preserve title, custody, accession, copyright, rights, provenance,
  preservation, deployment, and authority as distinct facts;
- present source and revision information as a quiet publication colophon;
- retain complete technical documents in the public archive while presenting
  them to visitors through concise editorial abstracts.

## Frontend boundary

The pass covers Museum i18n copy, About sequencing, Open Museum and transition
framing, the Sources route, the shared source/revision colophon, and the Methods
and provenance page. It does not alter artwork media, accession state, source
verification, URL safety, sandboxing, or the publication fail-closed boundary.

## Release gates

1. Canonical Museum manuscript promotion, schema validation, deterministic
   tests, and manifest verification pass.
2. Frontend-focused tests and Museum regression tests, changed lint/typecheck,
   formatting, path scrub, and production build pass.
3. About, Methods, gift, artist, project, object, home, and source routes pass
   desktop and 390px editorial/visual review with no overflow or console error.
4. Source and frontend PRs complete configured review and exact-head CI.
5. The merged frontend is qualified on staging and production with retained
   route, source-commit, copy, media, and mobile evidence.
