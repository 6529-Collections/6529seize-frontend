import type { Hex } from "viem";
import {
  asRecord,
  bodyOf,
  bodyText,
  cleanLabel,
  familyOf,
  identifiersOf,
  MUSEUM_ID_PATTERN,
  onchainMuseumRecordHref,
  push,
  refText,
  slug,
} from "./fields";
import type { OnchainMuseumRecord, OnchainMuseumSnapshot } from "./museum";
import { referencedSubjectId, registryCaip10 } from "./profile";
import {
  buildTextGroups,
  type OnchainTextGroup,
  type OnchainTextGroupKind,
} from "./texts";

/**
 * Index groups for PRV_ENTITY records: the profile kind, with agents that
 * created a work shown as artists, collections no one holds as projects and
 * sets that carry an accession number as accessions.
 */
const ENTITY_GROUP_ORDER = [
  "work",
  "artist",
  "project",
  "acquisition",
  "program",
  "accession",
  "lot",
  "object",
  "collection",
  "group",
  "publication",
  "agent",
  "digital_object",
];

/** Families shown as object records on the index. */
const RECORD_FAMILIES = new Set([
  "PRV_DECISION",
  "PRV_RIGHTS",
  "PRV_OBSERVATION",
  "PRV_EVENT",
  "PRV_ATTESTATION",
]);

/**
 * Words for profile values. The route supplies them from its messages so
 * this module stays free of copy.
 */
export interface OnchainLabeler {
  /** Plural heading of an entity group, such as "Works". */
  entityGroup(key: string): string;
  /** Singular name of an entity group, such as "Work". */
  entitySingular(key: string): string;
  /** Singular name of a family, such as "Relation". */
  family(recordType: string): string;
  /** Singular name of a family's kind, such as "Condition report". */
  recordKind(recordType: string, kind: string): string;
  /** Plural heading of a family's kind, such as "Condition reports". */
  recordKindPlural(recordType: string, kind: string): string;
  documentKind(kind: string): string;
  /** A statement with no named subject, by its kind and date. */
  dated(kind: string, isoDate: string): string;
  /** A relation read as a phrase: "CENTURY #31, by Casey Reas". */
  relation(kind: string, source: string, target: string): string;
  textGroup(kind: OnchainTextGroupKind): string;
  unverifiedGroup(): string;
}

export interface OnchainLink {
  readonly id: string;
  readonly label: string;
  readonly href: string | null;
  readonly subjectId: Hex | null;
}

/** A verified relation seen from one of its ends. */
export interface OnchainEdge {
  readonly relation: OnchainMuseumRecord;
  readonly kind: string;
  /** `out` when the record is the relation's source. */
  readonly direction: "out" | "in";
  readonly other: OnchainMuseumRecord | null;
  readonly otherRef: unknown;
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
  /** The singular kind of a record: "Work", "Relation", "Essay". */
  kindOf(record: OnchainMuseumRecord): string;
  /** The index group of an entity, such as `work` or `artist`. */
  groupKeyOf(record: OnchainMuseumRecord): string | null;
  find(subjectId: Hex): OnchainMuseumRecord | null;
  /** The verified record a profile reference names in this registry. */
  recordForRef(ref: unknown): OnchainMuseumRecord | null;
  resolveRef(ref: unknown): OnchainLink;
  /** Verified relations with this record at one end. */
  edgesOf(record: OnchainMuseumRecord): readonly OnchainEdge[];
  /** Verified records whose `about` or `body.target` names this record. */
  recordsAbout(record: OnchainMuseumRecord): readonly OnchainMuseumRecord[];
  /** The records this record's `about` and `body.target` name. */
  aboutOf(record: OnchainMuseumRecord): readonly OnchainMuseumRecord[];
  readonly declarationRecord: OnchainMuseumRecord | null;
  readonly entityGroups: readonly OnchainMuseumGroup[];
  readonly recordGroups: readonly OnchainMuseumGroup[];
  readonly textGroups: readonly OnchainTextGroup[];
  textGroupOf(record: OnchainMuseumRecord): OnchainTextGroup | null;
  readonly texts: readonly OnchainMuseumRecord[];
  readonly relationCount: number;
  readonly unverified: readonly OnchainMuseumRecord[];
}

type Compare = (left: string, right: string) => number;

export interface ViewOptions {
  readonly labeler: OnchainLabeler;
  readonly compare: Compare;
}

/** The references a record's `about` and `body.target` hold. */
function aboutRefs(record: OnchainMuseumRecord): unknown[] {
  const refs: unknown[] = (record.profile?.about ?? []).map((item) => item.ref);
  const target = bodyOf(record)["target"];
  if (familyOf(record) !== "PRV_RELATION" && target !== undefined) {
    refs.push(target);
  }
  return refs;
}

