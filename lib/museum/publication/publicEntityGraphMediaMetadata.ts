import { buildMuseumSignedWaveStormDropUrl } from "./entities";
import type {
  MuseumMediaMetadata,
  MuseumMediaMetadataContext,
  MuseumPublicEntityRecord,
  MuseumRightsCredit,
} from "./types";
import { isRecord } from "./publicEntityGraphPrimitives";

interface MuseumMediaProjectionInput {
  readonly width: unknown;
  readonly height: unknown;
  readonly altText: string | null;
  readonly mediaType: string;
  readonly creditLine: string;
  readonly licenseLabel: string | null;
}

const MUSEUM_WAVE_CURATED_ACQUISITION_ID = "6529NM-CA-2026-003" as const;

export function mediaRightsCredit(
  creditLine: string,
  licenseLabel: string | null,
  sourcePath: string
): MuseumRightsCredit {
  return {
    creditLine,
    licenseLabel,
    licenseUrl: null,
    rightsExpressionId: null,
    sourcePath,
  };
}

export function mediaLicenseLabel(
  media: Readonly<Record<string, unknown>>
): string | null {
  const rights = media["rights"];
  if (!isRecord(rights)) return null;
  for (const key of ["license_label", "licenseLabel"]) {
    const label = rights[key];
    if (typeof label === "string" && label.trim().length > 0) {
      return label.trim();
    }
  }
  const notes = rights["notes"];
  if (typeof notes !== "string") return null;
  const match = /^Source rights label:\s*(.+?)(?:\.\s+Rights state\b|$)/u.exec(
    notes
  );
  return match?.[1] === undefined || match[1].trim().length === 0
    ? null
    : match[1].trim();
}

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
    sourceRecordIds: mediaEntity.sourceRecordIds,
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
