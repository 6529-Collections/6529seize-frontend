import type { MuseumDataArchitectureStandardSlug as DataArchitectureStandardSlug } from "./dataArchitectureContract";
import type {
  MuseumAcquisitionProgram,
  MuseumCuratedAcquisition,
  MuseumCuratedAcquisitionStatus,
  MuseumEntityRelation,
  MuseumExhibition,
  MuseumExternalProposalPresentationMedia,
  MuseumOrganization,
} from "./entities";

export type {
  MuseumAcquisitionProgram,
  MuseumCuratedAcquisition,
  MuseumEntityKind,
  MuseumEntityRelation,
  MuseumExhibition,
  MuseumExternalProposalPresentationMedia,
  MuseumExternalProposalPresentationVariant,
  MuseumOrganization,
} from "./entities";

export {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalPresentationMedia,
  isMuseumExternalProposalTokenSourceUrl,
  isMuseumSignedWaveStormUrl,
  buildMuseumSignedWaveStormDropUrl,
} from "./entities";

export type MuseumSha256 = `sha256:${string}`;

export interface MuseumPublicationIdentity {
  readonly repository: "6529-Collections/6529networkmuseum";
  readonly requestedRef: string;
  readonly commit: string;
  readonly manifestPath: string;
  readonly manifestSha256: MuseumSha256 | null;
  readonly manifestCommitment: string | null;
  readonly inventoryCount: number;
  readonly assembledAt: string;
  /** Present only when the two-phase catalog was verified atomically. */
  readonly catalogId?: string;
  readonly catalogContentHash?: `0x${string}`;
}

export interface MuseumRightsCredit {
  readonly creditLine: string;
  readonly licenseLabel: string | null;
  readonly licenseUrl: string | null;
  readonly rightsExpressionId: string | null;
  readonly sourcePath: string;
}

type MuseumMediaKind = "still" | "live" | "iiif";
type MuseumMediaRole = "source" | "fallback";

interface MuseumMediaBase {
  readonly id: string;
  readonly artworkId: string;
  readonly kind: MuseumMediaKind;
  readonly role: MuseumMediaRole;
  readonly mediaType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly credit: MuseumRightsCredit;
  readonly sourcePath: string;
  readonly variants?: readonly MuseumMediaVariant[];
}

interface MuseumMediaVariant {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly byteSize: number;
  readonly sha256: MuseumSha256;
}

export interface MuseumRetainedMedia extends MuseumMediaBase {
  readonly custody: "retained";
  readonly url: string;
  readonly preservationStatus: "retained_verified" | "retained_unverified";
  readonly sha256: MuseumSha256 | null;
  readonly upstreamProvider: null;
}

export interface MuseumUpstreamMedia extends MuseumMediaBase {
  readonly custody: "upstream";
  readonly url: string;
  readonly preservationStatus: "not_retained";
  readonly sha256: null;
  readonly upstreamProvider: "art_blocks" | "museum_public_derivative";
}

export type MuseumMedia = MuseumRetainedMedia | MuseumUpstreamMedia;

export type MuseumMediaMetadataRole =
  | "museum_retained_preservation_object"
  | "token_linked_source_media"
  | "museum_generated_public_derivative"
  | "museum_authored_public_graphic"
  | "historical_wave_proposal_presentation";

export interface MuseumMediaMetadataContext {
  readonly kind: "wave_proposal";
  readonly waveId: string;
  readonly dropId: string;
  readonly publicationRecordId: string;
  readonly acquisitionId: string;
  readonly sourcePath: string;
  /** Null when the source record withholds the upstream presentation link. */
  readonly openHref: string | null;
}

/**
 * A governed media record whose descriptive evidence is published while its
 * image locator is withheld. It never carries a visitor image URL.
 */
export interface MuseumMediaMetadata {
  readonly id: string;
  readonly artworkId: string;
  readonly role: MuseumMediaMetadataRole;
  readonly mediaType: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
  readonly credit: MuseumRightsCredit;
  readonly sourcePath: string;
  /** Exact source records that establish this metadata-only media relation. */
  readonly sourceRecordIds?: readonly string[];
  readonly context?: MuseumMediaMetadataContext;
}

