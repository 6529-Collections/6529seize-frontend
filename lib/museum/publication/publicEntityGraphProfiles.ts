import type {
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumSourceDocument,
} from "./types";
import {
  ACQUISITION_STATUSES,
  OPTIONAL_MEDIA_AFFORDANCES,
  REQUIRED_MEDIA_AFFORDANCES,
  WORK_LIFECYCLE_STATUSES,
} from "./publicEntityGraphSchema";
import {
  assertDateTime,
  assertMediaSourcePath,
  assertSourcePath,
  assertStringEnum,
  isRecord,
  optionalString,
  requiredEvidenceRefs,
  requiredObject,
  requiredString,
  stringArray,
  typedNameVariantArray,
  typedReferenceArray,
} from "./publicEntityGraphPrimitives";
import {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalTokenSourceUrl,
} from "./entities";

const SUPPORTED_MEDIA_ROLES = new Set([
  "museum_retained_preservation_object",
  "token_linked_source_media",
  "museum_generated_public_derivative",
  "museum_authored_public_graphic",
  "historical_wave_proposal_presentation",
]);

export function assertCanonicalIdentity(
  payload: Record<string, unknown>,
  sourcePath: string,
  entityType: MuseumPublicEntityType,
  entityId: string
): {
  readonly slug: string | null;
  readonly route: string | null;
  readonly exposure: MuseumPublicEntityRecord["pageExposure"];
} {
  const slug = optionalString(payload, "public_slug", "public_entity_graph_slug");
  const route = optionalString(
    payload,
    "canonical_route",
    "public_entity_graph_route"
  );
  const exposure = assertStringEnum(
    payload,
    "page_exposure",
    new Set(["canonical_page", "relational_only", "reserved_no_instance"]),
    "public_entity_graph_exposure"
  ) as MuseumPublicEntityRecord["pageExposure"];

  if (entityType === "EXHIBITION") {
    throw new Error("public_entity_graph_exhibition_reserved");
  }
  if (entityType === "INSTITUTION" || entityType === "COLLECTION") {
    return assertSingletonIdentity(entityType, slug, route, exposure);
  }
  if (isRelationalOnlyType(entityType)) {
    return assertRelationalIdentity(slug, route, exposure);
  }
  if (exposure !== "canonical_page" || slug === null || route === null) {
    throw new Error("public_entity_graph_canonical_route");
  }
  if (!isSafePublicSlug(slug)) {
    throw new Error("public_entity_graph_slug");
  }
  const prefixes: Partial<Record<MuseumPublicEntityType, string>> = {
    ARTIST: "/museum/network/artists/",
    ORGANIZATION: "/museum/network/organizations/",
    PROJECT_OR_SERIES: "/museum/network/projects/",
    CURATED_ACQUISITION: "/museum/network/acquisitions/",
    RESEARCH_PUBLICATION: "/museum/network/research/",
    WORK: "/museum/network/works/",
    ACQUISITION_PROGRAM: "/museum/network/acquisition-programs/",
  };
  const prefix = prefixes[entityType];
  if (prefix === undefined || route !== `${prefix}${slug}`) {
    throw new Error("public_entity_graph_canonical_route");
  }
  if (
    entityType === "WORK" &&
    (slug !== entityId || !/^6529NM-W-[0-9]{4}$/u.test(slug))
  ) {
    throw new Error("public_entity_graph_work_route");
  }
  if (entityType === "ACQUISITION_PROGRAM" && slug === entityId) {
    throw new Error("public_entity_graph_program_slug");
  }
  if (
    entityType === "ARTIST" &&
    (slug.startsWith("keys-and-gates-artist-") ||
      slug.startsWith("conflict-at-its-edges-artist-"))
  ) {
    throw new Error("public_entity_graph_artist_slug");
  }
  assertSourcePath(sourcePath, "public_entity_graph_source_path");
  return { slug, route, exposure };
}

function assertSingletonIdentity(
  entityType: MuseumPublicEntityType,
  slug: string | null,
  route: string | null,
  exposure: MuseumPublicEntityRecord["pageExposure"]
): {
  readonly slug: string | null;
  readonly route: string | null;
  readonly exposure: MuseumPublicEntityRecord["pageExposure"];
} {
  const expectedRoute =
    entityType === "INSTITUTION"
      ? "/museum/network"
      : "/museum/network/collection";
  if (exposure !== "canonical_page" || slug !== null || route !== expectedRoute) {
    throw new Error("public_entity_graph_singleton_route");
  }
  return { slug, route, exposure };
}

