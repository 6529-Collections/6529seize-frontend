import type { MuseumAcquisitionMethod } from "./entities";
import type { MuseumPublicEntityType, MuseumPublicRelationType } from "./types";

export const PUBLIC_ENTITY_SCHEMA_ID =
  "0xd8aef6592fe156c4c3c10e59de540f5cdf8b130eedca322e0e22b30764bee1a9";
export const PUBLIC_RELATION_SCHEMA_ID =
  "0xaa76f1b93e01ae7a1cff2717b0c814df772fd26d3997a47847a1887cba6756de";
export const ENTITY_PATH_PATTERN = /^records\/entities\/([^/]+)\.json$/u;
export const RELATION_PATH_PATTERN = /^records\/relations\/([^/]+)\.json$/u;
export const MUSEUM_PUBLIC_ENTITY_INVENTORY_PATH =
  "schemas/public-entity-identity-inventory.json" as const;
export const MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_PATH =
  "schemas/public-relation-identity-inventory.json" as const;
export const MUSEUM_PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA_PATH =
  "schemas/public-relation-identity-inventory.schema.json" as const;
export const PUBLIC_RELATION_IDENTITY_INVENTORY_SCHEMA =
  "https://6529networkmuseum.org/schemas/public-relation-identity-inventory-v1.json" as const;
export const PUBLIC_RELATION_IDENTITY_INVENTORY_VERSION = "1.5.0" as const;

export const ENTITY_ID_PATTERNS: Readonly<
  Record<MuseumPublicEntityType, RegExp | null>
> = {
  INSTITUTION: /^6529NM-I-[0-9]{4}$/u,
  COLLECTION: /^6529NM-C-[0-9]{4}$/u,
  AGENT: /^6529NM-AGT-[0-9]{4}$/u,
  ARTIST: /^6529NM-ART-[0-9]{4}$/u,
  ORGANIZATION: /^6529NM-ORG-[0-9]{4}$/u,
  WORK: /^6529NM-W-[0-9]{4}$/u,
  PROJECT_OR_SERIES: /^6529NM-PRJ-[0-9]{4}$/u,
  CURATED_ACQUISITION: /^6529NM-CA-[0-9]{4}-[0-9]{3}$/u,
  ACQUISITION_PROGRAM: /^6529NM-AP-ENT-[0-9]{4}$/u,
  ACCESSION: /^6529NM-ACC-ENT-[0-9]{4}$/u,
  RESEARCH_PUBLICATION: /^6529NM-RP-[0-9]{4}$/u,
  MEDIA_REFERENCE: /^6529NM-MED-[0-9]{4}$/u,
  EXHIBITION: null,
};

/** Inventory-bound observations are source records, not public entity pages. */
export const INVENTORY_ONLY_ENTITY_ID_PATTERNS = {
  WORK_LIFECYCLE_OBSERVATION: /^6529NM-W-OBS-[0-9]{4}$/u,
} as const;

export const ENTITY_TYPES = new Set<MuseumPublicEntityType>([
  "INSTITUTION",
  "COLLECTION",
  "AGENT",
  "ARTIST",
  "ORGANIZATION",
  "WORK",
  "PROJECT_OR_SERIES",
  "CURATED_ACQUISITION",
  "ACQUISITION_PROGRAM",
  "ACCESSION",
  "RESEARCH_PUBLICATION",
  "MEDIA_REFERENCE",
]);

export const RELATION_TYPES = new Set<MuseumPublicRelationType>([
  "INSTITUTION_HOLDS_COLLECTION",
  "ARTIST_CREATES_WORK",
  "AGENT_PLAYS_ROLE",
  "PROJECT_CONTEXTUALIZES_WORK",
  "ORGANIZATION_ORIGINATES_PROJECT",
  "ORGANIZATION_PUBLISHES_PROJECT",
  "ACQUISITION_PROGRAM_PRODUCES_ACQUISITION",
  "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK",
  "PROGRAM_SELECTS_WORK",
  "ACCESSION_ADMITS_WORK",
  "COLLECTION_CONTAINS_WORK",
  "WORK_CONSTITUTED_BY_COMPONENT",
  "WORK_HAS_MANIFESTATION",
  "PUBLICATION_INTERPRETS_ENTITY",
  "INSTITUTION_PUBLISHES_PUBLICATION",
  "ENTITY_HAS_MEDIA",
  "EXHIBITION_PRESENTS_WORK",
]);

export const WORK_LIFECYCLE_STATUSES = new Set([
  "proposed_in_museum_wave",
  "selected_by_museum_wave_acquisition_review_in_progress",
  "selected_through_acquisition_program",
  "acquisition_pending",
  "acquisition_complete",
  "accession_review_in_progress",
  "accessioned",
  "closed_without_selection",
  "withdrawn",
  "not_established",
]);

export const ACQUISITION_STATUSES = new Set([
  "proposed_in_museum_wave",
  "selected_by_museum_wave_acquisition_review_in_progress",
  "selected_through_acquisition_program_acquisition_pending",
  "acquisition_complete_accession_review_in_progress",
  "accessioned_into_permanent_collection",
  "closed_without_selection",
  "withdrawn",
]);

export const RELATION_ASSERTION_STATUSES = new Set([
  "asserted",
  "observed",
  "reserved",
]);

interface MuseumRelationProfile {
  readonly sources: readonly MuseumPublicEntityType[];
  readonly targets: readonly MuseumPublicEntityType[];
  readonly allowedQualifiers: readonly string[];
  readonly requiredQualifiers: readonly string[];
  readonly reserved?: boolean;
}

