import {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalTokenSourceUrl,
} from "./entities";
import { isRecord } from "./publicEntityGraphPrimitives";
import {
  parseWavePublicationParts,
  type MuseumWavePublicationPart,
} from "./publicEntityGraphWaveReceipt";
import type { MuseumPublicEntityRecord, MuseumSourceDocument } from "./types";

const WAVE_PUBLICATION_OBSERVATION_PATH_PATTERN =
  /^records\/proposed-gifts\/[^/]+\/wave-publication-observation-[^/]+\.json$/u;

interface MuseumWavePublicationJoinInput {
  readonly uri: string | null;
  readonly mediaType: string;
  readonly creditLine: string;
}

interface MuseumWavePublicationJoin {
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
  readonly subjectEntity: MuseumPublicEntityRecord;
  readonly publicationRecordId: string;
  readonly waveId: string;
  readonly dropId: string;
  readonly input: MuseumWavePublicationJoinInput;
}

export function findWavePublicationPart({
  sourceDocuments,
  subjectEntity,
  publicationRecordId,
  waveId,
  dropId,
  input,
}: MuseumWavePublicationJoin): MuseumWavePublicationPart {
  const candidateObjectIds = sourceProfileReferences(
    subjectEntity.profile,
    "manifestation_references",
    "manifestation"
  ).filter((sourceId) =>
    /^6529NM-PG-[0-9]{4}-[0-9]{3}\.OBJ-[0-9]{3}$/u.test(sourceId)
  );
  if (candidateObjectIds.length !== 1) {
    throw new Error("public_entity_graph_media_wave_candidate_join");
  }
  const candidateObjectId = candidateObjectIds[0];
  if (candidateObjectId === undefined) {
    throw new Error("public_entity_graph_media_wave_candidate_join");
  }
  const matches = [...sourceDocuments.values()]
    .filter((document) =>
      WAVE_PUBLICATION_OBSERVATION_PATH_PATTERN.test(document.path)
    )
    .flatMap((document) => parseWavePublicationParts(document, sourceDocuments))
    .filter(
      (part) =>
        part.proposalId === publicationRecordId &&
        part.waveId === waveId &&
        part.dropId === dropId &&
        part.candidateObjectId === candidateObjectId
    );
  if (matches.length !== 1) {
    throw new Error("public_entity_graph_media_wave_publication_join");
  }
  const part = matches[0];
  if (part === undefined) {
    throw new Error("public_entity_graph_media_wave_publication_join");
  }
  if (
    part.mediaMimeType !== input.mediaType ||
    part.creditLine !== input.creditLine ||
    part.rightsLabel !== "All Rights Reserved" ||
    (isMuseumExternalProposalMediaUrl(input.uri ?? "") &&
      part.mediaUrl !== input.uri) ||
    (isMuseumExternalProposalTokenSourceUrl(input.uri ?? "") &&
      part.tokenSourceUri !== input.uri)
  ) {
    throw new Error("public_entity_graph_media_wave_publication_mismatch");
  }
  return withSourceDeclaredByteSize(part, sourceDocuments);
}

function withSourceDeclaredByteSize(
  part: MuseumWavePublicationPart,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): MuseumWavePublicationPart {
  if (part.mediaByteSize !== null || part.tokenSourceUri === null) {
    return part;
  }
  const proposalPath = `records/proposed-gifts/${part.proposalId}/proposal.json`;
  const proposalDocument = sourceDocuments.get(proposalPath);
  if (proposalDocument === undefined) return part;
  let root: unknown;
  try {
    root = JSON.parse(proposalDocument.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  if (!isRecord(root) || !isUnknownArray(root["objects"])) {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  const object = root["objects"].find(
    (candidate) =>
      isRecord(candidate) &&
      candidate["candidate_object_id"] === part.candidateObjectId
  );
  if (!isRecord(object) || !isRecord(object["image"])) {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  const image = object["image"];
  if (image["uri"] !== part.tokenSourceUri) {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  const bytes = image["bytes"];
  if (typeof bytes !== "number" || !Number.isSafeInteger(bytes) || bytes < 1) {
    throw new Error("public_entity_graph_media_wave_source_join");
  }
  return { ...part, mediaByteSize: bytes };
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function sourceProfileReferences(
  profile: Readonly<Record<string, unknown>>,
  key: string,
  referenceType: string
): string[] {
  const values = profile[key];
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    if (!isRecord(value) || value["reference_type"] !== referenceType) {
      return [];
    }
    const sourceRecordId = value["source_record_id"];
    return typeof sourceRecordId === "string" &&
      sourceRecordId.trim().length > 0
      ? [sourceRecordId]
      : [];
  });
}