function isRelationalOnlyType(
  entityType: MuseumPublicEntityType
): boolean {
  return (
    entityType === "AGENT" ||
    entityType === "ACCESSION" ||
    entityType === "MEDIA_REFERENCE"
  );
}

function assertRelationalIdentity(
  slug: string | null,
  route: string | null,
  exposure: MuseumPublicEntityRecord["pageExposure"]
): {
  readonly slug: string | null;
  readonly route: string | null;
  readonly exposure: MuseumPublicEntityRecord["pageExposure"];
} {
  if (exposure !== "relational_only" || slug !== null || route !== null) {
    throw new Error("public_entity_graph_relational_route");
  }
  return { slug, route, exposure };
}

function isSafePublicSlug(value: string): boolean {
  if (value.length === 0) return false;
  const first = value[0];
  const last = value.at(-1);
  if (first === undefined || last === undefined) return false;
  if (!/[A-Za-z0-9]/u.test(first) || !/[A-Za-z0-9]/u.test(last)) {
    return false;
  }
  return [...value].every((character) => /[A-Za-z0-9._-]/u.test(character));
}

const EXPECTED_PROFILE_TYPES: Record<MuseumPublicEntityType, string> = {
  INSTITUTION: "INSTITUTION",
  COLLECTION: "COLLECTION",
  AGENT: "AGENT",
  ARTIST: "ARTIST",
  ORGANIZATION: "ORGANIZATION",
  WORK: "WORK",
  PROJECT_OR_SERIES: "PROJECT_OR_SERIES",
  CURATED_ACQUISITION: "CURATED_ACQUISITION",
  ACQUISITION_PROGRAM: "ACQUISITION_PROGRAM",
  ACCESSION: "ACCESSION",
  RESEARCH_PUBLICATION: "RESEARCH_PUBLICATION",
  MEDIA_REFERENCE: "MEDIA_REFERENCE",
  EXHIBITION: "EXHIBITION",
};

export function assertProfile(
  payload: Record<string, unknown>,
  entityType: MuseumPublicEntityType
): Readonly<Record<string, unknown>> {
  const profile = requiredObject(
    payload,
    "profile",
    "public_entity_graph_profile"
  );
  if (profile["profile_type"] !== EXPECTED_PROFILE_TYPES[entityType]) {
    throw new Error("public_entity_graph_profile_type");
  }
  PROFILE_VALIDATORS[entityType](profile);
  return profile;
}

type ProfileValidator = (profile: Record<string, unknown>) => void;

const PROFILE_VALIDATORS: Record<MuseumPublicEntityType, ProfileValidator> = {
  INSTITUTION: (profile) => {
    requiredString(profile, "collection_entity_id", "public_entity_graph_institution_profile");
  },
  COLLECTION: (profile) => {
    requiredString(profile, "institution_entity_id", "public_entity_graph_collection_profile");
    if (profile["membership_rule"] !== "accession_only") {
      throw new Error("public_entity_graph_collection_membership_rule");
    }
    stringArray(profile, "admitted_work_entity_ids", "public_entity_graph_collection_works");
  },
  AGENT: (profile) => {
    requiredString(profile, "agent_kind", "public_entity_graph_agent_profile");
    requiredObject(profile, "authority", "public_entity_graph_agent_authority");
    stringArray(profile, "role_contexts", "public_entity_graph_agent_roles");
    typedNameVariantArray(profile, "name_variants", "public_entity_graph_agent_names");
  },
  ARTIST: (profile) => {
    requiredObject(profile, "authority", "public_entity_graph_artist_authority");
    requiredObject(profile, "practice", "public_entity_graph_artist_practice");
    typedNameVariantArray(profile, "name_variants", "public_entity_graph_artist_names");
  },
  ORGANIZATION: (profile) => {
    requiredString(profile, "organization_kind", "public_entity_graph_organization_kind");
    requiredString(profile, "history_summary", "public_entity_graph_organization_history");
    stringArray(profile, "roles", "public_entity_graph_organization_roles");
    requiredObject(profile, "authority", "public_entity_graph_organization_authority");
    typedNameVariantArray(profile, "name_variants", "public_entity_graph_organization_names");
  },
  WORK: validateWorkProfile,
  PROJECT_OR_SERIES: (profile) => {
    requiredString(profile, "project_type", "public_entity_graph_project_type");
    requiredString(profile, "project_relation_basis", "public_entity_graph_project_basis");
    requiredString(profile, "scope_statement", "public_entity_graph_project_scope");
    stringArray(profile, "agent_entity_ids", "public_entity_graph_project_agents");
    stringArray(profile, "work_entity_ids", "public_entity_graph_project_works");
    requiredString(profile, "ownership_boundary", "public_entity_graph_project_ownership");
    stringArray(profile, "source_record_ids", "public_entity_graph_project_sources");
  },
  CURATED_ACQUISITION: validateAcquisitionProfile,
  ACQUISITION_PROGRAM: (profile) => {
    requiredString(profile, "program_kind", "public_entity_graph_program_kind");
    requiredString(profile, "program_id", "public_entity_graph_program_id");
    stringArray(profile, "authority_record_ids", "public_entity_graph_program_authority");
    requiredString(profile, "rules_summary", "public_entity_graph_program_rules");
    requiredString(profile, "program_status", "public_entity_graph_program_status");
    stringArray(profile, "produced_acquisition_entity_ids", "public_entity_graph_program_acquisitions", false);
    stringArray(profile, "selected_outcome_record_ids", "public_entity_graph_program_outcomes", false);
  },
  ACCESSION: (profile) => {
    requiredString(profile, "accession_number", "public_entity_graph_accession_number");
    requiredString(profile, "accession_status", "public_entity_graph_accession_status");
    stringArray(profile, "admitted_work_entity_ids", "public_entity_graph_accession_works");
    requiredString(profile, "source_accession_record_id", "public_entity_graph_accession_source");
  },
  RESEARCH_PUBLICATION: validateResearchProfile,
  MEDIA_REFERENCE: (profile) => {
    validateMediaProfile(requiredObject(profile, "media", "public_entity_graph_media"));
  },
  EXHIBITION: () => {
    throw new Error("public_entity_graph_exhibition_reserved");
  },
};

