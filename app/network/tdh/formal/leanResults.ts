/**
 * The formal model page's statements about the Lean 4 model of TDH-v1, and
 * the results its proof manifest does not carry.
 *
 * Each statement names the manifest entries it rests on: the theorems that
 * prove it, the counterexamples that refute a claim, and the claims the
 * model's PROOFS.md names as not proved. The page takes every status from
 * the manifest (`formal/manifest.json` on the TDH feed, or the copy bundled
 * with the page), and a statement whose entries the manifest does not
 * confirm shows as unverified. Lean statements are quoted verbatim from the
 * model at 6529chain 7bf579a, without their proofs.
 */

/**
 * Results of runs the manifest does not repeat, from the model's README at
 * 6529chain 237c997 ("Results, 2026-10-15").
 */
export const LEAN_RUNS = {
  readmeCommit: "237c997",
  /** The 2026-10-11 cycle from 414,007 raw logs. */
  fullDayRecords: 21_410,
  fullDayTotal: 2_061_888_816,
  /** About 15 s to read and parse the input, 30 s to compute. */
  fullDaySeconds: 45,
  /** Random differential inputs, seeds 6529 and 7, each under both rules. */
  randomInputs: 6_000,
  randomVectors: 12_000,
  randomChecks: 1_272_930,
} as const;

/** A statement's status as the page shows it. */
export type StatementStatus =
  | "proved"
  | "byDefinition"
  | "checkedBuild"
  | "shownFalse"
  | "deferred"
  | "unverified";

export interface LeanStatement {
  /** Message key suffix: `network.tdh.formal.st.<id>.*`. */
  readonly id: string;
  readonly group: "p26" | "p53";
  readonly refs: readonly string[];
  /** The status the statement claims, once the manifest confirms it. */
  readonly status: Exclude<StatementStatus, "unverified">;
  /** Theorems the statement rests on; the manifest must say each is proved. */
  readonly proved: readonly string[];
  /** Counterexamples: theorems, or #guard cases by id (`1.case-H`). */
  readonly counterexamples: readonly string[];
  /** Claims PROOFS.md names as not proved here, by manifest id. */
  readonly deferred: readonly string[];
  /** Where the statement lives in the model. */
  readonly file: string;
  /** The Lean statement, verbatim, without its proof. */
  readonly lean: string | null;
}

const COUNTEREXAMPLES_FILE = "Tdh/Proofs/Counterexamples.lean";
const NONE: readonly string[] = [];