export const RELATION_PROFILES: Readonly<
  Record<MuseumPublicRelationType, MuseumRelationProfile>
> = {
  INSTITUTION_HOLDS_COLLECTION: {
    sources: ["INSTITUTION"],
    targets: ["COLLECTION"],
    allowedQualifiers: [],
    requiredQualifiers: [],
  },
  ARTIST_CREATES_WORK: {
    sources: ["ARTIST"],
    targets: ["WORK"],
    allowedQualifiers: ["role"],
    requiredQualifiers: [],
  },
  AGENT_PLAYS_ROLE: {
    sources: ["AGENT", "ARTIST", "ORGANIZATION"],
    targets: [
      "WORK",
      "PROJECT_OR_SERIES",
      "CURATED_ACQUISITION",
      "RESEARCH_PUBLICATION",
    ],
    allowedQualifiers: ["role"],
    requiredQualifiers: ["role"],
  },
  PROJECT_CONTEXTUALIZES_WORK: {
    sources: ["PROJECT_OR_SERIES"],
    targets: ["WORK"],
    allowedQualifiers: ["scope"],
    requiredQualifiers: [],
  },
  ORGANIZATION_ORIGINATES_PROJECT: {
    sources: ["ORGANIZATION"],
    targets: ["PROJECT_OR_SERIES"],
    allowedQualifiers: ["role"],
    requiredQualifiers: ["role"],
  },
  ORGANIZATION_PUBLISHES_PROJECT: {
    sources: ["ORGANIZATION"],
    targets: ["PROJECT_OR_SERIES"],
    allowedQualifiers: ["role"],
    requiredQualifiers: ["role"],
  },
  ACQUISITION_PROGRAM_PRODUCES_ACQUISITION: {
    sources: ["ACQUISITION_PROGRAM"],
    targets: ["CURATED_ACQUISITION"],
    allowedQualifiers: [],
    requiredQualifiers: [],
  },
  CURATED_ACQUISITION_BRINGS_TOGETHER_WORK: {
    sources: ["CURATED_ACQUISITION"],
    targets: ["WORK"],
    allowedQualifiers: ["display_order", "selection_status", "scope"],
    requiredQualifiers: ["display_order"],
  },
  PROGRAM_SELECTS_WORK: {
    sources: ["ACQUISITION_PROGRAM"],
    targets: ["WORK"],
    allowedQualifiers: ["selection_status", "mint_status", "display_order"],
    requiredQualifiers: ["selection_status"],
  },
  ACCESSION_ADMITS_WORK: {
    sources: ["ACCESSION"],
    targets: ["WORK"],
    allowedQualifiers: ["accession_object_id"],
    requiredQualifiers: ["accession_object_id"],
  },
  COLLECTION_CONTAINS_WORK: {
    sources: ["COLLECTION"],
    targets: ["WORK"],
    allowedQualifiers: ["collection_membership_status"],
    requiredQualifiers: ["collection_membership_status"],
  },
  WORK_CONSTITUTED_BY_COMPONENT: {
    sources: ["WORK"],
    targets: ["MEDIA_REFERENCE", "WORK"],
    allowedQualifiers: ["role"],
    requiredQualifiers: ["role"],
  },
  WORK_HAS_MANIFESTATION: {
    sources: ["WORK"],
    targets: ["MEDIA_REFERENCE", "WORK"],
    allowedQualifiers: ["role"],
    requiredQualifiers: ["role"],
  },
  PUBLICATION_INTERPRETS_ENTITY: {
    sources: ["RESEARCH_PUBLICATION"],
    targets: [
      "WORK",
      "PROJECT_OR_SERIES",
      "CURATED_ACQUISITION",
      "ARTIST",
      "ORGANIZATION",
    ],
    allowedQualifiers: ["role"],
    requiredQualifiers: [],
  },
  INSTITUTION_PUBLISHES_PUBLICATION: {
    sources: ["INSTITUTION"],
    targets: ["RESEARCH_PUBLICATION"],
    allowedQualifiers: [],
    requiredQualifiers: [],
  },
  ENTITY_HAS_MEDIA: {
    sources: [
      "INSTITUTION",
      "COLLECTION",
      "ARTIST",
      "ORGANIZATION",
      "WORK",
      "PROJECT_OR_SERIES",
      "CURATED_ACQUISITION",
      "ACQUISITION_PROGRAM",
      "RESEARCH_PUBLICATION",
    ],
    targets: ["MEDIA_REFERENCE"],
    allowedQualifiers: [
      "display_order",
      "media_context",
      "publication_context_entity_id",
    ],
    requiredQualifiers: ["media_context"],
  },
  EXHIBITION_PRESENTS_WORK: {
    sources: ["EXHIBITION"],
    targets: ["WORK"],
    allowedQualifiers: ["display_order"],
    requiredQualifiers: [],
    reserved: true,
  },
};

export const ACQUISITION_METHODS = new Set<MuseumAcquisitionMethod>([
  "donation",
  "purchase",
  "bequest",
  "exchange",
  "transfer",
]);

export const REQUIRED_MEDIA_AFFORDANCES = [
  "view",
  "alt_text",
  "open_wave_proposal_context",
] as const;
export const OPTIONAL_MEDIA_AFFORDANCES = [
  "thumbnail",
  "hero",
  "copy_citation",
] as const;