function validateWorkProfile(profile: Record<string, unknown>): void {
  stringArray(profile, "creator_entity_ids", "public_entity_graph_work_creators");
  requiredString(profile, "title", "public_entity_graph_work_title");
  requiredString(profile, "medium", "public_entity_graph_work_medium");
  const lifecycle = requiredString(
    profile,
    "work_lifecycle_status",
    "public_entity_graph_work_status"
  );
  if (!WORK_LIFECYCLE_STATUSES.has(lifecycle)) {
    throw new Error("public_entity_graph_work_status");
  }
  const current = requiredObject(
    profile,
    "current_museum_relation",
    "public_entity_graph_work_relation"
  );
  requiredString(current, "museum_entity_id", "public_entity_graph_work_museum");
  assertDateTime(current, "as_of", "public_entity_graph_work_as_of");
  requiredString(current, "relation_status", "public_entity_graph_work_relation_status");
  requiredEvidenceRefs(current, "evidence_refs", "public_entity_graph_work_relation_evidence");
  const membership = requiredObject(
    profile,
    "collection_membership",
    "public_entity_graph_work_membership"
  );
  const membershipStatus = requiredString(
    membership,
    "status",
    "public_entity_graph_work_membership_status"
  );
  if (membershipStatus !== "permanent_collection" && membershipStatus !== "not_in_collection") {
    throw new Error("public_entity_graph_work_membership_status");
  }
  stringArray(membership, "accession_entity_ids", "public_entity_graph_work_accessions", false);
  stringArray(membership, "source_record_ids", "public_entity_graph_work_sources");
  requiredEvidenceRefs(
    membership,
    "evidence_refs",
    "public_entity_graph_work_membership_evidence"
  );
  if (membershipStatus === "permanent_collection") {
    requiredString(membership, "collection_entity_id", "public_entity_graph_work_collection");
    if (stringArray(membership, "accession_entity_ids", "public_entity_graph_work_accessions").length === 0) {
      throw new Error("public_entity_graph_work_accessions");
    }
  } else if (membership["collection_entity_id"] !== null) {
    throw new Error("public_entity_graph_work_collection");
  }
  stringArray(profile, "project_or_series_entity_ids", "public_entity_graph_work_projects", false);
  stringArray(profile, "acquisition_entity_ids", "public_entity_graph_work_acquisitions", false);
  stringArray(profile, "program_entity_ids", "public_entity_graph_work_programs", false);
  stringArray(profile, "accession_entity_ids", "public_entity_graph_work_accession_refs", false);
  typedReferenceArray(profile, "component_references", "public_entity_graph_work_components");
  typedReferenceArray(profile, "manifestation_references", "public_entity_graph_work_manifestations");
  requiredString(profile, "identity_boundary", "public_entity_graph_work_identity");
  requiredObject(profile, "mint_fact", "public_entity_graph_work_mint");
}

