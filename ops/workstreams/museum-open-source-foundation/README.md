# Museum Open Museum foundation

## Charter

Make the Museum's present publication model and contribution path legible
without turning the art-led experience back into a repository dashboard. The
public repository is the transitional, inspectable, forkable and
pull-request-reviewed record. The planned custom on-chain contract is the
durable commitment layer; the website remains a replaceable display.

- Owning Museum/product task: `019fbd8c-2797-7ae0-91a3-672d82624fa7`
- Frontend repository: `6529-Collections/6529seize-frontend`
- Frontend branch: `codex/museum-open-source-foundation`
- Exact frontend base: `472da902945bfeab51cde4439da6dbafa90ecb90`
- Canonical Museum main at activation: `bd853b483f807aad6d737305a9f78b1273bb2356`
- Governed release: 213 entries; SHA-256
  `sha256:a403df4d775def50abf22e45829c4c47f8c239f98adb72a0375e589425f4c2cf`;
  Keccak `0x9e3eb6b11197c67ad4c92106213568e0af33018b8bd9fd312f2b5376c0d399c4`

Runtime resolves the canonical Museum `main` branch to an exact commit, verifies
its deterministic manifest, and activates the publication atomically. Candidate
source branches were used only for pre-merge QA and are not present in runtime.

## Canonical source contract

