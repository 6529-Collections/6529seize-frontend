# Network Museum Research page: final product specification

Status: decision complete  
Scope: `/museum/network/research` and its Research section pages
Date: 15 August 2026

## 1. Purpose

The Research page is the Museum's public reading room. It helps a visitor find
substantive writing about artists, works, acquisitions, digital-art
stewardship, and museum practice.

The page must make the present range of the Museum's scholarship immediately
legible. In the first screen and the section that follows it, a visitor must
encounter all three current bodies of acquisition research:

1. Casey Reas and _The System in Seven States_;
2. the Magnum Photos acquisition _Conflict at Its Edges_;
3. the selected, unminted works and artists of _Keys and Gates_.

The page must also provide a clear route into the Museum's research on rights,
preservation, provenance, digital-art systems, institutional practice, and
scholarly method.

The page preserves the distinction between the entities it describes. An
Artist is a person or collective with one canonical profile. A Work is an
individual artwork. A Project or body of work gives works an art-historical
context. An Acquisition records a group of works brought together under a
curatorial argument and lifecycle. A Program records an acquisition method.
An Organization, such as Magnum Photos, receives its own institutional and
historical profile. These entities may be related, but none substitutes for
another.

Research is an editorial surface. Accession certificates, gift
authorizations, condition reports, title reviews, custody diligence, and other
institutional records remain public and discoverable from the relevant
Acquisition or Work page. They do not appear as scholarship cards.

## 2. Visitor outcomes

A successful visit allows a reader to answer five questions without learning
the Museum's internal data model:

- What are the Museum's principal current research subjects?
- What can I read about the artists and works?
- What can I read about collecting and caring for digital art?
- How does the Museum conduct and publish scholarship?
- Where can I find the supporting accession and provenance records?

## 3. Final information architecture

The page contains seven sections in this order.

### 3.1 Page introduction

Eyebrow:

> PUBLIC SCHOLARSHIP

Title:

> Research

Description:

> Essays, artist studies, close readings, and research on collecting and
> preserving digital art.

The introduction occupies no more than one quarter of a 1440 × 1000 desktop
viewport. It contains no process language, repository language, statistics,
or internal identifiers.

### 3.2 Acquisition scholarship

Three equal editorial features open the page. All three must be substantially
visible in the first desktop viewport. They stack in the same order on mobile.

#### Feature 1: The System in Seven States

- Source: the acquisition essay _The System in Seven States_.
- Subject: seven accessioned works by Casey Reas.
- Status label: `Permanent Collection`.
- Image: an explicitly selected Casey Reas work. The current selection is
  `923 EMPTY ROOMS #713`. `CENTURY #31` is reserved for another top-level
  Museum context and must not be reused here.
- Summary:

  > Seven works across five projects trace Casey Reas's use of rules, code,
  > duration, and variation to construct the conditions of an image.

- Action: `Read the essay`.

#### Feature 2: Conflict at Its Edges

- Source: the acquisition essay _Conflict at Its Edges_.
- Subject: five accessioned photographs from Magnum Photos 75.
- Status label: `Permanent Collection`.
- Image: David Seymour's _Patrolling the border between the Negev Desert and
  Jordan_, using the Museum's governed responsive derivative.
- Summary:

  > Five photographs made between 1952 and 2016 examine conflict through
  > borders, controlled spaces, public dispute, ruins, and the uncertain
  > aftermath of violence.

- Action: `Read the essay`.

#### Feature 3: Access, Control, and Exit

- Source: the _Keys and Gates_ curatorial essay.
- Subject: sixteen selected photographs.
- Status label: `Acquisition in progress`.
- Image: Gül Yıldız's _Take the Key!_, using the governed program derivative.
- Summary:

  > Sixteen selected photographs consider access, control, custody, and exit
  > through thresholds, managed movement, residual infrastructure, bodies,
  > and interfaces. The works remain unminted.

- Action: `Read the essay`.

