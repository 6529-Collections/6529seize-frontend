import { compareLocalized } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { cache } from "react";
import { getMuseumCorpus } from "./source";
import type {
  MuseumAccessionLot,
  MuseumApprovedCollection,
  MuseumDocument,
  MuseumGovernanceDecision,
  MuseumObjectRecord,
  MuseumProgram,
  MuseumProgramMedia,
  MuseumSelectedWork,
  MuseumTextDocument,
  MuseumView,
} from "./types";
import { KEYS_AND_GATES_PROGRAM_ID } from "./constants";

interface JsonObject {
  readonly [key: string]: unknown;
  readonly records?: unknown;
  readonly decision_id?: unknown;
  readonly serial_no?: unknown;
  readonly title?: unknown;
  readonly decision_class?: unknown;
  readonly observed_wave_status?: unknown;
  readonly governance_effect?: unknown;
  readonly disposition?: unknown;
  readonly rating?: unknown;
  readonly raters_count?: unknown;
  readonly created_at?: unknown;
  readonly source_url?: unknown;
  readonly collections?: unknown;
  readonly approval_id?: unknown;
  readonly preferred_name?: unknown;
  readonly scope_definition?: unknown;
  readonly category?: unknown;
  readonly status?: unknown;
  readonly exclusions?: unknown;
  readonly works?: unknown;
  readonly record_id?: unknown;
  readonly outcome_record?: unknown;
  readonly artist?: unknown;
  readonly submission_drop_id?: unknown;
  readonly winner_place?: unknown;
  readonly vote_total?: unknown;
  readonly voter_count?: unknown;
  readonly program_id?: unknown;
  readonly curatorial_frame?: unknown;
  readonly subtitle?: unknown;
  readonly status_as_of?: unknown;
  readonly rules?: unknown;
  readonly non_claims?: unknown;
  readonly lots?: unknown;
  readonly custody?: unknown;
  readonly receipt_event?: unknown;
  readonly accession_lot_id?: unknown;
  readonly preferred_title?: unknown;
  readonly object_count?: unknown;
  readonly donation_status?: unknown;
  readonly accession_status?: unknown;
  readonly donor_public_credit?: unknown;
  readonly ens?: unknown;
  readonly address?: unknown;
  readonly transaction_hash?: unknown;
  readonly block_number?: unknown;
  readonly block_time?: unknown;
  readonly evidence_refs?: unknown;
  readonly completion_limits?: unknown;
  readonly record_type?: unknown;
  readonly object_id?: unknown;
  readonly handle?: unknown;
  readonly payload?: unknown;
  readonly current_state?: unknown;
  readonly record_status?: unknown;
  readonly claims?: unknown;
  readonly artist_statement?: unknown;
  readonly museum_interpretation?: unknown;
  readonly medium?: unknown;
  readonly text?: unknown;
  readonly classification?: unknown;
  readonly record_scope?: unknown;
  readonly media?: unknown;
  readonly mime_type?: unknown;
  readonly url?: unknown;
  readonly retrieval_status?: unknown;
  readonly selection_evidence?: unknown;
  readonly rights_and_consent?: unknown;
  readonly as_of?: unknown;
  readonly decision_at?: unknown;
  readonly wave_url?: unknown;
  readonly rights_effective_status?: unknown;
  readonly items?: unknown;
  readonly source?: unknown;
  readonly presentation?: unknown;
  readonly alt_text?: unknown;
  readonly alt_text_status?: unknown;
  readonly derivatives?: unknown;
  readonly width?: unknown;
  readonly height?: unknown;
  readonly sha256?: unknown;
  readonly byte_size?: unknown;
  readonly pixel_width?: unknown;
  readonly pixel_height?: unknown;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  const result = stringValue(value).trim();
  return result.length > 0 ? result : null;
}

const PROGRAM_MEDIA_HOSTS = new Set(["d3lqz0a4bldqgf.cloudfront.net"]);
const PROGRAM_MEDIA_MANIFEST_PATH = `records/programs/${KEYS_AND_GATES_PROGRAM_ID}/public/presentation-manifest.json`;

function approvedProgramMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      !PROGRAM_MEDIA_HOSTS.has(parsed.hostname) ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0 ||
      parsed.pathname === "/"
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function approvedProgramDerivativeUrl(value: unknown): string | null {
  const url = approvedProgramMediaUrl(value);
  if (url === null) {
    return null;
  }
  return new URL(url).pathname.startsWith("/museum/programs/") ? url : null;
}

function approvedProgramWaveUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "6529.io" ||
      parsed.username.length > 0 ||
      parsed.password.length > 0 ||
      parsed.port.length > 0 ||
      !parsed.pathname.startsWith("/waves/")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function resolveProgramOutcomePath(
  programDirectory: string,
  outcomeReference: string | null
): string | null {
  if (outcomeReference === null) {
    return null;
  }
  return outcomeReference.startsWith("records/")
    ? outcomeReference
    : `${programDirectory}/${outcomeReference}`;
}

function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return isObject(value) ? stringValue(value.text) : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function jsonObject(document: MuseumDocument | undefined): JsonObject | null {
  if (document?.contentType !== "json") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(document.text);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function legacyProgramMedia(
  outcome: JsonObject | null,
  title: string,
  artist: string
): MuseumProgramMedia | null {
  const media = Array.isArray(outcome?.media)
    ? outcome.media.find(isObject)
    : undefined;
  const sourceUrl = approvedProgramMediaUrl(media?.url);
  if (sourceUrl === null) {
    return null;
  }
  return {
    sourceUrl,
    sourceMimeType: stringValue(media?.mime_type),
    sourceSha256: nullableString(media?.sha256),
    sourceByteSize: null,
    sourceWidth: null,
    sourceHeight: null,
    altText: t(DEFAULT_LOCALE, "museum.network.objects.mediaAltFallback", {
      title,
      artist,
    }),
    altTextStatus: "identification_only_fallback",
    variants: [],
  };
}

function normalizeProgramMediaManifestItem(item: JsonObject): {
  readonly recordId: string;
  readonly media: MuseumProgramMedia;
} | null {
  const recordId = stringValue(item.record_id);
  const source = isObject(item.source) ? item.source : null;
  const presentation = isObject(item.presentation) ? item.presentation : null;
  const sourceUrl = approvedProgramMediaUrl(source?.url);
  const altText = nullableString(presentation?.alt_text);
  const derivatives = Array.isArray(presentation?.derivatives)
    ? presentation.derivatives
        .filter(isObject)
        .flatMap((derivative) => {
          const url = approvedProgramDerivativeUrl(derivative.url);
          const width = positiveInteger(derivative.width);
          const height = positiveInteger(derivative.height);
          const sha256 = nullableString(derivative.sha256);
          const byteSize = positiveInteger(derivative.byte_size);
          if (
            url === null ||
            width === null ||
            height === null ||
            sha256 === null ||
            byteSize === null ||
            derivative.mime_type !== "image/webp"
          ) {
            return [];
          }
          return [
            {
              url,
              width,
              height,
              mimeType: "image/webp" as const,
              sha256,
              byteSize,
            },
          ];
        })
        .sort((left, right) => left.width - right.width)
    : [];

  if (
    recordId.length === 0 ||
    source === null ||
    presentation === null ||
    sourceUrl === null ||
    altText === null ||
    derivatives.length === 0 ||
    new Set(derivatives.map((derivative) => derivative.width)).size !==
      derivatives.length
  ) {
    return null;
  }

  return {
    recordId,
    media: {
      sourceUrl,
      sourceMimeType: stringValue(source.mime_type),
      sourceSha256: nullableString(source.sha256),
      sourceByteSize: positiveInteger(source.byte_size),
      sourceWidth: positiveInteger(source.pixel_width),
      sourceHeight: positiveInteger(source.pixel_height),
      altText,
      altTextStatus: stringValue(presentation.alt_text_status),
      variants: derivatives,
    },
  };
}

function programMediaIndex(
  documents: Readonly<Record<string, MuseumDocument>>
): ReadonlyMap<string, MuseumProgramMedia> {
  const root = jsonObject(documents[PROGRAM_MEDIA_MANIFEST_PATH]);
  const items = root?.items;
  const result = new Map<string, MuseumProgramMedia>();
  const seenRecordIds = new Set<string>();

  for (const item of Array.isArray(items) ? items : []) {
    if (!isObject(item)) {
      continue;
    }
    const recordId = stringValue(item.record_id);
    if (recordId.length > 0 && seenRecordIds.has(recordId)) {
      result.delete(recordId);
      continue;
    }
    if (recordId.length > 0) {
      seenRecordIds.add(recordId);
    }
    const normalized = normalizeProgramMediaManifestItem(item);
    if (normalized !== null) {
      result.set(normalized.recordId, normalized.media);
    }
  }

  return result;
}

function firstMarkdownParagraph(markdown: string): string {
  const withoutFrontMatter = markdown.replace(/^---[\s\S]*?---\s*/u, "");
  const paragraph = withoutFrontMatter
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .find((part) => part.length > 0 && !part.startsWith("#"));

  return (paragraph ?? "").replace(/[`*_]/gu, "").replace(/\s+/gu, " ").trim();
}

function markdownTitle(path: string, markdown: string): string {
  const heading = markdown.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  if (heading !== undefined && heading.length > 0) {
    return heading.replace(/[`*_]/gu, "");
  }

  const fileName =
    path
      .split("/")
      .at(-1)
      ?.replace(/\.[^.]+$/u, "") ?? path;
  return fileName
    .split(/[-_]/u)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function markdownDocument(
  documents: Readonly<Record<string, MuseumDocument>>,
  path: string
): MuseumTextDocument | null {
  const document = documents[path];
  if (document?.contentType !== "markdown") {
    return null;
  }

  return {
    path,
    title: markdownTitle(path, document.text),
    excerpt: firstMarkdownParagraph(document.text),
    markdown: document.text,
  };
}

function governanceDecisions(
  documents: Readonly<Record<string, MuseumDocument>>
): MuseumGovernanceDecision[] {
  const path = "records/governance/decisions.json";
  const root = jsonObject(documents[path]);
  const records = root?.records;

  return (Array.isArray(records) ? records : [])
    .filter(isObject)
    .map((record) => ({
      decisionId: stringValue(record.decision_id),
      serialNo: numberValue(record.serial_no),
      title: stringValue(record.title, "Untitled decision"),
      decisionClass: stringValue(record.decision_class, "Museum governance"),
      observedWaveStatus: stringValue(record.observed_wave_status, "unknown"),
      governanceEffect: stringValue(record.governance_effect, "unknown"),
      disposition: nullableString(record.disposition),
      rating: numberValue(record.rating),
      ratersCount: numberValue(record.raters_count),
      createdAt: nullableString(record.created_at),
      sourceUrl: nullableString(record.source_url),
      sourcePath: path,
    }))
    .filter((record) => record.decisionId.length > 0);
}

function approvedCollections(
  documents: Readonly<Record<string, MuseumDocument>>
): MuseumApprovedCollection[] {
  const path = "records/collections/approved-collections.json";
  const root = jsonObject(documents[path]);
  const collections = root?.collections;

  return (Array.isArray(collections) ? collections : [])
    .filter(isObject)
    .map((collection) => ({
      approvalId: stringValue(collection.approval_id),
      preferredName: stringValue(
        collection.preferred_name,
        "Unnamed collection"
      ),
      scopeDefinition: stringValue(collection.scope_definition),
      category: stringValue(collection.category),
      status: stringValue(collection.status),
      decisionId: stringValue(collection.decision_id),
      exclusions: stringArray(collection.exclusions),
      sourcePath: path,
    }))
    .filter((collection) => collection.approvalId.length > 0);
}

function selectedWorks(
  documents: Readonly<Record<string, MuseumDocument>>,
  path: string,
  mediaIndex: ReadonlyMap<string, MuseumProgramMedia>
): MuseumSelectedWork[] {
  const root = jsonObject(documents[path]);
  const works = root?.works;
  const programDirectory = path.slice(0, path.lastIndexOf("/"));

  return (Array.isArray(works) ? works : [])
    .filter(isObject)
    .map((work) => {
      const outcomeReference = nullableString(work.outcome_record);
      const outcomePath = resolveProgramOutcomePath(
        programDirectory,
        outcomeReference
      );
      const outcome =
        outcomePath === null ? null : jsonObject(documents[outcomePath]);
      const recordId = stringValue(work.record_id);
      const title = stringValue(work.title, "Untitled work");
      const artist = stringValue(work.artist, "Unknown artist");

      return {
        recordId,
        outcomePath,
        status: stringValue(work.status, "unknown"),
        artist,
        title,
        submissionDropId: nullableString(work.submission_drop_id),
        winnerPlace: numberValue(work.winner_place),
        voteTotal: numberValue(work.vote_total),
        voterCount: numberValue(work.voter_count),
        media:
          mediaIndex.get(recordId) ??
          legacyProgramMedia(outcome, title, artist),
      };
    })
    .filter((work) => work.recordId.length > 0);
}

function programRules(value: unknown): string[] {
  if (!isObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, entry]) => {
    if (typeof entry === "string") {
      return [`${key.replace(/_/gu, " ")}: ${entry}`];
    }
    if (Array.isArray(entry)) {
      return entry.filter((item): item is string => typeof item === "string");
    }
    return [];
  });
}

