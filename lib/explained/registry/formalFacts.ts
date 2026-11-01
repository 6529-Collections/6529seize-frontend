import type { FormalManifest } from "@/lib/tdh/formal/manifest";
import lean from "../data/lean.json";
import reference from "../data/reference.json";
import type { FactInputs } from "../factInputs";
import { MANIFEST_REFRESH, manifestSource, source } from "./helpers";
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
 * The whole-model audit's counts, as the manifest's build states them in
 * words ("1,153 theorems and 1,584 definitions"): every theorem and
 * definition of the model rests only on Lean's standard axioms. Undefined
 * when the manifest does not say, so the page leaves the sentence out.
 */
const WHOLE_MODEL = /\(([\d,]+) theorems and ([\d,]+) definitions/;

function wholeModelCount(kind: "theorems" | "definitions"): FactDef<number> {
  return defineFact<number>({
    format: "count",
    ...(kind === "theorems" ? { unit: "theorems" as const } : {}),
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => {
      for (const line of inputs.manifest?.manifest.build.howChecked ?? []) {
        const match = WHOLE_MODEL.exec(line);
        const text = match?.[kind === "theorems" ? 1 : 2];
        if (text !== undefined) {
          return Number(text.replaceAll(",", ""));
        }
      }
      return undefined;
    },
  });
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
  /** The manifest's sentence for the entry, in plain words. */
  readonly statement: string | null;
  /**
   * The theorem as the model states it in Lean, at the manifest's commit
   * (`data/lean.json`); null for a limit, a #guard case, or while the copy
   * is from another commit than the manifest's.
   */
  readonly lean: string | null;
  readonly [key: string]: string | number | null;
}

export interface ManifestSectionEntries {
  readonly title: string | null;
  /** The rules the section is about: "P26 §7.1", "D131". */
  readonly refs: readonly string[];
  readonly entries: readonly StatementRow[];
  readonly [key: string]:
    | string
    | null
    | readonly string[]
    | readonly StatementRow[];
}

/**
 * The Lean statements copied at the manifest's commit, or none when the copy
 * is from another commit: a statement is printed only beside the manifest
 * that names its line.
 */
function leanStatements(
  inputs: FactInputs
): Readonly<Record<string, string>> | undefined {
  if (inputs.manifest?.manifest.source.commit !== lean.commit) {
    return undefined;
  }
  return lean.statements as Readonly<Record<string, string>>;
}

type VectorRun = FormalManifest["vectors"][number];

function vectorRunCount(
  id: string,
  pick: (run: VectorRun) => number,
  unit: "vectors" | "checks"
): FactDef<number> {
  return defineFact<number>({
    format: "count",
    unit,
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => {
      const run = inputs.manifest?.manifest.vectors.find(
        (item) => item.id === id
      );
      return run ? pick(run) : undefined;
    },
  });
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
  "manifest.facts.checks": defineFact<number>({
    format: "count",
    unit: "checks",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.facts.checks,
  }),
  "manifest.build.jobs": defineFact<number>({
    format: "count",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.build.jobs ?? undefined,
  }),
  "manifest.audit.axioms": defineFact<string[]>({
    format: "list",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) =>
      inputs.manifest
        ? [...inputs.manifest.manifest.build.audit.allowedAxioms]
        : undefined,
  }),
  "manifest.audit.wholeTheorems": wholeModelCount("theorems"),
  "manifest.audit.wholeDefinitions": wholeModelCount("definitions"),
  "manifest.audit.theorems": defineFact<number>({
    format: "count",
    unit: "theorems",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.build.audit.theorems,
  }),
  "manifest.vectors.reasons.passed": vectorRunCount(
    "p26-reasons",
    (run) => run.passed,
    "vectors"
  ),
  "manifest.vectors.reasons.total": vectorRunCount(
    "p26-reasons",
    (run) => run.total,
    "vectors"
  ),
  "manifest.vectors.reasons.checks": vectorRunCount(
    "p26-reasons",
    (run) => run.checks,
    "checks"
  ),
  "manifest.vectors.netting.passed": vectorRunCount(
    "netting",
    (run) => run.passed,
    "vectors"
  ),
  "manifest.vectors.netting.total": vectorRunCount(
    "netting",
    (run) => run.total,
    "vectors"
  ),
  "manifest.vectors.netting.checks": vectorRunCount(
    "netting",
    (run) => run.checks,
    "checks"
  ),
  /** Where the page read the manifest, for the browser to fetch it again. */
  "manifest.url": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.url ?? undefined,
  }),
  "manifest.leanStatements": defineFact<number>({
    format: "count",
    unit: "theorems",
    refresh: MANIFEST_REFRESH,
    source: () =>
      source(
        "manifest",
        `the Lean model at 6529's design record ${lean.commit.slice(0, 7)} (design/tdh-lean), each theorem read at the manifest's line`
      ),
    value: (inputs) => {
      const statements = leanStatements(inputs);
      return statements ? Object.keys(statements).length : undefined;
    },
  }),
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
        const statements = leanStatements(inputs);
        const titled = (manifest.sections ?? []).some(
          (section) => section.id === id
        );
        if (entries.length === 0 && !titled) {
          throw new Error(
            `Unknown fact "manifest.section.${id}": the manifest has no section ${id}.`
          );
        }
        const section = (manifest.sections ?? []).find(
          (item) => item.id === id
        );
        return {
          title: section?.title ?? null,
          refs: section?.refs ?? [],
          entries: entries.map((entry) => ({
            id: entry.id,
            name: entry.leanName,
            status: entry.status,
            checkedBy: entry.checkedBy,
            axioms: entry.axioms === null ? null : entry.axioms.join(", "),
            file: entry.file,
            line: entry.line,
            statement: entry.statement,
            lean: statements?.[entry.id] ?? null,
          })),
        };
      },
    }),
};
