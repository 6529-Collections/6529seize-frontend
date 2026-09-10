# Field catalogue and validation

Parent: [index](README.md). These are intake fields, not a replacement for Stream's canonical schemas. A field path is stable within module version 1. Module JSON is validated server-side; the FE uses the same declared rules.

## Common value and visibility rules

Every answer is represented as `{ status, value, intended_visibility }`. `status` is `provided | unknown | withheld | unavailable | not_applicable`; an absent property is unanswered. Only `provided` carries `value`; other statuses may carry `explanation` up to 1,000 characters. Default allowed status is `provided`; exceptions must be declared below. Unknown or unavailable satisfies addressing the question only where specified, and may still require reviewer attention. Privacy choice is not a substitute for a required rights declaration.

When a domain enum itself contains `unknown`, `uncertain`, `unavailable` or `not_applicable`, use `status=provided` with that enum value: the artist has answered the question. The outer statuses apply to fields explicitly allowing them without such an enum, such as an unknown capture date or withheld location. Never accept two different canonical encodings of the same unknown answer. An optional unanswered field is absent, rather than a fabricated unknown value. A provided empty array is permitted only for questions that explicitly allow none.

`intended_visibility` is `public_record | restricted`. All API access remains private in this delivery. Public-record fields are visible to all authorized context participants; restricted values only to the artist and participants explicitly allowed for that field/class. `withheld` stores no secret value. “Location withheld” must not keep hidden GPS coordinates in the same field. Do not require legal name, passport, birth date or home address by default.

Default visibility is `public_record` for catalogue/context/process/intent and `restricted` for contact and documentary consent. The artist sees the choice beside each module; sensitive fields have locked restricted visibility. Future publication approval is not granted by selecting `public_record` now.

Text limits below count Unicode code points; storage uses utf8mb4. A context's structured payload is capped at 256 KiB UTF-8 before files; a write request is capped at 512 KiB. Preserve meaningful case, punctuation and internal whitespace. Normalize transport to NFC and line endings to LF, disclose this canonicalization for snapshots, and do not silently trim substantive text. URLs are HTTPS, IPFS or Arweave references as appropriate, max 2,048 characters; v1 stores external source links without server-fetching arbitrary URLs.

Dates use `{ precision: day|month|year|range, start, end?, approximate: boolean }`; precision determines YYYY-MM-DD, YYYY-MM or YYYY. A range adds `endpoint_precision: day|month|year`, uses matching endpoint precision and requires an ordered end. An unknown date uses the outer `unknown` status without a value. Validate calendar dates and ordered ranges. Never substitute submission time for capture time. Dimensions are integer pixels measured from files when supported, distinguished from artist-entered dimensions. Dots per inch do not substitute for pixel dimensions.

Arrays are bounded: contributors 30, history entries 50, process/source links 50, assets 100/context, languages 10, rights instruments 30, depicted-person entries 50. The API returns these policy limits; no hidden client-only cap.

Requirement abbreviations: **R** = required for photography review; **K** = additional Keys and Gates review requirement; **O** = recommended or conditional as described. Existing Wave submission requirements remain in the Wave submission flow. The profile specifies the final required set.

## Identity module — artist record

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `display_name` | Text 160 | R; provided, public/pseudonymous name accepted |
| `profile_id` | Server identity reference | Derived from authenticated profile; cannot be changed by field PATCH |
| `preferred_credit` | Text 300 | R; provided; prefill display name, require confirmation |
| `biography` | Localized text 4,000 per language | O; suggest 100–200 words; never invent from profile activity |
| `links` | Label 100 + URL, max 10 | O; artist website/profile/authority references |
| `languages` | BCP 47 tags | O; communication/writing preference, not nationality inference |
| `private_contact` | Text 320 | O; always restricted; context-only override, excluded from shared identity revisions and never automatically copied |
| `record_language` | BCP 47 | R; defaults to current UI language only after user sees it |

The work stores an `artist_record_id` and revision reference. Selecting a newer record is an explicit context content change. Identity import is a draft proposal, not human-identity verification. Payment and signing-wallet configuration are deferred; do not duplicate existing payment data here.

