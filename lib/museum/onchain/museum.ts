import type { Hex } from "viem";
import { cidFromText, cidToText } from "./cid";
import {
  HASH_ALGORITHM_SHA256,
  ONCHAIN_MUSEUM_SOURCE,
  RFC8785_JCS_LITERAL,
} from "./constants";
import { mapWithConcurrency, type CidFetcher } from "./ipfs";
import { loadOnchainMedia, type OnchainMediaState } from "./media";
import {
  checkProfileVersion,
  isPlainObject,
  languageText,
  PROFILE_VERSION,
  readProfileCore,
  registryCaip10,
  type ProfileCore,
} from "./profile";
import type {
  RegistrySnapshot,
  RegistrySubject,
  RegistryVersion,
} from "./registry";
import { verifyOnchainContent, type OnchainVerificationStatus } from "./verify";

const CONTENT_CONCURRENCY = 24;
const decoder = new TextDecoder("utf-8", { fatal: true });

export type OnchainRecordState =
  | "verified"
  | "nonconforming"
  | "mismatch"
  | "unavailable"
  | "unsupported"
  | "deleted";

/**
 * Why a record is not shown: a failed byte check, a profile check that the
 * verified payload failed, or a check of the text a document names.
 */
export type OnchainRecordCheck =
  | OnchainVerificationStatus
  | "profile"
  | "subject_id"
  | "record_type"
  | "schema"
  | "effective_at"
  | "revision"
  | "namespace"
  | "declaration"
  | "text_reference"
  | "text_mismatch"
  | "text_unavailable"
  | "text_unsupported";

/** The text a PRV_DOCUMENT names, fetched by its CID and checked by SHA-256. */
export interface OnchainDocumentText {
  readonly state: "verified" | "mismatch" | "unavailable" | "unsupported";
  readonly cidText: string | null;
  readonly sha256: Hex | null;
  readonly byteSize: number | null;
  readonly mediaType: string | null;
  readonly servedBy: string | null;
  /** Present only when `state` is `verified`. */
  readonly text: string | null;
}

export interface OnchainMuseumRecord {
  readonly subjectId: Hex;
  readonly recordTypeId: Hex;
  /** The registry's record type literal, such as `PRV_ENTITY`. */
  readonly recordType: string | null;
  readonly schemaLiteral: string | null;
  readonly canonicalizationLiteral: string | null;
  readonly versionCount: number;
  readonly subjectDeleted: boolean;
  readonly version: RegistryVersion;
  readonly cidText: string | null;
  readonly state: OnchainRecordState;
  readonly check: OnchainRecordCheck | null;
  readonly computedDigest: Hex | null;
  readonly cidMatches: boolean | null;
  readonly servedBy: string | null;
  /**
   * The payload, present only when its bytes match the chain and it is the
   * profile record the registry version says it is.
   */
  readonly content: {
    readonly kind: "json";
    readonly payload: Record<string, unknown>;
  } | null;
  /** The payload's profile core; present with `content`. */
  readonly profile: ProfileCore | null;
  /** For a PRV_DOCUMENT with a verified payload: its text. */
  readonly text: OnchainDocumentText | null;
  readonly label: string;
}

/** The registry declaration (PRV_REGISTRY) the registry publishes about itself. */
export interface OnchainDeclaration {
  readonly state: "verified" | "mismatch" | "missing";
  readonly subjectId: Hex | null;
  readonly name: string | null;
  readonly ns: string | null;
  readonly profileVersion: string | null;
  readonly subjectDerivation: string | null;
  /** CAIP-10 IDs, as the declaration states them. */
  readonly registry: string | null;
  readonly predecessor: string | null;
  readonly effectiveAt: number | null;
}

