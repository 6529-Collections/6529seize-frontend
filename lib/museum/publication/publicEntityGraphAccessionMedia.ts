import {
  isMuseumExternalProposalMediaUrl,
  isMuseumSafeGovernedSourcePath,
} from "./entities";
import type { MuseumPublicEntityRecord, MuseumSourceDocument } from "./types";
import { requiredObject, requiredString } from "./publicEntityGraphPrimitives";

interface MuseumAccessionMediaFacts {
  readonly sourceByteSize: number;
  readonly publicationPartNumber: number;
}

export function accessionMediaFacts(
  mediaEntity: MuseumPublicEntityRecord,
  media: Readonly<Record<string, unknown>>,
  publicationRecordId: string,
  historicalWaveUri: string,
  displayUri: string,
  sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>
): MuseumAccessionMediaFacts {
  const context = requiredObject(
    media,
    "wave_proposal_context",
    "public_entity_graph_media_wave"
  );
  const observationRecordId = requiredString(
    context,
    "observation_record_id",
    "public_entity_graph_media_observation"
  );
  const fixity = requiredObject(
    media,
    "fixity",
    "public_entity_graph_media_fixity"
  );
  const rights = requiredObject(
    media,
    "rights",
    "public_entity_graph_media_rights"
  );
  const sourceObservation = requiredObject(
    media,
    "source_observation",
    "public_entity_graph_media_source_observation"
  );
  const tokenSourceLocator = requiredObject(
    media,
    "token_source_locator",
    "public_entity_graph_media_token_source_locator"
  );
  const tokenSourceFixity = requiredObject(
    media,
    "token_source_fixity",
    "public_entity_graph_media_token_source_fixity"
  );
  const activeDisplaySourceAmendment = requiredObject(
    media,
    "active_display_source_amendment",
    "public_entity_graph_media_display_source_amendment"
  );
  const sourceByteSize = requiredPositiveInteger(
    media,
    "source_byte_size",
    "public_entity_graph_media_source_byte_size"
  );
  const publicationPartNumber = requiredPositiveInteger(
    media,
    "publication_part_number",
    "public_entity_graph_media_publication_part_number"
  );
  if (
    context["publication_status"] !== "historical_public_proposal_context" ||
    !mediaEntity.sourceRecordIds.includes(publicationRecordId) ||
    !mediaEntity.sourceRecordIds.includes(observationRecordId) ||
    fixity["status"] !== "verified" ||
    fixity["algorithm"] !== "sha256" ||
    typeof fixity["digest"] !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(fixity["digest"]) ||
    typeof fixity["verified_at"] !== "string" ||
    rights["status"] !== "restricted" ||
    sourceObservation["status"] !== "mutable_external" ||
    !isMuseumExternalProposalMediaUrl(historicalWaveUri) ||
    tokenSourceLocator["uri"] !== displayUri ||
    tokenSourceLocator["repository_path"] !== null ||
    tokenSourceFixity["status"] !== "verified" ||
    tokenSourceFixity["algorithm"] !== "sha256" ||
    tokenSourceFixity["digest"] !== fixity["digest"] ||
    tokenSourceFixity["verified_at"] !== fixity["verified_at"] ||
    activeDisplaySourceAmendment["status"] !==
      "active_downstream_accession_display_source"
  ) {
    throw new Error("public_entity_graph_media_accession_record");
  }
  assertActiveDisplaySourceAmendment({
    mediaEntity,
    media,
    publicationRecordId,
    historicalWaveUri,
    displayUri,
    sourceByteSize,
    fixity,
    amendment: activeDisplaySourceAmendment,
    sourceDocuments,
  });
  return {
    sourceByteSize,
    publicationPartNumber,
  };
}

function assertActiveDisplaySourceAmendment(input: {
  readonly mediaEntity: MuseumPublicEntityRecord;
  readonly media: Readonly<Record<string, unknown>>;
  readonly publicationRecordId: string;
  readonly historicalWaveUri: string;
  readonly displayUri: string;
  readonly sourceByteSize: number;
  readonly fixity: Readonly<Record<string, unknown>>;
  readonly amendment: Readonly<Record<string, unknown>>;
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
}): void {
  const amendmentId = input.amendment["amendment_id"];
  const amendmentPath = input.amendment["path"];
  const observedAt = input.amendment["observed_at"];
  if (
    typeof amendmentId !== "string" ||
    !/^6529NM-MEDIA-CONT-AMD-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}$/u.test(
      amendmentId
    ) ||
    typeof amendmentPath !== "string" ||
    !isMuseumSafeGovernedSourcePath(amendmentPath) ||
    !amendmentPath.startsWith(
      `records/proposed-gifts/${input.publicationRecordId}/`
    ) ||
    !/^records\/proposed-gifts\/[^/]+\/public\/scholarship\/machine\/media-source-continuity-amendment\.json$/u.test(
      amendmentPath
    ) ||
    typeof observedAt !== "string" ||
    !Number.isFinite(Date.parse(observedAt))
  ) {
    throw new Error("public_entity_graph_media_accession_record");
  }
  const document = input.sourceDocuments.get(amendmentPath);
  if (document?.mediaType !== "application/json") {
    throw new Error("public_entity_graph_media_accession_amendment");
  }
  let root: unknown;
  try {
    root = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_media_accession_amendment");
  }
  if (!isRecord(root)) {
    throw new Error("public_entity_graph_media_accession_amendment");
  }
  const works = root["works"];
  const matchingWork = Array.isArray(works)
    ? works.find(
        (candidate): candidate is Record<string, unknown> =>
          isRecord(candidate) &&
          candidate["work_entity_id"] === input.media["subject_entity_id"] &&
          candidate["media_reference_entity_id"] === input.mediaEntity.id
      )
    : undefined;
  if (
    root["amendment_id"] !== amendmentId ||
    root["status"] !== input.amendment["status"] ||
    root["observed_at"] !== observedAt ||
    !isRecord(matchingWork) ||
    matchingWork["historical_wave_uri"] !== input.historicalWaveUri ||
    matchingWork["display_token_source_uri"] !== input.displayUri ||
    matchingWork["sha256"] !== input.fixity["digest"] ||
    matchingWork["bytes"] !== input.sourceByteSize ||
    matchingWork["width"] !== input.media["width"] ||
    matchingWork["height"] !== input.media["height"] ||
    matchingWork["fixity_verified_at"] !== input.fixity["verified_at"] ||
    matchingWork["display_policy"] !==
      "historical_wave_locator_preserved_token_source_used_for_accession_display"
  ) {
    throw new Error("public_entity_graph_media_accession_amendment");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredPositiveInteger(
  source: Readonly<Record<string, unknown>>,
  key: string,
  error: string
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(error);
  }
  return value;
}
