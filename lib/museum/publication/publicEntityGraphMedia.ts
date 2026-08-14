import {
  assertApprovedArtBlocksMediaUrl,
  assertApprovedMuseumRepositoryMediaUrl,
  buildImmutableMuseumBlobUrl,
} from "./security";
import {
  buildMuseumSignedWaveStormDropUrl,
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalPresentationMedia,
  isMuseumExternalProposalTokenSourceUrl,
  type MuseumAcquisitionMethod,
  type MuseumExternalProposalPresentationAffordance,
  type MuseumExternalProposalPresentationMedia,
} from "./entities";
import type {
  MuseumCuratedAcquisition,
  MuseumMedia,
  MuseumPublicEntityRecord,
  MuseumPublicEntityGraph,
  MuseumPublicWork,
  MuseumMediaMetadata,
  MuseumRightsCredit,
  MuseumSourceDocument,
  MuseumWorkAlias,
} from "./types";
import {
  ACQUISITION_METHODS,
  ENTITY_ID_PATTERNS,
} from "./publicEntityGraphSchema";
import {
  optionalString,
  requiredObject,
  requiredString,
  stringArray,
  isRecord,
} from "./publicEntityGraphPrimitives";
import { requireEntity } from "./publicEntityGraphValidation";
import {
  mediaLicenseLabel,
  mediaRightsCredit,
  metadataOnlyMedia,
  proposalMetadata,
} from "./publicEntityGraphMediaMetadata";
import { accessionMediaFacts } from "./publicEntityGraphAccessionMedia";
import { accessionPresentationVariants } from "./publicEntityGraphAccessionPresentation";
export { findWavePublicationPart } from "./publicEntityGraphWaveMediaJoin";

export function mapWorkStatus(
  status: string,
  acquisitionStatus?: string
): MuseumPublicWork["status"] {
  if (
    acquisitionStatus ===
    "selected_by_museum_wave_acquisition_review_in_progress"
  ) {
    return "selected_by_museum_wave_acquisition_review_in_progress";
  }
  switch (status) {
    case "proposed_in_museum_wave":
      return "proposed_in_museum_wave";
    case "selected_by_museum_wave_acquisition_review_in_progress":
      return "selected_by_museum_wave_acquisition_review_in_progress";
    case "selected_through_acquisition_program":
    case "acquisition_pending":
      return "selected_through_acquisition_program_acquisition_pending";
    case "acquisition_complete":
    case "accession_review_in_progress":
      return "acquisition_complete_accession_review_in_progress";
    case "accessioned":
      return "accessioned_into_permanent_collection";
    case "closed_without_selection":
      return "closed_without_selection";
    case "withdrawn":
      return "withdrawn";
    default:
      throw new Error("public_entity_graph_work_status_unpublishable");
  }
}

export function mapAcquisitionStatus(
  status: string
): MuseumCuratedAcquisition["status"] {
  switch (status) {
    case "proposed_in_museum_wave":
    case "selected_by_museum_wave_acquisition_review_in_progress":
    case "selected_through_acquisition_program_acquisition_pending":
    case "acquisition_complete_accession_review_in_progress":
    case "accessioned_into_permanent_collection":
    case "closed_without_selection":
    case "withdrawn":
      return status;
    case "selected_through_acquisition_program":
    case "acquisition_pending":
      return "selected_through_acquisition_program_acquisition_pending";
    case "acquisition_complete":
    case "accession_review_in_progress":
      return "acquisition_complete_accession_review_in_progress";
    case "accessioned":
      return "accessioned_into_permanent_collection";
    default:
      throw new Error("public_entity_graph_acquisition_status_unpublishable");
  }
}

export interface MuseumProjectedMedia {
  readonly retained: readonly MuseumMedia[];
  readonly presentation: readonly MuseumExternalProposalPresentationMedia[];
  readonly metadata: readonly MuseumMediaMetadata[];
}