function programs(
  documents: Readonly<Record<string, MuseumDocument>>,
  mediaIndex: ReadonlyMap<string, MuseumProgramMedia>
): MuseumProgram[] {
  return Object.entries(documents)
    .filter(([path]) => /^records\/programs\/[^/]+\/program\.json$/u.test(path))
    .flatMap(([path, document]) => {
      const root = jsonObject(document);
      if (root === null) {
        return [];
      }

      const programId = stringValue(root.program_id);
      if (programId.length === 0) {
        return [];
      }

      const selectedPath = path.replace(
        /program\.json$/u,
        "selected-works.json"
      );
      const frame = isObject(root.curatorial_frame)
        ? stringValue(root.curatorial_frame["premise"])
        : "";

      return [
        {
          programId,
          title: stringValue(root.title, programId),
          subtitle: stringValue(root.subtitle),
          status: stringValue(root.status, "unknown"),
          statusAsOf: nullableString(root.status_as_of),
          curatorialFrame: frame,
          rules: programRules(root.rules),
          nonClaims: stringArray(root.non_claims),
          selectedWorks: selectedWorks(documents, selectedPath, mediaIndex),
          sourcePath: path,
          selectedWorksPath:
            documents[selectedPath] === undefined ? null : selectedPath,
        },
      ];
    });
}