These features have equal visual weight. Casey is never a full-width hero
above smaller Magnum and Keys and Gates entries. Each feature uses a different
image source and a different subject identifier.

### 3.3 Artists

Heading:

> Artists

Description:

> Research on the artists represented in the Collection and in acquisitions
> currently in progress.

Each artist has one canonical profile. The profile addresses the artist's
practice and wider career, then identifies the works, projects, acquisitions,
and programs through which that artist is represented in the Museum. It is not
created, titled, grouped, or duplicated by acquisition.

The current artist corpus includes:

- Casey Reas;
- David Seymour, Larry Towell, Micha Bar-Am, Moisés Saman, and Lorenzo Meloni;
- each artist represented by a selected work in _Keys and Gates_.

If the same artist becomes related to more than one acquisition, the Museum
extends the existing profile and its relationship list. It does not publish a
second artist profile.

Visitors may filter Artists by related Acquisition or Program. Filtering
changes the visible set only. It does not change profile URLs, headings,
identity, or the structure of the Artist index. The section contains no
acquisition-owned artist rows and no proxy cards for Magnum Photos or _Keys
and Gates_.

The landing page may show up to six explicitly selected artist profiles. The
current selection must include Casey Reas, at least two photographers in
_Conflict at Its Edges_, and at least two artists in _Keys and Gates_. The
source presentation record controls identity and order. No automatic rotation
or randomization is permitted. Every current artist remains available through
`Browse all artists` and `Browse all research`.

An artist card contains the artist's name, one explicitly assigned image, a
short account of the practice, and concise Museum context such as `7 works in
the permanent Collection` or `1 selected work in an acquisition in progress`.
Casey Reas's artist card must use a different Work from the Casey acquisition
feature and from the primary image on every other top-level Museum landing.
The five Magnum photographers and the Keys and Gates artists use their own
works. The prohibited phrase `connected work` is never used.

### 3.4 Works and projects

Heading:

> Works and projects

Description:

> Close readings of individual works and studies of the projects and bodies of
> work to which they belong.

Work studies and project essays are canonical to the Work or Project they
interpret. Their acquisition and program relationships appear as context,
links, and filters. They are not duplicated into acquisition-specific copies.

The landing page may show up to six explicitly selected studies. The current
selection must contain two Casey Reas studies, two studies of photographs in
_Conflict at Its Edges_, and two studies of works selected for _Keys and
Gates_. Each uses an image of the Work under discussion. The source
presentation record controls identity and order. A study is omitted from the
landing when its Work has already supplied an image to an earlier visible
entry; another eligible study is selected instead.

### 3.5 Organizations and contexts

Heading:

> Organizations and contexts

Description:

> Histories of the institutions, platforms, movements, and cultural settings
> that shape the works in the Museum's care.

Magnum Photos appears here as an organization, with a substantive profile of
its history, structure, photographic practice, and relevance to the five works
in _Conflict at Its Edges_. It never appears as an artist or as a substitute
for its five photographers.

_Keys and Gates_ remains an Acquisition and Program context, not an artist.
Art Blocks and other organizations or platforms may appear here only when a
published profile exists. An acquisition title, collection title, or program
name does not become an organization merely to fill this section.

### 3.6 Digital-art stewardship and museum practice

This area consists of two visually distinct editorial lists.

#### Digital-art stewardship

Description:

> Research on rights, preservation, provenance, software, and the changing
> conditions of digital works.

Initial entries:

- `Inside the System`: a Museum-made diagram of executable work, dependencies,
  rendering, and preservation layers;
- `Rights and licenses`: a Museum-made diagram separating token title,
  copyright, display, reproduction, and preservation permissions;
- `Data architecture and the public record`: a Museum-made graph of Artist,
  Work, Project, Acquisition, Program, rights, custody, and source relations;
- the Museum's reproducible generative-art descriptor methodology: a
  deterministic analytical graphic generated from the published method and
  sample result set.

#### Museum practice

Description:

> Studies of museum scholarship, collecting, publication, and institutional
> practice.

