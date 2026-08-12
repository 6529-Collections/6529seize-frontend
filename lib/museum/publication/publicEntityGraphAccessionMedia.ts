import type { MuseumPublicEntityRecord } from "./types";
import { requiredObject, requiredString } from "./publicEntityGraphPrimitives";

interface MuseumAccessionMediaFacts {
  readonly sourceByteSize: number;
  readonly publicationPartNumber: number;
}

export function accessionMediaFacts(
  mediaEntity: MuseumPublicEntityRecord,
  media: Readonly<Record<string, unknown>>,
  publicationRecordId: string
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
  if (
    context["publication_status"] !==
      "historical_public_proposal_context" ||
    !mediaEntity.sourceRecordIds.includes(publicationRecordId) ||
    !mediaEntity.sourceRecordIds.includes(observationRecordId) ||
    fixity["status"] !== "verified" ||
    fixity["algorithm"] !== "sha256" ||
    typeof fixity["digest"] !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(fixity["digest"]) ||
    typeof fixity["verified_at"] !== "string" ||
    rights["status"] !== "restricted" ||
    sourceObservation["status"] !== "mutable_external"
  ) {
    throw new Error("public_entity_graph_media_accession_record");
  }
  return {
    sourceByteSize: requiredPositiveInteger(
      media,
      "source_byte_size",
      "public_entity_graph_media_source_byte_size"
    ),
    publicationPartNumber: requiredPositiveInteger(
      media,
      "publication_part_number",
      "public_entity_graph_media_publication_part_number"
    ),
  };
}

function requiredPositiveInteger(
  source: Readonly<Record<string, unknown>>,
  key: string,
  error: string
): number {
  const value = source[key];
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error(error);
  }
  return value;
}
