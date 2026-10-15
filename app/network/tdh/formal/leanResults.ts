/**
 * The Lean 4 model of TDH-v1 and its results, as recorded in the model's
 * README and PROOFS.md in 6529's design repository at commit fbc9f34
 * (15 October 2026, Lean 4.35.0). Lean statements are quoted verbatim, without
 * their proofs. Updating them is a deliberate content change reviewed against
 * a new build of the model.
 */

export const LEAN_BUILD = {
  commit: "fbc9f34",
  date: "2026-10-15",
  leanVersion: "4.35.0",
  vectorsPassed: 51,
  vectorsTotal: 51,
  vectorChecks: 976,
  fullDayRecords: 21_410,
  fullDayTotal: 2_061_888_816,
  randomInputs: 1_000,
  randomChecks: 217_200,
  facts: 16,
} as const;

export type StatementStatus =
  | "proved"
  | "checkedBuild"
  | "checkedVectors"
  | "shownFalse";

export interface LeanStatement {
  /** Message key suffix: `network.tdh.formal.st.<id>.*`. */
  readonly id: string;
  readonly group: "p26" | "p53";
  readonly refs: readonly string[];
  readonly status: StatementStatus;
  /** Theorem names, as in the model. */
  readonly names: readonly string[];
  /** Where the statement lives in the model. */
  readonly file: string;
  /** The Lean statement, verbatim, without its proof. */
  readonly lean: string | null;
}

export const LEAN_STATEMENTS: readonly LeanStatement[] = [
  {
    id: "netting",
    group: "p26",
    refs: ["P26 §7.1", "D131"],
    status: "proved",
    names: [
      "replayHoldings_invariance",
      "netPairs_eq_of_net",
      "reorder_invariance",
      "roundTrip_invariance",
    ],
    file: "Tdh/Proofs/NetInvariance.lean, Tdh/Proofs/Netting.lean",
    lean: `theorem replayHoldings_invariance (p : Params) (cm : ClusterMap) (c₁ c₂ : Array Transfer)
    (hg : Corresponds (groupByTransaction c₁) (groupByTransaction c₂))
    (h₁ h₂ : Holdings)
    (hr₁ : replayHoldings p { netting := true } cm c₁ = .ok h₁)
    (hr₂ : replayHoldings p { netting := true } cm c₂ = .ok h₂) :
    ∀ k w, h₁.stack k w = h₂.stack k w`,
  },
  {
    id: "replay",
    group: "p26",
    refs: ["P26 §7.1"],
    status: "proved",
    names: ["replay_ok", "run_netTransactions", "netting_keeps_sizes"],
    file: "Tdh/Proofs/Replay.lean",
    lean: `theorem replay_ok (p : Params) (v : Variant) (cm : ClusterMap) (canonical : Array Transfer)
    (counts : Counts) (hU : underflowCounts canonical = .ok counts)
    (hN : v.netting = true → checkNetting canonical = .ok ()) :
    ∃ h, replayHoldings p v cm canonical = .ok h ∧
      ∀ k w, isSink w = false → ((h.stack k w).size : Int) = balance canonical.toList k w`,
  },
  {
    id: "conservation",
    group: "p26",
    refs: ["P26 §3.4", "P26 §7.1"],
    status: "proved",
    names: ["held_eq_inflow_sub_outflow"],
    file: "Tdh/Proofs/Replay.lean",
    lean: `theorem held_eq_inflow_sub_outflow (p : Params) (v : Variant) (cm : ClusterMap)
    (canonical : Array Transfer) (counts : Counts) (h : Holdings)
    (hU : underflowCounts canonical = .ok counts) (hR : replayHoldings p v cm canonical = .ok h)
    (k : TokenKey) :
    (((participants canonical.toList).filter (fun w => isSink w = false)).map
        fun w => ((h.stack k w).size : Int)).sum =
      inflow canonical.toList k - outflow canonical.toList k ∧
    ∀ w, w ∉ participants canonical.toList → isSink w = false → (h.stack k w).size = 0`,
  },
  {
    id: "totals",
    group: "p26",
    refs: ["P26 §8.5", "P26 §8.7"],
    status: "proved",
    names: ["computeCycle_totals"],
    file: "Tdh/Proofs/Totals.lean",
    lean: `theorem computeCycle_totals (p : Params) (v : Variant) (input : CycleInput) (out : CycleOutput)
    (h : computeCycle p v input = .ok out) :
    out.totals.final = (out.identities.toList.map (·.2.final)).sum ∧
    out.totals.finalExcludingSinks =
      (out.identities.toList.map fun e => if sinkKeys.contains e.1 then 0 else e.2.final).sum ∧
    out.totals.base = (out.identities.toList.map (·.2.base)).sum ∧
    out.totals.raw = (out.identities.toList.map (·.2.raw)).sum ∧
    out.totals.final < RANGE_LIMIT`,
  },
  {
    id: "order",
    group: "p26",
    refs: ["P26 §3.1", "P26 §3.3", "P26 §6.1"],
    status: "proved",
    names: ["computeCycle_perm", "canonicalTransfers_perm", "keptEvents_perm"],
    file: "Tdh/Proofs/Order.lean",
    lean: `theorem computeCycle_perm (p : Params) (v : Variant) (input : CycleInput)
    (ts : List Transfer) (es : List DelegationEvent)
    (hts : ts.Perm input.transfers) (hes : es.Perm input.delegationEvents) :
    computeCycle p v { input with transfers := ts, delegationEvents := es } = computeCycle p v input`,
  },
  {
    id: "lifo",
    group: "p26",
    refs: ["P26 §7.1"],
    status: "proved",
    names: [
      "Stack.toList_push",
      "Stack.takeLast_some",
      "Stack.takeLast_none",
      "Stack.size_eq_length",
    ],
    file: "Tdh/Theorems.lean",
    lean: `theorem Stack.takeLast_some (s : Stack) (n : Nat) (moved : List Run) (rest : Stack)
    (h : s.takeLast n = some (moved, rest)) :
    rest.toList ++ expand moved = s.toList ∧ (expand moved).length = n

theorem Stack.takeLast_none (s : Stack) (n : Nat) (h : s.takeLast n = none) :
    s.toList.length < n`,
  },
  {
    id: "facts",
    group: "p26",
    refs: ["P26 §8.1", "P26 §8.3", "P26 §8.4", "P26 §10"],
    status: "checkedBuild",
    names: [],
    file: "Tdh/Facts.lean",
    lean: null,
  },
  {
    id: "identitySums",
    group: "p26",
    refs: ["P26 §7.3"],
    status: "checkedVectors",
    names: [],
    file: "Tdh/Cycle.lean",
    lean: null,
  },
  {
    id: "minted",
    group: "p26",
    refs: ["P26 §3.4"],
    status: "shownFalse",
    names: [],
    file: "Tdh/Proofs/Counterexamples.lean",
    lean: null,
  },
  {
    id: "walletSum",
    group: "p26",
    refs: ["P26 §7.3", "P26 §8.5"],
    status: "shownFalse",
    names: [],
    file: "Tdh/Proofs/Counterexamples.lean",
    lean: null,
  },
  {
    id: "firstRule",
    group: "p26",
    refs: ["P26 §7.1", "D131"],
    status: "shownFalse",
    names: [],
    file: "Tdh/Proofs/Counterexamples.lean",
    lean: null,
  },
  {
    id: "cap",
    group: "p53",
    refs: ["P53 §6.3"],
    status: "proved",
    names: ["cap_bound", "waterFill_spec", "largestRemainder_sum"],
    file: "P53/Cap.lean",
    lean: `theorem cap_bound (parties : List (Nat × Nat)) (h6 : 6 ≤ (sortedWeights parties).length) :
    ∀ p ∈ parties, 10000 * counted parties p.2 ≤ 1999 * countedTotal parties`,
  },
  {
    id: "exclusions",
    group: "p53",
    refs: ["P53 §13"],
    status: "proved",
    names: [
      "steps_keep_exclusions",
      "step_opens_after",
      "pruned_recompute_shortens",
    ],
    file: "P53/Incidents.lean",
    lean: `theorem steps_keep_exclusions (incs : List Incident) (fs : List Fault) (c : Nat)
    (h : excluded incs c) : excluded (fs.foldl step incs) c`,
  },
];

