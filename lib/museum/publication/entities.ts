/**
 * Public entity vocabulary for the Museum information architecture.
 *
 * A proposed acquisition is a lifecycle state, not a separate entity kind.
 * In particular, this keeps a proposal from being mistaken for Collection
 * membership or an accession record.
 */

export type MuseumEntityKind =
  | "collection"
  | "work"
  | "artist"
  | "organization"
  | "project"
  | "curated_acquisition"
  | "acquisition_program"
  | "research"
  | "exhibition";

export type MuseumEntityType = MuseumEntityKind;

export type MuseumAcquisitionMethod =
  | "gift"
  | "donation"
  | "purchase"
  | "commission"
  | "bequest"
  | "exchange"
  | "transfer"
  | "program_primary_mint_purchase"
  | "other_authorized_method";

/** Machine-facing projection of the Museum's public acquisition ladder. */
export type MuseumProposedAcquisitionStatus =
  | "proposed_in_museum_wave"
  | "selected_by_museum_wave_acquisition_review_in_progress"
  | "selected_through_acquisition_program_acquisition_pending"
  | "acquisition_complete_accession_review_in_progress"
  | "accessioned_into_permanent_collection"
  | "closed_without_selection"
  | "withdrawn";

export type MuseumCuratedAcquisitionStatus = MuseumProposedAcquisitionStatus;

export type MuseumAcquisitionProgramStatus =
  | "proposed"
  | "open"
  | "selection_complete"
  | "acquisition_in_progress"
  | "completed"
  | "closed";

export interface MuseumEntityReference {
  readonly id: string;
  readonly kind: MuseumEntityKind;
}

export type MuseumEntityRelationKind =
  | "institution_holds_collection"
  | "collection_contains_work"
  | "artist_creates_work"
  | "organization_publishes_project"
  | "project_contextualizes_work"
  | "acquisition_program_produces_curated_acquisition"
  | "program_selects_work"
  | "curated_acquisition_brings_together_work"
  | "accession_admits_work"
  | "entity_has_media"
  | "institution_publishes_research"
  | "exhibition_presents_work"
  | "publication_interprets_entity"
  | "governance_authorizes_entity"
  | "governance_selects_entity";

export interface MuseumEntityRelation {
  readonly id: string;
  readonly relation: MuseumEntityRelationKind;
  readonly from: MuseumEntityReference;
  readonly to: MuseumEntityReference;
  readonly sourcePath: string;
}

