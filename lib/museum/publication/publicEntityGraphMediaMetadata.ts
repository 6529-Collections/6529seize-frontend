import { buildMuseumSignedWaveStormDropUrl } from "./entities";
import type {
  MuseumMediaMetadata,
  MuseumMediaMetadataContext,
  MuseumPublicEntityRecord,
} from "./types";

interface MuseumMediaProjectionInput {
  readonly width: unknown;
  readonly height: unknown;
  readonly altText: string | null;
  readonly mediaType: string;
  readonly creditLine: string;
  readonly licenseLabel: string | null;
}

const MUSEUM_WAVE_CURATED_ACQUISITION_ID = "6529NM-CA-2026-003" as const;

export function metadataOnlyMedia(
  mediaEntity: MuseumPublicEntityRecord,
  subjectEntityId: string,
  input: MuseumMediaProjectionInput,
  role: string
): MuseumMediaMetadata {
  if (!isMuseumMediaMetadataRole(role)) {
    throw new Error("public_entity_graph_media_role");
  }
  return {
    id: mediaEntity.id,
    artworkId: subjectEntityId,
    role,
    mediaType: input.mediaType,
    width: positiveDimension(input.width),
    height: positiveDimension(input.height),
    altText: input.altText,
    credit: {
      creditLine: input.creditLine,
      licenseLabel: input.licenseLabel,
      licenseUrl: null,
      rightsExpressionId: null,
      sourcePath: mediaEntity.sourcePath,
    },
    sourcePath: mediaEntity.sourcePath,
  };
}

export function proposalMetadata({
  mediaEntity,
  subjectEntityId,
  input,
  waveId,
  dropId,
  publicationRecordId,
  canOpenWaveContext,
}: {
  readonly mediaEntity: MuseumPublicEntityRecord;
  readonly subjectEntityId: string;
  readonly input: MuseumMediaProjectionInput;
  readonly waveId: string;
  readonly dropId: string;
  readonly publicationRecordId: string;
  readonly canOpenWaveContext: boolean;
}): MuseumMediaMetadata {
  const context: MuseumMediaMetadataContext = {
    kind: "wave_proposal",
    waveId,
    dropId,
    publicationRecordId,
    acquisitionId: MUSEUM_WAVE_CURATED_ACQUISITION_ID,
    sourcePath: mediaEntity.sourcePath,
    openHref: canOpenWaveContext
      ? buildMuseumSignedWaveStormDropUrl(waveId, dropId)
      : null,
  };
  return {
    ...metadataOnlyMedia(
      mediaEntity,
      subjectEntityId,
      input,
      "historical_wave_proposal_presentation"
    ),
    context,
  };
}

function positiveDimension(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function isMuseumMediaMetadataRole(
  value: string
): value is MuseumMediaMetadata["role"] {
  return (
    value === "museum_retained_preservation_object" ||
    value === "token_linked_source_media" ||
    value === "museum_generated_public_derivative" ||
    value === "museum_authored_public_graphic" ||
    value === "historical_wave_proposal_presentation"
  );
}
