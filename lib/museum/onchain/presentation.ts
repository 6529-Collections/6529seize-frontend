import type { Hex } from "viem";
import type { OnchainMuseumRecord, OnchainMuseumSnapshot } from "./museum";

export const ONCHAIN_MUSEUM_BASE_PATH = "/museum/network-onchain";

export function onchainMuseumRecordHref(subjectId: Hex): string {
  return `${ONCHAIN_MUSEUM_BASE_PATH}/records/${subjectId.toLowerCase()}`;
}

export const ONCHAIN_MUSEUM_TEXTS_HREF = `${ONCHAIN_MUSEUM_BASE_PATH}/texts`;

const SUBJECT_ID_PATTERN = /^0x[0-9a-f]{64}$/u;
/** A Museum identifier used as a label, such as 6529NM.2026.003.COND.01. */
const MUSEUM_ID_PATTERN = /^6529NM[-.][A-Z0-9.-]+$/u;

export function parseSubjectIdParam(value: string): Hex | null {
  const lower = value.toLowerCase();
  return SUBJECT_ID_PATTERN.test(lower) ? (lower as Hex) : null;
}

/** Entity types in the order the index presents them. */
const ENTITY_TYPE_ORDER = [
  "WORK",
  "ARTIST",
  "PROJECT_OR_SERIES",
  "CURATED_ACQUISITION",
  "ACQUISITION_PROGRAM",
  "ACCESSION",
  "COLLECTION",
  "INSTITUTION",
  "ORGANIZATION",
  "RESEARCH_PUBLICATION",
  "AGENT",
  "MEDIA_REFERENCE",
];

/** Which entity types a text folder's ID may name, best first. */
const CONTEXT_ENTITY_ORDER = [
  "ACCESSION",
  "ACQUISITION_PROGRAM",
  "CURATED_ACQUISITION",
];

/**
 * Words for registry values. The route supplies them from its messages so
 * this module stays free of copy.
 */
export interface OnchainLabeler {
  entityTypePlural(type: string): string;
  entityTypeSingular(type: string): string;
  recordType(literal: string): string;
  recordTypePlural(literal: string): string;
  relationType(type: string): string;
  textGroup(kind: OnchainTextGroupKind): string;
}

export type OnchainTextGroupKind =
  | "accession"
  | "proposedGift"
  | "program"
  | "programWorks"
  | "programArtists"
  | "institutionalPractice"
  | "institutionalProfiles"
  | "policies"
  | "dataArchitecture"
  | "documentation"
  | "contributing"
  | "other";

