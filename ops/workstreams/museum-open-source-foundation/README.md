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

The richer Open Museum treatment belongs on `/museum/network/about`. The
Sources and chronology route should connect its exact Casey research manuscript
to the same public-source model without displacing the visitor research record.

## Component and copy contract

### Shared source/contribution strip

Add a server-rendered `MuseumSourceContribution` component at the bottom of the
Museum content area, before the existing institutional footer.

- Input: `MuseumPublicationIdentity | null` and current/stale/unavailable state.
- Exact source: a fixed-origin URL to the resolved 40-hex source commit.
- Exact guide: the same commit's governed `CONTRIBUTING.md`.
- Action: the fixed canonical-main `CONTRIBUTING.md`, so visitors receive the
  current maintained instructions rather than obsolete workflow copy.
- Copy: public record, exact source and contribution—not release metrics.
- Failure: if there is no verified identity, omit immutable claims and retain
  only the canonical repository/contributor action with explicit unavailable
  wording.

All interface copy belongs in `i18n/messages/museum.en-US.json`. Governed
manuscripts, formal names, source paths and commitments remain exact authored
content and are not translated or paraphrased by the component.

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

Exact-source links identify the bytes the visitor is reading. The contribution
action intentionally points to canonical main because workflow instructions
can evolve. The distinction must be visible in copy and tests.

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
3. Route/component tests prove one H1, one shared strip, exact-commit links,
   canonical-main contribution action, stale/unavailable behavior and onsite
   manuscript rendering.
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
