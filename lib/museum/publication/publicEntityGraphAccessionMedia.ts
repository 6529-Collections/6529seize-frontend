import type { MuseumPublicEntityRecord } from "./types";
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
  displayUri: string
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
    sourceObservation["status"] !== "mutable_external" ||
    !isExactHistoricalWaveLocator(historicalWaveUri) ||
    tokenSourceLocator["uri"] !== displayUri ||
    tokenSourceLocator["repository_path"] !== null ||
    tokenSourceFixity["status"] !== "verified" ||
    tokenSourceFixity["algorithm"] !== "sha256" ||
    tokenSourceFixity["digest"] !== fixity["digest"] ||
    tokenSourceFixity["verified_at"] !== fixity["verified_at"] ||
    activeDisplaySourceAmendment["amendment_id"] !==
      "6529NM-MEDIA-CONT-AMD-2026-08-12-001" ||
    activeDisplaySourceAmendment["path"] !==
      "records/proposed-gifts/6529NM-PG-2026-001/public/scholarship/machine/media-source-continuity-amendment.json" ||
    activeDisplaySourceAmendment["status"] !==
      "active_downstream_accession_display_source" ||
    activeDisplaySourceAmendment["observed_at"] !==
      "2026-08-12T07:37:56.984246Z"
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

function isExactHistoricalWaveLocator(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "d3lqz0a4bldqgf.cloudfront.net" &&
      parsed.port === "" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname.startsWith("/drops/")
    );
  } catch {
    return false;
  }
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
