import { createHash } from "node:crypto";
import {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalTokenSourceUrl,
  isMuseumSafeGovernedSourcePath,
} from "./entities";
import type { MuseumSourceDocument } from "./types";
import {
  isRecord,
  requiredObject,
  requiredString,
  optionalString,
} from "./publicEntityGraphPrimitives";

export interface MuseumWavePublicationPart {
  readonly observationPath: string;
  readonly partId: number;
  readonly proposalId: string;
  readonly waveId: string;
  readonly dropId: string;
  readonly candidateObjectId: string;
  readonly mediaUrl: string;
  readonly mediaMimeType: string;
  readonly mediaByteSize: number | null;
  readonly creditLine: string;
  readonly rightsLabel: string;
  readonly tokenSourceUri: string | null;
}

interface ParsedWavePublicationPart {
  readonly sourcePath: string;
  readonly partId: number;
  readonly candidateObjectId: string | null;
  readonly part: MuseumWavePublicationPart | null;
}

interface WavePublicationIdentity {
  readonly proposalId: string;
  readonly waveId: string;
  readonly dropId: string;
}

interface WavePartAccumulator {
  readonly result: MuseumWavePublicationPart[];
  readonly partIds: Set<number>;
  readonly sourcePaths: Set<string>;
  readonly candidateObjectIds: Set<string>;
}

const CANDIDATE_OBJECT_ID_PATTERN =
  /^6529NM-PG-[0-9]{4}-[0-9]{3}\.OBJ-[0-9]{3}$/u;

function sha256Utf8(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function assertPartsCount(
  value: unknown,
  length: number
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    length !== value ||
    value !== 7
  ) {
    throw new Error("public_entity_graph_media_wave_publication_parts_count");
  }
}