export interface MuseumOrganization {
  readonly kind: "organization";
  readonly id: string;
  readonly slug: string;
  readonly preferredName: string;
  readonly projectIds: readonly string[];
  readonly artworkIds: readonly string[];
  readonly acquisitionIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export type MuseumSignedWaveStormUrl =
  `https://6529.io/waves/${string}-${string}-${string}-${string}-${string}`;

export interface MuseumExternalProposalPresentationSource {
  readonly kind: "signed_wave_storm";
  readonly waveId: string;
  readonly dropId: string;
  /** Exact part in the immutable Wave publication observation. */
  readonly partId: number;
  readonly serial: number | null;
  /** Exact upstream proposal record joined to this presentation. */
  readonly publicationRecordId: string;
  /** Exact curated-acquisition context that authorizes this presentation. */
  readonly contextEntityId: string;
  /** Immutable Wave publication-observation path for the exact presentation URL. */
  readonly sourcePath: string;
  /** Immutable MEDIA_REFERENCE path carrying the token/source locator and rights. */
  readonly mediaRecordPath: string;
  readonly sourceCommit: string;
}

export type MuseumExternalProposalPresentationAffordance =
  | "view"
  | "thumbnail"
  | "hero"
  | "alt"
  | "open_upstream_presentation";

export interface MuseumExternalProposalPresentationCredit {
  readonly creditLine: string;
  readonly sourcePath: string;
}

export interface MuseumExternalProposalPresentationRights {
  /** The external presentation is not a Museum rights grant. */
  readonly status: "presentation_only";
  readonly licenseLabel: "All Rights Reserved";
  readonly licenseUrl: string | null;
}

/**
 * Media used to present a proposal before the Museum has acquired it.
 * The literal policies prevent consumers from treating an external Storm as
 * retained Museum media or as a downloadable publication asset.
 */
export interface MuseumExternalProposalPresentationMedia {
  readonly id: string;
  readonly kind: "external_proposal_presentation";
  /** Exact governed upstream media URI; never a Museum derivative or IIIF URL. */
  readonly mediaUrl: string;
  readonly mediaMimeType: "image/jpeg" | "image/png" | "image/webp";
  /** Optional source-declared byte size used only for an intentional-view gate. */
  readonly sourceByteSize?: number;
  readonly width: number;
  readonly height: number;
  readonly altText: string;
  readonly source: MuseumExternalProposalPresentationSource;
  readonly credit: MuseumExternalProposalPresentationCredit;
  readonly rights: MuseumExternalProposalPresentationRights;
  readonly download: "not_permitted";
  readonly preservation: "not_retained";
  readonly affordances: readonly MuseumExternalProposalPresentationAffordance[];
}

export interface MuseumCuratedAcquisition {
  readonly kind: "curated_acquisition";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly thesis: string;
  readonly status: MuseumCuratedAcquisitionStatus;
  readonly statusAsOf: string;
  readonly acquisitionMethod: MuseumAcquisitionMethod;
  /** Optional source-declared aliases; never inferred from related IDs. */
  readonly sourceAliases?: readonly string[];
  readonly programId: string | null;
  readonly artistIds: readonly string[];
  readonly organizationIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly workIds: readonly string[];
  readonly accessionLotIds: readonly string[];
  readonly presentationMedia?: readonly MuseumExternalProposalPresentationMedia[];
  readonly sourceDocumentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export interface MuseumAcquisitionProgram {
  readonly kind: "acquisition_program";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: MuseumAcquisitionProgramStatus;
  readonly acquisitionMethod: MuseumAcquisitionMethod;
  readonly acquisitionIds: readonly string[];
  /** Explicit source/program identifiers accepted as route aliases. */
  readonly sourceAliases?: readonly string[];
  readonly sourceDocumentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

/**
 * Reserved contract only. A substantive Exhibition must exist before a
 * publication includes one, adds it to navigation, or emits its route.
 */
export interface MuseumExhibition {
  readonly kind: "exhibition";
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: "planned" | "open" | "closed";
  readonly workIds: readonly string[];
  readonly sourceDocumentIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export function isMuseumSignedWaveStormUrl(
  value: string
): value is MuseumSignedWaveStormUrl {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "6529.io" &&
      parsed.username.length === 0 &&
      parsed.password.length === 0 &&
      parsed.port.length === 0 &&
      parsed.search.length === 0 &&
      parsed.hash.length === 0 &&
      /^\/waves\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        parsed.pathname
      )
    );
  } catch {
    return false;
  }
}

const ARWEAVE_TRANSACTION_PATH_PATTERN =
  /^\/[A-Za-z0-9_-]{43}$/u;
const WAVE_PRESENTATION_HOST = "d3lqz0a4bldqgf.cloudfront.net";
const WAVE_PRESENTATION_PATH_PATTERN =
  /^\/drops\/[A-Za-z0-9_-]+\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\.(?:jpe?g|png|webp)$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export function isMuseumSafeGovernedSourcePath(value: string): boolean {
  if (
    value.length === 0 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("%") ||
    value.includes("//") ||
    /[\u0000-\u001f]/u.test(value)
  ) {
    return false;
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    return false;
  }
  const filename = segments.at(-1);
  return filename !== undefined && /\.(?:json|md|txt)$/u.test(filename);
}

export function isMuseumExternalProposalMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === WAVE_PRESENTATION_HOST &&
      parsed.username.length === 0 &&
      parsed.password.length === 0 &&
      parsed.port.length === 0 &&
      parsed.search.length === 0 &&
      parsed.hash.length === 0 &&
      WAVE_PRESENTATION_PATH_PATTERN.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/** The token/source locator is evidence, never the presentation URL. */
export function isMuseumExternalProposalTokenSourceUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "arweave.net" &&
      parsed.username.length === 0 &&
      parsed.password.length === 0 &&
      parsed.port.length === 0 &&
      parsed.search.length === 0 &&
      parsed.hash.length === 0 &&
      ARWEAVE_TRANSACTION_PATH_PATTERN.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export function isMuseumExternalProposalPresentationMedia(
  value: unknown
): value is MuseumExternalProposalPresentationMedia {
  const candidate = isRecord(value) ? value : null;
  if (candidate === null) return false;
  const source = candidate["source"];
  const credit = candidate["credit"];
  const affordances = candidate["affordances"];
  const sourceByteSize = candidate["sourceByteSize"];
  return (
    candidate["kind"] === "external_proposal_presentation" &&
    typeof candidate["id"] === "string" &&
    typeof candidate["mediaUrl"] === "string" &&
    isMuseumExternalProposalMediaUrl(candidate["mediaUrl"]) &&
    (candidate["mediaMimeType"] === "image/jpeg" ||
      candidate["mediaMimeType"] === "image/png" ||
      candidate["mediaMimeType"] === "image/webp") &&
    (sourceByteSize === undefined ||
      (typeof sourceByteSize === "number" &&
        Number.isSafeInteger(sourceByteSize) &&
        sourceByteSize > 0)) &&
    typeof candidate["width"] === "number" &&
    Number.isSafeInteger(candidate["width"]) &&
    candidate["width"] > 0 &&
    typeof candidate["height"] === "number" &&
    Number.isSafeInteger(candidate["height"]) &&
    candidate["height"] > 0 &&
    typeof candidate["altText"] === "string" &&
    candidate["altText"].trim().length > 0 &&
    isMuseumExternalProposalPresentationSource(source) &&
    isMuseumExternalProposalPresentationCredit(credit) &&
    /\u00a9/u.test(credit.creditLine) &&
    credit.sourcePath === source.mediaRecordPath &&
    isRecord(candidate["rights"]) &&
    candidate["rights"]["status"] === "presentation_only" &&
    candidate["rights"]["licenseLabel"] === "All Rights Reserved" &&
    candidate["rights"]["licenseUrl"] === null &&
    candidate["download"] === "not_permitted" &&
    candidate["preservation"] === "not_retained" &&
    isMuseumExternalProposalPresentationAffordances(affordances)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMuseumExternalProposalPresentationSource(
  value: unknown
): value is MuseumExternalProposalPresentationSource {
  if (!isRecord(value)) return false;
  const partId = value["partId"];
  const serial = value["serial"];
  return (
    value["kind"] === "signed_wave_storm" &&
    typeof value["waveId"] === "string" &&
    UUID_PATTERN.test(value["waveId"]) &&
    typeof value["dropId"] === "string" &&
    UUID_PATTERN.test(value["dropId"]) &&
    typeof partId === "number" &&
    Number.isSafeInteger(partId) &&
    partId > 0 &&
    typeof value["publicationRecordId"] === "string" &&
    value["publicationRecordId"].trim().length > 0 &&
    typeof value["contextEntityId"] === "string" &&
    value["contextEntityId"] === "6529NM-CA-2026-003" &&
    (serial === null ||
      (typeof serial === "number" &&
        Number.isSafeInteger(serial) &&
        serial > 0)) &&
    typeof value["sourcePath"] === "string" &&
    isMuseumSafeGovernedSourcePath(value["sourcePath"]) &&
    typeof value["mediaRecordPath"] === "string" &&
    isMuseumSafeGovernedSourcePath(value["mediaRecordPath"]) &&
    typeof value["sourceCommit"] === "string" &&
    /^[a-f0-9]{40}$/u.test(value["sourceCommit"])
  );
}

function isMuseumExternalProposalPresentationCredit(
  value: unknown
): value is MuseumExternalProposalPresentationCredit {
  return (
    isRecord(value) &&
    typeof value["creditLine"] === "string" &&
    value["creditLine"].trim().length > 0 &&
    typeof value["sourcePath"] === "string" &&
    isMuseumSafeGovernedSourcePath(value["sourcePath"])
  );
}

function isMuseumExternalProposalPresentationAffordances(
  value: unknown
): value is readonly MuseumExternalProposalPresentationAffordance[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const allowed: readonly MuseumExternalProposalPresentationAffordance[] = [
    "view",
    "thumbnail",
    "hero",
    "alt",
    "open_upstream_presentation",
  ];
  return (
    new Set(value).size === value.length &&
    value.every(
      (affordance): affordance is MuseumExternalProposalPresentationAffordance =>
        typeof affordance === "string" && allowed.includes(affordance as MuseumExternalProposalPresentationAffordance)
    ) &&
    value.includes("view") &&
    value.includes("alt") &&
    value.includes("open_upstream_presentation")
  );
}

export function buildMuseumSignedWaveStormDropUrl(
  waveId: string,
  dropId: string
): string | null {
  if (!UUID_PATTERN.test(waveId) || !UUID_PATTERN.test(dropId)) return null;
  const url = `https://6529.io/waves/${waveId}?drop=${dropId}`;
  try {
    const parsed = new URL(url);
    const entries = [...parsed.searchParams.entries()];
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "6529.io" &&
      parsed.username.length === 0 &&
      parsed.password.length === 0 &&
      parsed.port.length === 0 &&
      parsed.pathname === `/waves/${waveId}` &&
      entries.length === 1 &&
      entries[0]?.[0] === "drop" &&
      entries[0][1] === dropId
    )
      ? url
      : null;
  } catch {
    return null;
  }
}
