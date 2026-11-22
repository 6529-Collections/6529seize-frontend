import type { Hex } from "viem";
import type { OnchainMuseumRecord, OnchainMuseumSnapshot } from "./museum";

export const ONCHAIN_MUSEUM_BASE_PATH = "/museum/network-onchain";

export function onchainMuseumRecordHref(subjectId: Hex): string {
  return `${ONCHAIN_MUSEUM_BASE_PATH}/records/${subjectId.toLowerCase()}`;
}

export const ONCHAIN_MUSEUM_TEXTS_HREF = `${ONCHAIN_MUSEUM_BASE_PATH}/texts`;

const SUBJECT_ID_PATTERN = /^0x[0-9a-f]{64}$/u;

export function parseSubjectIdParam(value: string): Hex | null {
  const lower = value.toLowerCase();
  return SUBJECT_ID_PATTERN.test(lower) ? (lower as Hex) : null;
}

/** Entity types in the order the index presents them. */
const ENTITY_TYPE_ORDER = [
  "WORK",
  "ARTIST",
  "PROJECT_OR_SERIES",
  "COLLECTION",
  "CURATED_ACQUISITION",
  "ACQUISITION_PROGRAM",
  "ACCESSION",
  "INSTITUTION",
  "ORGANIZATION",
  "AGENT",
  "RESEARCH_PUBLICATION",
  "MEDIA_REFERENCE",
];

export function payloadString(
  record: OnchainMuseumRecord,
  key: string
): string | null {
  if (record.content?.kind !== "json") return null;
  const value = record.content.payload[key];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export function payloadRecord(
  record: OnchainMuseumRecord,
  key: string
): Record<string, unknown> | null {
  if (record.content?.kind !== "json") return null;
  const value = record.content.payload[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function payloadStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function entityKey(record: OnchainMuseumRecord): string | null {
  return (
    payloadString(record, "entity_id") ?? payloadString(record, "record_id")
  );
}

interface OnchainMuseumGroup {
  readonly key: string;
  readonly records: readonly OnchainMuseumRecord[];
}

function byLabel(
  compare: (left: string, right: string) => number
): (left: OnchainMuseumRecord, right: OnchainMuseumRecord) => number {
  return (left, right) => compare(left.label, right.label);
}

interface OnchainMuseumIndex {
  readonly entityGroups: readonly OnchainMuseumGroup[];
  readonly recordGroups: readonly OnchainMuseumGroup[];
  readonly relationCount: number;
  readonly texts: readonly OnchainMuseumRecord[];
  /** Records that are not verified, whatever their type. */
  readonly unverified: readonly OnchainMuseumRecord[];
}

export function buildOnchainMuseumIndex(
  snapshot: OnchainMuseumSnapshot,
  compare: (left: string, right: string) => number
): OnchainMuseumIndex {
  const entities = new Map<string, OnchainMuseumRecord[]>();
  const records = new Map<string, OnchainMuseumRecord[]>();
  const texts: OnchainMuseumRecord[] = [];
  const unverified: OnchainMuseumRecord[] = [];
  let relationCount = 0;
  for (const record of snapshot.records) {
    if (record.state !== "verified") unverified.push(record);
    if (record.recordType === "PUBLIC_DOCUMENT") {
      texts.push(record);
      continue;
    }
    if (record.recordType === "PUBLIC_RELATION") {
      relationCount += 1;
      continue;
    }
    if (record.recordType === "PUBLIC_ENTITY") {
      const type = payloadString(record, "entity_type") ?? "UNKNOWN";
      entities.set(type, [...(entities.get(type) ?? []), record]);
      continue;
    }
    const type = record.recordType ?? "UNKNOWN";
    records.set(type, [...(records.get(type) ?? []), record]);
  }
  const order = (key: string) => {
    const index = ENTITY_TYPE_ORDER.indexOf(key);
    return index === -1 ? ENTITY_TYPE_ORDER.length : index;
  };
  const sortRecords = byLabel(compare);
  return {
    entityGroups: [...entities.entries()]
      .sort(
        ([left], [right]) => order(left) - order(right) || compare(left, right)
      )
      .map(([key, items]) => ({ key, records: [...items].sort(sortRecords) })),
    recordGroups: [...records.entries()]
      .sort(([left], [right]) => compare(left, right))
      .map(([key, items]) => ({ key, records: [...items].sort(sortRecords) })),
    relationCount,
    texts: [...texts].sort((left, right) =>
      compare(
        left.documentPath ?? left.label,
        right.documentPath ?? right.label
      )
    ),
    unverified,
  };
}

/** Groups texts by the first folder of their repository path. */
export function groupOnchainTexts(
  texts: readonly OnchainMuseumRecord[]
): OnchainMuseumGroup[] {
  const groups = new Map<string, OnchainMuseumRecord[]>();
  for (const text of texts) {
    const path = text.documentPath ?? "";
    const slash = path.indexOf("/");
    const key = slash === -1 ? "" : path.slice(0, slash);
    groups.set(key, [...(groups.get(key) ?? []), text]);
  }
  return [...groups.entries()].map(([key, records]) => ({ key, records }));
}

export interface OnchainEntityLink {
  readonly id: string;
  readonly label: string;
  readonly href: string | null;
}

/** Resolves Museum entity and record IDs to verified records on the chain. */
export function buildEntityResolver(
  snapshot: OnchainMuseumSnapshot
): (id: string) => OnchainEntityLink {
  const byId = new Map<string, OnchainMuseumRecord>();
  for (const record of snapshot.records) {
    if (record.state !== "verified") continue;
    const key = entityKey(record);
    if (key !== null && !byId.has(key)) byId.set(key, record);
  }
  return (id) => {
    const record = byId.get(id);
    return record === undefined
      ? { id, label: id, href: null }
      : {
          id,
          label: record.label,
          href: onchainMuseumRecordHref(record.subjectId),
        };
  };
}

/** Verified relation records that reference an entity ID. */
export function relationsReferencing(
  snapshot: OnchainMuseumSnapshot,
  entityId: string
): OnchainMuseumRecord[] {
  return snapshot.records.filter(
    (record) =>
      record.state === "verified" &&
      record.recordType === "PUBLIC_RELATION" &&
      record.content?.kind === "json" &&
      payloadStrings(record.content.payload["references"]).includes(entityId)
  );
}

export function findOnchainRecord(
  snapshot: OnchainMuseumSnapshot,
  subjectId: Hex
): OnchainMuseumRecord | null {
  return (
    snapshot.records.find(
      (record) => record.subjectId.toLowerCase() === subjectId.toLowerCase()
    ) ?? null
  );
}

/** Turns an upper-snake literal into words, for types without copy. */
export function humanizeLiteral(literal: string): string {
  const words = literal.toLowerCase().split("_").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