Initial entries:

- `Museums to learn from`: a verified CC0 or Public Domain Mark archival image
  of a museum gallery or study collection, selected for its relevance to
  display and public access;
- `Scholarship and writing standard`: a verified CC0 or Public Domain Mark
  image of a catalogue, printing office, marked page, or reading room;
- `The Open Museum`: a verified CC0 or Public Domain Mark image of a public
  reading room, library, museum interior, or open collection store;
- the Museum's transition from repository publication to an on-chain record:
  a Museum-made provenance diagram showing the public record, commitment,
  contract, and display as distinct layers.

Documents in these two lists use only an explicitly assigned Museum-made
graphic or a verified public-domain archival image carrying CC0 or a Public
Domain Mark. They never
inherit an artwork because they mention an artist, acquisition, program, or
work. External illustrations carry a visible caption and the label
`Editorial illustration; not in the Collection`.

### 3.7 Browse all research

The complete research index provides search and the following filters:

- All research;
- Artists;
- Works;
- Projects and bodies of work;
- Acquisition essays;
- Organizations and contexts;
- Digital-art stewardship;
- Museum practice.

Each result contains an authored title, document type, subject label, and
short summary. Media is optional. Search results never display raw Markdown,
the first paragraph of a document, machine identifiers, or unedited record
fields as descriptive copy.

A quiet note follows the index:

> Looking for certificates, technical reviews, rights records, or provenance
> evidence? Open the relevant Acquisition or Work page to see its complete
> public record.

Actions: `Browse acquisitions` and `Browse the Collection`.

## 4. Editorial eligibility

### 4.1 Eligible for editorial presentation

The following document classes may appear in features, sections, and search:

- artist practice profiles;
- project essays;
- collection and acquisition essays;
- program essays with substantive curatorial content;
- object and work studies with substantive visual or historical analysis;
- organization and historical-context profiles;
- rights, preservation, provenance, and digital-art stewardship essays;
- institutional-practice studies and profiles;
- the Museum scholarship and writing standard.

### 4.2 Public records outside the editorial presentation

The following remain public but are excluded from every Research feature,
section, and search result:

- accession certificates;
- gift acceptance and accession authorizations;
- curatorial accession reviews used as institutional decisions;
- technical and condition reviews;
- title, rights, and accession reviews;
- custody, title, sanctions, and compliance diligence;
- transaction evidence and chain snapshots;
- release manifests, machine integration records, and source inventories.

Exclusion from Research does not remove, hide, or downgrade a record. The
record remains attached to the Acquisition or Work it documents.

## 5. Source-governed presentation contract

The Research landing is rendered from a closed, source-governed
`researchPresentation.v1` record. The frontend must not infer editorial
placement from file order, document kind, title keywords, subject relations,
or the presence of media.

Each presentation entry contains:

```text
documentId       exact published document identifier
placement        acquisition_feature | artist | work_project |
                 organization_context | stewardship | practice | browse_only
rank             unique positive integer within placement
subjectId        exact Artist, Work, Project, Acquisition, Program,
                 Organization, or museum-practice identifier
subjectType      artist | work | project | acquisition | program |
                 organization | museum_practice
relatedAcquisitionIds  zero or more exact Acquisition identifiers
relatedProgramIds      zero or more exact Program identifiers
title            authored visitor-facing title
summary          authored visitor-facing summary
mediaType        museum_work | museum_original | external_public_domain
mediaId          exact Work identifier or governed Media Asset identifier
mediaRole        artwork | archival | diagram | data_visualization
statusLabel      optional controlled visitor-facing status
actionLabel      controlled visitor-facing action
```

Validation fails closed when:

- a document, subject, Work, or Media Asset does not resolve exactly once;
- a document is placed more than once on the landing page;
- ranks collide within a placement;
- a record-only document kind receives an editorial placement;
- a summary is absent or exceeds 240 Unicode characters;
- the three acquisition features do not represent _The System in Seven
  States_, _Conflict at Its Edges_, and _Keys and Gates_ exactly once each;