export type MuseumPublicDocumentKind =
  | "founding_principles"
  | "open_museum_statement"
  | "onchain_transition"
  | "contributor_guide"
  | "artist_practice"
  | "collection_essay"
  | "acquisition_essay"
  | "program_essay"
  | "source_record"
  | "curatorial_accession_review"
  | "accession_certificate"
  | "gift_acceptance_authorization"
  | "technical_condition_review"
  | "title_rights_accession_review"
  | "custody_title_compliance_diligence"
  | "object_entry"
  | "gift_narrative"
  | "project_essay"
  | "source_chronology_matrix"
  | "institutional_practice_study"
  | "institutional_practice_adjacent"
  | "institution_profile"
  | "institutional_practice_source_register"
  | "scholarship_editorial_standard"
  | "data_architecture_overview"
  | "data_architecture_standard"
  | "data_architecture_case_study"
  | "rights_handbook"
  | "rights_artist_guide"
  | "rights_collector_guide";

export interface MuseumPublicDocument {
  readonly id: string;
  readonly kind: MuseumPublicDocumentKind;
  readonly title: string;
  readonly markdown: string;
  readonly sha256: MuseumSha256 | null;
  readonly sourcePath: string;
  readonly artistIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly giftIds: readonly string[];
  readonly artworkIds: readonly string[];
  readonly workIds?: readonly string[];
  readonly acquisitionIds?: readonly string[];
  readonly programIds?: readonly string[];
  readonly organizationIds?: readonly string[];
  readonly sourceRecordIds?: readonly string[];
}

export type MuseumInstitutionProfileSlug =
  | "met"
  | "getty"
  | "moma"
  | "whitney"
  | "tate"
  | "centre-pompidou"
  | "sfmoma"
  | "guggenheim"
  | "zkm"
  | "ars-electronica"
  | "rhizome-new-museum"
  | "serpentine-arts-technologies"
  | "v-and-a"
  | "lacma"
  | "hek-basel"
  | "li-ma"
  | "v2"
  | "transmediale"
  | "acmi"
  | "m-plus"
  | "nam-june-paik-art-center"
  | "ntt-icc"
  | "centro-multimedia"
  | "laboratorio-arte-alameda"
  | "dia"
  | "walker-art-center"
  | "mca-chicago";

export interface MuseumInstitutionProfile {
  readonly id: `institutional-practice:${MuseumInstitutionProfileSlug}`;
  readonly slug: MuseumInstitutionProfileSlug;
  readonly document: MuseumPublicDocument;
}

export interface MuseumInstitutionalPractice {
  readonly id: "institutional-practice:a-field-of-practice";
  readonly slug: "a-field-of-practice";
  readonly introduction: MuseumPublicDocument;
  readonly profiles: readonly MuseumInstitutionProfile[];
  readonly adjacentPractice: MuseumPublicDocument;
  readonly editorialStandard: MuseumPublicDocument;
  readonly sourceRegister: MuseumPublicDocument;
}

export type MuseumDataArchitectureStandardSlug = DataArchitectureStandardSlug;

export type MuseumDataArchitectureImplementationState =
  | "conceptual_mapping"
  | "source_fields_present"
  | "serialized"
  | "validated"
  | "operational";

export interface MuseumDataArchitectureStandard {
  readonly slug: MuseumDataArchitectureStandardSlug;
  readonly name: string;
  readonly category: string;
  readonly humanQuestion: string;
  readonly authority: string;
  readonly version: string;
  readonly authorityStatus: string;
  readonly officialUrl: string;
  readonly caseyState: MuseumDataArchitectureImplementationState;
  readonly document: MuseumPublicDocument;
}

export interface MuseumDataArchitectureCaseyObject {
  readonly objectId: string;
  readonly title: string;
  readonly caip19: string;
  readonly custodyReceiptLog: number;
  readonly metadataSha256: MuseumSha256;
  readonly generatorObservationSha256: MuseumSha256;
  readonly generatorBytesRetained: false;
  readonly accessionState: "accessioned";
  readonly preservationState: "in_progress";
}