const TEXT_GROUP_ORDER: readonly OnchainTextGroupKind[] = [
  "accession",
  "proposedGift",
  "program",
  "programWorks",
  "programArtists",
  "institutionalPractice",
  "institutionalProfiles",
  "policies",
  "dataArchitecture",
  "documentation",
  "contributing",
  "other",
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
  return asRecord(record.content.payload[key]);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
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

/** Drops Markdown emphasis that a text's first heading carries. */
export function cleanLabel(label: string): string {
  return label
    .replaceAll(/[*`]/gu, "")
    .replaceAll(/(^|\s)_+|_+(\s|$)/gu, "$1$2")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

function normalizeTitle(value: string): string {
  return cleanLabel(value)
    .toLocaleLowerCase("en-US")
    .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export interface OnchainLink {
  readonly id: string;
  readonly label: string;
  readonly href: string | null;
  readonly subjectId: Hex | null;
}

export interface OnchainTextGroup {
  readonly key: string;
  readonly anchor: string;
  readonly kind: OnchainTextGroupKind;
  /** The Museum ID in the texts' folder, such as an accession number. */
  readonly contextId: string | null;
  /** The kind of group, such as "Accession". */
  readonly kicker: string;
  /** The group's name: the record it belongs to, or the kind. */
  readonly heading: string;
  /** The entity the group's texts belong to, when it is on-chain. */
  readonly contextHref: string | null;
  readonly contextSubjectId: Hex | null;
  readonly records: readonly OnchainMuseumRecord[];
}

export interface OnchainMuseumGroup {
  readonly key: string;
  readonly anchor: string;
  readonly heading: string;
  readonly records: readonly OnchainMuseumRecord[];
}

export interface OnchainMuseumView {
  readonly snapshot: OnchainMuseumSnapshot;
  labelOf(record: OnchainMuseumRecord): string;
  /** The singular kind of a record: "Work", "Relation", "Text". */
  kindOf(record: OnchainMuseumRecord): string;
  resolve(id: string): OnchainLink;
  recordById(id: string): OnchainMuseumRecord | null;
  find(subjectId: Hex): OnchainMuseumRecord | null;
  readonly entityGroups: readonly OnchainMuseumGroup[];
  readonly recordGroups: readonly OnchainMuseumGroup[];
  readonly textGroups: readonly OnchainTextGroup[];
  textGroupOf(record: OnchainMuseumRecord): OnchainTextGroup | null;
  readonly texts: readonly OnchainMuseumRecord[];
  readonly relationCount: number;
  readonly unverified: readonly OnchainMuseumRecord[];
}

interface TextGroupKey {
  readonly kind: OnchainTextGroupKind;
  readonly contextId: string | null;
}

function recordsTextGroupKey(parts: readonly string[]): TextGroupKey {
  const [, second, third, , section] = parts;
  if (!third) return { kind: "other", contextId: null };
  if (second === "accessions") return { kind: "accession", contextId: third };
  if (second === "proposed-gifts") {
    return { kind: "proposedGift", contextId: third };
  }
  if (second === "programs") {
    if (section === "works") return { kind: "programWorks", contextId: third };
    if (section === "artists") {
      return { kind: "programArtists", contextId: third };
    }
    return { kind: "program", contextId: third };
  }
  if (second === "institutional-practice") {
    return {
      kind:
        third === "profiles"
          ? "institutionalProfiles"
          : "institutionalPractice",
      contextId: null,
    };
  }
  return { kind: "other", contextId: null };
}

/** Places a text by its repository path. */
export function textGroupKey(path: string | null): TextGroupKey {
  const parts = (path ?? "").split("/");
  const [first, second] = parts;
  if (first === "records") return recordsTextGroupKey(parts);
  if (first === "policies") return { kind: "policies", contextId: null };
  if (first === "docs") {
    return {
      kind: second?.startsWith("data-architecture")
        ? "dataArchitecture"
        : "documentation",
      contextId: null,
    };
  }
  if (parts.length === 1 && first !== "") {
    return { kind: "contributing", contextId: null };
  }
  return { kind: "other", contextId: null };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
}

interface ViewOptions {
  readonly labeler: OnchainLabeler;
  readonly compare: (left: string, right: string) => number;
}

type Compare = (left: string, right: string) => number;

function referencesOf(record: OnchainMuseumRecord): string[] {
  return record.content?.kind === "json"
    ? payloadStrings(record.content.payload["references"])
    : [];
}

function sourceRecordIds(record: OnchainMuseumRecord): string[] {
  return record.content?.kind === "json"
    ? payloadStrings(record.content.payload["source_record_ids"])
    : [];
}

/** Readable labels for every record, relations last as they name others. */
function buildLabels(
  records: readonly OnchainMuseumRecord[],
  byId: ReadonlyMap<string, OnchainMuseumRecord>,
  labeler: OnchainLabeler,
  kindOf: (record: OnchainMuseumRecord) => string
): Map<string, string> {
  const labels = new Map<string, string>();
  const baseLabel = (record: OnchainMuseumRecord): string => {
    const cleaned = cleanLabel(record.label);
    const title = payloadString(record, "title");
    if (record.recordType === "WORK_DESCRIPTION" && title !== null) {
      return `${kindOf(record)}: ${cleanLabel(title)}`;
    }
    if (!MUSEUM_ID_PATTERN.test(cleaned)) return cleaned;
    const objectId = payloadString(record, "object_id");
    const object = objectId === null ? undefined : byId.get(objectId);
    const objectTitle =
      object === undefined ? null : payloadString(object, "title");
    return objectTitle === null
      ? `${kindOf(record)} ${cleaned}`
      : `${kindOf(record)}: ${cleanLabel(objectTitle)}`;
  };
  const relations: OnchainMuseumRecord[] = [];
  for (const record of records) {
    if (record.recordType === "PUBLIC_RELATION") relations.push(record);
    else labels.set(record.subjectId, baseLabel(record));
  }
  for (const record of relations) {
    const type = payloadString(record, "relation_type");
    const names = referencesOf(record)
      .map((id) => byId.get(id))
      .filter((item): item is OnchainMuseumRecord => item !== undefined)
      .map((item) => labels.get(item.subjectId) ?? item.label);
    labels.set(
      record.subjectId,
      type === null || names.length === 0
        ? baseLabel(record)
        : `${labeler.relationType(type)}: ${names.join(" · ")}`
    );
  }
  return labels;
}

interface IndexGroups {
  readonly entityGroups: OnchainMuseumGroup[];
  readonly recordGroups: OnchainMuseumGroup[];
  readonly texts: OnchainMuseumRecord[];
  readonly unverified: OnchainMuseumRecord[];
  readonly relationCount: number;
}

function push(
  map: Map<string, OnchainMuseumRecord[]>,
  key: string,
  record: OnchainMuseumRecord
): void {
  map.set(key, [...(map.get(key) ?? []), record]);
}

function buildIndexGroups(
  records: readonly OnchainMuseumRecord[],
  labeler: OnchainLabeler,
  compare: Compare,
  sortByLabel: (left: OnchainMuseumRecord, right: OnchainMuseumRecord) => number
): IndexGroups {
  const entities = new Map<string, OnchainMuseumRecord[]>();
  const others = new Map<string, OnchainMuseumRecord[]>();
  const texts: OnchainMuseumRecord[] = [];
  const unverified: OnchainMuseumRecord[] = [];
  let relationCount = 0;
  for (const record of records) {
    if (record.state !== "verified") unverified.push(record);
    if (record.recordType === "PUBLIC_DOCUMENT") texts.push(record);
    else if (record.recordType === "PUBLIC_RELATION") relationCount += 1;
    else if (record.recordType === "PUBLIC_ENTITY") {
      push(entities, payloadString(record, "entity_type") ?? "UNKNOWN", record);
    } else push(others, record.recordType ?? "UNKNOWN", record);
  }
  const order = (key: string) => {
    const index = ENTITY_TYPE_ORDER.indexOf(key);
    return index === -1 ? ENTITY_TYPE_ORDER.length : index;
  };
  return {
    entityGroups: [...entities.entries()]
      .sort(
        ([left], [right]) => order(left) - order(right) || compare(left, right)
      )
      .map(([key, items]) => ({
        key,
        anchor: `entities-${slug(key)}`,
        heading: labeler.entityTypePlural(key),
        records: [...items].sort(sortByLabel),
      })),
    recordGroups: [...others.entries()]
      .map(([key, items]) => ({
        key,
        anchor: `records-${slug(key)}`,
        heading: labeler.recordTypePlural(key),
        records: [...items].sort(sortByLabel),
      }))
      .sort((left, right) => compare(left.heading, right.heading)),
    texts,
    unverified,
    relationCount,
  };
}

/** The verified entity a text folder's Museum ID names, if any. */
function contextEntity(
  records: readonly OnchainMuseumRecord[],
  contextId: string
): OnchainMuseumRecord | null {
  for (const type of CONTEXT_ENTITY_ORDER) {
    const match = records.find(
      (record) =>
        record.state === "verified" &&
        payloadString(record, "entity_type") === type &&
        (entityKey(record) === contextId ||
          sourceRecordIds(record).includes(contextId))
    );
    if (match !== undefined) return match;
  }
  return null;
}

function buildTextGroups(
  records: readonly OnchainMuseumRecord[],
  texts: readonly OnchainMuseumRecord[],
  labeler: OnchainLabeler,
  compare: Compare,
  labelOf: (record: OnchainMuseumRecord) => string
): OnchainTextGroup[] {
  const groups = new Map<string, OnchainTextGroup>();
  const members = new Map<string, OnchainMuseumRecord[]>();
  for (const text of texts) {
    const { kind, contextId } = textGroupKey(text.documentPath);
    const key = `${kind}:${contextId ?? ""}`;
    push(members, key, text);
    if (groups.has(key)) continue;
    const context =
      contextId === null ? null : contextEntity(records, contextId);
    groups.set(key, {
      key,
      anchor: `texts-${slug(key)}`,
      kind,
      contextId,
      kicker: labeler.textGroup(kind),
      heading:
        context === null
          ? (contextId ?? labeler.textGroup(kind))
          : labelOf(context),
      contextHref:
        context === null ? null : onchainMuseumRecordHref(context.subjectId),
      contextSubjectId: context?.subjectId ?? null,
      records: [],
    });
  }
  const byLabel = (left: OnchainMuseumRecord, right: OnchainMuseumRecord) =>
    compare(labelOf(left), labelOf(right));
  return [...groups.values()]
    .map((group) => ({
      ...group,
      records: [...(members.get(group.key) ?? [])].sort(byLabel),
    }))
    .sort(
      (left, right) =>
        TEXT_GROUP_ORDER.indexOf(left.kind) -
          TEXT_GROUP_ORDER.indexOf(right.kind) || compare(left.key, right.key)
    );
}

/**
 * Derives everything the pages show from a verified snapshot: readable
 * labels, entity links, index groups and text groups. Only verified records
 * contribute content; every record keeps its on-chain label as a fallback.
 */
export function buildOnchainMuseumView(
  snapshot: OnchainMuseumSnapshot,
  { labeler, compare }: ViewOptions
): OnchainMuseumView {
  const { records } = snapshot;
  const byId = new Map<string, OnchainMuseumRecord>();
  const bySubject = new Map<string, OnchainMuseumRecord>();
  for (const record of records) {
    bySubject.set(record.subjectId.toLowerCase(), record);
    const key = record.state === "verified" ? entityKey(record) : null;
    if (key !== null && !byId.has(key)) byId.set(key, record);
  }
  const kindOf = (record: OnchainMuseumRecord): string => {
    const entityType = payloadString(record, "entity_type");
    return entityType === null
      ? labeler.recordType(record.recordType ?? "UNKNOWN")
      : labeler.entityTypeSingular(entityType);
  };
  const labels = buildLabels(records, byId, labeler, kindOf);
  const labelOf = (record: OnchainMuseumRecord) =>
    labels.get(record.subjectId) ?? record.label;
  const resolve = (id: string): OnchainLink => {
    const record = byId.get(id);
    return record === undefined
      ? { id, label: id, href: null, subjectId: null }
      : {
          id,
          label: labelOf(record),
          href: onchainMuseumRecordHref(record.subjectId),
          subjectId: record.subjectId,
        };
  };
  const index = buildIndexGroups(records, labeler, compare, (left, right) =>
    compare(labelOf(left), labelOf(right))
  );
  const textGroups = buildTextGroups(
    records,
    index.texts,
    labeler,
    compare,
    labelOf
  );
  const groupBySubject = new Map<string, OnchainTextGroup>();
  for (const group of textGroups) {
    for (const record of group.records) {
      groupBySubject.set(record.subjectId, group);
    }
  }

  return {
    snapshot,
    labelOf,
    kindOf,
    resolve,
    recordById: (id) => byId.get(id) ?? null,
    find: (subjectId) => bySubject.get(subjectId.toLowerCase()) ?? null,
    entityGroups: index.entityGroups,
    recordGroups: index.recordGroups,
    textGroups,
    textGroupOf: (record) => groupBySubject.get(record.subjectId) ?? null,
    texts: textGroups.flatMap((group) => group.records),
    relationCount: index.relationCount,
    unverified: index.unverified,
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

/** The works an entity names among its source records, such as an accession's. */
export function worksNamedBy(
  view: OnchainMuseumView,
  record: OnchainMuseumRecord
): OnchainMuseumRecord[] {
  return sourceRecordIds(record)
    .map((id) => view.recordById(id))
    .filter(
      (item): item is OnchainMuseumRecord =>
        item !== null && payloadString(item, "entity_type") === "WORK"
    );
}

/** Texts whose title names the given title, for a work or an artist. */
export function textsNaming(
  view: OnchainMuseumView,
  title: string,
  mode: "equals" | "includes"
): OnchainMuseumRecord[] {
  const wanted = normalizeTitle(title);
  if (wanted === "") return [];
  return view.texts.filter((text) => {
    const label = normalizeTitle(view.labelOf(text));
    return mode === "equals" ? label === wanted : label.includes(wanted);
  });
}