/**
 * P26 §7.1's first netting rule against the current one, from
 * Tdh/Proofs/Counterexamples.lean: two inputs that differ only inside one
 * transaction, and the totals each rule gives them.
 */
export const FIRST_RULE_CASES = [
  { id: "A", first: [20, 190], current: [20, 20] },
  { id: "B", first: [20, 10], current: [10, 10] },
  { id: "C", first: [50, 100], current: [100, 100] },
  { id: "D", first: [320, 490], current: [320, 320] },
  { id: "E", first: [100, 20], current: [100, 100] },
] as const;

/** The model's files and the P26 sections they cover (README, "Layout"). */
export const MODEL_MODULES = [
  { module: "Tdh.Basic, Tdh.Binary64", key: "basic", section: "§1" },
  {
    module: "Tdh.Registry, Tdh.RegistryHash",
    key: "registry",
    section: "§2, §10",
  },
  { module: "Tdh.Inputs", key: "inputs", section: "§2, §3, §6.1" },
  { module: "Tdh.Cutoff", key: "cutoff", section: "§4" },
  { module: "Tdh.Eligibility", key: "eligibility", section: "§5" },
  { module: "Tdh.Consolidation", key: "consolidation", section: "§6" },
  {
    module: "Tdh.Stack, Tdh.Holdings",
    key: "holdings",
    section: "§3.2, §7.1, §7.2",
  },
  { module: "Tdh.Arithmetic", key: "arithmetic", section: "§8.1–§8.4" },
  { module: "Tdh.Scores", key: "scores", section: "§7.3, §8.3, §8.4, §8.6" },
  { module: "Tdh.Cycle", key: "cycle", section: "§7.3, §8.5, §8.7, §9" },
] as const;