export interface Graph {
  readonly refSubject: (ref: unknown) => Hex | null;
  readonly bySubject: ReadonlyMap<string, OnchainMuseumRecord>;
  readonly edges: ReadonlyMap<string, OnchainEdge[]>;
  readonly about: ReadonlyMap<string, OnchainMuseumRecord[]>;
}

function buildGraph(snapshot: OnchainMuseumSnapshot): Graph {
  const { registry, declaration } = snapshot;
  const registryId = registryCaip10(registry.checks.chainId, registry.registry);
  const bySubject = new Map<string, OnchainMuseumRecord>();
  for (const record of snapshot.records) {
    bySubject.set(record.subjectId.toLowerCase(), record);
  }
  const ns =
    declaration.ns ??
    snapshot.records.find((record) => record.profile !== null)?.profile?.ns ??
    "";
  const refSubject = (ref: unknown) => referencedSubjectId(ref, ns, registryId);
  const verified = (ref: unknown) => {
    const id = refSubject(ref);
    const record = id === null ? undefined : bySubject.get(id);
    return record?.profile === null || record === undefined ? null : record;
  };
  const edges = new Map<string, OnchainEdge[]>();
  const about = new Map<string, OnchainMuseumRecord[]>();
  for (const record of snapshot.records) {
    if (record.profile === null) continue;
    if (familyOf(record) === "PRV_RELATION") {
      const { source, target } = record.profile.body;
      const from = verified(source);
      const to = verified(target);
      const base = { relation: record, kind: record.profile.kind };
      if (from !== null) {
        push(edges, from.subjectId, {
          ...base,
          direction: "out",
          other: to,
          otherRef: target,
        });
      }
      if (to !== null) {
        push(edges, to.subjectId, {
          ...base,
          direction: "in",
          other: from,
          otherRef: source,
        });
      }
      continue;
    }
    const seen = new Set<string>();
    for (const ref of aboutRefs(record)) {
      const named = verified(ref);
      if (named === null || seen.has(named.subjectId)) continue;
      seen.add(named.subjectId);
      push(about, named.subjectId, record);
    }
  }
  return { refSubject, bySubject, edges, about };
}

interface EntityRoles {
  /** Agents a work is created by. */
  readonly creators: ReadonlySet<string>;
  /** Collections something holds. */
  readonly held: ReadonlySet<string>;
  /** Sets whose members are all objects: accession lots. */
  readonly lots: ReadonlySet<string>;
}

function entityGroupKey(
  record: OnchainMuseumRecord,
  { creators, held, lots }: EntityRoles
): string | null {
  if (record.profile === null || familyOf(record) !== "PRV_ENTITY") return null;
  const { kind } = record.profile;
  if (kind === "agent") {
    return creators.has(record.subjectId) ? "artist" : "agent";
  }
  if (kind === "collection") {
    return held.has(record.subjectId) ? "collection" : "project";
  }
  if (kind === "set") {
    if (lots.has(record.subjectId)) return "lot";
    return identifiersOf(record, "accession_number").length > 0
      ? "accession"
      : "acquisition";
  }
  return kind;
}

function isLot(record: OnchainMuseumRecord, graph: Graph): boolean {
  const members = bodyOf(record)["members"];
  return (
    record.profile?.kind === "set" &&
    Array.isArray(members) &&
    members.length > 0 &&
    members.every((member) => {
      const id = graph.refSubject(member);
      const item = id === null ? undefined : graph.bySubject.get(id);
      return item?.profile?.kind === "object";
    })
  );
}

function entityRoles(
  records: readonly OnchainMuseumRecord[],
  graph: Graph
): EntityRoles {
  const creators = new Set<string>();
  const held = new Set<string>();
  const lots = new Set(
    records.filter((record) => isLot(record, graph)).map((r) => r.subjectId)
  );
  for (const record of records) {
    if (record.profile?.kind !== "work" || familyOf(record) !== "PRV_ENTITY") {
      continue;
    }
    const createdBy = bodyOf(record)["created_by"];
    for (const item of Array.isArray(createdBy) ? createdBy : []) {
      const id = graph.refSubject(asRecord(item)?.["agent"]);
      if (id !== null) creators.add(id);
    }
    for (const edge of graph.edges.get(record.subjectId) ?? []) {
      if (
        edge.kind === "created_by" &&
        edge.direction === "out" &&
        edge.other
      ) {
        creators.add(edge.other.subjectId);
      }
    }
  }
  for (const list of graph.edges.values()) {
    for (const edge of list) {
      if (edge.kind === "held_by" && edge.direction === "in" && edge.other) {
        held.add(edge.other.subjectId);
      }
    }
  }
  return { creators, held, lots };
}

