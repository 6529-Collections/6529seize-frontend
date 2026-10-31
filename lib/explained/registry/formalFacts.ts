import type { FormalManifest } from "@/lib/tdh/formal/manifest";
import reference from "../data/reference.json";
import type { FactInputs } from "../factInputs";
import { MANIFEST_REFRESH, manifestSource } from "./helpers";
import { defineFact, type FactDef, type FactFamily } from "./types";

/**
 * More facts read from the Lean proof manifest (`formal/manifest.json`), for
 * How sure: which rules the manifest is about, its counterexamples by kind,
 * its sections in order, and each section's entries (a family, resolved
 * only on the page that lists them, so other pages do not carry the list).
 * Like the kit's manifest facts, every count is taken from the entries.
 */

type Theorem = FormalManifest["theorems"][number];

const theorems = (inputs: FactInputs): readonly Theorem[] | undefined =>
  inputs.manifest?.manifest.theorems;

function countWhere(pick: (entry: Theorem) => boolean): FactDef<number> {
  return defineFact<number>({
    format: "count",
    unit: "theorems",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => theorems(inputs)?.filter(pick).length,
  });
}

const shownFalse = (entry: Theorem) => entry.status === "counterexample";
/** The five counterexamples to the first netting rule, replaced on Oct 15. */
const firstRule = (entry: Theorem) =>
  shownFalse(entry) && entry.id.includes("firstRule");

/** The section ids in the manifest's order, its titled list first. */
function sectionIds(inputs: FactInputs): string[] | undefined {
  const manifest = inputs.manifest?.manifest;
  if (!manifest) {
    return undefined;
  }
  const ids = (manifest.sections ?? []).map((section) => section.id);
  for (const entry of manifest.theorems) {
    if (!ids.includes(entry.section)) {
      ids.push(entry.section);
    }
  }
  return ids;
}

/**
 * The rule version the manifest's model followed. P26 called its rules
 * `tdh-v1.0` until it took the name `tdh-v1.4` (D137); a manifest whose
 * specification commit predates that change is about the rules under their
 * old name, before D136's four wallets.
 */
function manifestRuleVersion(inputs: FactInputs): string | undefined {
  const spec = inputs.manifest?.manifest.documents?.specification;
  if (!spec) {
    return undefined;
  }
  return Date.parse(spec.lastChangeDate) < Date.parse(reference.names.renamedAt)
    ? "tdh-v1.0"
    : inputs.record.p26.ruleVersion;
}

export interface StatementRow {
  readonly id: string;
  readonly name: string | null;
  readonly status: string;
  readonly checkedBy: string | null;
  readonly axioms: string | null;
  readonly file: string | null;
  readonly line: number | null;
  readonly statement: string | null;
  readonly [key: string]: string | number | null;
}

export interface ManifestSectionEntries {
  readonly title: string | null;
  readonly entries: readonly StatementRow[];
  readonly [key: string]: string | null | readonly StatementRow[];
}

export const FORMAL_FACTS = {
  "manifest.ruleVersion": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: manifestRuleVersion,
  }),
  "manifest.commitDate": defineFact<string>({
    format: "day",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.source.commitDate.slice(0, 10),
  }),
  "manifest.specCommit": defineFact<string>({
    format: "commit",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) =>
      inputs.manifest?.manifest.documents?.specification?.lastChange ??
      undefined,
  }),
  "manifest.shownFalse.firstRule": countWhere(firstRule),
  "manifest.shownFalse.netting": countWhere(
    (entry) =>
      shownFalse(entry) &&
      !firstRule(entry) &&
      entry.library === "tdh" &&
      entry.section === "1"
  ),
  "manifest.shownFalse.never": countWhere(
    (entry) =>
      shownFalse(entry) && entry.library === "tdh" && entry.section !== "1"
  ),
  "manifest.shownFalse.p53": countWhere(
    (entry) => shownFalse(entry) && entry.library === "p53"
  ),
  "manifest.sectionIds": defineFact<string[]>({
    format: "list",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: sectionIds,
  }),
} as const;

/** `manifest.section.5a`: one section's title and every entry in it. */
export const MANIFEST_SECTION_FAMILY: FactFamily = {
  pattern: /^manifest\.section\.([\w-]{1,20})$/,
  def: (id) =>
    defineFact<ManifestSectionEntries>({
      format: "list",
      refresh: MANIFEST_REFRESH,
      source: manifestSource,
      value: (inputs) => {
        const manifest = inputs.manifest?.manifest;
        if (!manifest) {
          return undefined;
        }
        const entries = manifest.theorems.filter(
          (entry) => entry.section === id
        );
        const titled = (manifest.sections ?? []).some(
          (section) => section.id === id
        );
        if (entries.length === 0 && !titled) {
          throw new Error(
            `Unknown fact "manifest.section.${id}": the manifest has no section ${id}.`
          );
        }
        return {
          title:
            (manifest.sections ?? []).find((section) => section.id === id)
              ?.title ?? null,
          entries: entries.map((entry) => ({
            id: entry.id,
            name: entry.leanName,
            status: entry.status,
            checkedBy: entry.checkedBy,
            axioms: entry.axioms === null ? null : entry.axioms.join(", "),
            file: entry.file,
            line: entry.line,
            // Only a named limit carries its words: the page lists the limits.
            statement: entry.status === "deferred" ? entry.statement : null,
          })),
        };
      },
    }),
};