- two visible entries resolve to the same underlying Work, Media Asset, source
  image, or source-image byte hash;
- Keys and Gates carries a permanent-Collection or accessioned status;
- an Artist subject resolves to more than one canonical Artist profile;
- an Organization or Acquisition is assigned `subjectType: artist`;
- an artist relationship names an Acquisition or Program that does not
  resolve exactly once;
- `museum_work` media does not resolve to the Work represented or discussed by
  an art-scholarship entry;
- `museum_original` media lacks a reproducible source file, authorship record,
  and Museum CC0 dedication;
- `external_public_domain` media lacks an item-level CC0 1.0 or Public Domain
  Mark 1.0 assertion from the source institution;
- an external illustration is presented without its caption or without the
  label `Editorial illustration; not in the Collection`.

Until the source contract is released, the frontend may use one explicit,
typed mapping of exact document and Work identifiers. That mapping must match
this specification and must be deleted when `researchPresentation.v1` becomes
available. Heuristic fallback is prohibited.

## 6. Selection and balance rules

- The three acquisition features represent _The System in Seven States_,
  _Conflict at Its Edges_, and _Keys and Gates_ exactly once each.
- Artist identity and ordering are independent of Acquisition membership.
- No Artist receives more than one canonical profile or landing-page card.
- Every Acquisition and Program reference on an Artist, Work, or Project is a
  relationship, link, or filter; it is never the entity's parent identity.
- No one current acquisition accounts for more than four of the first twelve
  non-lead editorial entries.
- The same document appears once at most on the landing page.
- The same underlying Work or illustration appears once at most on the entire
  Research landing. A crop, resize, format conversion, poster frame, or other
  derivative still counts as the same image source.
- A Work used as primary media on the Museum homepage or the top-level
  Collection, Artists, or Acquisitions landing cannot serve as primary media
  on Research. Detail pages may show the Work they document.
- An Artist card resolves to a published Artist profile; an Acquisition,
  Program, or Organization cannot be used as a proxy Artist card.
- Record-only documents never fill an empty editorial position.
- An empty placement remains absent until an editor assigns eligible work.
- Newly published files never change the landing merely because their path or
  manifest order changes.

## 7. Visual system

### 7.1 Composition

- The page uses open editorial composition, generous black space, and thin
  rules already present in the 6529 visual system.
- Heavy bordered boxes are reserved for interactive controls and grouped
  reference results. Editorial cards use image, title, summary, and a rule;
  they do not resemble registry rows or dashboards.
- The three lead features share one grid and one visual scale.
- Section headings and body copy align to a stable reading column.
- Technical labels and source links remain secondary to art and scholarship.

### 7.2 Images

- Every image is assigned explicitly by Work identifier or governed Media
  Asset identifier. File order, document relations, and first-image fallback
  never choose media.
- Art scholarship uses the Work or Project under discussion. It never borrows
  an unrelated Collection image to make a card visually complete.
- Stewardship and museum-practice research uses a separate editorial
  illustration collection: Museum-made diagrams and analytical graphics, or
  item-level verified CC0/Public Domain Mark archival images.
- External open-access imagery is accepted only when the exact item page or
  official API record carries `CC0 1.0` or `Public Domain Mark 1.0`. The words
  `open access`, `free to use`, or `no known copyright restrictions` are not,
  by themselves, sufficient rights evidence.
- Preferred institutional source pools are The Metropolitan Museum of Art,
  Smithsonian Open Access, the National Gallery of Art, and Rijksmuseum. The
  Library of Congress may be used only when the exact item record establishes
  public-domain status rather than a collection-level `free to use` label.
- Wikimedia Commons and aggregators may help discovery but are never the sole
  rights authority; the Museum records and links the originating institution.
- Each external Media Asset records title, creator, date, source institution,
  institutional object identifier, exact item URL, rights statement, rights
  URL, retrieval time, original-byte SHA-256, derivative SHA-256 values,
  dimensions, caption, and alt text.
