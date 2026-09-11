# Museum art-first rebuild

## Charter

Replace the current registry-first 6529 Network Museum pages with a first-class,
art-led public museum experience inside the native 6529.io product shell. The
runtime code target is this repository only: `6529-Collections/6529seize-frontend`.
The Museum repository remains the governed content source; Evolve may contain
historical orchestration notes but is not a runtime target.

- Owning product and curatorial task: `019fbd8c-2797-7ae0-91a3-672d82624fa7`
- Implementation task: current Codex task
- Branch: `codex/museum-art-first-rebuild`
- Exact frontend base: `2d310e05b886263e868eae3e06073ad20fe760df`
- Canonical Museum source at kickoff: `390200112363970686cf180863cec9a111b9b8e7`
- Governing experience standard: Museum repository
  `docs/public-museum-experience-standard.md`
- Active writing lane: Museum repository curatorial-writing workstream

The owning task must review rendered desktop and mobile evidence before merge or
deployment. Green CI, HTTP 200 responses, or successful data resolution are not
product acceptance.

## First implementation boundary

The first releasable slice is intentionally narrow and does not depend on
unfinished curatorial prose:

1. Resolve the moving Museum publication ref to an exact commit before reading
   content.
2. Validate a closed, typed public publication model and activate it atomically;
   retain the last valid snapshot on upstream failure.
3. Model public documents, artwork media, credit, rights, live-work behavior,
   and preservation status explicitly.
4. Project the governed Casey REAS accession into artist, project, gift, artwork,
   and dossier routes without changing institutional facts.
5. Replace counts, status cards, and raw JSON as the visitor hierarchy with
   artwork, interpretation, relationships, then progressively disclosed
   provenance/rights/technical material.
6. Use the seven approved Art Blocks still and generator URLs only as labeled
   upstream source/fallback media until retained Museum media is published.

No media bytes, IIIF completion, copyright ownership, preservation completion,
or accession state will be inferred or invented.

## Absolute launch-gate audit

Status is the current production state captured on 2026-08-02, not the target.

| # | Absolute gate | Current status | Evidence and source finding | Required closure |
|---|---|---|---|---|
| 1 | No accessioned artwork lacks visible approved media | **FAIL** | Home, gift, and object routes contain no artwork image or live canvas. See `evidence/current-production-desktop-viewport.png`, `evidence/current-production-gift.png`, and `evidence/current-production-object.png`. `MuseumMarkdown` suppresses all images. | Render governed still/fallback media for all seven Casey works and test each object. |
| 2 | No live work lacks a meaningful fallback | **FAIL** | Object routes expose a generator URI only as technical text; no still, live activation, failure fallback, or third-party disclosure exists. | Still-first viewer; deliberate live activation; timeout/error return to still; reduced-motion and keyboard behavior. |
| 3 | Public accession scholarship in GitHub is readable onsite | **FAIL** | The accession's artist profile, collection essay, seven object texts, reviews, and certificate are in the governed manifest but omitted from the gift/object experience. | Explicit, typed dossier document inventory and readable onsite document routes/sections. |
| 4 | Collection is not donation-eligibility policy | **FAIL** | `/museum/network/collection` is the approved-collections donation policy. | `/collection` becomes accessioned holdings; donation eligibility moves to About/Support context with a legacy alias. |
| 5 | Selected-unminted works are not presented as holdings | **PASS, fragile** | Keys and Gates appears as a program and labels the work `selected_unminted`; it is not currently in the holdings route. | Preserve this distinction in types, copy, links, tests, and visual hierarchy. |
| 6 | Raw JSON is not the main detailed experience | **FAIL** | Detail pages are status/metric/record cards followed by a large raw JSON disclosure. | Visitor-facing art and scholarship first; machine evidence remains a tertiary disclosure with source attribution. |
| 7 | Artwork credit and rights are visible | **FAIL** | Object and gift pages do not show the governed `Gift of punk6529` credit and CC BY-NC 4.0 presentation basis beside media. | Put credit, rights summary, source, and preservation state next to every artwork viewer. |
| 8 | Accessibility alternatives exist | **FAIL** | No artwork exists in the DOM, so there is no alt/description, live-work alternative, or artwork-focused keyboard path. | Governed visual description, semantic figure/caption, viewer controls, focus, reduced motion, and error alternative. |
| 9 | Visual QA inspected actual artwork | **FAIL** | Existing release evidence established page resolution but did not inspect rendered art because the UI contains none. | Retain real desktop/mobile screenshots for home, collection, gift, object still, object live, failure fallback, and dossier. |
| 10 | HTTP 200 cannot silently omit dossier/media | **FAIL** | Production returns 200 for artless detail pages and the adapter activates partial corpora after per-file failures. | Atomic publication validation plus route-level completeness assertions and browser tests for seven media and required dossier docs. |

### Baseline evidence

- `evidence/current-production-desktop-viewport.png`: 1440 × 1000 Museum
  overview; release-status banner, hashes, metrics, no artwork.
- `evidence/current-production-mobile.png`: 390 × 844 capture; the document
  reports 649 px scroll width in a 390 px viewport and clips the Museum nav.
- `evidence/current-production-gift.png`: accession route begins with status and
  metric cards; zero artwork media.
- `evidence/current-production-object.png`: artwork route renders text/evidence
  but zero artwork media.