function validateAcquisitionProfile(profile: Record<string, unknown>): void {
  requiredString(profile, "title", "public_entity_graph_acquisition_title");
  requiredString(profile, "thesis", "public_entity_graph_acquisition_thesis");
  const method = requiredString(
    profile,
    "acquisition_method",
    "public_entity_graph_acquisition_method"
  );
  if (!new Set(["donation", "purchase", "bequest", "exchange", "transfer"]).has(method)) {
    throw new Error("public_entity_graph_acquisition_method");
  }
  const pathway = requiredObject(
    profile,
    "program_or_pathway",
    "public_entity_graph_acquisition_pathway"
  );
  requiredString(pathway, "kind", "public_entity_graph_acquisition_pathway_kind");
  stringArray(pathway, "entity_ids", "public_entity_graph_acquisition_pathway_entities", false);
  stringArray(pathway, "source_record_ids", "public_entity_graph_acquisition_pathway_sources");
  stringArray(profile, "work_entity_ids", "public_entity_graph_acquisition_works");
  stringArray(profile, "source_work_record_ids", "public_entity_graph_acquisition_source_works");
  const lifecycle = requiredObject(
    profile,
    "lifecycle",
    "public_entity_graph_acquisition_lifecycle"
  );
  const status = requiredString(
    lifecycle,
    "status",
    "public_entity_graph_acquisition_status"
  );
  if (!ACQUISITION_STATUSES.has(status)) {
    throw new Error("public_entity_graph_acquisition_status");
  }
  assertDateTime(lifecycle, "as_of", "public_entity_graph_acquisition_as_of");
  requiredEvidenceRefs(lifecycle, "evidence_refs", "public_entity_graph_acquisition_lifecycle_evidence");
  requiredString(profile, "collection_effect", "public_entity_graph_acquisition_collection_effect");
  requiredObject(profile, "independent_acquisition_facts", "public_entity_graph_acquisition_facts");
  requiredString(profile, "public_credit", "public_entity_graph_acquisition_credit");
}

function validateResearchProfile(profile: Record<string, unknown>): void {
  requiredString(profile, "publication_kind", "public_entity_graph_research_kind");
  requiredString(profile, "title", "public_entity_graph_research_title");
  requiredString(profile, "publication_date", "public_entity_graph_research_date");
  requiredString(profile, "version", "public_entity_graph_research_version");
  stringArray(profile, "author_entity_ids", "public_entity_graph_research_authors");
  stringArray(profile, "subject_entity_ids", "public_entity_graph_research_subjects");
  const publicationUri = requiredString(
    profile,
    "publication_document_uri",
    "public_entity_graph_research_uri"
  );
  if (!publicationUri.startsWith("https://")) {
    throw new Error("public_entity_graph_research_uri");
  }
}

function validateMediaProfile(media: Record<string, unknown>): void {
  const role = requiredString(media, "media_role", "public_entity_graph_media_role");
  assertSupportedMediaRole(role);
  const locator = requiredObject(
    media,
    "source_locator",
    "public_entity_graph_media_locator"
  );
  const uri = optionalString(locator, "uri", "public_entity_graph_media_uri");
  const repositoryPath = optionalString(
    locator,
    "repository_path",
    "public_entity_graph_media_path"
  );
  const affordances = stringArray(
    media,
    "allowed_ui_affordances",
    "public_entity_graph_media_affordances",
    false
  );
  const metadataOnly = !hasDirectVisualAffordance(affordances);
  assertMediaLocator(uri, repositoryPath, metadataOnly);
  const mediaType = requiredString(media, "media_type", "public_entity_graph_media_type");
  assertMediaType(mediaType);
  assertMediaVisual(media, metadataOnly);
  assertMediaIdentity(media);
  const rights = requiredObject(media, "rights", "public_entity_graph_media_rights");
  requiredString(rights, "status", "public_entity_graph_media_rights_status");
  const observation = requiredObject(
    media,
    "source_observation",
    "public_entity_graph_media_observation"
  );
  requiredString(observation, "status", "public_entity_graph_media_observation_status");
  if (role === "historical_wave_proposal_presentation") {
    validateWaveProposalMediaProfile(uri, affordances, media, rights);
  }
}

function assertSupportedMediaRole(role: string): void {
  if (!SUPPORTED_MEDIA_ROLES.has(role)) {
    throw new Error("public_entity_graph_media_role");
  }
}