- Each Museum-made graphic records its authoring source, input data or diagram
  specification, generation command when applicable, original-byte SHA-256,
  derivative hashes, caption, alt text, and CC0 dedication.
- Public-domain illustrations remain visibly distinct from Collection works.
  Their captions state the creator, title, date, source institution, and rights
  status, followed by `Editorial illustration; not in the Collection`.
- Native aspect ratio is preserved. `object-fit: contain` is the default.
- Documentary photographs are never cropped to imitate square generative art.
- Responsive derivatives and accurate `sizes` values are required.
- The selected candidate width may not exceed twice the rendered width.
- A missing, unresolved, or rights-incomplete image produces a text-led card;
  it never borrows the first image from a related artist, acquisition, program,
  or document.

#### 7.2.1 Initial Research-page image allocation

The first implementation uses the following allocation. All Work assignments
remain subject to the cross-route uniqueness check; if another top-level
Museum landing already uses the same Work as primary media, the presentation
record must choose an unused Work before release.

| Placement                            | Initial image                                                              | Rule                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| _The System in Seven States_ feature | `923 EMPTY ROOMS #713`                                                     | Not `CENTURY #31`; do not repeat on the Research page                 |
| _Conflict at Its Edges_ feature      | David Seymour, _Patrolling the border between the Negev Desert and Jordan_ | Preserve native photographic ratio                                    |
| _Keys and Gates_ feature             | Gül Yıldız, _Take the Key!_                                                | Status remains acquisition in progress                                |
| Casey Reas Artist card               | Initial target: `Ex Nihilo (Cosmos) #248`                                  | Must differ from every top-level landing primary image                |
| Magnum Artist cards                  | Larry Towell's and Moisés Saman's own photographs                          | Never use the Seymour feature image or a photograph by another artist |
| Keys and Gates Artist cards          | Three artists' own selected works, excluding _Take the Key!_               | Exact artists and order are source-governed                           |
| Casey Work and Project studies       | `Pre-Process #63` and `Phototaxis #308`                                    | One image per study; no reuse elsewhere on Research                   |
| Magnum Work studies                  | Micha Bar-Am's and Lorenzo Meloni's photographs                            | Complete the five-photograph set without repetition                   |
| Keys and Gates Work studies          | Two selected works not used by the feature or Artist cards                 | Exact Works and order are source-governed                             |

The non-acquisition research programme begins with eight independent image
commissions or selections:

| Research subject                        | Image brief                                                                         | Required source class                |
| --------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| Inside the System                       | Executable-work and preservation-layer diagram                                      | Museum original, CC0                 |
| Rights and licenses                     | Token title, copyright, display, reproduction, and preservation-rights diagram      | Museum original, CC0                 |
| Data architecture and the public record | Entity-and-evidence relationship graph                                              | Museum original, CC0                 |
| Generative-art descriptor methodology   | Reproducible chart generated from the published method                              | Museum original, CC0                 |
| Museums to learn from                   | Historic gallery or study-collection image concerned with display and public access | Item-level CC0 or Public Domain Mark |
| Scholarship and writing standard        | Catalogue, printing, annotation, or reading-room image                              | Item-level CC0 or Public Domain Mark |
| The Open Museum                         | Public reading room, library, museum interior, or open store                        | Item-level CC0 or Public Domain Mark |
| Repository-to-chain transition          | Public-record, commitment, contract, and display diagram                            | Museum original, CC0                 |

The three archival selections must depict three different subjects from at
least two originating institutions. They must not be generic decoration: the image
record includes a one-sentence curatorial rationale connecting the image to
the research subject. Final object selections and their rights evidence are
approved in the source presentation record before frontend integration.

#### 7.2.2 Image-reuse audit

The release produces a machine-readable image-usage report for the Museum
homepage and the top-level Collection, Artists, Acquisitions, and Research
routes. Each visible image reports route, placement, `mediaId`, underlying
Work identifier when applicable, original-byte SHA-256, derivative SHA-256,
and perceptual hash.

