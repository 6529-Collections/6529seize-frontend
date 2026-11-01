import type { FormalManifest } from "@/lib/tdh/formal/manifest";
import type { FactInputs } from "../factInputs";
import { MANIFEST_REFRESH, manifestSource } from "./helpers";
import { defineFact, type FactDef } from "./types";

/**
 * Facts read from the Lean proof manifest (`formal/manifest.json`): every
 * count and its date. Kernel and evaluation counterexamples are counted from
 * the entries themselves, so the counts and the list cannot disagree.
 */

type Theorem = FormalManifest["theorems"][number];
const theorems = (inputs: FactInputs): readonly Theorem[] | undefined =>
  inputs.manifest?.manifest.theorems;

/** The proof the TDH chapter features: netting changes no stack. */
const HEADLINE_THEOREM = "Tdh.Proofs.replayHoldings_invariance";

function count(
  pick: (manifest: FormalManifest) => number | undefined,
  unit: "theorems" | "vectors" | "checks" = "theorems"
): FactDef<number> {
  return defineFact<number>({
    format: "count",
    unit,
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) =>
      inputs.manifest ? pick(inputs.manifest.manifest) : undefined,
  });
}

function byStatus(
  status: Theorem["status"],
  checkedBy?: string
): (manifest: FormalManifest) => number {
  return (manifest) =>
    manifest.theorems.filter(
      (entry) =>
        entry.status === status &&
        (checkedBy === undefined || entry.checkedBy === checkedBy)
    ).length;
}

export interface ManifestSection {
  readonly id: string;
  readonly proved: number;
  readonly shownFalse: number;
  readonly limits: number;
  readonly [key: string]: string | number;
}

function sections(inputs: FactInputs): ManifestSection[] | undefined {
  const entries = theorems(inputs);
  if (!entries) {
    return undefined;
  }
  const ids = [...new Set(entries.map((entry) => entry.section))];
  return ids.map((id) => {
    const inSection = entries.filter((entry) => entry.section === id);
    return {
      id,
      proved: inSection.filter((entry) => entry.status === "proved").length,
      shownFalse: inSection.filter((entry) => entry.status === "counterexample")
        .length,
      limits: inSection.filter((entry) => entry.status === "deferred").length,
    };
  });
}

const headline = (inputs: FactInputs) =>
  theorems(inputs)?.find((entry) => entry.leanName === HEADLINE_THEOREM);

export const MANIFEST_FACTS = {
  "manifest.writtenAt": defineFact<string>({
    format: "instant",
    unit: "UTC",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.generatedAt,
  }),
  "manifest.sha256": defineFact<string>({
    format: "hash",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.sha256 ?? undefined,
  }),
  "manifest.commit": defineFact<string>({
    format: "commit",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.source.commit,
  }),
  "manifest.generator": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.generator ?? undefined,
  }),
  "manifest.lean": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => inputs.manifest?.manifest.lean.version,
  }),
  "manifest.proved": defineFact<number>({
    ...count((manifest) => manifest.summary.proved),
    evidence: "proved",
  }),
  "manifest.proved.tdh": count(
    (manifest) =>
      manifest.theorems.filter(
        (entry) => entry.status === "proved" && entry.library === "tdh"
      ).length
  ),
  "manifest.proved.p53": count(
    (manifest) =>
      manifest.theorems.filter(
        (entry) => entry.status === "proved" && entry.library === "p53"
      ).length
  ),
  "manifest.shownFalse.tdh": count(
    (manifest) =>
      manifest.theorems.filter(
        (entry) => entry.status === "counterexample" && entry.library === "tdh"
      ).length
  ),
  "manifest.shownFalse.p53": count(
    (manifest) =>
      manifest.theorems.filter(
        (entry) => entry.status === "counterexample" && entry.library === "p53"
      ).length
  ),
  // Distinct Lean statements: theorems are told apart by their Lean names.
  // The manifest's English descriptions are not counted, since related
  // theorems (a sum and its slice, the five permutation checks) share one.
  "manifest.distinct": count(
    (manifest) =>
      new Set(
        manifest.theorems
          .filter((entry) => entry.status === "proved")
          .map((entry) => entry.leanName ?? entry.id)
      ).size
  ),
  "manifest.noAxioms": count(
    (manifest) =>
      manifest.theorems.filter(
        (entry) =>
          entry.status === "proved" && (entry.axioms ?? []).length === 0
      ).length
  ),
  "manifest.shownFalse": defineFact<number>({
    ...count((manifest) => manifest.summary.counterexample),
    evidence: "shownFalse",
  }),
  "manifest.shownFalse.kernel": count(byStatus("counterexample", "kernel")),
  "manifest.shownFalse.evaluation": count(
    byStatus("counterexample", "evaluation")
  ),
  "manifest.limits": defineFact<number>({
    ...count((manifest) => manifest.summary.deferred),
    evidence: "notGuaranteed",
  }),
  "manifest.entries": count((manifest) => manifest.summary.entries),
  "manifest.audited": count((manifest) => manifest.summary.audited),
  "manifest.audited.tdh": count((manifest) => manifest.summary.auditedTdh),
  "manifest.audited.p53": count((manifest) => manifest.summary.auditedP53),
  "manifest.vectors.passed": count(
    (manifest) => manifest.vectors[0]?.passed,
    "vectors"
  ),
  "manifest.vectors.total": count(
    (manifest) => manifest.vectors[0]?.total,
    "vectors"
  ),
  "manifest.vectors.checks": count(
    (manifest) => manifest.vectors[0]?.checks,
    "checks"
  ),
  "manifest.sections": defineFact<ManifestSection[]>({
    format: "list",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: sections,
  }),
  "manifest.sections.count": count(
    (manifest) => new Set(manifest.theorems.map((entry) => entry.section)).size
  ),
  // The claims by whose rules they are about: TDH's (P26), or the proposed
  // validator rules' (P53).
  "manifest.sections.tdh": count(
    (manifest) =>
      new Set(
        manifest.theorems
          .filter((entry) => entry.library === "tdh")
          .map((entry) => entry.section)
      ).size
  ),
  "manifest.sections.p53": count(
    (manifest) =>
      new Set(
        manifest.theorems
          .filter((entry) => entry.library === "p53")
          .map((entry) => entry.section)
      ).size
  ),
  "manifest.headline.name": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    evidence: "proved",
    value: (inputs) => headline(inputs)?.leanName ?? undefined,
  }),
  "manifest.headline.file": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => headline(inputs)?.file?.split("/").pop(),
  }),
  "manifest.headline.line": defineFact<number>({
    format: "count",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => headline(inputs)?.line ?? undefined,
  }),
  "manifest.headline.axioms": defineFact<string>({
    format: "text",
    refresh: MANIFEST_REFRESH,
    source: manifestSource,
    value: (inputs) => {
      const entry = headline(inputs);
      return entry ? (entry.axioms ?? []).join(", ") : undefined;
    },
  }),
} as const;
