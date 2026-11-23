import type { Hex } from "viem";
import type { OnchainMuseumRecord } from "./museum";
import { isPlainObject, languageText } from "./profile";

/** Routes of the preview, and the fields of a record the pages read. */
export const ONCHAIN_MUSEUM_BASE_PATH = "/museum/network-onchain";

export function onchainMuseumRecordHref(subjectId: Hex): string {
  return `${ONCHAIN_MUSEUM_BASE_PATH}/records/${subjectId.toLowerCase()}`;
}

export const ONCHAIN_MUSEUM_TEXTS_HREF = `${ONCHAIN_MUSEUM_BASE_PATH}/texts`;

const SUBJECT_ID_PATTERN = /^0x[0-9a-f]{64}$/u;
/** A Museum identifier used as a label, such as 6529NM.2026.001. */
export const MUSEUM_ID_PATTERN = /^6529NM[-.][A-Z0-9.-]+$/u;

export function parseSubjectIdParam(value: string): Hex | null {
  const lower = value.toLowerCase();
  return SUBJECT_ID_PATTERN.test(lower) ? (lower as Hex) : null;
}

/** The profile family: the payload's, else the registry's record type. */
export function familyOf(record: OnchainMuseumRecord): string {
  return record.profile?.recordType ?? record.recordType ?? "UNKNOWN";
}

export function bodyOf(
  record: OnchainMuseumRecord
): Readonly<Record<string, unknown>> {
  return record.profile?.body ?? {};
}

export function bodyText(
  record: OnchainMuseumRecord,
  key: string
): string | null {
  return languageText(bodyOf(record)[key], record.profile?.lang);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return isPlainObject(value) ? value : null;
}

/**
 * The institution's own fields, under its namespace key in `ext`. The
 * profile keeps nothing a reader needs there; the pages use them only for
 * display details the profile has no field for, such as a medium.
 */
export function museumExt(
  record: OnchainMuseumRecord
): Record<string, unknown> | null {
  if (record.content === null || record.profile === null) return null;
  return asRecord(asRecord(record.content.payload["ext"])?.[record.profile.ns]);
}

export function museumExtString(
  record: OnchainMuseumRecord,
  key: string
): string | null {
  const value = museumExt(record)?.[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** `body.identifiers` values of a scheme, such as `accession_number`. */
export function identifiersOf(
  record: OnchainMuseumRecord,
  scheme: string
): string[] {
  const list = bodyOf(record)["identifiers"];
  if (!Array.isArray(list)) return [];
  return list
    .filter(isPlainObject)
    .filter((item) => item["scheme"] === scheme)
    .map((item) => item["value"])
    .filter((value): value is string => typeof value === "string");
}

/** The path of a text in the Museum's repository, a display detail. */
export function documentPath(record: OnchainMuseumRecord): string | null {
  return museumExtString(record, "path");
}

/** A reference as text: the URI, else the local ID or subject it names. */
export function refText(ref: unknown): string {
  if (typeof ref === "string") return ref;
  const record = asRecord(ref);
  for (const key of ["local_id", "subject"]) {
    const value = record?.[key];
    if (typeof value === "string") return value;
  }
  return "";
}

/** Drops Markdown emphasis that a text's first heading carries. */
export function cleanLabel(label: string): string {
  return label
    .replaceAll(/[*`]/gu, "")
    .replaceAll(/(^|\s)_+|_+(\s|$)/gu, "$1$2")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

/** An anchor-safe form of a key. */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
}

export function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list === undefined) map.set(key, [value]);
  else list.push(value);
}
