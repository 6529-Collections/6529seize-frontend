import type { Hex } from "viem";
import { keccakUtf8 } from "./verify";

/**
 * Reading 6529 provenance profile v1 payloads: the core fields every family
 * shares, subject IDs, references and the checks a reader makes against the
 * registry version that holds the payload.
 */
export const PROFILE_VERSION = "PRV_PROFILE_V1.0";

const RFC3339_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u;

export interface ProfileAbout {
  readonly role: string;
  readonly ref: unknown;
}

/** The core fields of a profile payload. */
export interface ProfileCore {
  readonly recordType: string;
  readonly kind: string;
  readonly ns: string;
  readonly localId: string;
  readonly effectiveAt: string;
  readonly status: string;
  readonly revisionReason: string | null;
  readonly assertionMode: string | null;
  readonly lang: string;
  readonly about: readonly ProfileAbout[];
  readonly body: Readonly<Record<string, unknown>>;
}

/** Why a verified payload does not belong to the registry version holding it. */
type ProfileMismatch =
  | "profile"
  | "subject_id"
  | "record_type"
  | "schema"
  | "effective_at"
  | "revision";

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** The core of a profile payload, or null when it is not one. */
export function readProfileCore(payload: unknown): ProfileCore | null {
  if (!isPlainObject(payload) || payload["profile"] !== PROFILE_VERSION) {
    return null;
  }
  const subject = payload["subject"];
  const recordType = nonEmpty(payload["record_type"]);
  const kind = nonEmpty(payload["kind"]);
  const effectiveAt = nonEmpty(payload["effective_at"]);
  const status = nonEmpty(payload["status"]);
  if (
    !isPlainObject(subject) ||
    recordType === null ||
    kind === null ||
    effectiveAt === null ||
    status === null
  ) {
    return null;
  }
  const ns = nonEmpty(subject["ns"]);
  const localId = nonEmpty(subject["local_id"]);
  if (ns === null || localId === null) return null;
  const revision = payload["revision"];
  const assertion = payload["assertion"];
  const about = Array.isArray(payload["about"])
    ? payload["about"].filter(isPlainObject).map((item) => ({
        role: typeof item["role"] === "string" ? item["role"] : "",
        ref: item["ref"],
      }))
    : [];
  return {
    recordType,
    kind,
    ns,
    localId,
    effectiveAt,
    status,
    revisionReason: isPlainObject(revision)
      ? nonEmpty(revision["reason"])
      : null,
    assertionMode: isPlainObject(assertion)
      ? nonEmpty(assertion["mode"])
      : null,
    lang: nonEmpty(payload["lang"]) ?? "en",
    about,
    body: isPlainObject(payload["body"]) ? payload["body"] : {},
  };
}

/** `keccak256(ns + ".subject." + lower(record_type) + ".v1:" + local_id)`. */
export function profileSubjectId(
  ns: string,
  recordType: string,
  localId: string
): Hex {
  return keccakUtf8(
    `${ns}.subject.${recordType.toLowerCase()}.v1:${localId}`
  ).toLowerCase() as Hex;
}

/** What the registry holds for the version a payload was read from. */
interface ProfileVersionFacts {
  readonly subjectId: Hex;
  readonly recordType: string | null;
  readonly schemaLiteral: string | null;
  readonly effectiveAt: number;
  readonly version: number;
}

/**
 * The checks of the profile's core: the subject ID derives from the payload,
 * and the record type, schema, effective time and revision agree with the
 * registry version. Null when every check passes.
 */
export function checkProfileVersion(
  core: ProfileCore | null,
  facts: ProfileVersionFacts
): ProfileMismatch | null {
  if (core === null) return "profile";
  if (
    profileSubjectId(core.ns, core.recordType, core.localId) !==
    facts.subjectId.toLowerCase()
  ) {
    return "subject_id";
  }
  if (facts.recordType !== core.recordType) return "record_type";
  if (facts.schemaLiteral !== `${core.recordType}_V1.0`) return "schema";
  if (
    !RFC3339_SECONDS.test(core.effectiveAt) ||
    Date.parse(core.effectiveAt) / 1000 !== facts.effectiveAt
  ) {
    return "effective_at";
  }
  if ((facts.version === 1) !== (core.revisionReason === "initial")) {
    return "revision";
  }
  return null;
}

/**
 * The subject ID a reference names inside this registry: a subject
 * reference `{record_type, local_id, ns?}`, or a record reference whose
 * registry is this one. Null for a URI or another registry's record.
 */
export function referencedSubjectId(
  ref: unknown,
  ns: string,
  registryCaip10: string
): Hex | null {
  if (!isPlainObject(ref)) return null;
  const recordType = nonEmpty(ref["record_type"]);
  const localId = nonEmpty(ref["local_id"]);
  if (recordType !== null && localId !== null) {
    return profileSubjectId(nonEmpty(ref["ns"]) ?? ns, recordType, localId);
  }
  const registry = nonEmpty(ref["registry"]);
  const subject = nonEmpty(ref["subject"]);
  if (
    registry?.toLowerCase() === registryCaip10.toLowerCase() &&
    subject !== null &&
    /^0x[0-9a-fA-F]{64}$/u.test(subject)
  ) {
    return subject.toLowerCase() as Hex;
  }
  return null;
}

/** The text of a language map: the language asked for, else the first. */
export function languageText(
  value: unknown,
  lang: string = "en"
): string | null {
  if (typeof value === "string") return nonEmpty(value);
  if (!isPlainObject(value)) return null;
  const preferred = nonEmpty(value[lang]);
  if (preferred !== null) return preferred;
  for (const item of Object.values(value)) {
    const text = nonEmpty(item);
    if (text !== null) return text;
  }
  return null;
}

/** The registry as a CAIP-10 account ID, the form the declaration uses. */
export function registryCaip10(chainId: number, registry: string): string {
  return `eip155:${chainId}:${registry.toLowerCase()}`;
}