export interface OnchainMuseumSnapshot {
  readonly loadedAt: string;
  readonly loadMs: number;
  /** `fixture` when the route reads local test fixtures instead of the chain. */
  readonly source: "chain" | "fixture";
  readonly registry: Omit<RegistrySnapshot, "subjects">;
  readonly declaration: OnchainDeclaration;
  /** The file index and presentation manifests; images are checked by the browser. */
  readonly media: OnchainMediaState;
  readonly records: readonly OnchainMuseumRecord[];
  readonly counts: Readonly<Record<OnchainRecordState, number>>;
  /** The release and record counts the Museum published, and whether they hold. */
  readonly expected: {
    readonly releases: number;
    readonly records: number;
    readonly matches: boolean;
  };
}

function bytesToText(bytes: Uint8Array): string | null {
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

function recordLabel(
  version: RegistryVersion,
  profile: ProfileCore | null
): string {
  if (version.label.trim() !== "") return version.label;
  if (profile !== null) {
    return (
      languageText(profile.body["label"], profile.lang) ??
      languageText(profile.body["title"], profile.lang) ??
      profile.localId
    );
  }
  return version.cid === "0x" ? "" : cidToText(version.cid);
}

type Outcome = Omit<OnchainMuseumRecord, "label">;

function baseRecord(
  subject: RegistrySubject,
  registry: RegistrySnapshot
): Omit<Outcome, "state"> {
  const { version } = subject;
  return {
    subjectId: subject.subjectId,
    recordTypeId: subject.recordType,
    recordType: registry.recordTypes[subject.recordType] ?? null,
    schemaLiteral: registry.schemas[version.schemaId]?.literal ?? null,
    canonicalizationLiteral:
      registry.canonicalizations[version.contentHash.canonicalizationId] ??
      null,
    versionCount: subject.versionCount,
    subjectDeleted: subject.deleted,
    version,
    cidText: version.cid === "0x" ? null : cidToText(version.cid),
    check: null,
    computedDigest: null,
    cidMatches: null,
    servedBy: null,
    content: null,
    profile: null,
    text: null,
  };
}

/**
 * Fetches a payload by the CID its version names, checks its bytes against
 * the version's digest and canonicalization, then checks the profile core
 * against the version itself.
 */
async function loadPayload(
  subject: RegistrySubject,
  registry: RegistrySnapshot,
  fetchCid: CidFetcher
): Promise<Outcome> {
  const base = baseRecord(subject, registry);
  const { version } = subject;
  if (version.deleted || version.cid === "0x") {
    return { ...base, state: "deleted" };
  }
  if (base.canonicalizationLiteral !== RFC8785_JCS_LITERAL) {
    return { ...base, state: "unsupported" };
  }
  const expectation = {
    contentHash: version.contentHash,
    canonicalizationLiteral: base.canonicalizationLiteral,
    cid: version.cid,
  };
  const fetched = await fetchCid(
    version.cid,
    (bytes) =>
      verifyOnchainContent(expectation, { kind: "bytes", bytes }).status ===
      "verified"
  );
  if (fetched === null) return { ...base, state: "unavailable" };
  const result = verifyOnchainContent(expectation, {
    kind: "bytes",
    bytes: fetched.bytes,
  });
  const checked = {
    ...base,
    check: result.status === "verified" ? null : result.status,
    computedDigest: result.computedDigest,
    cidMatches: result.cidMatches,
    servedBy: fetched.host,
  };
  if (result.status === "unsupported") {
    return { ...checked, state: "unsupported" };
  }
  if (result.status !== "verified") return { ...checked, state: "mismatch" };
  const text = bytesToText(fetched.bytes);
  const payload: unknown = text === null ? null : JSON.parse(text);
  const profile = readProfileCore(payload);
  const mismatch = checkProfileVersion(profile, {
    subjectId: subject.subjectId,
    recordType: base.recordType,
    schemaLiteral: base.schemaLiteral,
    effectiveAt: version.effectiveAt,
    version: version.version,
  });
  if (mismatch !== null || !isPlainObject(payload) || profile === null) {
    return { ...checked, state: "nonconforming", check: mismatch ?? "profile" };
  }
  return {
    ...checked,
    state: "verified",
    content: { kind: "json", payload },
    profile,
  };
}

function readDeclaration(
  records: readonly Outcome[],
  registryId: string
): { declaration: OnchainDeclaration; failed: Hex | null } {
  const missing: OnchainDeclaration = {
    state: "missing",
    subjectId: null,
    name: null,
    ns: null,
    profileVersion: null,
    subjectDerivation: null,
    registry: null,
    predecessor: null,
    effectiveAt: null,
  };
  const record = records.find(
    (item) =>
      item.state === "verified" &&
      item.profile?.recordType === "PRV_REGISTRY" &&
      item.profile.kind === "declaration"
  );
  const profile = record?.profile;
  if (record === undefined || profile === null || profile === undefined) {
    return { declaration: missing, failed: null };
  }
  const { body } = profile;
  const text = (key: string) =>
    typeof body[key] === "string" ? body[key] : null;
  const declaration: OnchainDeclaration = {
    subjectId: record.subjectId,
    name: languageText(body["name"], profile.lang),
    ns: text("ns"),
    profileVersion: text("profile_version"),
    subjectDerivation: text("subject_derivation"),
    registry: text("registry"),
    predecessor: text("predecessor"),
    effectiveAt: record.version.effectiveAt,
    state: "verified",
  };
  const conforms =
    declaration.registry?.toLowerCase() === registryId &&
    declaration.ns === profile.ns &&
    declaration.profileVersion === PROFILE_VERSION &&
    declaration.subjectDerivation === "v1";
  return conforms
    ? { declaration, failed: null }
    : {
        declaration: { ...declaration, state: "mismatch" },
        failed: record.subjectId,
      };
}

/**
 * Applies the declaration to every record: a declaration that names another
 * registry is not shown, and a record outside the declared namespace is not
 * the Museum's.
 */
function applyDeclaration(
  records: readonly Outcome[],
  declaration: OnchainDeclaration,
  failed: Hex | null
): Outcome[] {
  const withheld = (record: Outcome, check: OnchainRecordCheck): Outcome => ({
    ...record,
    state: "nonconforming",
    check,
    content: null,
    profile: null,
  });
  return records.map((record) => {
    if (record.subjectId === failed) return withheld(record, "declaration");
    if (
      record.state === "verified" &&
      declaration.state === "verified" &&
      record.profile?.ns !== declaration.ns
    ) {
      return withheld(record, "namespace");
    }
    return record;
  });
}

const NO_TEXT_REFERENCE: OnchainDocumentText = {
  state: "unsupported",
  cidText: null,
  sha256: null,
  byteSize: null,
  mediaType: null,
  servedBy: null,
  text: null,
};

/**
 * Fetches the text a document's `body.content` names and checks it under
 * the content reference's canonicalization by SHA-256, its size, and the
 * raw CID when the CID is raw.
 */
async function loadDocumentText(
  profile: ProfileCore,
  fetchCid: CidFetcher
): Promise<OnchainDocumentText> {
  const content = profile.body["content"];
  if (!isPlainObject(content)) return NO_TEXT_REFERENCE;
  const cidText = typeof content["cid"] === "string" ? content["cid"] : null;
  const digest =
    typeof content["sha256"] === "string" &&
    /^0x[0-9a-f]{64}$/u.test(content["sha256"])
      ? (content["sha256"] as Hex)
      : null;
  const byteSize =
    typeof content["bytes"] === "number" ? content["bytes"] : null;
  const mediaType =
    typeof content["media_type"] === "string" ? content["media_type"] : null;
  const literal =
    typeof content["canonicalization"] === "string"
      ? content["canonicalization"]
      : "";
  const cid = cidText === null ? null : cidFromText(cidText);
  const reference = { cidText, sha256: digest, byteSize, mediaType };
  if (cid === null || digest === null || !mediaType?.startsWith("text/")) {
    return { ...NO_TEXT_REFERENCE, ...reference };
  }
  const expectation = {
    contentHash: {
      algorithm: HASH_ALGORITHM_SHA256,
      digest,
      canonicalizationId: "0x" as Hex,
    },
    canonicalizationLiteral: literal,
    cid,
  };
  const accept = (bytes: Uint8Array) =>
    (byteSize === null || bytes.length === byteSize) &&
    verifyOnchainContent(expectation, { kind: "bytes", bytes }).status ===
      "verified";
  const fetched = await fetchCid(cid, accept);
  if (fetched === null) {
    return { ...reference, state: "unavailable", servedBy: null, text: null };
  }
  const status = verifyOnchainContent(expectation, {
    kind: "bytes",
    bytes: fetched.bytes,
  }).status;
  const text = bytesToText(fetched.bytes);
  if (status === "unsupported") {
    return { ...reference, state: "unsupported", servedBy: null, text: null };
  }
  if (!fetched.accepted || text === null) {
    return {
      ...reference,
      state: "mismatch",
      servedBy: fetched.host,
      text: null,
    };
  }
  return { ...reference, state: "verified", servedBy: fetched.host, text };
}

/** A document is shown only when the text it names verifies too. */
async function withDocumentText(
  record: Outcome,
  fetchCid: CidFetcher
): Promise<Outcome> {
  if (
    record.state !== "verified" ||
    record.profile?.recordType !== "PRV_DOCUMENT"
  ) {
    return record;
  }
  const text = await loadDocumentText(record.profile, fetchCid);
  if (text.state === "verified") return { ...record, text };
  const hasReference = text.cidText !== null && text.sha256 !== null;
  return {
    ...record,
    state: text.state,
    check: hasReference ? `text_${text.state}` : "text_reference",
    text,
  };
}

/**
 * Builds the Museum from a registry snapshot. Every payload is fetched by the
 * CID its version names and kept only when its bytes hash to the version's
 * digest under RFC 8785 and Keccak-256 and its profile core agrees with the
 * version. The registry declaration then fixes the namespace, each document's
 * text is checked by SHA-256, and the file index is read from the release
 * that names one.
 */
export async function buildOnchainMuseum(
  registry: RegistrySnapshot,
  fetchCid: CidFetcher,
  startedAt: number = Date.now(),
  source: OnchainMuseumSnapshot["source"] = "chain"
): Promise<OnchainMuseumSnapshot> {
  const loaded = await mapWithConcurrency(
    registry.subjects,
    CONTENT_CONCURRENCY,
    (subject) => loadPayload(subject, registry, fetchCid)
  );
  const registryId = registryCaip10(registry.checks.chainId, registry.registry);
  const { declaration, failed } = readDeclaration(loaded, registryId);
  const declared = applyDeclaration(loaded, declaration, failed);
  const [records, media] = await Promise.all([
    mapWithConcurrency(declared, CONTENT_CONCURRENCY, async (record) => {
      const outcome = await withDocumentText(record, fetchCid);
      return {
        ...outcome,
        label: recordLabel(outcome.version, outcome.profile),
      };
    }),
    loadOnchainMedia(registry.releases, fetchCid),
  ]);
  const counts: Record<OnchainRecordState, number> = {
    verified: 0,
    nonconforming: 0,
    mismatch: 0,
    unavailable: 0,
    unsupported: 0,
    deleted: 0,
  };
  for (const record of records) counts[record.state] += 1;
  const { subjects: _subjects, ...registryHead } = registry;
  const { expected } = ONCHAIN_MUSEUM_SOURCE;
  return {
    loadedAt: new Date().toISOString(),
    loadMs: Date.now() - startedAt,
    source,
    registry: registryHead,
    declaration,
    media,
    records,
    counts,
    expected: {
      ...expected,
      matches:
        registry.releases.length === expected.releases &&
        records.length === expected.records,
    },
  };
}
