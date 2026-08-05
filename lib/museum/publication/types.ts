export type MuseumSha256 = `sha256:${string}`;

export interface MuseumPublicationIdentity {
  readonly repository: "6529-Collections/6529networkmuseum";
  readonly requestedRef: string;
  readonly commit: string;
  readonly manifestPath: "release-artifacts/latest/record-manifest.json";
  readonly manifestSha256: MuseumSha256 | null;
  readonly manifestCommitment: string | null;
  readonly inventoryCount: number;
  readonly assembledAt: string;
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
  readonly upstreamProvider: "art_blocks";
}

export type MuseumMedia = MuseumRetainedMedia | MuseumUpstreamMedia;

export type MuseumPublicDocumentKind =
  | "founding_principles"
  | "open_museum_statement"
  | "onchain_transition"
  | "contributor_guide"
  | "artist_practice"
  | "collection_essay"
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
  readonly objectAssignments: readonly MuseumRightsObjectAssignment[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumArtist {
  readonly id: string;
  readonly slug: string;
  readonly preferredName: string;
  readonly projectIds: readonly string[];
  readonly artworkIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly artistId: string;
  readonly platform: string;
  readonly releaseYear: number;
  readonly artworkIds: readonly string[];
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

export interface MuseumPublication {
  readonly identity: MuseumPublicationIdentity;
  readonly declaredSourcePaths: readonly string[];
  readonly artists: readonly MuseumArtist[];
  readonly projects: readonly MuseumProject[];
  readonly gifts: readonly MuseumGift[];
  readonly artworks: readonly MuseumArtwork[];
  readonly documents: readonly MuseumPublicDocument[];
  readonly institutionalPractice: MuseumInstitutionalPractice;
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