## Artwork module

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `title` | Text 255 | R; exact spelling/case; “Untitled” only when artist chooses it |
| `title_language` | BCP 47 | R |
| `alternate_titles` | Language + text 255, max 10 | O; translations/earlier titles, each labeled |
| `capture_date` | Date object | R; unknown allowed, surfaced for review |
| `completion_date` | Date object | O; final edit/assembly date, separate from capture |
| `location` | Text 300 | R; provided/withheld/unknown allowed; locality-level sufficient |
| `medium` | `{ kind: digital_photograph\|analogue_photograph\|photographic_composite\|other, detail?: text 500 }` | R; other requires detail |
| `edition_statement` | Text 500 | R; K suggests intended 1/1; no token mint is asserted |
| `visual_description` | Text 1,500 | O; factual accessibility description, separate from interpretation |
| `series_title` | Text 255 | O |
| `canonical_asset_id` | Ready asset UUID | R; artist-approved final artwork, not an arbitrary preview |
| `declared_dimensions` | Positive width/height, max 1,000,000 each | O; discrepancy against inspected file is visible |
| `work_relationships` | Related work ID or source URL + relation | O; `version_of\|part_of_series\|related_work`; no inferred identity merge |

Replacing `canonical_asset_id` requires a reason (20–1,000 characters) after any confirmation. The UI offers separate-work creation and shows the previous image. This phase does not enforce an edition covenant; it records the statement for review.

## Files module

Asset records are specified in [backend](03-backend-and-api.md). User-editable per-file metadata: `role`, `label` (160), `description` (1,000), `intended_visibility`, `source_of_asset` (self/collaborator/third_party/unknown), `source_credit` (500), `derived_from_asset_ids` (max 30), and `deposit_note` (1,000).

Roles: `artwork_final`, `preservation_master`, `camera_original`, `working_file`, `process_evidence`, `display_derivative`, `consent_instrument`, `rights_instrument`, `interview_recording`, `interview_transcript`, `other_supporting`. Consent instruments and private-rights instruments are always restricted. Camera/working files default restricted; other roles require an explicit visible publication choice before confirmation. One file can have multiple roles only through distinct manifest role links to the same bytes, not duplicated uploads.

Required: identify the canonical final file and answer `master_availability` as `supplied | same_as_final | unavailable`. Unavailable requires explanation; it raises technical attention rather than blocking truthful intake. `source_availability` uses `supplied | retained_by_artist | unavailable | not_applicable`, with explanation for the latter three. RAW and working files are recommended when they survive; absence is not automatically disqualifying.

Server-derived values: received byte count, detected MIME/format, original SHA-256, inspection status, dimensions, embedded color-profile presence/name where safely extractable. Never label these values artist statements. Full EXIF and GPS remain restricted, are not searchable and are not returned in a general file response. Existing C2PA data is preserved as bytes; v1 does not claim C2PA validation.

## Context module

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `caption` | Localized text 3,000 | R; K asks 75–150 words; soft word-count guidance, not rejection of non-space-delimited languages |
| `artist_statement` | Localized text 12,000 | O; suggest 300–600 words |
| `making_context` | Text 6,000 | O; what happened before/during/after |
| `theme_connection` | Text 4,000 | K; may reference caption instead of requiring repeated prose |
| `misunderstandings` | Text 4,000 | O; what future viewers should not misread |
| `history` | Bounded entries below | R question: `entries_supplied\|none_known\|unknown`; individual entries optional |
| `references` | Label, URL, note 1,000 | O; historical/contextual sources, not automatic assertions of truth |

History entry fields: `kind` = publication/exhibition/award/print_edition/nft_mint/other; `scope` = this_work/series/artist; title (300); date object; venue/publisher (300); URL; note (1,000). NFT history may include artist-supplied chain/contract/token strings, marked unverified until a future chain adapter checks them. `prior_mint_status` is a separate R question: `never_minted|previously_minted|unknown`; previous mint requires references or an explanation of unavailable information.

Localized text uses `{ primary_language, versions: [{ language, text, authorship: original|artist_translation|third_party_translation, approved_by_artist: boolean }] }`. The system does not auto-translate. Original and translated statements stay separately attributable.

