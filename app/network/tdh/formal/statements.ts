/** The twelve statements the Lean model's proofs are planned to establish (plan §8.1). */
export const PLANNED_STATEMENTS = [
  { id: "order", p26: "P26 §3.3" },
  { id: "conservation", p26: "P26 §3.4, §7.1" },
  { id: "netting", p26: "D131" },
  { id: "carry", p26: "P26 §7.1" },
  { id: "lifo", p26: "P26 §7.1" },
  { id: "days", p26: "P26 §4.3" },
  { id: "rounding", p26: "P26 §8" },
  { id: "boostBounds", p26: "P26 §8.3, §10" },
  { id: "identities", p26: "P26 §6.3" },
  { id: "sums", p26: "P26 §7.3, §8.4" },
  { id: "range", p26: "P26 §1, §8.7" },
  { id: "conformance", p26: "P26 §13" },
] as const;

export type StatementStatus = "planned" | "stated" | "proved" | "gap";

export interface StatementRow {
  readonly id: string;
  readonly title: string;
  readonly plain: string;
  readonly p26: string;
  readonly lean: string | null;
  readonly status: StatementStatus;
}

/** Lean modules being written, one per specification section. */
export const MODEL_MODULES = [
  { module: "Tdh.Inputs", key: "order", section: "§2, §3" },
  { module: "Tdh.Cutoff", key: "snapshot", section: "§4" },
  { module: "Tdh.Eligibility", key: "eligibility", section: "§5" },
  { module: "Tdh.Consolidation", key: "identities", section: "§6" },
  { module: "Tdh.Stack, Tdh.Holdings", key: "holdings", section: "§7" },
  { module: "Tdh.Arithmetic, Tdh.Binary64", key: "scores", section: "§8" },
] as const;