export const LEAN_STATEMENTS: readonly LeanStatement[] = [
  {
    id: "netting",
    group: "p26",
    refs: ["P26 §7.1", "D131"],
    status: "proved",
    proved: [
      "replayHoldings_invariance",
      "replay_invariance",
      "net_invariance",
      "netPairs_eq_of_net",
      "reorder_invariance",
      "roundTrip_invariance",
      "netChange_perm",
      "netChange_add_outAndBack",
      "netMovements_netChange",
      "netMovements_oneWay",
      "netMovements_token",
      "netTransaction_single",
      "applyTransfer_of_effect",
      "applyTransfer_local",
      "applyTransfer_frame",
      "replay_project",
    ],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Proofs/NetInvariance.lean, Tdh/Proofs/Netting.lean",
    lean: `theorem replayHoldings_invariance (p : Params) (cm : ClusterMap) (c₁ c₂ : Array Transfer)
    (hg : Corresponds (groupByTransaction c₁) (groupByTransaction c₂))
    (h₁ h₂ : Holdings)
    (hr₁ : replayHoldings p { netting := true } cm c₁ = .ok h₁)
    (hr₂ : replayHoldings p { netting := true } cm c₂ = .ok h₂) :
    ∀ k w, h₁.stack k w = h₂.stack k w`,
  },
  {
    id: "beyondStacks",
    group: "p26",
    refs: ["P26 §7.1", "P26 §5"],
    status: "shownFalse",
    proved: NONE,
    counterexamples: ["1.case-H", "1.case-I"],
    deferred: NONE,
    file: COUNTEREXAMPLES_FILE,
    lean: null,
  },
  {
    id: "balanceRaw",
    group: "p26",
    refs: ["P26 §7.1", "P26 §7.2"],
    status: "deferred",
    proved: NONE,
    counterexamples: NONE,
    deferred: ["1.balance-raw-same-eligibility"],
    file: "PROOFS.md",
    lean: null,
  },
  {
    id: "replay",
    group: "p26",
    refs: ["P26 §7.1"],
    status: "proved",
    proved: ["replay_ok", "run_netTransactions", "netting_keeps_sizes"],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Proofs/Replay.lean",
    lean: `theorem replay_ok (p : Params) (v : Variant) (cm : ClusterMap) (canonical : Array Transfer)
    (counts : Counts) (hU : underflowCounts p canonical = .ok counts)
    (hN : v.netting = true → checkNetting canonical = .ok ()) :
    ∃ h, replayHoldings p v cm canonical = .ok h ∧
      ∀ k w, p.isSink w = false → ((h.stack k w).size : Int) = balance canonical.toList k w`,
  },
  {
    id: "conservation",
    group: "p26",
    refs: ["P26 §3.4", "P26 §7.1"],
    status: "proved",
    proved: ["held_eq_inflow_sub_outflow"],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Proofs/Replay.lean",
    lean: `theorem held_eq_inflow_sub_outflow (p : Params) (v : Variant) (cm : ClusterMap)
    (canonical : Array Transfer) (counts : Counts) (h : Holdings)
    (hU : underflowCounts p canonical = .ok counts) (hR : replayHoldings p v cm canonical = .ok h)
    (k : TokenKey) :
    (((participants canonical.toList).filter (fun w => p.isSink w = false)).map
        fun w => ((h.stack k w).size : Int)).sum =
      inflow p canonical.toList k - outflow p canonical.toList k ∧
    ∀ w, w ∉ participants canonical.toList → p.isSink w = false → (h.stack k w).size = 0`,
  },
  {
    id: "identitySums",
    group: "p26",
    refs: ["P26 §7.3"],
    status: "proved",
    proved: [
      "computeCycle_identity_sums",
      "computeRecords_identity_sums",
      "computeRecords_wallet_identity",
      "makeRecord_ok",
      "tableOf_sum",
      "tableOf_getD",
    ],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Proofs/Records.lean",
    lean: `theorem computeCycle_identity_sums (p : Params) (v : Variant) (input : CycleInput) (out : CycleOutput)
    (h : computeCycle p v input = .ok out) :
    (∀ key ri, out.identities[key]? = some ri →
      ∃ ms : List Address, ms.Nodup ∧ (∀ w, w ∈ ms ↔ w ∈ out.wallets ∧ out.clusters.identityKey w = key) ∧
        ∃ rws : List Record, ListRel (fun w rw => out.wallets[w]? = some rw) ms rws ∧
          ri.balance = (rws.map (·.balance)).sum ∧ ri.raw = (rws.map (·.raw)).sum ∧
          ri.base = (rws.map (·.base)).sum ∧
          ∀ k, (ri.tokens.getD k {}).balance = (rws.map fun rw => (rw.tokens.getD k {}).balance).sum ∧
            (ri.tokens.getD k {}).raw = (rws.map fun rw => (rw.tokens.getD k {}).raw).sum ∧
            (ri.tokens.getD k {}).base = (rws.map fun rw => (rw.tokens.getD k {}).base).sum) ∧
    (∀ w, w ∈ out.wallets → ∃ ri, out.identities[out.clusters.identityKey w]? = some ri)`,
  },
  {
    id: "order",
    group: "p26",
    refs: ["P26 §3.1", "P26 §3.3", "P26 §6.1"],
    status: "proved",
    proved: [
      "computeCycle_perm",
      "canonicalTransfers_perm",
      "checkPositions_perm",
      "keptEvents_perm",
    ],
    counterexamples: NONE,
    deferred: ["4.raw-log-order"],
    file: "Tdh/Proofs/Order.lean",
    lean: `theorem computeCycle_perm (p : Params) (v : Variant) (input : CycleInput)
    (ts : List Transfer) (es : List DelegationEvent) (is : List Position)
    (hts : ts.Perm input.transfers) (hes : es.Perm input.delegationEvents)
    (his : is.Perm input.ignoredLogs) :
    computeCycle p v { input with transfers := ts, delegationEvents := es, ignoredLogs := is } =
      computeCycle p v input`,
  },
  {
    id: "lifo",
    group: "p26",
    refs: ["P26 §7.1"],
    status: "proved",
    proved: ["Stack.toList_push", "Stack.takeLast_some", "Stack.takeLast_none"],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Theorems.lean",
    lean: `theorem Stack.takeLast_some (s : Stack) (n : Nat) (moved : List Run) (rest : Stack)
    (h : s.takeLast n = some (moved, rest)) :
    rest.toList ++ expand moved = s.toList ∧ (expand moved).length = n

theorem Stack.takeLast_none (s : Stack) (n : Nat) (h : s.takeLast n = none) :
    s.toList.length < n`,
  },
  {
    id: "totals",
    group: "p26",
    refs: ["P26 §8.5", "P26 §8.7"],
    status: "byDefinition",
    proved: ["computeCycle_totals", "cycleTotals_eq"],
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Proofs/Totals.lean",
    lean: `theorem computeCycle_totals (p : Params) (v : Variant) (input : CycleInput) (out : CycleOutput)
    (h : computeCycle p v input = .ok out) :
    out.totals.final = (out.identities.toList.map (·.2.final)).sum ∧
    out.totals.finalExcludingSinks =
      (out.identities.toList.map fun e => if p.sinkKeys.contains e.1 then 0 else e.2.final).sum ∧
    out.totals.base = (out.identities.toList.map (·.2.base)).sum ∧
    out.totals.raw = (out.identities.toList.map (·.2.raw)).sum ∧
    out.totals.final < RANGE_LIMIT`,
  },
  {
    id: "facts",
    group: "p26",
    refs: [
      "P26 §3.1",
      "P26 §7.1",
      "P26 §8.1",
      "P26 §8.3",
      "P26 §8.4",
      "P26 §10",
    ],
    status: "checkedBuild",
    proved: NONE,
    counterexamples: NONE,
    deferred: NONE,
    file: "Tdh/Facts.lean",
    lean: null,
  },
  {
    id: "minted",
    group: "p26",
    refs: ["P26 §3.4"],
    status: "shownFalse",
    proved: NONE,
    counterexamples: ["2.case-G"],
    deferred: NONE,
    file: COUNTEREXAMPLES_FILE,
    lean: null,
  },
  {
    id: "walletSum",
    group: "p26",
    refs: ["P26 §7.3", "P26 §8.5"],
    status: "shownFalse",
    proved: NONE,
    counterexamples: ["3.case-F"],
    deferred: NONE,
    file: COUNTEREXAMPLES_FILE,
    lean: null,
  },
  {
    id: "firstRule",
    group: "p26",
    refs: ["P26 §7.1", "D131"],
    status: "shownFalse",
    proved: NONE,
    counterexamples: [
      "firstRule_reorder",
      "firstRule_sinks",
      "firstRule_trigger",
      "firstRule_insert",
      "firstRule_mintBurn",
    ],
    deferred: NONE,
    file: COUNTEREXAMPLES_FILE,
    lean: null,
  },
  {
    id: "cap",
    group: "p53",
    refs: ["P53 §6.2", "P53 §6.3"],
    status: "proved",
    proved: [
      "roster_cap_live",
      "live_hasKeys",
      "roster_cap",
      "roster_total",
      "cap_bound",
      "level_bound",
      "waterFill_spec",
      "capLevel_eq",
      "largestRemainder_sum",
      "largestRemainder_slice",
      "groupSplit_sum",
      "partySlices_sum",
      "sixPasses_six",
      "sixPasses_level",
    ],
    counterexamples: ["fivePasses_wrong"],
    deferred: ["5a.inputs-taken-as-given"],
    file: "P53/Cap.lean",
    lean: `theorem roster_cap_live (r : Roster) (h6 : 6 ≤ (sortedWeights r.live.weights).length) :
    ∀ x ∈ r.live,
      10000 * ((partySlices (counted r.live.weights x.2.weight) x.2).map (·.2)).sum ≤ 1999 * r.live.W`,
  },
  {
    id: "exclusions",
    group: "p53",
    refs: ["P53 §13"],
    status: "proved",
    proved: [
      "steps_keep_exclusions",
      "steps_prefix",
      "step_joins",
      "step_during_exclusion",
      "step_opens_after",
      "ladder_values",
      "batch_order",
      "pruning_keeps_exclusions",
      "pruning_keeps_records",
      "run_eq_prune",
      "step_prune",
      "steps_prune",
      "prune_excluded",
      "pruneExample_kept_records",
    ],
    counterexamples: ["pruned_recompute_shortens"],
    deferred: ["5b.not-covered"],
    file: "P53/Incidents.lean",
    lean: `theorem steps_keep_exclusions (incs : List Incident) (fs : List Fault) (c : Nat)
    (h : excluded incs c) : excluded (fs.foldl step incs) c

theorem pruning_keeps_exclusions (evs : List Event) (ht : Timed evs) (c : Nat) (hc : lastPrune evs ≤ c) :
    excluded (evs.foldl Event.apply []) c ↔ excluded ((faultsOf evs).foldl step []) c`,
  },
];