function accessions(
  documents: Readonly<Record<string, MuseumDocument>>
): MuseumAccessionLot[] {
  const path = "records/accessions/register.json";
  const root = jsonObject(documents[path]);
  const lots = root?.lots;

  return (Array.isArray(lots) ? lots : [])
    .filter(isObject)
    .map((lot) => {
      const custody = isObject(lot.custody) ? lot.custody : {};
      const receipt = isObject(lot.receipt_event) ? lot.receipt_event : {};

      return {
        accessionLotId: stringValue(lot.accession_lot_id),
        preferredTitle: stringValue(
          lot.preferred_title,
          "Untitled accession lot"
        ),
        objectCount: numberValue(lot.object_count),
        donationStatus: stringValue(lot.donation_status, "unknown"),
        accessionStatus: stringValue(lot.accession_status, "unknown"),
        donorPublicCredit: nullableString(lot.donor_public_credit),
        custodyEns: nullableString(custody.ens),
        custodyAddress: nullableString(custody.address),
        receiptTransactionHash: nullableString(receipt.transaction_hash),
        receiptBlockNumber: numberValue(receipt.block_number),
        receiptBlockTime: nullableString(receipt.block_time),
        evidenceRefs: stringArray(lot.evidence_refs),
        completionLimits: stringArray(lot.completion_limits),
        sourcePath: path,
      };
    })
    .filter((lot) => lot.accessionLotId.length > 0);
}

