import type { Hex } from "viem";
import {
  cleanLabel,
  documentPath,
  identifiersOf,
  onchainMuseumRecordHref,
  push,
  slug,
} from "./fields";
import type { OnchainMuseumRecord } from "./museum";
import type { Graph, OnchainMuseumView, ViewOptions } from "./presentation";

/** Texts grouped by where the Museum keeps them, and texts that name a title. */
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

function normalizeTitle(value: string): string {
  return cleanLabel(value)
    .toLocaleLowerCase("en-US")
    .replaceAll(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * The verified entity a text group belongs to: for an accession folder, the
 * set that carries its accession number (the accession over the bare lot);
 * otherwise the subject most of the group's texts name first in `about`.
 */
function contextEntity(
  texts: readonly OnchainMuseumRecord[],
  key: TextGroupKey,
  graph: Graph,
  records: readonly OnchainMuseumRecord[]
): OnchainMuseumRecord | null {
  const { contextId } = key;
  if (contextId === null) return null;
  const sets = records.filter(
    (record) =>
      record.profile?.kind === "set" &&
      identifiersOf(record, "accession_number").includes(contextId)
  );
  const named =
    sets.find((record) => record.profile?.localId !== contextId) ?? sets[0];
  if (named !== undefined) return named;
  const counts = new Map<string, number>();
  for (const text of texts) {
    const id = graph.refSubject(text.profile?.about[0]?.ref);
    if (id !== null) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const record = best === undefined ? undefined : graph.bySubject.get(best[0]);
  return record?.profile === null || record === undefined ? null : record;
}

export function buildTextGroups(
  texts: readonly OnchainMuseumRecord[],
  records: readonly OnchainMuseumRecord[],
  graph: Graph,
  { labeler, compare }: ViewOptions,
  labelOf: (record: OnchainMuseumRecord) => string
): OnchainTextGroup[] {
  const members = new Map<string, OnchainMuseumRecord[]>();
  const keys = new Map<string, TextGroupKey>();
  for (const text of texts) {
    const groupKey = textGroupKey(documentPath(text));
    const key = `${groupKey.kind}:${groupKey.contextId ?? ""}`;
    push(members, key, text);
    keys.set(key, groupKey);
  }
  const byLabel = (left: OnchainMuseumRecord, right: OnchainMuseumRecord) =>
    compare(labelOf(left), labelOf(right));
  return [...keys.entries()]
    .map(([key, groupKey]) => {
      const items = members.get(key) ?? [];
      const context = contextEntity(items, groupKey, graph, records);
      return {
        key,
        anchor: `texts-${slug(key)}`,
        kind: groupKey.kind,
        contextId: groupKey.contextId,
        kicker: labeler.textGroup(groupKey.kind),
        heading:
          context === null
            ? (groupKey.contextId ?? labeler.textGroup(groupKey.kind))
            : labelOf(context),
        contextHref:
          context === null ? null : onchainMuseumRecordHref(context.subjectId),
        contextSubjectId: context?.subjectId ?? null,
        records: [...items].sort(byLabel),
      };
    })
    .sort(
      (left, right) =>
        TEXT_GROUP_ORDER.indexOf(left.kind) -
          TEXT_GROUP_ORDER.indexOf(right.kind) || compare(left.key, right.key)
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