/** The definitions the netting theorem's hypotheses use, verbatim. */
export const NETTING_DEFINITIONS = `def SameNet (tx₁ tx₂ : List Transfer) : Prop :=
  ∃ ts hh, (∀ m ∈ tx₁, m.timestamp = ts ∧ m.txHash = hh) ∧ (∀ m ∈ tx₂, m.timestamp = ts ∧ m.txHash = hh) ∧
    ∀ k w, netChange (tokenMovements tx₁ k) w = netChange (tokenMovements tx₂ k) w

inductive Corresponds : List (List Transfer) → List (List Transfer) → Prop
  | nil : Corresponds [] []
  | cons {tx₁ tx₂ : List Transfer} {gs₁ gs₂ : List (List Transfer)} :
      SameNet tx₁ tx₂ → Corresponds gs₁ gs₂ → Corresponds (tx₁ :: gs₁) (tx₂ :: gs₂)`;

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
    module: "Tdh.Registry, Tdh.Keccak, Tdh.RegistryHash",
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
  {
    module: "Tdh.Scores",
    key: "scores",
    section: "§7.3, §8.3, §8.4, §8.6, §8.7",
  },
  { module: "Tdh.Cycle", key: "cycle", section: "§7.3, §8.5, §8.7, §9" },
] as const;
