import type { Hex } from "viem";
import { cidToText } from "./cid";
import {
  PUBLIC_DOCUMENT_SUBJECT_PREFIX,
  RFC8785_JCS_LITERAL,
} from "./constants";
import { mapWithConcurrency, type CidFetcher } from "./ipfs";
import type {
  RegistryRelease,
  RegistrySnapshot,
  RegistrySubject,
  RegistryVersion,
} from "./registry";
import {
  keccakUtf8,
  verifyOnchainContent,
  type OnchainVerificationStatus,
} from "./verify";

const CONTENT_CONCURRENCY = 24;
const decoder = new TextDecoder("utf-8", { fatal: true });

export type OnchainRecordState =
  | "verified"
  | "mismatch"
  | "unavailable"
  | "unsupported"
  | "deleted";

export type OnchainRecordContent =
  | { readonly kind: "json"; readonly payload: Record<string, unknown> }
  | { readonly kind: "markdown"; readonly text: string };

export interface OnchainMuseumRecord {
  readonly subjectId: Hex;
  readonly recordTypeId: Hex;
  readonly recordType: string | null;
  readonly schemaLiteral: string | null;
  readonly canonicalizationLiteral: string | null;
  readonly versionCount: number;
  readonly subjectDeleted: boolean;
  readonly version: RegistryVersion;
  readonly cidText: string | null;
  readonly state: OnchainRecordState;
  readonly check: OnchainVerificationStatus | null;
  readonly computedDigest: Hex | null;
  readonly cidMatches: boolean | null;
  readonly servedBy: string | null;
  /** Present only when `state` is `verified`. */
  readonly content: OnchainRecordContent | null;
  /** The repository path of a release 2 document, from the verified catalog. */
  readonly documentPath: string | null;
  readonly label: string;
}

export interface OnchainCatalogState {
  readonly state: "verified" | "mismatch" | "unavailable";
  readonly cidText: string | null;
  readonly servedBy: string | null;
  readonly catalogId: string | null;
  readonly createdAt: string | null;
  /** The release IDs whose manifest hash the catalog matched. */
  readonly releaseIds: readonly number[];
}

