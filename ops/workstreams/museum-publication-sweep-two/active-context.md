# Active context

## Current state

- Rescue PR #3550 is merged as
  `bd0983475802c8a742a1f52416fe480285ab1960` and is live in production.
- Production `/api/version` returned that exact commit with `stale=false`; the
  deployment workflow's three-match HTTP-version check passed.
- Production validation passed core smoke 14/14, WCAG/i18n 6/6, and the
  Museum-specific desktop/mobile sweep 10/10 plus live and return-to-still.
- The general surface matrix reproduced two pre-existing harness false
  positives. The release owner accepted an explicit exception with raw evidence:
  an init script wrote session storage in a sandboxed Arweave child frame, and
  two `eth_getBlockByNumber` reads used safe JSON-RPC methods on hosts missing
  from the test guard's public-RPC host set.
- Sweep two is isolated on a clean branch from the exact released main commit.
  It does not mutate the qualified production candidate.

## Canonical documents

The strict publication must add these exact manifest-declared files under
`records/accessions/6529NM.2026.001/public/`:

- `gift-into-public-trust.md`
- `projects/century.md`
- `projects/process-and-pre-process.md`
- `projects/microimage-and-phototaxis.md`
- `projects/atomism-and-923-empty-rooms.md`
- `projects/still-life-and-ex-nihilo.md`
- `source-and-chronology-matrix.md`

## Decisions

1. Extend the existing `MuseumPublicDocument` model with explicit gift
   narrative, project essay, and source/chronology kinds.
2. Associate every project essay with exactly one governed project and its
   accessioned artwork IDs; associate the matrix with the artist, gift, all five
   projects, and all seven objects.
3. Use the canonical gift narrative as the gift page's principal writing. Keep
   the earlier collection essay available in the accession dossier.
4. Give the matrix a deep-linked Stories and Research route; link to it from
   gift and project pages. Render Markdown as inert sanitized content only.
5. Map known governed relative document links to onsite Museum routes. Other
   safe repository-relative citations remain source links and never become
   frontend fetches or embeds.
6. Wide source tables receive an explicit keyboard-focusable horizontal region;
   the page itself must remain within the viewport.
7. Do not infer readiness by inspecting a sandboxed cross-origin iframe. Keep
   the strict `sandbox="allow-scripts"` boundary, reveal one non-obscuring
   recovery label on the existing Return to still control after 12 seconds,
   and reserve the hard error state for an actual iframe error.
8. Production E2E helpers may write session storage only in the top frame. The
   two added RPC hosts remain subject to the existing safe-method parser, so
   signing/sending/write methods still fail closed.

## Immediate work

1. Complete final build, React Doctor, whitespace, and public-path scrub gates.
2. Create a signed commit, push, and open a ready pull request.
3. Iterate exact-head bots and CI, and obtain owning task review before merge.
4. Qualify the exact merged release through staging and production under the
   repository deployment controls.