interface MuseumMediaProjectionInput {
  readonly uri: string | null;
  readonly tokenSourceUri: string | null;
  readonly repositoryPath: string | null;
  readonly visual: boolean;
  readonly mediaType: string;
  readonly width: unknown;
  readonly height: unknown;
  readonly altText: string | null;
  readonly creditLine: string;
  readonly licenseLabel: string | null;
  readonly allowedUiAffordances: readonly string[];
}

interface MuseumMediaProjectionContext {
  readonly sourceCommit: string;
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
  readonly graph: MuseumPublicEntityGraph;
  readonly catalogMediaAssetPaths: ReadonlySet<string>;
}

const MUSEUM_WAVE_CURATED_ACQUISITION_ID = "6529NM-CA-2026-003" as const;

export function projectMediaRelations(
  entities: readonly MuseumPublicEntityRecord[],
  graph: MuseumPublicEntityGraph,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>,
  catalogMediaAssetPaths: readonly string[] = []
): ReadonlyMap<string, MuseumProjectedMedia> {
  const mediaBySubject = new Map<
    string,
    {
      retained: MuseumMedia[];
      presentation: MuseumExternalProposalPresentationMedia[];
      metadata: MuseumMediaMetadata[];
    }
  >();
  const context: MuseumMediaProjectionContext = {
    sourceCommit: graph.sourceCommit,
    sourceDocuments,
    graph,
    catalogMediaAssetPaths: new Set(catalogMediaAssetPaths),
  };
  for (const relation of graph.relations.filter(
    (candidate) => candidate.relationType === "ENTITY_HAS_MEDIA"
  )) {
    const mediaEntity = requireEntity(
      entities,
      relation.targetEntityId,
      "public_entity_graph_media_missing"
    );
    const subjectEntity = requireEntity(
      entities,
      relation.sourceEntityId,
      "public_entity_graph_media_subject"
    );
    const projected = mediaFromEntity(mediaEntity, subjectEntity, context);
    const bucket = mediaBySubject.get(relation.sourceEntityId) ?? {
      retained: [],
      presentation: [],
      metadata: [],
    };
    if (projected.retained !== null) bucket.retained.push(projected.retained);
    if (projected.presentation !== null) {
      bucket.presentation.push(projected.presentation);
    }
    if (projected.metadata !== null) bucket.metadata.push(projected.metadata);
    mediaBySubject.set(relation.sourceEntityId, bucket);
  }
  return mediaBySubject;
}

function mediaFromEntity(
  mediaEntity: MuseumPublicEntityRecord,
  subjectEntity: MuseumPublicEntityRecord,
  context: MuseumMediaProjectionContext
): {
  readonly retained: MuseumMedia | null;
  readonly presentation: MuseumExternalProposalPresentationMedia | null;
  readonly metadata: MuseumMediaMetadata | null;
} {
  const media = requiredObject(
    mediaEntity.profile,
    "media",
    "public_entity_graph_media"
  );
  const role = requiredString(
    media,
    "media_role",
    "public_entity_graph_media_role"
  );
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
  const tokenSourceValue = media["token_source_locator"];
  const tokenSourceUri = isRecord(tokenSourceValue)
    ? optionalString(
        tokenSourceValue,
        "uri",
        "public_entity_graph_media_token_source_uri"
      )
    : null;
  const mediaType = requiredString(
    media,
    "media_type",
    "public_entity_graph_media_type"
  );
  const width = media["width"];
  const height = media["height"];
  const visual = media["visual"] === true;
  const altText =
    typeof media["accessibility_text"] === "string"
      ? media["accessibility_text"]
      : null;
  const creditLine = requiredString(
    media,
    "credit",
    "public_entity_graph_media_credit"
  );
  const licenseLabel = mediaLicenseLabel(media);
  const allowedUiAffordances = stringArray(
    media,
    "allowed_ui_affordances",
    "public_entity_graph_media_affordances",
    false
  );
  if (media["subject_entity_id"] !== subjectEntity.id) {
    throw new Error("public_entity_graph_media_subject");
  }
  const input: MuseumMediaProjectionInput = {
    uri,
    tokenSourceUri,
    repositoryPath,
    visual,
    mediaType,
    width,
    height,
    altText,
    creditLine,
    licenseLabel,
    allowedUiAffordances,
  };
  if (role === "historical_wave_proposal_presentation") {
    return projectProposalMedia(mediaEntity, subjectEntity, context, input);
  }
  return projectRetainedMedia(
    mediaEntity,
    subjectEntity.id,
    input,
    role,
    context
  );
}

