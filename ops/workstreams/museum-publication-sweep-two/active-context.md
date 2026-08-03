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

1. Push the signed review follow-up to ready PR #3551.
2. Iterate exact-head bots and CI, and obtain owning task review before merge.
3. Qualify the exact merged release through staging and production under the
   repository deployment controls.

## Review disposition

- The gift page eagerly loads only the first visible row of three governed Art
  Blocks stills; the remaining four retain lazy loading and all retain the
  unoptimized approved upstream URLs.
- The onsite source route is titled `Casey Reas: Sources and chronology` and
  presents itself as a public research record. A pure projection includes the
  exact canonical span from section 2 through section 11, fails closed when
  either boundary is absent or ambiguous, and suppresses internal process and
  revision sections. The complete immutable manuscript remains linked on
  GitHub.
- Balanced Markdown heading delimiters are removed without corrupting literal
  asterisks or backticks. The collection-essay dossier anchor is covered by a
  route test and was already present in rendered output.
- GitHub blob citations now share one exact-commit and governed-path builder.
  Invalid or absent commit identity fails closed instead of falling back to a
  mutable branch, and all Markdown callers state their commit trust explicitly.
  Research-table column headers expose `scope="col"`.
- Source-matrix boundary matching ignores delimiter text inside Markdown fenced
  code blocks, so examples cannot become public projection boundaries; focused
  tests cover fenced-only and fenced-plus-canonical manuscripts.
- The live-view recovery label wraps safely on narrow screens. Governed English
  manuscript fallback debt is recorded below.
- Publication project-document contracts and heading parsing are split into
  focused modules so the repository Debt Ratchet remains green without a
  suppression.

## Current validation

- Production build: passed before the review-only follow-up.
- Museum regression: 13 suites / 85 tests passed before the review-only
  follow-up.
- Review-focused tests: 10 suites / 73 tests passed after the follow-up,
  including publication, route, Markdown, viewer, and read-only guard coverage.
- `lint:changed`: passed.
- `typecheck:changed`: passed for 1,232 changed TypeScript files.
- Debt Ratchet: passed.
- React Doctor: 100/100, no issues.
- `codex-diff-check`: passed.

## Internationalization fallback debt

- Routes/components: the gift page, project routes, and source/chronology route
  render governed manuscript titles and Markdown bodies from the atomic Museum
  publication.
- Untranslated surface: authored manuscript titles, prose, notes,
  bibliographies, revision histories, and research tables. Governed artist
  names, artwork titles, credits, and record quotations also remain exact.
- Fallback behavior: Museum interface chrome resolves through the `en-US`
  catalog; governed publication content renders in its authored English in
  every locale and is never machine-translated or inferred.
- User impact: visitors using another locale receive localized/fallback chrome
  around English curatorial and research writing.
- Owner/follow-up: the frontend internationalization workstream and Museum
  publication owner must define a reviewed translation publication model before
  adding manuscript locales.
- Remediation: add locale-identified governed manuscripts to the publication
  contract, require them atomically per locale, and retain authored English as
  the explicit fallback without altering canonical record fields.