function assertReceiptIntegrity(
  value: Record<string, unknown>,
  partId: unknown,
  sourcePath: string,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): asserts partId is number {
  const contentEncoding = requiredString(
    value,
    "content_encoding",
    "public_entity_graph_media_wave_publication_encoding"
  );
  const lineEndings = requiredString(
    value,
    "line_endings",
    "public_entity_graph_media_wave_publication_line_endings"
  );
  const contentSha256 = requiredString(
    value,
    "content_sha256",
    "public_entity_graph_media_wave_publication_content_hash"
  );
  const sourceDocument = sourceDocuments.get(sourcePath);
  if (
    typeof partId !== "number" ||
    !Number.isSafeInteger(partId) ||
    partId < 1 ||
    !isMuseumSafeGovernedSourcePath(sourcePath) ||
    sourceDocument?.path !== sourcePath
  ) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  if (sourceDocument.sha256 === null) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  if (contentEncoding !== "UTF-8" || lineEndings !== "LF") {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  if (
    !/^sha256:[a-f0-9]{64}$/u.test(contentSha256) ||
    sourceDocument.text.startsWith("\uFEFF") ||
    sourceDocument.text.includes("\r")
  ) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  const computedHash = sha256Utf8(sourceDocument.text);
  if (
    computedHash !== contentSha256 ||
    sourceDocument.sha256 !== contentSha256
  ) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
}

function parseWavePublicationPart(
  value: unknown,
  document: MuseumSourceDocument,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>,
  identity: WavePublicationIdentity
): ParsedWavePublicationPart {
  if (!isRecord(value)) {
    throw new Error("public_entity_graph_media_wave_publication_part");
  }
  const candidateObjectId = value["candidate_object_id"];
  if (candidateObjectId !== null && typeof candidateObjectId !== "string") {
    throw new Error("public_entity_graph_media_wave_publication_candidate");
  }
  const partId = value["part_id"];
  const sourcePath = requiredString(
    value,
    "source_path",
    "public_entity_graph_media_wave_publication_source"
  );
  assertReceiptIntegrity(value, partId, sourcePath, sourceDocuments);
  if (typeof partId !== "number") {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  if (candidateObjectId === null) {
    return { sourcePath, partId, candidateObjectId, part: null };
  }
  if (
    !CANDIDATE_OBJECT_ID_PATTERN.test(candidateObjectId) ||
    !candidateObjectId.startsWith(`${identity.proposalId}.`)
  ) {
    throw new Error("public_entity_graph_media_wave_publication_candidate");
  }
  const mediaUrl = requiredString(
    value,
    "media_url",
    "public_entity_graph_media_wave_publication_media"
  );
  const mediaMimeType = requiredString(
    value,
    "mime_type",
    "public_entity_graph_media_wave_publication_mime"
  );
  const creditLine = requiredString(
    value,
    "credit",
    "public_entity_graph_media_wave_publication_credit"
  );
  const rightsLabel = requiredString(
    value,
    "rights_label",
    "public_entity_graph_media_wave_publication_rights"
  );
  const tokenSourceUri = optionalString(
    value,
    "token_source_uri",
    "public_entity_graph_media_wave_publication_token"
  );
  const mediaByteSize = value["media_bytes"];
  if (
    mediaByteSize !== undefined &&
    mediaByteSize !== null &&
    (typeof mediaByteSize !== "number" ||
      !Number.isSafeInteger(mediaByteSize) ||
      mediaByteSize < 1)
  ) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  if (
    !isMuseumExternalProposalMediaUrl(mediaUrl) ||
    !/^image\/(?:jpe?g|png|webp)$/u.test(mediaMimeType) ||
    !/\u00a9/u.test(creditLine) ||
    rightsLabel !== "All Rights Reserved" ||
    (tokenSourceUri !== null &&
      !isMuseumExternalProposalTokenSourceUrl(tokenSourceUri))
  ) {
    throw new Error("public_entity_graph_media_wave_publication_part");
  }
  return {
    sourcePath,
    partId,
    candidateObjectId,
    part: {
      observationPath: document.path,
      partId,
      proposalId: identity.proposalId,
      waveId: identity.waveId,
      dropId: identity.dropId,
      candidateObjectId,
      mediaUrl,
      mediaMimeType,
      mediaByteSize: typeof mediaByteSize === "number" ? mediaByteSize : null,
      creditLine,
      rightsLabel,
      tokenSourceUri,
    },
  };
}

function addWavePublicationPart(
  parsed: ParsedWavePublicationPart,
  accumulator: WavePartAccumulator
): void {
  if (
    accumulator.partIds.has(parsed.partId) ||
    accumulator.sourcePaths.has(parsed.sourcePath)
  ) {
    throw new Error("public_entity_graph_media_wave_publication_receipt");
  }
  accumulator.partIds.add(parsed.partId);
  accumulator.sourcePaths.add(parsed.sourcePath);
  const candidateObjectId = parsed.candidateObjectId;
  if (parsed.part === null || candidateObjectId === null) return;
  if (accumulator.candidateObjectIds.has(candidateObjectId)) {
    throw new Error("public_entity_graph_media_wave_publication_candidate");
  }
  accumulator.candidateObjectIds.add(candidateObjectId);
  accumulator.result.push(parsed.part);
}

export function parseWavePublicationParts(
  document: MuseumSourceDocument,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): readonly MuseumWavePublicationPart[] {
  let root: unknown;
  try {
    root = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_media_wave_publication_json");
  }
  if (!isRecord(root)) {
    throw new Error("public_entity_graph_media_wave_publication_shape");
  }
  const envelope = requiredObject(
    root,
    "envelope",
    "public_entity_graph_media_wave_publication_envelope"
  );
  if (envelope["recordType"] !== "WAVE_PUBLICATION_OBSERVATION") {
    throw new Error("public_entity_graph_media_wave_publication_type");
  }
  const payload = requiredObject(
    root,
    "payload",
    "public_entity_graph_media_wave_publication_payload"
  );
  if (payload["is_signed"] !== true) {
    throw new Error("public_entity_graph_media_wave_publication_unsigned");
  }
  const proposalId = requiredString(
    payload,
    "proposal_id",
    "public_entity_graph_media_wave_publication_proposal"
  );
  const waveId = requiredString(
    payload,
    "wave_id",
    "public_entity_graph_media_wave_publication_wave"
  );
  const dropId = requiredString(
    payload,
    "drop_id",
    "public_entity_graph_media_wave_publication_drop"
  );
  const parts = payload["parts"];
  if (!Array.isArray(parts)) {
    throw new Error("public_entity_graph_media_wave_publication_parts");
  }
  assertPartsCount(payload["parts_count"], parts.length);
  const accumulator: WavePartAccumulator = {
    result: [],
    partIds: new Set<number>(),
    sourcePaths: new Set<string>(),
    candidateObjectIds: new Set<string>(),
  };
  const identity: WavePublicationIdentity = { proposalId, waveId, dropId };
  for (const value of parts) {
    addWavePublicationPart(
      parseWavePublicationPart(value, document, sourceDocuments, identity),
      accumulator
    );
  }
  if (
    accumulator.partIds.size !== parts.length ||
    accumulator.sourcePaths.size !== parts.length ||
    [1, 2, 3, 4, 5, 6, 7].some((partId) => !accumulator.partIds.has(partId))
  ) {
    throw new Error("public_entity_graph_media_wave_publication_part_unique");
  }
  if (
    accumulator.candidateObjectIds.size !== 5 ||
    accumulator.result.length !== 5
  ) {
    throw new Error(
      "public_entity_graph_media_wave_publication_candidate_count"
    );
  }
  return accumulator.result;
}