function projectProposalMedia(
  mediaEntity: MuseumPublicEntityRecord,
  subjectEntity: MuseumPublicEntityRecord,
  context: MuseumMediaProjectionContext,
  input: MuseumMediaProjectionInput
): {
  readonly retained: null;
  readonly presentation: MuseumExternalProposalPresentationMedia | null;
  readonly metadata: MuseumMediaMetadata | null;
} {
  const media = requiredObject(
    mediaEntity.profile,
    "media",
    "public_entity_graph_media"
  );
  const { waveId, dropId, publicationRecordId } = waveContext(media);
  if (!mediaEntity.sourceRecordIds.includes(publicationRecordId)) {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  if (
    input.visual &&
    input.allowedUiAffordances.includes("view") &&
    input.tokenSourceUri === null
  ) {
    throw new Error("public_entity_graph_media_token_source_locator");
  }
  const metadataOnly =
    !input.visual ||
    (input.tokenSourceUri === null && input.repositoryPath === null) ||
    !input.allowedUiAffordances.includes("view");
  if (metadataOnly) {
    assertProposalContext(media, subjectEntity, context, waveId, dropId);
    return {
      retained: null,
      presentation: null,
      metadata: proposalMetadata({
        mediaEntity,
        subjectEntityId: subjectEntity.id,
        input,
        waveId,
        dropId,
        publicationRecordId,
        canOpenWaveContext: input.allowedUiAffordances.includes(
          "open_wave_proposal_context"
        ),
      }),
    };
  }
  assertProposalPresentationInput(input);
  assertProposalContext(media, subjectEntity, context, waveId, dropId);
  assertProposalSourceLocator(input);
  const { sourceByteSize, publicationPartNumber } = accessionMediaFacts(
    mediaEntity,
    media,
    publicationRecordId,
    input.uri,
    input.tokenSourceUri,
    context.sourceDocuments
  );
  const affordances = proposalAffordances(input);
  const sourceSha256 = requiredString(
    requiredObject(media, "fixity", "public_entity_graph_media_fixity"),
    "digest",
    "public_entity_graph_media_fixity"
  );
  const variants = accessionPresentationVariants({
    workId: subjectEntity.id,
    mediaId: mediaEntity.id,
    sourceUrl: input.tokenSourceUri,
    sourceSha256,
    sourceByteSize,
    sourceWidth: input.width,
    sourceHeight: input.height,
    sourceAltText: input.altText,
    sourceDocuments: context.sourceDocuments,
    catalogMediaAssetPaths: context.catalogMediaAssetPaths,
  });
  const candidate: MuseumExternalProposalPresentationMedia = {
    id: mediaEntity.id,
    kind: "external_proposal_presentation",
    mediaUrl: input.tokenSourceUri,
    mediaMimeType:
      input.mediaType as MuseumExternalProposalPresentationMedia["mediaMimeType"],
    sourceByteSize,
    ...(variants.length === 0 ? {} : { variants }),
    width: input.width,
    height: input.height,
    altText: input.altText,
    source: {
      kind: "signed_wave_storm",
      waveId,
      dropId,
      partId: publicationPartNumber,
      serial: null,
      publicationRecordId,
      contextEntityId: MUSEUM_WAVE_CURATED_ACQUISITION_ID,
      sourcePath: mediaEntity.sourcePath,
      mediaRecordPath: mediaEntity.sourcePath,
      sourceCommit: context.sourceCommit,
    },
    credit: {
      creditLine: input.creditLine,
      sourcePath: mediaEntity.sourcePath,
    },
    rights: {
      status: "presentation_only",
      licenseLabel: "All Rights Reserved",
      licenseUrl: null,
    },
    download: "not_permitted",
    preservation: "not_retained",
    affordances,
  };
  if (!isMuseumExternalProposalPresentationMedia(candidate)) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  return { retained: null, presentation: candidate, metadata: null };
}

function assertProposalPresentationInput(
  input: MuseumMediaProjectionInput
): asserts input is MuseumMediaProjectionInput & {
  readonly uri: string;
  readonly tokenSourceUri: string;
  readonly width: number;
  readonly height: number;
  readonly altText: string;
} {
  if (
    input.uri === null ||
    input.tokenSourceUri === null ||
    !input.visual ||
    typeof input.width !== "number" ||
    typeof input.height !== "number" ||
    input.altText === null
  ) {
    throw new Error("public_entity_graph_media_proposal_shape");
  }
  if (!/\u00a9/u.test(input.creditLine)) {
    throw new Error("public_entity_graph_media_proposal_credit");
  }
}

function waveContext(media: Record<string, unknown>): {
  readonly waveId: string;
  readonly dropId: string;
  readonly publicationRecordId: string;
} {
  const wave = isRecord(media["signed_wave"])
    ? media["signed_wave"]
    : requiredObject(
        media,
        "wave_proposal_context",
        "public_entity_graph_media_wave"
      );
  return {
    waveId: requiredString(
      wave,
      "wave_id",
      "public_entity_graph_media_wave_id"
    ),
    dropId: requiredString(
      wave,
      "drop_id",
      "public_entity_graph_media_drop_id"
    ),
    publicationRecordId: requiredString(
      wave,
      "publication_record_id",
      "public_entity_graph_media_wave_publication"
    ),
  };
}

function assertProposalContext(
  media: Record<string, unknown>,
  subjectEntity: MuseumPublicEntityRecord,
  context: MuseumMediaProjectionContext,
  waveId: string,
  dropId: string
): void {
  const publicationContextEntityIds = stringArray(
    media,
    "publication_context_entity_ids",
    "public_entity_graph_media_wave_context",
    false
  );
  const acquisitionContextIds = publicationContextEntityIds.filter((id) =>
    ENTITY_ID_PATTERNS.CURATED_ACQUISITION?.test(id)
  );
  if (
    acquisitionContextIds.length !== 1 ||
    acquisitionContextIds[0] !== MUSEUM_WAVE_CURATED_ACQUISITION_ID
  ) {
    throw new Error("public_entity_graph_media_wave_context");
  }
  const hasAcquisitionContext = context.graph.relations.some(
    (relation) =>
      relation.relationType === "CURATED_ACQUISITION_BRINGS_TOGETHER_WORK" &&
      relation.targetEntityId === subjectEntity.id &&
      relation.sourceEntityId === MUSEUM_WAVE_CURATED_ACQUISITION_ID
  );
  if (!hasAcquisitionContext) {
    throw new Error("public_entity_graph_media_wave_context");
  }
  if (buildMuseumSignedWaveStormDropUrl(waveId, dropId) === null) {
    throw new Error("public_entity_graph_media_wave_url");
  }
}

function assertProposalSourceLocator(input: MuseumMediaProjectionInput): void {
  if (
    input.uri === null ||
    !isMuseumExternalProposalMediaUrl(input.uri) ||
    input.tokenSourceUri === null ||
    !isMuseumExternalProposalTokenSourceUrl(input.tokenSourceUri)
  ) {
    throw new Error("public_entity_graph_media_proposal_source_locator");
  }
}

function proposalAffordances(
  input: MuseumMediaProjectionInput
): MuseumExternalProposalPresentationAffordance[] {
  if (!input.visual || !input.allowedUiAffordances.includes("view")) {
    throw new Error("public_entity_graph_media_affordance");
  }
  return [
    "view" as const,
    ...(input.allowedUiAffordances.includes("thumbnail")
      ? ["thumbnail" as const]
      : []),
    ...(input.allowedUiAffordances.includes("hero") ? ["hero" as const] : []),
    ...(input.allowedUiAffordances.includes("alt_text")
      ? ["alt" as const]
      : []),
    ...(input.allowedUiAffordances.includes("open_wave_proposal_context")
      ? ["open_upstream_presentation" as const]
      : []),
  ];
}

function projectRetainedMedia(
  mediaEntity: MuseumPublicEntityRecord,
  subjectEntityId: string,
  input: MuseumMediaProjectionInput,
  role: string,
  context: MuseumMediaProjectionContext
): {
  readonly retained: MuseumMedia | null;
  readonly presentation: null;
  readonly metadata: MuseumMediaMetadata | null;
} {
  if (!input.allowedUiAffordances.includes("view")) {
    return {
      retained: null,
      presentation: null,
      metadata: metadataOnlyMedia(mediaEntity, subjectEntityId, input, role),
    };
  }
  if (
    input.uri === null ||
    typeof input.width !== "number" ||
    typeof input.height !== "number"
  ) {
    return {
      retained: null,
      presentation: null,
      metadata: metadataOnlyMedia(mediaEntity, subjectEntityId, input, role),
    };
  }
  const media = requiredObject(
    mediaEntity.profile,
    "media",
    "public_entity_graph_media"
  );
  const credit = mediaRightsCredit(
    input.creditLine,
    input.licenseLabel,
    mediaEntity.sourcePath
  );
  if (media["media_role"] === "museum_retained_preservation_object") {
    return projectPreservedMedia(
      mediaEntity,
      subjectEntityId,
      input,
      credit,
      context
    );
  }
  if (media["media_role"] === "token_linked_source_media") {
    const approved = assertApprovedArtBlocksMediaUrl(input.uri);
    return {
      retained: {
        id: mediaEntity.id,
        artworkId: subjectEntityId,
        kind: approved.kind,
        role: "source",
        mediaType: input.mediaType,
        width: input.width,
        height: input.height,
        altText: input.altText,
        credit,
        sourcePath: mediaEntity.sourcePath,
        custody: "upstream",
        url: approved.url,
        preservationStatus: "not_retained",
        sha256: null,
        upstreamProvider: "art_blocks",
      },
      presentation: null,
      metadata: null,
    };
  }
  if (
    media["media_role"] === "museum_generated_public_derivative" ||
    media["media_role"] === "museum_authored_public_graphic"
  ) {
    const url = assertApprovedMuseumRepositoryMediaUrl(
      context.sourceCommit,
      input.repositoryPath,
      context.catalogMediaAssetPaths
    );
    return {
      retained: {
        id: mediaEntity.id,
        artworkId: subjectEntityId,
        kind: "still",
        role: "source",
        mediaType: input.mediaType,
        width: input.width,
        height: input.height,
        altText: input.altText,
        credit,
        sourcePath: mediaEntity.sourcePath,
        custody: "upstream",
        url,
        preservationStatus: "not_retained",
        sha256: null,
        upstreamProvider: "museum_public_derivative",
      },
      presentation: null,
      metadata: null,
    };
  }
  return {
    retained: null,
    presentation: null,
    metadata: metadataOnlyMedia(mediaEntity, subjectEntityId, input, role),
  };
}

function projectPreservedMedia(
  mediaEntity: MuseumPublicEntityRecord,
  subjectEntityId: string,
  input: MuseumMediaProjectionInput,
  credit: MuseumRightsCredit,
  context: MuseumMediaProjectionContext
): {
  readonly retained: MuseumMedia | null;
  readonly presentation: null;
  readonly metadata: null;
} {
  const media = requiredObject(
    mediaEntity.profile,
    "media",
    "public_entity_graph_media"
  );
  const fixity = requiredObject(
    media,
    "fixity",
    "public_entity_graph_media_fixity"
  );
  const fixityStatus = requiredString(
    fixity,
    "status",
    "public_entity_graph_media_fixity_status"
  );
  if (fixityStatus !== "verified") {
    return { retained: null, presentation: null, metadata: null };
  }
  const digest = requiredString(
    fixity,
    "digest",
    "public_entity_graph_media_fixity_digest"
  );
  if (!/^sha256:[a-f0-9]{64}$/u.test(digest)) {
    return { retained: null, presentation: null, metadata: null };
  }
  const url = assertApprovedMuseumRepositoryMediaUrl(
    context.sourceCommit,
    input.repositoryPath,
    context.catalogMediaAssetPaths
  );
  return {
    retained: {
      id: mediaEntity.id,
      artworkId: subjectEntityId,
      kind: "still",
      role: "source",
      mediaType: input.mediaType,
      width: input.width as number,
      height: input.height as number,
      altText: input.altText,
      credit,
      sourcePath: mediaEntity.sourcePath,
      custody: "retained",
      url,
      preservationStatus: "retained_verified",
      sha256: digest as `sha256:${string}`,
      upstreamProvider: null,
    },
    presentation: null,
    metadata: null,
  };
}

export function aliasesForWorks(
  entities: readonly MuseumPublicEntityRecord[]
): readonly MuseumWorkAlias[] {
  const aliases = new Map<string, MuseumWorkAlias>();
  const sharedReferences = new Set<string>();
  for (const work of entities.filter(
    (entity) => entity.entityType === "WORK"
  )) {
    // A manifestation can be shared by several Works (for example a visual
    // observation record). Only a typed manifestation/source-object reference
    // is an identity alias; the inventory remains authoritative for all other
    // source joins.
    const refs = sourceProfileReferences(
      work.profile,
      "manifestation_references",
      "manifestation"
    );
    for (const alias of refs) {
      if (sharedReferences.has(alias)) continue;
      if (
        alias === work.id ||
        ENTITY_ID_PATTERNS["WORK"]?.test(alias) === true
      ) {
        continue;
      }
      const existing = aliases.get(alias);
      if (existing !== undefined && existing.workId !== work.id) {
        // A shared manifestation (for example a visual observation) is
        // context, not a Work identity alias. The identity inventory remains
        // authoritative for aliases that may redirect to a canonical Work.
        aliases.delete(alias);
        sharedReferences.add(alias);
        continue;
      }
      aliases.set(alias, {
        kind: "work_source_alias",
        sourceObjectId: alias,
        workId: work.id,
        sourcePath: work.sourcePath,
      });
    }
  }
  return [...aliases.values()].sort((left, right) =>
    left.sourceObjectId.localeCompare(right.sourceObjectId)
  );
}

function sourceProfileReferences(
  profile: Readonly<Record<string, unknown>>,
  key: string,
  referenceType: string
): string[] {
  const values = profile[key];
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    if (!isRecord(value)) return [];
    if (value["reference_type"] !== referenceType) return [];
    const sourceRecordId = value["source_record_id"];
    return typeof sourceRecordId === "string" &&
      sourceRecordId.trim().length > 0
      ? [sourceRecordId]
      : [];
  });
}

export function mergeWorkAliases(
  aliases: readonly MuseumWorkAlias[]
): readonly MuseumWorkAlias[] {
  const byAlias = new Map<string, MuseumWorkAlias>();
  for (const alias of aliases) {
    const existing = byAlias.get(alias.sourceObjectId);
    if (existing !== undefined && existing.workId !== alias.workId) {
      throw new Error("public_entity_graph_alias_collision");
    }
    byAlias.set(alias.sourceObjectId, alias);
  }
  return [...byAlias.values()].sort((left, right) =>
    left.sourceObjectId.localeCompare(right.sourceObjectId)
  );
}

export function mapAcquisitionMethod(value: string): MuseumAcquisitionMethod {
  if (!ACQUISITION_METHODS.has(value as MuseumAcquisitionMethod)) {
    throw new Error("public_entity_graph_acquisition_method");
  }
  return value as MuseumAcquisitionMethod;
}

export function immutableDocumentSource(
  sourceCommit: string,
  path: string
): string {
  const url = buildImmutableMuseumBlobUrl(sourceCommit, path);
  if (url === null) throw new Error("public_entity_graph_document_join");
  return url;
}