function objectRecords(
  documents: Readonly<Record<string, MuseumDocument>>,
  mediaIndex: ReadonlyMap<string, MuseumProgramMedia>
): MuseumObjectRecord[] {
  return Object.entries(documents)
    .filter(
      ([path, document]) =>
        path.endsWith(".json") && document.contentType === "json"
    )
    .flatMap(([path, document]) => {
      const record = jsonObject(document);
      if (record === null) {
        return [];
      }

      const root = isObject(record.payload) ? record.payload : record;

      const recordType = stringValue(root.record_type).toLocaleLowerCase();
      const isObjectRecord =
        recordType === "object" ||
        recordType === "object_record" ||
        recordType === "program_outcome" ||
        /^records\/accessions\/[^/]+\/objects\/[^/]+\.json$/u.test(path);
      if (!isObjectRecord) {
        return [];
      }

      const artistValue = root.artist;
      const artist = isObject(artistValue)
        ? (nullableString(artistValue.preferred_name) ??
          nullableString(artistValue.handle) ??
          "")
        : stringValue(artistValue);
      const claims = isObject(root.claims) ? root.claims : {};
      const selectionEvidence = isObject(root.selection_evidence)
        ? root.selection_evidence
        : {};
      const rightsAndConsent = isObject(root.rights_and_consent)
        ? root.rights_and_consent
        : {};
      const objectId = stringValue(root.object_id, stringValue(root.record_id));
      if (objectId.length === 0) {
        return [];
      }
      const title = stringValue(root.title, objectId);
      const resolvedArtist = artist || "Unknown artist";

      return [
        {
          objectId,
          accessionLotId: nullableString(root.accession_lot_id),
          title,
          artist: resolvedArtist,
          artistStatement:
            nullableString(textValue(root.artist_statement)) ??
            nullableString(textValue(claims.artist_statement)),
          classification: stringValue(
            root.classification,
            stringValue(root.medium)
          ),
          status: stringValue(
            root.status,
            stringValue(
              root.current_state,
              stringValue(root.record_status, "unknown")
            )
          ),
          statusAsOf: nullableString(root.as_of),
          programId: nullableString(root.program_id),
          media:
            mediaIndex.get(objectId) ??
            legacyProgramMedia(root, title, resolvedArtist),
          selectionPlace: numberValue(selectionEvidence.winner_place),
          selectionDate: nullableString(selectionEvidence.decision_at),
          selectionSourceUrl: approvedProgramWaveUrl(
            selectionEvidence.wave_url
          ),
          rightsStatus: nullableString(
            rightsAndConsent.rights_effective_status
          ),
          scope: stringValue(
            root.record_scope,
            stringValue(claims.museum_interpretation)
          ),
          sourcePath: path,
          record,
        },
      ];
    });
}

export function normalizeMuseumCorpus(
  corpus: Awaited<ReturnType<typeof getMuseumCorpus>>
): MuseumView {
  const documents = corpus.documents;
  const mediaIndex = programMediaIndex(documents);
  const mission = markdownDocument(
    documents,
    "policies/founding-and-operating-principles.md"
  );
  const policies = Object.keys(documents)
    .filter((path) => path.startsWith("policies/") && path.endsWith(".md"))
    .map((path) => markdownDocument(documents, path))
    .filter((document): document is MuseumTextDocument => document !== null)
    .sort((left, right) =>
      compareLocalized(DEFAULT_LOCALE, left.title, right.title)
    );
  const methodology = Object.keys(documents)
    .filter((path) => path.startsWith("docs/") && path.endsWith(".md"))
    .map((path) => markdownDocument(documents, path))
    .filter((document): document is MuseumTextDocument => document !== null)
    .sort((left, right) =>
      compareLocalized(DEFAULT_LOCALE, left.title, right.title)
    );

  return {
    sourceState: corpus.sourceState,
    release: corpus.release,
    mission,
    policies,
    methodology,
    governance: governanceDecisions(documents),
    approvedCollections: approvedCollections(documents),
    programs: programs(documents, mediaIndex),
    accessions: accessions(documents),
    objects: objectRecords(documents, mediaIndex),
    errorCode: corpus.errorCode,
  };
}

/**
 * Resolve reviewed responsive program media for a public work's explicit
 * source-record identifiers. Metadata-only public media never carries a
 * visitor image URL, so the fallback is deliberately limited to normalized
 * program media with at least one reviewed derivative variant.
 */
export function findReviewedProgramMedia(
  view: MuseumView | null | undefined,
  sourceRecordIds: readonly string[]
): MuseumProgramMedia | null {
  const identifiers = new Set(
    sourceRecordIds.map((identifier) => identifier.trim()).filter(Boolean)
  );
  if (identifiers.size === 0 || view === null || view === undefined) {
    return null;
  }

  const objectMedia = view.objects.find(
    (object) =>
      identifiers.has(object.objectId) &&
      object.media !== null &&
      object.media.variants.length > 0
  )?.media;
  if (objectMedia !== undefined && objectMedia !== null) {
    return objectMedia;
  }

  for (const program of view.programs) {
    const selectedWork = program.selectedWorks.find(
      (work) =>
        identifiers.has(work.recordId) &&
        work.media !== null &&
        work.media.variants.length > 0
    );
    if (selectedWork?.media !== undefined && selectedWork.media !== null) {
      return selectedWork.media;
    }
  }

  return null;
}

export const getMuseumView = cache(async (): Promise<MuseumView> => {
  return normalizeMuseumCorpus(await getMuseumCorpus());
});