## Process module

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `capture_method` | `digital_camera\|phone\|drone\|film_scan\|other` + note 500 | R; unknown allowed with note |
| `camera` / `lens` | Text 300 each | O; unknown allowed |
| `exposure_note` | Text 500 | O; use existing data, do not make the artist reconstruct settings |
| `techniques` | Enum array | R; `single_capture\|staged\|composite\|collage\|focus_stack\|long_exposure\|miniature\|other`; other requires note |
| `editing_tools` | Name/version entries, max 20 | O; version may be unknown |
| `process_description` | Text 8,000 | R; describe capture and material changes |
| `material_changes` | Text 4,000 | R; explicit none is accepted |
| `ai_use` | `none\|assistive\|generative\|unknown` + detail 4,000 | R; assistive/generative requires detail, no automatic eligibility verdict |
| `ingredients` | Asset/source ref, creator, role, rights note | Required if composite/collage; unavailable references require explanation |
| `contributors` | Name, optional profile ref, role, authorship claim, credit | R question: entries or none; credits do not grant authority |
| `construction_note` | Text 4,000 | Required for miniature; recommended for other staged/constructed work |

An artist may select multiple techniques. “Composite” is neither hidden nor treated as an error. Do not turn process classification into an undisclosed AI or authenticity scoring system.

Wire shape for an enum with a detail/note is `{ kind, detail? }`; detail uses the field's stated limit. `capture_method` allows outer unknown with explanation; supplied other requires detail. `techniques` uses `{ kinds: [...], other_detail? }`, with 500 characters for other detail. `contributors` uses `{ kind: entries_supplied|none, entries: [...] }`; none requires an empty list. Contributor entries have `name` (160), optional `profile_id`, `role` (300), `authorship_claim` (boolean), and `credit` (500). Ingredients use `{ kind: entries_supplied|unavailable, entries: [...], explanation? }`, with unavailable requiring an explanation. Each entry identifies its asset ID or source URL where available, creator (160), role (300) and rights note (1,000); unknown origin must be stated, not filled with the current artist's name.

## Rights module

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `rights_basis` | `artist_owned\|coauthored\|licensed_components\|other\|unknown` | R; detail required except artist_owned |
| `intended_license` | URI + human label | R; K profile fixes proposed CC0 1.0; changing profile/license needs coordinator review |
| `rights_declaration` | Text 6,000 | R; retain original source and artist-approved wording separately |
| `declaration_effect` | `proposed\|conditional\|already_effective\|unknown` | R; no automatic change at confirmation |
| `third_party_material` | `none\|present\|unknown` + refs/note | R; present requires details |
| `people_depicted` | `none\|self_only\|adults\|includes_minors\|uncertain` | R; always restricted; flag minors/uncertain for restricted review |
| `consent_status` | `not_applicable\|documents_supplied\|exists_not_supplied\|not_available\|uncertain` | Required unless no people; always restricted; status alone is not clearance |
| `consent_asset_ids` | Restricted asset IDs | Required when documents_supplied; ready files only |
| `identifiability_note` | Text 2,000 | Conditional; restricted |
| `sensitive_context_note` | Text 4,000 | O; restricted; public caption is separately chosen |
| `publication_notes` | Text 2,000 | O; public/private wishes; incompatible proposed license restrictions trigger review |

For Keys and Gates, documented consent suitable for its release and the identifiable-minor exclusion are program requirements. A parental release does not override that exclusion. Review evidence and outcome are written by the rights reviewer, not by an artist field. An honest problematic answer is saveable; it prevents rights-lane acceptance until resolved.

Consent asset references, depicted-person answers, consent status and sensitive-context/identifiability notes are locked restricted. Rights basis, intended license, the artist's chosen declaration and declaration effect default to public-record intent, with actual access still private during this phase. Reviewers without rights-evidence access receive redacted markers for the restricted questions, including their conditional details.

CC0 choices for the final artwork do not automatically apply to biography, transcript or source material. Record per-asset intended terms where relevant. The UI explains CC0 through approved copy and links to the [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/); it does not generate legal instruments or promise that a waiver removes other people's rights.