export interface MuseumDataArchitectureCaseStudy {
  readonly profileId: "6529NM_DATA_ARCHITECTURE_V1";
  readonly accessionLotId: "6529NM.2026.001";
  readonly custodyTransaction: string;
  readonly custodyBlock: number;
  readonly evidenceManifestPath: string;
  readonly metadataDigestScope: string;
  readonly generatorDigestScope: string;
  readonly objects: readonly MuseumDataArchitectureCaseyObject[];
  readonly sourceJson: string;
  readonly sourcePath: string;
  readonly sha256: MuseumSha256 | null;
}

export interface MuseumDataArchitecture {
  readonly id: "6529NM_DATA_ARCHITECTURE_V1";
  readonly version: "1.0.0";
  readonly status: "working_standard";
  readonly observedOn: string;
  readonly title: string;
  readonly introduction: MuseumPublicDocument;
  readonly standards: readonly MuseumDataArchitectureStandard[];
  readonly caseyImplementation: MuseumPublicDocument;
  readonly caseySchedule: MuseumDataArchitectureCaseStudy;
  readonly profileJson: string;
  readonly profileSourcePath: string;
  readonly profileSha256: MuseumSha256 | null;
}

export type MuseumRightsUseStatus =
  | "allowed"
  | "allowed_with_conditions"
  | "not_licensed"
  | "status_only"
  | "case_by_case";

export type MuseumRightsAction =
  | "display_the_work"
  | "publish_online"
  | "publish_in_print"
  | "make_preservation_copies"
  | "share_an_adaptation"
  | "make_commercial_use";

export type MuseumRightsPracticeStatus =
  | "ordinary"
  | "ordinary_with_terms"
  | "purpose_limited"
  | "contextual"
  | "separate_basis";

export interface MuseumRightsPracticeReading {
  readonly status: MuseumRightsPracticeStatus;
  readonly note: string;
}

export interface MuseumRightsLegalCode {
  readonly path: string;
  readonly sourceUri: string;
  readonly publicationUri: string;
  readonly sha256: MuseumSha256;
  readonly text: string;
}

export interface MuseumRightsExpression {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly group:
    | "creative_commons_license"
    | "creative_commons_tool"
    | "rights_statement"
    | "copyright_case"
    | "custom_license";
  readonly instrumentKind:
    | "public_license"
    | "public_domain_dedication"
    | "public_domain_mark"
    | "descriptive_status"
    | "no_public_license"
    | "custom_terms";
  readonly version: string | null;
  readonly spdxId: string | null;
  readonly canonicalUri: string | null;
  readonly summary: string;
  readonly museumCan: readonly string[];
  readonly conditions: readonly string[];
  readonly boundaries: readonly string[];
  readonly visitorNote: string;
  readonly useMatrix: Readonly<
    Record<MuseumRightsAction, MuseumRightsUseStatus>
  >;
  readonly museumPracticeMatrix: Readonly<
    Record<MuseumRightsAction, MuseumRightsPracticeReading>
  >;
  readonly legalCode: MuseumRightsLegalCode | null;
}

export interface MuseumRightsObjectAssignment {
  readonly objectId: string;
  readonly expressionId: string;
  readonly rightsRecordPath: string;
  readonly evidenceBasis: string;
}