Validation rejects:

- reuse of one underlying Work as primary media on two top-level routes;
- reuse of one source illustration anywhere on the Research landing;
- byte-identical or perceptually equivalent variants presented as different
  images;
- use of `CENTURY #31` as a default or fallback image;
- use of any Casey Reas Work for unrelated stewardship, museum-practice, or
  organization research;
- a media URL or derivative that is not represented in the governed image
  usage report.

### 7.3 Type and spacing

- Main body copy: minimum 16 px, line-height 1.55.
- Card summaries: minimum 15 px, line-height 1.5.
- Metadata and status: minimum 13 px, line-height 1.4.
- Cards use at least 24 px between image and title groups and at least 48 px
  vertical separation between rows.
- No paragraph is visually truncated. Landing summaries are complete authored
  sentences rather than clipped source excerpts.

### 7.4 Responsive behavior

- At 1440 px, all three lead subjects are visible in the opening viewport.
- At 820 px, the lead grid becomes one wide feature followed by two equal
  features without clipping or horizontal scroll.
- At 390 px, all content forms one column, media remains within the viewport,
  and controls retain a minimum 44 × 44 px target.
- Wide tables do not appear on the Research landing.

### 7.5 Research section pages

Research section pages are public reading rooms, not unedited database views.
They retain the complete governed manuscript while presenting a deliberate
first reading.

- Each page opens with its authored title, plain-language scope, lifecycle
  status when relevant, and one explicitly assigned image with a complete
  credit and rights line.
- Acquisition essays show the works under discussion as an image sequence
  before the selected reading. _Conflict at Its Edges_ shows all five
  accessioned photographs; _The System in Seven States_ may show all seven
  accessioned works; _Access, Control, and Exit_ may show the selected works
  while stating that they remain unminted and unaccessioned.
- A concise, authored sequence of manuscript sections forms the visible
  reading. The complete governed manuscript remains available in a semantic
  disclosure immediately after that sequence.
- Technical relations, source matrices, institution directories, and other
  supporting material remain available in separate semantic disclosures.
  They do not interrupt the primary reading.
- Section selection is exact and fails closed. The frontend may select only
  authored headings declared for that page; a missing or renamed heading
  cannot silently substitute another passage.
- A hero qualifier adds presentation context to the complete credit and
  rights line. It never replaces or abbreviates that line.
- Non-acquisition research uses subject-specific editorial illustration.
  Data architecture uses Pieter Jansz. Saenredam's 1632 church ground plan;
  rights uses Pellegrino dal Colle's _The Printmaking Workshop_; sources and
  chronology uses Rembrandt's _A Scholar in His Study ('Faust')_. The item
  pages, rights statements, byte hashes, responsive derivatives, dimensions,
  captions, and alt text are recorded in the governed media manifest.
- The same generic illustration cannot stand in for unrelated research
  subjects. An unresolved illustration yields a text-led page.
- Complete pages must remain readable at 1440, 820, and 390 pixels: no
  continuous 100,000-pixel manuscript dump, no clipped table, no horizontal
  overflow, and no control below the 44-pixel target floor.

## 8. Copy standard

Public copy follows the Museum's scholarship and writing standard.

- State what the reader will find.
- Name artists, works, projects, and historical subjects precisely.
- Use ordinary museum language for lifecycle status.
- Keep interpretation attached to visible form or cited history.
- Remove data-pipeline vocabulary from the visitor hierarchy.
- Avoid slogans, fake profundity, process narration, and abstract claims about
  systems when a concrete description is available.

The following expressions are prohibited in landing copy:

- `connected work`;
- `canonical public record`;
- `publication layer`;
- `machine application profile`;
- `curated unit`;
- raw document-kind names;
- raw Museum identifiers except inside an expanded source or record view.

## 9. Deterministic acceptance requirements

Release acceptance covers the complete rendered Research landing and every
changed Research section page at 1440 × 1000, 820 × 1000, and 390 × 844.