function assertMediaLocator(
  uri: string | null,
  repositoryPath: string | null,
  metadataOnly: boolean
): void {
  if (uri === null && repositoryPath === null && !metadataOnly) {
    throw new Error("public_entity_graph_media_locator");
  }
  if (repositoryPath !== null) {
    assertMediaSourcePath(repositoryPath, "public_entity_graph_media_path");
  }
}

function assertMediaType(mediaType: string): void {
  if (!isSafeMediaType(mediaType)) {
    throw new Error("public_entity_graph_media_type");
  }
}

function assertMediaVisual(
  media: Record<string, unknown>,
  metadataOnly: boolean
): void {
  const visual = media["visual"];
  if (typeof visual !== "boolean") {
    throw new Error("public_entity_graph_media_visual");
  }
  const width = media["width"];
  const height = media["height"];
  if (
    visual &&
    !metadataOnly &&
    (typeof width !== "number" ||
      typeof height !== "number" ||
      width <= 0 ||
      height <= 0)
  ) {
    throw new Error("public_entity_graph_media_dimensions");
  }
  const alt = media["accessibility_text"];
  if (
    visual &&
    !metadataOnly &&
    typeof alt !== "string" &&
    media["accessibility_status"] !== "publication_join"
  ) {
    throw new Error("public_entity_graph_media_alt");
  }
}

function assertMediaIdentity(media: Record<string, unknown>): void {
  requiredString(media, "subject_entity_id", "public_entity_graph_media_subject");
  requiredString(media, "credit", "public_entity_graph_media_credit");
}

function validateWaveProposalMediaProfile(
  uri: string | null,
  affordances: readonly string[],
  media: Record<string, unknown>,
  rights: Record<string, unknown>
): void {
  const signedWave = isRecord(media["signed_wave"])
    ? media["signed_wave"]
    : requiredObject(
        media,
        "wave_proposal_context",
        "public_entity_graph_media_wave"
      );
  requiredString(signedWave, "wave_id", "public_entity_graph_media_wave_id");
  requiredString(signedWave, "drop_id", "public_entity_graph_media_drop_id");
  requiredString(
    signedWave,
    "publication_record_id",
    "public_entity_graph_media_publication"
  );
  const hasDirectVisualLocator = hasDirectVisualAffordance(affordances);
  if (
    new Set(affordances).size !== affordances.length ||
    affordances.some((affordance) => !isAllowedProposalAffordance(affordance))
  ) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  if (!hasDirectVisualLocator) {
    if (
      uri !== null &&
      !isMuseumExternalProposalTokenSourceUrl(uri)
    ) {
      throw new Error("public_entity_graph_media_proposal_contract");
    }
    assertWaveProposalRights(rights);
    return;
  }
  if (uri === null || !isApprovedWaveLocator(uri)) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  if (
    REQUIRED_MEDIA_AFFORDANCES.some((affordance) => !affordances.includes(affordance))
  ) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  assertWaveProposalRights(rights);
}

function assertWaveProposalRights(rights: Record<string, unknown>): void {
  const rightsStatus = rights["status"];
  if (rightsStatus !== "restricted" && rightsStatus !== "unknown") {
    throw new Error("public_entity_graph_media_proposal_rights");
  }
}

function hasDirectVisualAffordance(affordances: readonly string[]): boolean {
  return affordances.some((affordance) =>
    ["view", "thumbnail", "hero"].includes(affordance)
  );
}

function isApprovedWaveLocator(value: string): boolean {
  return (
    isMuseumExternalProposalTokenSourceUrl(value) ||
    isMuseumExternalProposalMediaUrl(value)
  );
}

function isSafeMediaType(value: string): boolean {
  const [type, subtype, ...rest] = value.split("/");
  return (
    type !== undefined &&
    subtype !== undefined &&
    rest.length === 0 &&
    type.length > 0 &&
    subtype.length > 0 &&
    [...type, ...subtype].every((character) =>
      /[a-z0-9!#$&^_.+-]/u.test(character)
    )
  );
}

function isAllowedProposalAffordance(value: string): boolean {
  return (
    REQUIRED_MEDIA_AFFORDANCES.includes(
      value as (typeof REQUIRED_MEDIA_AFFORDANCES)[number]
    ) ||
    OPTIONAL_MEDIA_AFFORDANCES.includes(
      value as (typeof OPTIONAL_MEDIA_AFFORDANCES)[number]
    )
  );
}

export function isProfileRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export type MuseumProfileDocument = MuseumSourceDocument;
