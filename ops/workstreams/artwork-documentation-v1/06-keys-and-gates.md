# Keys and Gates pilot configuration

Parent: [index](README.md). This applies the reusable feature to program `6529NM-AP-01`. It proposes documentation requirements for this delivery; it does not rewrite the commission, selection, advance-payment or accession terms.

## 1. Source basis and initial population

Use the [Keys and Gates Wave](https://6529.io/waves/4ff022b3-aa17-4a0a-ba78-58f64ff1d427), [program note](https://keysandgates_thememes.ar.io/) and [Museum outcome records](https://github.com/6529-Collections/6529networkmuseum/tree/7d71773296e3358f5df9bbb19c6d31445c006115/records/programs/6529NM-AP-01/outcomes). The source records contain the original statements and distinguish selection evidence from later mint/acquisition/accession. Recheck live authors and source availability at import time. Handles below are display labels, not access-control identifiers.

Initial roster: 16 works by 15 artists. HugoFaz has two independent works that may pin the same shared artist-record revision. Preserve exact original title spelling/case, including apparent typos, until the artist confirms a correction.

| Outcome | Artist | Title | Source drop ID |
|---|---|---|---|
| OUT-001 | GulYildiz | Take the Key! | `c3283930-101e-4e3a-b921-57d81649ca81` |
| OUT-002 | HugoFaz | the Artist in teh Open Sea | `35efbf4c-2633-4b14-aa6a-82ea7660b6b9` |
| OUT-003 | nasimghanizadeh | Managed Freedom | `b47b7d58-6276-45ba-b707-ec0f623e39e2` |
| OUT-004 | intrepid | No Key, Only Light | `57c49f95-7854-4a2a-ba2c-d448bc7827fc` |
| OUT-005 | ikertje | Residual Barrier | `52631c54-fcce-46e7-b88c-5100de46734c` |
| OUT-006 | GIANT | The Hostile Gate | `73ecf8fc-9bde-492d-a624-39d0dd547587` |
| OUT-007 | priyanka | the cost of open | `f24313f0-b335-4c16-9052-3a689f82f188` |
| OUT-008 | Rakesh | Dichotomy. | `aa257b16-4309-48b6-9033-1e3d7fb9016d` |
| OUT-009 | pandelic | Now Is Our Time | `a9e1af00-7ac7-4b7d-a39e-31c7a662ee28` |
| OUT-010 | Minalisa | Checkpoint | `d68542bc-f05e-4f23-ae8b-fac730cd4b7b` |
| OUT-011 | HugoFaz | Sina Beizavi in Brazil | `52b6f536-3ebc-4bf5-b7da-2ed775df7ad3` |
| OUT-012 | Teyhu | Rusted | `7d3a31f8-41bf-4fc5-8756-ed67eccdcc96` |
| OUT-013 | arsonic | Nowhere To Esc. | `51982d19-395a-4eaa-866c-8e89aa952cbb` |
| OUT-014 | Zoku | Morning Glory | `dc75fe32-f3c2-49db-9069-d9975b5964f3` |
| OUT-015 | shamspranto | মুক্তিযুদ্ধ - Fight for Freedom | `8ac2b1b8-64f9-48ef-b41b-04ee3a9ba3ab` |
| OUT-016 | Veerendra | No Access | `13407a59-3b86-4a04-b68e-87e818ed3766` |

Do not turn a roster import into an announcement or automatic artist message. Create source-backed drafts through the authorized import service; coordinators can review the results and use existing approved communication channels to invite artists. This spec authorizes neither posting nor changing program records.

## 2. Profile configuration

Profile ID `keys_and_gates_v1`, version 1, program ID `6529NM-AP-01`, Wave ID `4ff022b3-aa17-4a0a-ba78-58f64ff1d427`. Enable all eight module versions at 1. Resolve the complete configuration into each context; inheritance described below is build-time convenience, not a mutable runtime dependency.

See the [concrete resolved configuration example](examples/keys-and-gates-profile.json). Rule IDs name registered server validators/review rules; they are not executable expressions returned by a program. All configured fields not required by the resolved profile are recommended. Review policy outcomes and completeness are returned by the server rather than inferred from literal English statements in this JSON.

| Profile | Required fields and review |
|---|---|
| `stream_artwork_basic_v1` | Identity name/credit/record language; artwork title/title language/medium/canonical file; context caption; rights basis/intended license/declaration/effect. All eight modules available. Curatorial and rights lanes; technical lane may be configured by a new profile version. Other questions recommended or conditionally validated when answered. |
| `photography_documentation_v1` | All R fields/questions in the field catalogue, plus typed conditions triggered by their answers. Curatorial, technical and rights lanes. |
| `keys_and_gates_v1` | Photography required set plus theme connection, proposed 1/1 statement and proposed CC0 1.0 scope; program's existing caption/consent/identifiable-minor conditions apply to review. Same three lanes. |

Photography/Keys and Gates required-for-review field IDs:

```text
identity.display_name                  identity.preferred_credit
identity.record_language
artwork.title                          artwork.title_language
artwork.capture_date                   artwork.location
artwork.medium                         artwork.edition_statement
artwork.canonical_asset_id
files.master_availability
context.caption                        context.history
context.prior_mint_status
process.capture_method                 process.techniques
process.process_description            process.material_changes
process.ai_use                         process.contributors
rights.rights_basis                    rights.intended_license
rights.rights_declaration               rights.declaration_effect
rights.third_party_material            rights.people_depicted
preservation.significant_properties    preservation.display_orientation_crop
preservation.color_and_tone            preservation.acceptable_changes
```

Keys and Gates additionally requires `context.theme_connection`; referencing the approved caption is sufficient when it covers the theme. Each question is one addressed item, regardless of text length. Conditions add `process.ingredients` for composite/collage, `process.construction_note` for miniature, `rights.consent_status` when people are depicted, `rights.consent_asset_ids` when documents are claimed supplied and `rights.identifiability_note` for minors/uncertainty. Source availability, biography, expanded statement, source files, print detail and interview remain recommended. This intentionally keeps the first intake attainable while making richer documentation visible and valuable.

Inline field IDs: `context.caption`, `process.process_description` and `identity.preferred_credit`, with a read-only name/artist-record selector. Original title/media remain the normal submission fields and become source proposals. The pilot's selected works will mostly enter afterward; shipping the same modules' inline mode proves the ongoing Stream workflow without reopening the closed commission.

Existing program terms ask for a 75–150 word caption. The UI provides language-aware guidance; the reviewer resolves an unusually long caption or a language where word segmentation differs. Do not truncate a long original submission to create the caption. Keep the original statement and let the artist approve a separate concise version.

The proposed edition/license fields are constrained by the program profile, but a contradictory artist answer is preserved as a review issue, not silently rewritten. A generic work can select another license; a Keys and Gates context cannot silently change policy through its editor. “Required for review” here does not add a new payment gate or retroactively invalidate the original selection.

## 3. Import and artist check flow

1. Resolve each source drop through the server and match the roster/Wave. Obtain the stable author profile ID from the authenticated API source. Reject or hold mismatches for a coordinator; never resolve ownership by a current handle alone.
2. Dry-run the import: show 16 candidate links, existing-record matches, missing authors/sources and proposed module mappings. A second run must create zero duplicate works or contexts.
3. Preserve the authorized original text/excerpt, source identity, retrieval time and byte digest in a source receipt. Preserve conditional CC0 wording verbatim; do not transform it into an effective release claim.
4. Prefill straightforward title, artist credit, stated location/year and process values as artist-check proposals. Keep original text intact. Capture source paths for every extracted value. Mark any guess/ambiguity as unresolved, not verified. Use deterministic/manual mappings for launch; no generative rewriting service is required.
5. Prefill the original long account into `artist_statement` where appropriate; leave caption editing to the artist. Artist-visible source excerpts permit checking. Original media URLs can illustrate the submission but do not satisfy the final-original upload requirement.
6. Offer the artist an initial “Check your existing information” pass, then files, optional deeper context and remaining required questions. Save progressively. A coordinator can request specific additions without asking everyone to rewrite the same information.
7. Artist confirms the exact version; the three assigned reviewers review that version. The coordinator works from the structured queue. No one supplies payment destination, token configuration or a mint signature in this flow.

Only the artist or an explicitly granted editor changes artist-authored text after import. Importing into an existing record uses a field diff and the context ETag. A coordinator's note is always attributed to the coordinator.

## 4. Work-specific follow-ups

These are source-derived prompts for the coordinator, not final judgments or automatically published flags. Confirm them privately with the artist where needed. General review applies to all 16 works; do not invent a special concern for a work just to fill a table.

| Work | Focused follow-up |
|---|---|
| the Artist in teh Open Sea | Confirm whether the title spelling is intentional. Document component captures and the long-exposure/composite process; request surviving components only where available. |
| No Key, Only Light | Resolve the narrative's 2021 date versus the technical note's 2020 year. Keep both source statements until the artist clarifies. Separately route depicted-person eligibility/consent to restricted rights review; do not infer identifiability from the written account. |
| The Hostile Gate | Distinguish the history of this exact image from exhibition/publication/award claims about its series or the artist's practice. |
| Now Is Our Time | Preserve the source's 2011 capture context separately from the later program/release dates. Review old source availability honestly. |
| Checkpoint | Preserve the withheld-location choice. Technical review checks original embedded location data; private context must not be promoted into captions or previews. |
| Sina Beizavi in Brazil | Review how the named person's context and consent are documented, with sensitive evidence restricted. Do not infer clearance from the presence of a name in the submission. |
| Morning Glory | Accept genuine phone-image dimensions; the source reports 2670 × 1878. Compare delivered file metadata, and do not ask for artificial upscaling. |
| মুক্তিযুদ্ধ - Fight for Freedom | Preserve the Bengali title and any artist-approved English version. Document Photoshop/collage ingredients and their origins. |
| No Access | Document miniature construction and focus stacking. Distinguish the photographed artwork from physical models or objects that are supporting material. |

Do not expose restricted follow-up details in analytics, email previews or public Museum status. A source's existing rights representation is evidence of what the artist said, not proof that the team has inspected a release. The program's exclusion of identifiable minors is not overridden by a generic “consent provided” checkbox.

## 5. Review lanes and pilot operating outcome

Curatorial checks: exact work identity, coherent dates, artist-approved caption/translation, theme, proper credit and correctly scoped history. Technical checks: original-byte delivery, final/master distinction, source availability, process account, significant properties and display guidance. Rights checks: declaration effect/scope, third-party materials, contributors, depicted people/consent and publication sensitivities.

Reviewers record uncertainty explicitly. A technical reviewer may accept a well-documented unavailable original with a reason where policy allows; a rights reviewer cannot accept an unresolved program exclusion. A reviewer can ask for a focused correction without unlocking other roles' private evidence.

Pilot completion is: 16 correctly linked work contexts, a reusable identity record per resolved artist, required questions addressed, available originals stored with verified byte hashes, artist-confirmed revisions and explicit lane outcomes. Optional interviews may remain pending or declined. Any unresolved review item is visible as such; it is not disguised by overall completion. This outcome is documentation readiness only. Mint preparation and institutional accession retain their own later decisions.