### 9.1 Semantic acceptance

- The opening contains exactly the three specified lead features.
- Their images resolve to three different Work identifiers.
- Their statuses resolve to two `Permanent Collection` labels and one
  `Acquisition in progress` label.
- Casey Reas, each of the five photographers in _Conflict at Its Edges_, and
  each artist represented in _Keys and Gates_ resolve to one canonical Artist
  profile each.
- Magnum Photos resolves as an Organization and never as an Artist.
- _The System in Seven States_, _Conflict at Its Edges_, and _Keys and Gates_
  resolve as Acquisitions and never as Artists.
- Artist cards link to Artist profiles. Their Acquisition and Program context
  is rendered as a secondary relationship, not as a heading or parent page.
- The Artist section is not divided into acquisition-owned rows. Acquisition
  and Program filters leave profile identity and URLs unchanged.
- An Artist related to two Acquisitions still appears once in the Artist index
  and resolves to one profile.
- No record-only document kind appears in any editorial card or search result.
- Every visible summary equals its authored presentation summary.
- Every visible card has exactly one primary link and one unique document ID.
- Artists, Works and Projects, Acquisitions, Organizations and contexts,
  digital-art stewardship, and museum practice are all represented before the
  browse index.
- The three acquisition features use the exact three Works assigned in section
  7.2.1.
- The four stewardship entries use four different Museum-made graphics.
- The museum-practice entries use their assigned public-domain archival images
  or Museum-made graphics; none uses a Casey Reas, Magnum, or Keys and Gates
  Work as generic illustration.
- Every external illustration resolves to an item-level rights record and
  renders its full caption and non-Collection label.

### 9.2 Visual acceptance

- Retain a full-page screenshot and viewport screenshot at every required
  width.
- Inspect every section in the full-page images; a clean opening viewport is
  insufficient.
- Assert no repeated underlying Work or source illustration anywhere on the
  Research landing, including recrops and re-encodings.
- Compare the cross-route contact sheet and assert that no Research primary
  image duplicates primary media on the Museum homepage, Collection, Artists,
  or Acquisitions landing.
- Assert no unresolved image, placeholder, clipped title, clipped summary,
  overlapping border, horizontal overflow, or card wider than its container.
- Assert all body, summary, and metadata text meets the specified size and
  line-height floors.
- Assert documentary photographs retain their native ratio.
- Assert external illustrations are visually and textually distinguishable
  from Collection works and retain readable captions at every width.
- Run automated WCAG A and AA checks on the complete page at desktop and
  mobile widths.
- For every changed route, retain a complete full-page capture at all three
  required widths from the exact production build and exact source commit.
- Send the complete screenshot corpus, not a selected sample, to three
  independent adversarial reviews: museum and curatorial quality; visual and
  interaction quality; and copy and editorial quality. Any blocker requires a
  correction, a fresh production build, a complete recapture, and fresh
  review before a pull request may open.
- Repeat the route-by-route screenshot comparison on staging and on the exact
  production runtime before release closeout.

### 9.3 Corpus-change acceptance

Mutation tests must prove that:

- adding a new accession certificate does not change the Research landing;
- adding a new illustrated technical review does not change the Research
  landing;
- changing manifest order does not change presentation order;
- omitting a required lead document fails the presentation closed;
- assigning one media Work to two lead entries fails validation;
- assigning `Permanent Collection` to Keys and Gates fails validation;
- assigning Magnum Photos or Keys and Gates to `subjectType: artist` fails
  validation;
- adding a second profile for an existing Artist identifier fails validation;
- relating one Artist to a second Acquisition extends the existing profile and
  does not create a second Artist result;
- removing an Acquisition relationship does not remove the Artist profile from
  the Artist index;
- substituting a resized, recropped, or re-encoded version of an already used
  source image still fails the duplicate-image check;
- assigning one Work as primary media to Research and another top-level Museum
  landing fails the cross-route uniqueness check;