`intended_license` uses `{ uri, label }` with a 160-character label. `rights_basis` uses `{ kind, detail? }` (detail max 2,000); `third_party_material` uses `{ kind, details?, references? }` (details max 4,000; max 30 references). Simple enums such as `people_depicted`, `declaration_effect` and `consent_status` remain strings inside the answer wrapper. `identifiability_note` is required for includes_minors/uncertain and always restricted. On all other people answers it is optional and restricted.

## Preservation module

| Field | Type/limit | Requirement and behavior |
|---|---|---|
| `significant_properties` | Text 6,000 | R; image characteristics that matter |
| `display_orientation_crop` | Text 2,000 | R; full frame/aspect, borders and crop preferences |
| `color_and_tone` | Text 2,000 | R; “no special instruction” accepted |
| `screen_preferences` | Text 2,000 | O |
| `print_preferences` | Text 3,000 | O; “not specified” accepted; no implied physical print acquisition |
| `acceptable_changes` | Text 4,000 | R; file conversion/scaling vs changes that create another version |
| `avoid_changes` | Text 4,000 | O |
| `physical_materials` | Text 2,000 | O; distinguish supporting miniatures/prints from proposed acquired object |

Artist display wishes document intent. They are not additional copyright restrictions on a CC0 artwork. No migration or alteration is performed by this feature.

## Interview module

`mode` = written/recording/declined/not_yet; `instrument_id` and version; `date`; `participants` (name/role); `languages`; answers to the eight prompts in [copy](05-artist-guidance-and-copy.md); optional recording and transcript asset IDs; `recording_permission` and `transcript_permission` = not_requested/private_review/intended_public_record; artist correction note.

All interview fields are O in the first Keys and Gates intake configuration, with a clearly visible recommendation. A recording may arrive before a transcript. Mark transcript missing honestly; do not claim full interview documentation. Declined is a stated choice, not a Stream waiver or legal instrument. The coordinator may arrange a conversation outside the app and upload it with permission. No paid transcription service or recording integration is needed for v1.

Interview answers are keyed by stable `q1` through `q8` IDs and use localized text, at most 8,000 characters per answer/language, within the overall payload budget. Participants are capped at 30, names at 160 and roles at 300; correction note at 4,000. The instrument's exact resolved prompts/version are pinned with the record. Recording/transcript fields require corresponding ready assets if supplied; a written interview may omit them.

## Remaining structured field conventions

`context.history` uses `{ kind: entries_supplied|none_known|unknown, entries: [...] }`; only entries_supplied has entries. `context.prior_mint_status` uses `{ kind: never_minted|previously_minted|unknown, references?: [...], explanation?: text 1000 }`; previous mint requires a reference or explanation. `context.theme_connection` uses `{ kind: text, text }` or `{ kind: caption_reference }`; the latter is valid only while a caption is provided, and resolves to that revision's caption. `files.master_availability` and `files.source_availability` use `{ kind, explanation? }` with the enums above and a 1,000-character explanation limit.

When master availability is supplied, the manifest must contain a ready preservation_master role; same_as_final creates an explicit preservation_master role link to the canonical final asset; unavailable has no invented file. Source availability supplied requires a ready camera_original or working_file role. `artwork.canonical_asset_id` must correspond to a ready artwork_final role in this context. Derivation references must be acyclic, context-authorized and never point to the same asset. Relationships/references not otherwise bounded above have a limit of 30; labels 160, notes 1,000 and URLs use the common limit. Every asset link records `intended_terms: { kind: unspecified|private_deposit|proposed_license|already_licensed, license_uri?, note? }`, with notes at most 2,000; license URI required for license kinds.

Malformed supplied values block saving. Missing answers and conditional omissions are allowed in a draft and returned as completeness items; they block confirmation only when required by the pinned profile. Conditional validity within a supplied object (for example other without its detail) blocks that write. Truthful but review-sensitive answers remain valid values. The backend must encode these distinctions explicitly in OpenAPI/schema tests before the FE generates clients.