export interface OnchainMuseumSnapshot {
  readonly loadedAt: string;
  readonly loadMs: number;
  readonly registry: Omit<RegistrySnapshot, "subjects">;
  readonly catalog: OnchainCatalogState;
  readonly records: readonly OnchainMuseumRecord[];
  readonly counts: Readonly<Record<OnchainRecordState, number>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bytesToText(bytes: Uint8Array): string | null {
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

/** Maps release 2 subject IDs to the repository paths the catalog lists. */
function documentPathsBySubject(payload: unknown): Map<string, string> {
  const paths = new Map<string, string>();
  if (!isRecord(payload)) return paths;
  const documents = payload["assembly_documents"];
  if (!Array.isArray(documents)) return paths;
  for (const document of documents) {
    if (!isRecord(document)) continue;
    const path = document["path"];
    if (typeof path !== "string" || !path.endsWith(".md")) continue;
    paths.set(
      keccakUtf8(`${PUBLIC_DOCUMENT_SUBJECT_PREFIX}${path}`).toLowerCase(),
      path
    );
  }
  return paths;
}

async function loadCatalog(
  releases: readonly RegistryRelease[],
  canonicalizations: Readonly<Record<Hex, string>>,
  fetchCid: CidFetcher
): Promise<{ state: OnchainCatalogState; payload: unknown }> {
  const withManifest = releases.filter(
    (release) => release.manifestCid !== "0x"
  );
  const first = withManifest[0];
  if (first === undefined) {
    return {
      state: {
        state: "unavailable",
        cidText: null,
        servedBy: null,
        catalogId: null,
        createdAt: null,
        releaseIds: [],
      },
      payload: null,
    };
  }
  const literal =
    canonicalizations[first.manifestHash.canonicalizationId] ?? "";
  const expectation = {
    contentHash: first.manifestHash,
    canonicalizationLiteral: literal,
    cid: first.manifestCid,
  };
  const fetched = await fetchCid(
    first.manifestCid,
    (bytes) =>
      verifyOnchainContent(expectation, { kind: "bytes", bytes }).status ===
      "verified"
  );
  const cidText = cidToText(first.manifestCid);
  if (!fetched?.accepted) {
    return {
      state: {
        state: fetched === null ? "unavailable" : "mismatch",
        cidText,
        servedBy: fetched?.host ?? null,
        catalogId: null,
        createdAt: null,
        releaseIds: [],
      },
      payload: null,
    };
  }
  const payload: unknown = JSON.parse(bytesToText(fetched.bytes) ?? "null");
  const releaseIds = withManifest
    .filter(
      (release) =>
        release.manifestHash.digest.toLowerCase() ===
          first.manifestHash.digest.toLowerCase() &&
        release.manifestHash.algorithm === first.manifestHash.algorithm &&
        release.manifestCid.toLowerCase() === first.manifestCid.toLowerCase()
    )
    .map((release) => release.releaseId);
  return {
    state: {
      state: "verified",
      cidText,
      servedBy: fetched.host,
      catalogId:
        isRecord(payload) && typeof payload["catalog_id"] === "string"
          ? payload["catalog_id"]
          : null,
      createdAt:
        isRecord(payload) && typeof payload["created_at"] === "string"
          ? payload["created_at"]
          : null,
      releaseIds,
    },
    payload,
  };
}

function recordLabel(
  version: RegistryVersion,
  content: OnchainRecordContent | null
): string {
  if (version.label.trim() !== "") return version.label;
  if (content?.kind === "json") {
    for (const key of [
      "preferred_label",
      "title",
      "record_id",
      "relation_id",
    ]) {
      const value = content.payload[key];
      if (typeof value === "string" && value.trim() !== "") return value;
    }
  }
  return version.cid === "0x" ? "" : cidToText(version.cid);
}

async function loadRecord(
  subject: RegistrySubject,
  registry: RegistrySnapshot,
  documentPaths: Map<string, string>,
  fetchCid: CidFetcher
): Promise<OnchainMuseumRecord> {
  const { version } = subject;
  const recordType = registry.recordTypes[subject.recordType] ?? null;
  const schemaLiteral = registry.schemas[version.schemaId]?.literal ?? null;
  const canonicalizationLiteral =
    registry.canonicalizations[version.contentHash.canonicalizationId] ?? null;
  const base = {
    subjectId: subject.subjectId,
    recordTypeId: subject.recordType,
    recordType,
    schemaLiteral,
    canonicalizationLiteral,
    versionCount: subject.versionCount,
    subjectDeleted: subject.deleted,
    version,
    cidText: version.cid === "0x" ? null : cidToText(version.cid),
    documentPath: documentPaths.get(subject.subjectId.toLowerCase()) ?? null,
  };
  const outcome = (
    state: OnchainRecordState,
    rest: Partial<OnchainMuseumRecord> = {}
  ): OnchainMuseumRecord => {
    const content = rest.content ?? null;
    return {
      ...base,
      state,
      check: null,
      computedDigest: null,
      cidMatches: null,
      servedBy: null,
      ...rest,
      content,
      label: recordLabel(version, content),
    };
  };

  if (version.deleted || version.cid === "0x") return outcome("deleted");
  if (canonicalizationLiteral === null) return outcome("unsupported");

  const expectation = {
    contentHash: version.contentHash,
    canonicalizationLiteral,
    cid: version.cid,
  };
  const fetched = await fetchCid(
    version.cid,
    (bytes) =>
      verifyOnchainContent(expectation, { kind: "bytes", bytes }).status ===
      "verified"
  );
  if (fetched === null) return outcome("unavailable");
  const result = verifyOnchainContent(expectation, {
    kind: "bytes",
    bytes: fetched.bytes,
  });
  const checked = {
    check: result.status,
    computedDigest: result.computedDigest,
    cidMatches: result.cidMatches,
    servedBy: fetched.host,
  };
  if (result.status === "unsupported") return outcome("unsupported", checked);
  if (result.status !== "verified") return outcome("mismatch", checked);

  const text = bytesToText(fetched.bytes);
  if (text === null) return outcome("mismatch", checked);
  if (canonicalizationLiteral === RFC8785_JCS_LITERAL) {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload)) return outcome("unsupported", checked);
    return outcome("verified", {
      ...checked,
      content: { kind: "json", payload },
    });
  }
  return outcome("verified", {
    ...checked,
    content: { kind: "markdown", text },
  });
}

/**
 * Builds the Museum from a registry snapshot: the publication catalog by the
 * releases' manifest CID, then every subject's current version by its CID.
 * Content is attached to a record only after its bytes hash to the digest
 * read from the chain.
 */
export async function buildOnchainMuseum(
  registry: RegistrySnapshot,
  fetchCid: CidFetcher,
  startedAt: number = Date.now()
): Promise<OnchainMuseumSnapshot> {
  const catalog = await loadCatalog(
    registry.releases,
    registry.canonicalizations,
    fetchCid
  );
  const documentPaths = documentPathsBySubject(catalog.payload);
  const records = await mapWithConcurrency(
    registry.subjects,
    CONTENT_CONCURRENCY,
    (subject) => loadRecord(subject, registry, documentPaths, fetchCid)
  );
  const counts: Record<OnchainRecordState, number> = {
    verified: 0,
    mismatch: 0,
    unavailable: 0,
    unsupported: 0,
    deleted: 0,
  };
  for (const record of records) counts[record.state] += 1;
  const { subjects: _subjects, ...registryHead } = registry;
  return {
    loadedAt: new Date().toISOString(),
    loadMs: Date.now() - startedAt,
    registry: registryHead,
    catalog: catalog.state,
    records,
    counts,
  };
}