- assigning a Collection Work to museum-practice or stewardship research fails
  unless that document substantively studies the Work;
- an external asset supported only by a generic `open access`, `free to use`,
  or `no known copyright restrictions` label fails rights validation;
- removing the item-level rights URL, source hash, caption, or non-Collection
  label from an external illustration fails validation;
- adding a new eligible essay affects the page only after an explicit
  presentation entry is approved.

## 10. Media implementation plan

### 10.1 Inventory and duplicate map

Generate an inventory of every image rendered on the Museum homepage and the
top-level Collection, Artists, Acquisitions, and Research routes. Resolve each
URL to its underlying Work or Media Asset, calculate original and derivative
SHA-256 values and perceptual hashes, and produce a contact sheet grouped by
route. This inventory establishes the images that Research cannot reuse.

### 10.2 Editorial allocation

Materialize the allocation in section 7.2.1 as exact presentation entries.
Where a provisional Work conflicts with another top-level route, select a
different Work by the same artist and record the reason. No runtime fallback
or automatic substitution is allowed.

### 10.3 Original graphics and archival selections

Create the five specified Museum diagrams from checked-in vector or data-driven
sources. Select three exact archival images from at least two official source
institutions. Preferred rights pools are:

- [The Met Open Access](https://www.metmuseum.org/hubs/open-access), using only
  item pages marked Public Domain/CC0;
- [Smithsonian Open Access](https://www.si.edu/openaccess/faq), using only media
  explicitly designated CC0;
- [National Gallery of Art Open Access](https://www.nga.gov/terms-and-notices),
  using only object images released under CC0;
- [Rijksmuseum Information and Data Policy](https://data.rijksmuseum.nl/assets/files/RMA_InformationDataPolicy_ENG_v1.1_def-4cc333d4f8d60978a500348bf39887e6.pdf),
  using only items carrying CC0 or Public Domain Mark rights;
- [Library of Congress Free to Use and Reuse](https://www.loc.gov/free-to-use/),
  only when the exact item record independently establishes public-domain
  status.

The originating institution's object page is the authority. Aggregator
metadata cannot replace it.

### 10.4 Governed media records and derivatives

Add one governed Media Asset record per original graphic or archival image.
Retain source bytes and fixity, generate responsive AVIF and WebP derivatives,
preserve native ratio, write captions and alt text, and bind every derivative
to the presentation entry. The frontend serves preserved derivatives rather
than hotlinking an institution's image server.

### 10.5 Frontend composition

Render acquisition scholarship, Artists, Works and projects, Organizations
and contexts, stewardship, and museum practice from exact presentation entries.
Use open editorial layouts rather than repeated boxed cards. External archival
images always render with their source caption and non-Collection label.

### 10.6 Qualification

Run the entity, rights, media-resolution, duplicate-image, cross-route, and
mutation tests. Render full-page desktop, tablet, and mobile screenshots plus
the route contact sheet. Review every image for subject relevance, attribution,
ratio, responsive candidate size, and visual repetition before staging and
again on production.

## 11. Implementation boundary

This work changes the Research landing, its source presentation contract, its
adapter, and its acceptance tests. Existing research-document routes remain
available. Canonical Artist, Work, Project, Acquisition, Program, and
Organization routes remain independently owned by their entity pages; this
specification changes their Research-page placement and links, not their
underlying records.

The release is atomic across the canonical Museum source and frontend. The
Research page must not activate a partial presentation contract.

## 12. Definition of done

The work is complete when:

1. the source-governed presentation and Media Asset records pass Museum
   validation;
2. the image-usage inventory and cross-route contact sheet contain no forbidden
   duplicate Work or illustration;
3. the frontend renders the exact approved presentation without heuristics;
4. all semantic, mutation, responsive, media, accessibility, and full-page
   visual requirements pass on the exact PR head;
5. staging shows the approved full-page composition at all three widths;
6. production serves the exact qualified frontend version;
7. the complete production Research page is visually reviewed from top to
   bottom at desktop, tablet, and mobile widths.