interface Labels {
  readonly labelOf: (record: OnchainMuseumRecord) => string;
  readonly kindOf: (record: OnchainMuseumRecord) => string;
}

function buildLabels(
  records: readonly OnchainMuseumRecord[],
  graph: Graph,
  labeler: OnchainLabeler,
  groupKeyOf: (record: OnchainMuseumRecord) => string | null
): Labels {
  const kindOf = (record: OnchainMuseumRecord): string => {
    const family = familyOf(record);
    const groupKey = groupKeyOf(record);
    if (groupKey !== null) return labeler.entitySingular(groupKey);
    if (record.profile === null) return labeler.family(family);
    if (family === "PRV_DOCUMENT") {
      return labeler.documentKind(record.profile.kind);
    }
    if (RECORD_FAMILIES.has(family)) {
      return labeler.recordKind(family, record.profile.kind);
    }
    return labeler.family(family);
  };
  const labels = new Map<string, string>();
  const labelOf = (record: OnchainMuseumRecord) =>
    labels.get(record.subjectId) ?? cleanLabel(record.label);
  const recordLabel = (ref: unknown): string | null => {
    const id = graph.refSubject(ref);
    const record = id === null ? undefined : graph.bySubject.get(id);
    return record === undefined ? null : labelOf(record);
  };
  const refLabel = (ref: unknown): string => {
    const label = recordLabel(ref);
    if (label !== null) return label;
    if (typeof ref === "string") return ref;
    const localId = asRecord(ref)?.["local_id"];
    return typeof localId === "string" ? localId : "";
  };
  const ownLabel = (record: OnchainMuseumRecord): string | null => {
    const family = familyOf(record);
    if (family === "PRV_ENTITY") {
      const label = cleanLabel(bodyText(record, "label") ?? record.label);
      return MUSEUM_ID_PATTERN.test(label)
        ? `${kindOf(record)} ${label}`
        : label;
    }
    if (family === "PRV_DOCUMENT") return bodyText(record, "title");
    if (family === "PRV_REGISTRY") return bodyText(record, "name");
    return null;
  };
  const deferred: OnchainMuseumRecord[] = [];
  for (const record of records) {
    const own = record.profile === null ? null : ownLabel(record);
    if (own !== null) labels.set(record.subjectId, cleanLabel(own));
    else if (record.profile !== null) deferred.push(record);
  }
  // Statements about a record next, then relations, which name both kinds.
  deferred.sort(
    (left, right) =>
      Number(familyOf(left) === "PRV_RELATION") -
      Number(familyOf(right) === "PRV_RELATION")
  );
  for (const record of deferred) {
    if (familyOf(record) === "PRV_RELATION") {
      const { source, target } = bodyOf(record);
      labels.set(
        record.subjectId,
        labeler.relation(
          record.profile?.kind ?? "",
          refLabel(source),
          refLabel(target)
        )
      );
      continue;
    }
    const subject = aboutRefs(record)
      .map(recordLabel)
      .find((item) => item !== null);
    const observedTo = bodyOf(record)["observed_to"];
    if (
      (subject === undefined || subject === null) &&
      typeof observedTo === "string"
    ) {
      labels.set(record.subjectId, labeler.dated(kindOf(record), observedTo));
      continue;
    }
    labels.set(
      record.subjectId,
      subject === undefined || subject === null
        ? `${kindOf(record)} ${record.profile?.localId ?? ""}`.trim()
        : `${kindOf(record)}: ${subject}`
    );
  }
  return { labelOf, kindOf };
}

interface IndexGroups {
  readonly entityGroups: OnchainMuseumGroup[];
  readonly recordGroups: OnchainMuseumGroup[];
  readonly texts: OnchainMuseumRecord[];
  readonly unverified: OnchainMuseumRecord[];
  readonly relationCount: number;
}