export interface MuseumRightsHandbook {
  readonly introduction: MuseumPublicDocument;
  readonly artistGuide: MuseumPublicDocument;
  readonly collectorGuide: MuseumPublicDocument;
  readonly expressions: readonly MuseumRightsExpression[];
  readonly useStatusDefinitions: Readonly<
    Record<MuseumRightsUseStatus, string>
  >;
  readonly practiceStatusDefinitions: Readonly<
    Record<MuseumRightsPracticeStatus, string>
  >;
  readonly objectAssignments: readonly MuseumRightsObjectAssignment[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumArtist {
  readonly id: string;
  readonly slug: string;
  readonly preferredName: string;
  readonly projectIds: readonly string[];
  readonly artworkIds: readonly string[];
  readonly workIds?: readonly string[];
  readonly documentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly artistId: string;
  readonly artistIds?: readonly string[];
  readonly organizationIds?: readonly string[];
  readonly platform: string;
  readonly releaseYear: number;
  readonly artworkIds: readonly string[];
  readonly workIds?: readonly string[];
  readonly documentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumGift {
  readonly id: string;
  readonly accessionLotId: string;
  readonly authorizationId: string;
  readonly acquisitionMethod: "donation";
  readonly institutionalStatus: "accessioned";
  readonly donorPublicCredit: string;
  readonly acceptedAt: string;
  readonly artworkIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly sourcePath: string;
}

interface MuseumArtworkBase {
  readonly id: string;
  readonly title: string;
  readonly artistId: string;
  readonly projectId: string;
  readonly medium: string;
  readonly rightsCredit: MuseumRightsCredit;
  readonly media: readonly MuseumMedia[];
  readonly documentIds: readonly string[];
  readonly sourcePath: string;
}

export interface MuseumAccessionedArtwork extends MuseumArtworkBase {
  readonly institutionalStatus: "accessioned";
  readonly accessionLotId: string;
  readonly giftId: string;
  readonly programId: null;
}

export interface MuseumSelectedUnmintedArtwork extends MuseumArtworkBase {
  readonly institutionalStatus: "selected_unminted";
  readonly accessionLotId: null;
  readonly giftId: null;
  readonly programId: string;
}

export type MuseumArtwork =
  | MuseumAccessionedArtwork
  | MuseumSelectedUnmintedArtwork;

/**
 * Canonical public Work records are additive to the released legacy artwork
 * projection. Their Museum relationship is explicit and never inferred from
 * the raw program outcome status.
 */
export type MuseumWorkPublicStatus = MuseumCuratedAcquisitionStatus;

export interface MuseumWorkQualifier {
  readonly kind:
    | "mint"
    | "payment"
    | "title"
    | "custody"
    | "rights"
    | "preservation";
  readonly status: string;
  readonly sourcePath: string;
}

export interface MuseumPublicWork {
  readonly kind: "work";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly medium: string;
  readonly artistId: string;
  readonly artistIds?: readonly string[];
  readonly projectId: string | null;
  readonly status: MuseumWorkPublicStatus;
  readonly statusAsOf: string;
  /** True only when the active Collection and accession edges agree. */
  readonly collectionMembership?: boolean;
  readonly acquisitionIds: readonly string[];
  readonly programIds: readonly string[];
  readonly media: readonly MuseumMedia[];
  readonly mediaMetadata?: readonly MuseumMediaMetadata[];
  readonly presentationMedia?: readonly MuseumExternalProposalPresentationMedia[];
  readonly documentIds: readonly string[];
  readonly qualifiers: readonly MuseumWorkQualifier[];
  readonly sourceRecordIds?: readonly string[];
  readonly sourcePaths: readonly string[];
}

/** Explicit compatibility join from a released source/program object ID. */
export interface MuseumWorkAlias {
  readonly kind: "work_source_alias";
  readonly sourceObjectId: string;
  readonly workId: string;
  readonly sourcePath: string;
}

export type MuseumPublicEntityType =
  | "INSTITUTION"
  | "COLLECTION"
  | "AGENT"
  | "ARTIST"
  | "ORGANIZATION"
  | "WORK"
  | "PROJECT_OR_SERIES"
  | "CURATED_ACQUISITION"
  | "ACQUISITION_PROGRAM"
  | "ACCESSION"
  | "RESEARCH_PUBLICATION"
  | "MEDIA_REFERENCE"
  | "EXHIBITION";

export interface MuseumPublicEntityRecord {
  readonly id: string;
  readonly entityType: MuseumPublicEntityType;
  readonly label: string;
  readonly slug: string | null;
  readonly canonicalRoute: string | null;
  readonly pageExposure:
    | "canonical_page"
    | "relational_only"
    | "reserved_no_instance";
  readonly entityStatus: "published" | "archived";
  /** Exact source observation time for the typed entity state. */
  readonly statusAsOf?: string;
  readonly sourcePath: string;
  readonly sourceRecordIds: readonly string[];
  readonly mediaEntityIds?: readonly string[];
  readonly profile: Readonly<Record<string, unknown>>;
}

export type MuseumPublicRelationType =
  | "INSTITUTION_HOLDS_COLLECTION"
  | "ARTIST_CREATES_WORK"
  | "AGENT_PLAYS_ROLE"
  | "PROJECT_CONTEXTUALIZES_WORK"
  | "ORGANIZATION_ORIGINATES_PROJECT"
  | "ORGANIZATION_PUBLISHES_PROJECT"
  | "ACQUISITION_PROGRAM_PRODUCES_ACQUISITION"
  | "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK"
  | "PROGRAM_SELECTS_WORK"
  | "ACCESSION_ADMITS_WORK"
  | "COLLECTION_CONTAINS_WORK"
  | "WORK_CONSTITUTED_BY_COMPONENT"
  | "WORK_HAS_MANIFESTATION"
  | "PUBLICATION_INTERPRETS_ENTITY"
  | "INSTITUTION_PUBLISHES_PUBLICATION"
  | "ENTITY_HAS_MEDIA"
  | "EXHIBITION_PRESENTS_WORK";

export interface MuseumPublicRelationRecord {
  readonly id: string;
  readonly relationType: MuseumPublicRelationType;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly assertionStatus: "asserted" | "observed" | "reserved";
  readonly qualifier: Readonly<Record<string, unknown>>;
  readonly sourceRecordIds: readonly string[];
  readonly sourcePath: string;
}

export interface MuseumPublicEntityGraph {
  readonly sourceCommit: string;
  readonly entityPaths: readonly string[];
  readonly relationPaths: readonly string[];
  readonly entities: readonly MuseumPublicEntityRecord[];
  readonly relations: readonly MuseumPublicRelationRecord[];
  readonly identityInventory: MuseumPublicIdentityInventory;
  readonly relationIdentityInventory: MuseumPublicRelationIdentityInventory;
}

export interface MuseumPublicRelationIdentityInventory {
  readonly sourcePath: string;
  readonly schemaPath: string;
  readonly inventoryVersion: string;
  readonly activeRelationIds: readonly string[];
  readonly retiredRelationIds: readonly string[];
}

export interface MuseumResearchPublication {
  readonly kind: "research";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly publicationKind: string;
  readonly publicationUri: string;
  readonly authorIds: readonly string[];
  readonly subjectIds: readonly string[];
  readonly sourcePath: string;
}

export interface MuseumAcquisitionAlias {
  readonly kind: "acquisition_source_alias";
  readonly alias: string;
  readonly acquisitionId: string;
  readonly sourcePath: string;
}

export interface MuseumPublicProgramAlias {
  readonly kind: "program_source_alias";
  readonly alias: string;
  readonly programId: string;
  readonly sourcePath: string;
}

export interface MuseumPublicRouteAlias {
  readonly legacyRoute: string;
  readonly canonicalRoute: string;
  readonly canonicalEntityId: string;
  readonly sourcePath: string;
}

export interface MuseumPublicTypedReferenceRegistryEntry {
  readonly registryId: "PUBLIC_TYPED_REFERENCE_REGISTRY_V1";
  readonly targetId: string;
  readonly referenceType: "component" | "manifestation";
  readonly targetType: string;
  readonly authoritativeRecordId: string;
  readonly authoritativeRecordType: string;
  readonly caip19: string | null;
}

export interface MuseumPublicIdentityInventory {
  readonly sourcePath: string;
  readonly inventoryVersion: "1.6.0" | "1.7.0";
  /** Canonical curated acquisitions explicitly declared by the identity inventory. */
  readonly curatedAcquisitionIds: readonly string[];
  readonly workAliases: readonly MuseumWorkAlias[];
  readonly acquisitionAliases: readonly MuseumAcquisitionAlias[];
  readonly programAliases: readonly MuseumPublicProgramAlias[];
  readonly routeAliases: readonly MuseumPublicRouteAlias[];
  readonly typedReferenceRegistry: readonly MuseumPublicTypedReferenceRegistryEntry[];
}

export interface MuseumPublication {
  readonly identity: MuseumPublicationIdentity;
  readonly declaredSourcePaths: readonly string[];
  readonly artists: readonly MuseumArtist[];
  /** Optional additive IA projection; legacy publications may omit it. */
  readonly organizations?: readonly MuseumOrganization[];
  readonly projects: readonly MuseumProject[];
  readonly gifts: readonly MuseumGift[];
  readonly artworks: readonly MuseumArtwork[];
  /** Optional canonical Work records; absent on the released legacy source. */
  readonly works?: readonly MuseumPublicWork[];
  /** Optional explicit source-ID joins for legacy Work URLs. */
  readonly workAliases?: readonly MuseumWorkAlias[];
  /** Exact route aliases published with the typed identity inventory. */
  readonly routeAliases?: readonly MuseumPublicRouteAlias[];
  /** Exact typed PUBLIC_ENTITY/PUBLIC_RELATION graph for this commit. */
  readonly entityGraph?: MuseumPublicEntityGraph;
  /** Typed research publications; markdown remains a separate source document. */
  readonly researchPublications?: readonly MuseumResearchPublication[];
  /** Explicit typed aliases for legacy acquisition and program identifiers. */
  readonly acquisitionAliases?: readonly MuseumAcquisitionAlias[];
  /** Optional additive IA projection; legacy publications may omit it. */
  readonly acquisitionPrograms?: readonly MuseumAcquisitionProgram[];
  /** Optional additive IA projection; legacy publications may omit it. */
  readonly curatedAcquisitions?: readonly MuseumCuratedAcquisition[];
  /** Optional additive IA projection; legacy publications may omit it. */
  readonly relations?: readonly MuseumEntityRelation[];
  /** Reserved until a substantive exhibition is published. */
  readonly exhibitions?: readonly MuseumExhibition[];
  readonly documents: readonly MuseumPublicDocument[];
  readonly institutionalPractice: MuseumInstitutionalPractice;
  readonly dataArchitecture: MuseumDataArchitecture;
  readonly rightsHandbook: MuseumRightsHandbook;
}

export interface MuseumSourceDocument {
  readonly path: string;
  readonly sha256: MuseumSha256 | null;
  readonly mediaType: "application/json" | "text/markdown" | "text/plain";
  readonly text: string;
}

export interface MuseumPublicationAssemblyContext {
  readonly identity: MuseumPublicationIdentity;
  readonly declaredSourcePaths: readonly string[];
  readonly documents: ReadonlyMap<string, MuseumSourceDocument>;
}

export interface MuseumPublicationAssembler {
  readonly requiredPaths: readonly string[];
  assemble(context: MuseumPublicationAssemblyContext): MuseumPublication;
}

export interface MuseumLastValidPublication {
  readonly publication: MuseumPublication;
  readonly acceptedAt: string;
}

export type MuseumPublicationLoadState =
  | {
      readonly status: "current";
      readonly publication: MuseumPublication;
      readonly errorCode: null;
      readonly failedAt: null;
      readonly lastValidAcceptedAt: null;
    }
  | {
      readonly status: "stale";
      readonly publication: MuseumPublication;
      readonly errorCode: string;
      readonly failedAt: string;
      readonly lastValidAcceptedAt: string;
    }
  | {
      readonly status: "unavailable";
      readonly publication: null;
      readonly errorCode: string;
      readonly failedAt: string;
      readonly lastValidAcceptedAt: null;
    };

export interface MuseumPublicationSource {
  load(
    lastValid?: MuseumLastValidPublication
  ): Promise<MuseumPublicationLoadState>;
}

export function isMuseumCollectionArtwork(
  artwork: MuseumArtwork
): artwork is MuseumAccessionedArtwork {
  return artwork.institutionalStatus === "accessioned";
}
