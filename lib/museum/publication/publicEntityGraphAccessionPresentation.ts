import type { MuseumExternalProposalPresentationVariant } from "./entities";
import type { MuseumSourceDocument } from "./types";
import { isRecord } from "./publicEntityGraphPrimitives";

const CDN_BASE = "https://d3lqz0a4bldqgf.cloudfront.net";
const TRANSFORM_PATH = "webp-v2-q82-m6-fixed-icc";
const WIDTHS = [640, 1280, 2400] as const;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const LEGACY_MAGNUM_PRESENTATION_PATH =
  "records/accessions/6529NM.2026.002/public/presentation-manifest.json";

export function accessionPresentationVariants(input: {
  readonly workId: string;
  readonly mediaId: string;
  readonly sourceUrl: string;
  readonly sourceSha256: string;
  readonly sourceByteSize: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly sourceAltText: string;
  readonly sourceDocuments: ReadonlyMap<string, MuseumSourceDocument>;
  readonly catalogMediaAssetPaths: ReadonlySet<string>;
}): readonly MuseumExternalProposalPresentationVariant[] {
  const candidates = [...input.sourceDocuments.values()].filter((document) =>
    /^records\/accessions\/6529NM\.[0-9]{4}\.[0-9]{3}\/public\/presentation-manifest\.json$/u.test(
      document.path
    )
  );
  for (const document of candidates) {
    const variants = variantsFromManifest(document, input);
    if (variants !== null) return variants;
  }
  return [];
}

function variantsFromManifest(
  document: MuseumSourceDocument,
  input: Parameters<typeof accessionPresentationVariants>[0]
): readonly MuseumExternalProposalPresentationVariant[] | null {
  if (document.mediaType !== "application/json") {
    throw new Error("public_entity_graph_accession_presentation_manifest");
  }
  let root: unknown;
  try {
    root = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_accession_presentation_manifest");
  }
  if (!isRecord(root) || !Array.isArray(root["items"])) {
    throw new Error("public_entity_graph_accession_presentation_manifest");
  }
  const matches = root["items"].filter(
    (candidate): candidate is Record<string, unknown> =>
      isRecord(candidate) &&
      candidate["work_entity_id"] === input.workId &&
      candidate["media_reference_entity_id"] === input.mediaId
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error("public_entity_graph_accession_presentation_join");
  }
  const accessionPathMatch =
    /^records\/accessions\/([^/]+)\/public\/presentation-manifest\.json$/u.exec(
      document.path
    );
  const accessionId = root["accession_lot_id"];
  if (
    root["record_type"] !== "ACCESSION_MEDIA_PRESENTATION" ||
    (root["schema_profile"] !== "6529NM_ACCESSION_MEDIA_PRESENTATION_V1" &&
      root["schema_profile"] !== "6529NM_ACCESSION_MEDIA_PRESENTATION_V2") ||
    typeof accessionId !== "string" ||
    !/^6529NM\.[0-9]{4}\.[0-9]{3}$/u.test(accessionId) ||
    accessionPathMatch?.[1] !== accessionId ||
    !isRecord(root["delivery"]) ||
    root["delivery"]["status"] !== "approved_for_contextual_museum_display" ||
    root["delivery"]["cdn_base_url"] !== CDN_BASE ||
    root["delivery"]["cache_control"] !== CACHE_CONTROL ||
    (root["schema_profile"] === "6529NM_ACCESSION_MEDIA_PRESENTATION_V1" &&
      document.path !== LEGACY_MAGNUM_PRESENTATION_PATH) ||
    (root["schema_profile"] === "6529NM_ACCESSION_MEDIA_PRESENTATION_V2" &&
      (!isRecord(root["record_control"]) ||
        root["record_control"]["record_status"] !== "reviewed" ||
        !isRecord(root["record_control"]["review"]) ||
        root["record_control"]["review"]["role"] !== "reviewer" ||
        root["record_control"]["review"]["outcome"] !== "approved" ||
        typeof root["record_control"]["review"]["reviewed_commit"] !==
          "string"))
  ) {
    throw new Error("public_entity_graph_accession_presentation_manifest");
  }
  const item = matches[0]!;
  const source = item["source"];
  const presentation = item["presentation"];
  if (
    !isRecord(source) ||
    source["url"] !== input.sourceUrl ||
    source["sha256"] !== input.sourceSha256 ||
    source["byte_size"] !== input.sourceByteSize ||
    source["pixel_width"] !== input.sourceWidth ||
    source["pixel_height"] !== input.sourceHeight ||
    !isRecord(presentation) ||
    presentation["alt_text"] !== input.sourceAltText ||
    !Array.isArray(presentation["derivatives"]) ||
    presentation["derivatives"].length !== WIDTHS.length
  ) {
    throw new Error("public_entity_graph_accession_presentation_source");
  }
  const derivativeRecords = presentation["derivatives"] as readonly unknown[];
  const sourceDigest = input.sourceSha256.replace(/^sha256:/u, "");
  return WIDTHS.map((width, index) => {
    const derivative = derivativeRecords[index];
    if (!isRecord(derivative)) {
      throw new Error("public_entity_graph_accession_presentation_variant");
    }
    const repositoryPath = `media/accessions/${accessionId}/${input.workId}/${sourceDigest}/${TRANSFORM_PATH}/${width}.webp`;
    const url = `${CDN_BASE}/museum/accessions/${accessionId}/${input.workId}/${sourceDigest}/${TRANSFORM_PATH}/${width}.webp`;
    const height = derivative["height"];
    const byteSize = derivative["byte_size"];
    const sha256 = derivative["sha256"];
    if (
      derivative["width"] !== width ||
      typeof height !== "number" ||
      !Number.isSafeInteger(height) ||
      height <= 0 ||
      typeof byteSize !== "number" ||
      !Number.isSafeInteger(byteSize) ||
      byteSize <= 0 ||
      typeof sha256 !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(sha256) ||
      derivative["mime_type"] !== "image/webp" ||
      derivative["repository_path"] !== repositoryPath ||
      derivative["url"] !== url ||
      derivative["cache_control"] !== CACHE_CONTROL ||
      !input.catalogMediaAssetPaths.has(repositoryPath)
    ) {
      throw new Error("public_entity_graph_accession_presentation_variant");
    }
    return {
      url,
      width,
      height,
      byteSize,
      sha256: sha256 as `sha256:${string}`,
    };
  });
}