function buildIndexGroups(
  records: readonly OnchainMuseumRecord[],
  groupKeyOf: (record: OnchainMuseumRecord) => string | null,
  { labeler, compare }: ViewOptions,
  byLabel: (left: OnchainMuseumRecord, right: OnchainMuseumRecord) => number
): IndexGroups {
  const entities = new Map<string, OnchainMuseumRecord[]>();
  const others = new Map<string, OnchainMuseumRecord[]>();
  const texts: OnchainMuseumRecord[] = [];
  const unverified: OnchainMuseumRecord[] = [];
  let relationCount = 0;
  for (const record of records) {
    const family = familyOf(record);
    if (record.state !== "verified") unverified.push(record);
    const groupKey = groupKeyOf(record);
    if (family === "PRV_DOCUMENT") texts.push(record);
    else if (record.profile === null) push(others, "unverified", record);
    else if (family === "PRV_RELATION") relationCount += 1;
    else if (groupKey !== null) push(entities, groupKey, record);
    else if (RECORD_FAMILIES.has(family)) {
      push(others, `${family}.${record.profile.kind}`, record);
    }
  }
  const order = (key: string) => {
    const index = ENTITY_GROUP_ORDER.indexOf(key);
    return index === -1 ? ENTITY_GROUP_ORDER.length : index;
  };
  const recordHeading = (key: string) => {
    if (key === "unverified") return labeler.unverifiedGroup();
    const [family = "", kind = ""] = key.split(".");
    return labeler.recordKindPlural(family, kind);
  };
  return {
    entityGroups: [...entities.entries()]
      .sort(
        ([left], [right]) => order(left) - order(right) || compare(left, right)
      )
      .map(([key, items]) => ({
        key,
        anchor: `entities-${slug(key)}`,
        heading: labeler.entityGroup(key),
        records: [...items].sort(byLabel),
      })),
    recordGroups: [...others.entries()]
      .map(([key, items]) => ({
        key,
        anchor: `records-${slug(key)}`,
        heading: recordHeading(key),
        records: [...items].sort(byLabel),
      }))
      .sort((left, right) => compare(left.heading, right.heading)),
    texts,
    unverified,
    relationCount,
  };
}

/**
 * Derives everything the pages show from a verified snapshot: readable
 * labels, references resolved to records, relations by record, index groups
 * and text groups. Only verified payloads contribute content; every record
 * keeps its on-chain label as a fallback.
 */
export function buildOnchainMuseumView(
  snapshot: OnchainMuseumSnapshot,
  options: ViewOptions
): OnchainMuseumView {
  const { records } = snapshot;
  const graph = buildGraph(snapshot);
  const roles = entityRoles(records, graph);
  const groupKeys = new Map<string, string | null>();
  const groupKeyOf = (record: OnchainMuseumRecord) => {
    if (!groupKeys.has(record.subjectId)) {
      groupKeys.set(record.subjectId, entityGroupKey(record, roles));
    }
    return groupKeys.get(record.subjectId) ?? null;
  };
  const { labelOf, kindOf } = buildLabels(
    records,
    graph,
    options.labeler,
    groupKeyOf
  );
  const recordForRef = (ref: unknown) => {
    const id = graph.refSubject(ref);
    const record = id === null ? undefined : graph.bySubject.get(id);
    return record === undefined || record.profile === null ? null : record;
  };
  const resolveRef = (ref: unknown): OnchainLink => {
    const record = recordForRef(ref);
    const asText = refText(ref);
    return record === null
      ? { id: asText, label: asText, href: null, subjectId: null }
      : {
          id: record.subjectId,
          label: labelOf(record),
          href: onchainMuseumRecordHref(record.subjectId),
          subjectId: record.subjectId,
        };
  };
  const index = buildIndexGroups(records, groupKeyOf, options, (left, right) =>
    options.compare(labelOf(left), labelOf(right))
  );
  const textGroups = buildTextGroups(
    index.texts,
    records,
    graph,
    options,
    labelOf
  );
  const groupBySubject = new Map<string, OnchainTextGroup>();
  for (const group of textGroups) {
    for (const record of group.records) {
      groupBySubject.set(record.subjectId, group);
    }
  }
  const declarationId = snapshot.declaration.subjectId;

  return {
    snapshot,
    labelOf,
    kindOf,
    groupKeyOf,
    find: (subjectId) => graph.bySubject.get(subjectId.toLowerCase()) ?? null,
    recordForRef,
    resolveRef,
    edgesOf: (record) => graph.edges.get(record.subjectId) ?? [],
    recordsAbout: (record) => graph.about.get(record.subjectId) ?? [],
    aboutOf: (record) =>
      aboutRefs(record)
        .map(recordForRef)
        .filter((item): item is OnchainMuseumRecord => item !== null),
    declarationRecord:
      declarationId === null
        ? null
        : (graph.bySubject.get(declarationId.toLowerCase()) ?? null),
    entityGroups: index.entityGroups,
    recordGroups: index.recordGroups,
    textGroups,
    textGroupOf: (record) => groupBySubject.get(record.subjectId) ?? null,
    texts: textGroups.flatMap((group) => group.records),
    relationCount: index.relationCount,
    unverified: index.unverified,
  };
}