- `evidence/current-production-program.png`: selected-unminted status is
  accurate, but the program is artless.

## Product and information architecture

The public Museum navigation is Home, Collection, Artists, Programs and
Exhibitions, Stories and Research, and About. Governance, methodology,
provenance mechanics, accessions, approved collections, and release integrity
remain available as secondary institutional material, not as the first-order
visitor journey.

Required semantic routes for this slice:

- `/museum/network`
- `/museum/network/collection`
- `/museum/network/collection/[object-id]`
- `/museum/network/artists`
- `/museum/network/artists/casey-reas`
- `/museum/network/projects/[slug]`
- `/museum/network/gifts/6529NM.2026.001`
- `/museum/network/programs`
- `/museum/network/programs/6529NM-AP-01`
- `/museum/network/stories/[slug]`
- `/museum/network/about`

Existing accession/object/program URLs remain aliases so published links do not
break.

## Source and trust boundary

The source adapter must expose a narrow `MuseumPublicationSource` interface. The
GitHub implementation resolves `main` through the GitHub commits API once per
refresh and fetches the manifest and all declared public records from that exact
40-hex commit. It never constructs fetches from repository-provided arbitrary
URLs, never executes repository HTML/JavaScript, rejects traversal and unknown
extensions, and verifies declared SHA-256 hashes before activation.

Publication activation is all-or-nothing. A malformed or incomplete candidate
cannot replace the last valid snapshot. The visitor sees an explicit stale or
unavailable state while the last valid snapshot remains usable within policy.
The typed publication boundary is also the future Ethereum adapter contract:
snapshot identity, content pointers, commitments, publication state, entities,
documents, and media are presentation inputs; transport-specific GitHub details
do not enter components. No deployed contract or address is claimed.

The current Museum repository does not yet contain retained artwork bytes, IIIF
manifests, or the complete immutable public publication catalog described by the
new standard. The frontend therefore implements the target typed contract and a
strict, explicit legacy projection for the governed Casey files. That projection
uses only exact allowlisted paths and exact approved Art Blocks HTTPS origins,
labels them as upstream media, and remains removable when the canonical catalog
lands.

## Delivery phases

### Phase A — foundation

- Exact-commit resolution and immutable raw URL construction.
- Closed schema/type guards for public entities, documents, rights, and media.
- Atomic snapshot assembly, content-hash verification, cache/stale semantics.
- Explicit Casey and Keys and Gates projections from governed source paths.
- Unit tests for traversal, arbitrary URLs, partial activation, media allowlists,
  missing dossier files, and status distinctions.

### Phase B — art-first presentation

- Native 6529 Museum shell and responsive navigation.
- Artwork-led home and collection grid.
- Casey artist, project, gift, and artwork pages.
- Still-first artwork viewer with optional sandboxed live activation and
  meaningful fallback.
- Onsite dossier reading; evidence progressively disclosed.
- Metadata, canonical links, and share-image strategy without fake retained art.

### Phase C — proof and review

- Repo typecheck, lint, focused tests, affected/full tests, production build,
  help sync, and React Doctor.
- Automated axe/accessibility and route completeness checks.
- Real desktop/mobile screenshots, keyboard walkthrough, reduced-motion check,
  live/fallback behavior, credits, rights, and dossier proof.
- Side-by-side native 6529 route versus Museum screenshots and computed-style
  token evidence.
- Owning product/curatorial task review and feedback iteration.

### Phase D — PR and release

Only after product acceptance: focused signed commit, draft/ready PR under repo
policy, configured review bots, exact-head CI, actionable thread resolution, and
merge/deployment verification. This workstream does not weaken rules or equate a
successful deployment with visual acceptance.

## Validation matrix

| Layer | Required proof |
|---|---|
| Source | Exact ref resolution, manifest hash verification, path and URL rejection, atomic activation, stale fallback |
| Domain | Seven accessioned Casey objects, five projects, one artist, one gift, complete dossier, selected-unminted separation |
| Presentation | Artwork visible before evidence, credit/rights visible, onsite scholarship, no counts-first home |
| Accessibility | WCAG 2.2 AA semantics/focus/contrast, keyboard viewer, reduced motion, descriptions and fallback |
| Responsive | 390 px and desktop without horizontal overflow; intentional image crops and readable dossier |
| Visual fidelity | Native 6529 shell/tokens/primitives plus evidence-backed Museum extensions; no detached template language |
| Failure | GitHub unavailable, stale snapshot, image failure, live generator timeout/failure, incomplete publication |
| Release | Help sync, tests, lint, typecheck, build, React Doctor, visual evidence, owner acceptance, bot review |

## Visual-fidelity gate

Native 6529 design-system fidelity is absolute. The Museum must be recognizably
6529 at first glance. A detailed source-backed matrix lives in
`visual-fidelity-audit.md` and will name exact primitives/tokens after the current
site audit completes.

The following patterns are rejected now: detached luxury-museum typography,
oversized serif display type, glass cards, decorative gradients, pill/badge
carpets, dashboard metrics, generic AI-template sectioning, and a parallel global
navigation system. Museum differentiation comes from artwork scale, image rhythm,
negative space, sequencing, and editorial pacing while retaining native 6529
type, color, focus, breakpoint, navigation, and interaction conventions.