| Path                                     | Governed status                                        | Frontend use                                                                                |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`                        | Active contributor guide                               | Required publication byte; exact-commit source link plus canonical-main contribution action |
| `RIGHTS.md`                              | Governed rights and reuse boundary                     | Exact-commit contribution-context link; not part of the three-file atomic minimum           |
| `docs/open-museum.md`                    | Working public operating statement; not adopted policy | Required public document and primary About/Open Museum manuscript                           |
| `docs/onchain-transition.md`             | Working migration statement; not deployment evidence   | Required public document explaining commitment, content and display separation              |
| `docs/onchain-design.md`                 | Design requirements                                    | Deeper exact-source reference, never a deployed-system claim                                |
| `docs/external-works-registry.md`        | Working architecture                                   | Deeper exact-source reference, never a deployed-system claim                                |
| `specs/onchain/contract-migration-v1.md` | Migration specification                                | Deeper exact-source reference, never activation evidence                                    |

Approved visitor-facing target language is:

> Our Fall 2026 goal is for every admitted Museum record—from governance
> decisions and policies to accessions, provenance, rights, preservation events,
> and later corrections—to have an on-chain commitment and append-only lineage
> in a custom contract.

It must be followed immediately by:

> The contract is being designed; it has not yet been deployed or activated.

Large essays and media remain content-addressed. The frontend is replaceable.
No address, deployment, migration, audit, or network write may be inferred.
The contract records authorized decisions and claims; it does not make
curatorial or governance decisions. Commitments bind identity, schema, hash,
URI, authority, effective time and lineage; retrieving exact bytes does not
establish availability or truth.

## Audited route coverage

The shared strip is inherited from `app/museum/network/layout.tsx` and must be
rendered exactly once by `components/museum/MuseumShell.tsx`. This covers:

- Museum home: `/museum/network`
- holdings: `/museum/network/collection` and object details
- artists and artist details
- project details
- gifts/accessions and object aliases
- programs and selected-unminted program records
- stories/research and the Casey source/chronology record
- About, governance, methodology and approved-collection legacy routes

The server builds a closed 57-route source catalog from the active
publication's manifest-admitted paths. Rendered non-redirect routes resolve to
an honest primary source. The legacy `/collections` route family redirects on
the server and is intentionally unmapped so its destination owns the source
claim. Unknown or unsafe route text fails closed.

The richer Open Museum treatment belongs on `/museum/network/about`. The
Sources and chronology route should connect its exact Casey research manuscript
to the same public-source model without displacing the visitor research record.

## Component and copy contract

### Shared source/contribution strip

Add `MuseumSourceContribution` at the bottom of the Museum content area, before
the existing institutional footer. The server passes a small source catalog
built from the same atomic publication; the client pathname may only select an
entry from that catalog.

- Input: `MuseumPublicationIdentity | null`, current/stale/unavailable state,
  and the manifest-admitted route source catalog.
- Primary source: a fixed-origin `blob/<exact commit>/<path>` URL for the honest
  primary record behind the route. Mixed-content routes use "View primary
  source" and never claim one file is the entire page source.
- Improvement: the same admitted path on the maintained `main` edit surface.
- Help: canonical-main `CONTRIBUTING.md` is a separate contributor-guide action.
- Related sources: up to two exact-commit links with closed visitor labels and
  the exact governed path retained in accessible context.
- Failure: an unmapped route omits primary and edit actions; a missing verified
  identity omits every immutable claim. The maintained guide remains available
  with explicit unavailable wording.

All interface copy belongs in `i18n/messages/museum.en-US.json`. Governed
manuscripts, formal names, source paths and commitments remain exact authored
content and are not translated or paraphrased by the component.

The embedded Open Museum and transition views suppress only the exact leading
H1 and exact status paragraph that the designed framing already renders. Both
must match the closed source-path contract byte-for-text after line wrapping;
an added caveat, changed title/status or unrecognized path returns the original
Markdown untouched. No governed body text is rewritten, and the immutable
source link remains visible beside the framed presentation.

### About and Sources

Extend `MuseumPublicDocumentKind` with explicit Open Museum and on-chain
transition kinds. The strict legacy assembler must require all three new files,
verify them through the existing manifest/hash boundary, and relate the two
visitor manuscripts to the institution rather than Casey objects.

About renders the governed public statements as writing inside the native
Museum composition, with one restrained source-navigation sequence for the
contributor guide and three deeper design/specification links. The Casey source
route receives a compact public-source introduction and exact contribution
links while preserving its existing visitor projection and single H1.

## Trust and URL boundary

The implementation may construct links only from fixed GitHub origin,
repository, validated 40-hex commit and allowlisted governed paths. Repository
content remains inert Markdown/JSON processed by the existing sanitizer. No
repository HTML or scripts execute, no arbitrary URL is followed, and no page
performs an additional source fetch outside the atomic publication facade.

Primary and related source links identify exact admitted bytes used by the
route. Improvement links intentionally target the same path on canonical main;
the contributor guide remains separate because workflow instructions can
evolve. The distinction must be visible in copy and tests.

## Native visual-fidelity matrix

| Surface             | Exact reuse                                                                                                       | Museum extension                                                                   | Rejected pattern                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Global shell        | `components/layout/WebLayout.tsx`, `components/layout/SmallScreenLayout.tsx`, `components/museum/MuseumShell.tsx` | One inherited strip within the 1324px content system                               | Parallel Museum shell or navigation                          |
| Type and color      | `styles/fonts.css`, `styles/globals.css`, `tailwind.config.ts`                                                    | Montserrat, black ground, iron hierarchy, primary-blue links                       | Serif, gradients, glass, luxury palette                      |
| Editorial structure | `MuseumSectionHeading`, `MuseumMarkdown`                                                                          | Longer governed prose with restrained rules and readable measure                   | Feature-card dashboard or process diagram as primary content |
| Links/focus         | Existing Museum link classes and `primary-400` focus ring                                                         | 44px targets, wrapped mobile source actions                                        | Pills, hover-only controls, hidden focus                     |
| State               | Existing `MuseumSourceNotice` and publication unavailable boundary                                                | Exact stale commit remains inspectable; unavailable state makes no immutable claim | Silent stale data or hash/status banner as the page hero     |

The strip is black with an `iron-800` top rule, compact type and simple links.
It must read as provenance at the edge of an artwork page, not a callout card.
About differentiates through pacing and source-backed prose, not new tokens.

## Validation and release gates

1. Publication tests prove the three new required files activate atomically and
   fail closed when missing, undeclared, malformed or hash-invalid.
2. URL/security tests prove exact commits, fixed repository and path allowlist;
   arbitrary refs, traversal, credentials, ports and foreign origins fail.
3. Route/component tests prove one H1, one shared strip, complete rendered-route
   mapping, intentional redirect non-mapping, exact-commit primary/related
   links, same-path canonical-main edits, separate contributor help,
   stale/unavailable behavior and onsite manuscript rendering.
4. Update `ops/help/help-index.json`, sync `public/help-index.json`, and record
   the repository phase plus the not-deployed on-chain boundary.
5. Run focused Museum suites, changed lint/typecheck, React Doctor, whitespace
   checks and a production build.
6. Retain desktop and true 390px evidence for home, artwork, About and Sources;
   prove native shell, art-first hierarchy, keyboard focus and no overflow.
7. Open a signed focused PR, resolve configured bots and review threads, obtain
   owning product review, and require exact-head green checks before merge.
8. Qualify the exact merged candidate through the sanctioned staging and
   production release path, then repeat Museum-specific read-only E2E.
