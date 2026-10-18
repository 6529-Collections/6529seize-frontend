/**
 * The formal model page's statements about the Lean 4 model of TDH v1.4;
 * the rounds of the model and their runs are in `leanRounds.ts`.
 *
 * Each statement names the manifest entries it rests on: the theorems that
 * prove it, the counterexamples that refute a claim, and the claims the
 * model's PROOFS.md names as not proved. The page takes every status from
 * the manifest (`formal/manifest.json` on the TDH feed, or the copy bundled
 * with the page), and a statement whose entries the manifest does not
 * confirm shows as unverified. Lean statements are quoted verbatim, without
 * their proofs, from the model at 6529chain 7bf579a; those of rounds 4, 5
 * and 6 from f854661, 6b32f3f and 2694e72, where the earlier ones read the
 * same.
 *
 * The page knows four rounds of the model. Round 3 (manifest at 7bf579a)
 * starts from decoded inputs; round 4 (6529chain f854661) starts from raw
 * logs and proves their order cannot matter; round 5 (6b32f3f) follows P26's
 * fifth round and proves that transfers at one log position share their
 * contract, sender and recipient; round 6 (2694e72) follows D136's
 * four-wallet consolidation and D137's names (TDH v1.4) and proves the
 * limits of its clusters. Which one a manifest records is read from the
 * manifest itself (`leanRound` in `formalStatus.ts`).
 */

import type { LeanRound } from "./leanRounds";

/** A statement's status as the page shows it. */
/**
 * A statement's status. `shownFalseEval` is a claim shown false only by
 * counterexamples the build evaluates (#guard), which trusts Lean's
 * compiler: the page derives it from the manifest, never states it.
 */
export type StatementStatus =
  | "proved"
  | "byDefinition"
  | "checkedBuild"
  | "shownFalse"
  | "shownFalseEval"
  | "deferred"
  | "unverified";

/** What a statement changes in a later round of the model. */
type RoundChanges = Partial<
  Pick<LeanStatement, "copy" | "refs" | "proved" | "deferred" | "file" | "lean">
>;

export interface LeanStatement {
  readonly id: string;
  /** Message key suffix, `network.tdh.formal.st.<copy>.*`; the id if unset. */
  readonly copy?: string;
  /** The rounds of the model the statement is about; every round if unset. */
  readonly rounds?: readonly LeanRound[];
  /** Its entries and wording from round 4 on, where they differ. */
  readonly round4?: RoundChanges;
  /** Its entries and wording in round 5, on top of round 4's. */
  readonly round5?: RoundChanges;
  /** Its entries and wording in round 6, on top of round 5's. */
  readonly round6?: RoundChanges;
  readonly group: "p26" | "p53";
  /**
   * `lemma` for a statement about the model's own representation rather
   * than a property of the rule; the page does not count it as a property.
   */
  readonly kind?: "property" | "lemma";
  readonly refs: readonly string[];
  /** The status the statement claims, once the manifest confirms it. */
  readonly status: Exclude<StatementStatus, "unverified" | "shownFalseEval">;
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
    round4: { deferred: ["1.canonical-sort"] },
    file: "Tdh/Proofs/NetInvariance.lean, Tdh/Proofs/Netting.lean",
    lean: `theorem replayHoldings_invariance
    (p : Params) (cm : ClusterMap) (c₁ c₂ : Array Transfer)
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
    round4: { deferred: ["3.identity-wallets-field"] },
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
    round4: {
      copy: "orderRaw",
      refs: ["P26 §3.1", "P26 §3.2", "P26 §3.3", "P26 §6.1"],
      proved: [
        "computeCycleFromSource_perm",
        "decode_perm",
        "decodeLogs_perm",
        "mapM_perm",
        "checkLogTypes_perm",
        "checkLogPositions_perm",
        "logBlocks_perm",
        "checkSelected_perm",
        "checkRawOrDecoded_perm",
        "computeCycle_perm",
        "canonicalTransfers_perm",
        "checkPositions_perm",
        "checkInputTypes_perm",
        "keptEvents_perm",
      ],
      deferred: ["4.error-names"],
      file: "Tdh/Proofs/Order.lean, Tdh/Proofs/Decoding.lean",
      lean: `theorem computeCycleFromSource_perm (p : Params) (v : Variant) (src₁ src₂ : CycleSource)
    (hB : src₁.cutoffBlock = src₂.cutoffBlock) (hT : src₁.cutoffTime = src₂.cutoffTime)
    (hH : src₁.headers = src₂.headers) (hC : src₁.claimTotalMax = src₂.claimTotalMax)
    (hl : src₁.logs.Perm src₂.logs) (ht : src₁.transfers.Perm src₂.transfers)
    (he : src₁.delegationEvents.Perm src₂.delegationEvents) :
    (computeCycleFromSource p v src₁).toOption = (computeCycleFromSource p v src₂).toOption`,
    },
    round5: {
      copy: "orderOneLog",
      proved: [
        "computeCycleFromSource_perm",
        "decode_perm",
        "decodeLogs_perm",
        "mapM_perm",
        "checkLogTypes_perm",
        "checkLogPositions_perm",
        "logBlocks_perm",
        "checkSelected_perm",
        "checkRawOrDecoded_perm",
        "computeCycle_perm",
        "canonicalTransfers_perm",
        "checkPositions_perm",
        "checkInputTypes_perm",
        "keptEvents_perm",
        "canonicalTransfers_oneLog",
        "oneLog_of_neighbours",
      ],
      deferred: ["4.error-names", "4.maps-fixed"],
      lean: `theorem computeCycleFromSource_perm (p : Params) (v : Variant) (src₁ src₂ : CycleSource)
    (hB : src₁.cutoffBlock = src₂.cutoffBlock) (hT : src₁.cutoffTime = src₂.cutoffTime)
    (hH : src₁.headers = src₂.headers) (hC : src₁.claimTotalMax = src₂.claimTotalMax)
    (hl : src₁.logs.Perm src₂.logs) (ht : src₁.transfers.Perm src₂.transfers)
    (he : src₁.delegationEvents.Perm src₂.delegationEvents) :
    (computeCycleFromSource p v src₁).toOption = (computeCycleFromSource p v src₂).toOption

theorem canonicalTransfers_oneLog (input : CycleInput) (out : Array Transfer)
    (h : canonicalTransfers input = .ok out) :
    ∀ a ∈ out.toList, ∀ b ∈ out.toList, a.logPart.1 = b.logPart.1 → a.logPart.2 = b.logPart.2`,
    },
    file: "Tdh/Proofs/Order.lean",
    lean: `theorem computeCycle_perm (p : Params) (v : Variant) (input : CycleInput)
    (ts : List Transfer) (es : List DelegationEvent) (is : List Position)
    (hts : ts.Perm input.transfers) (hes : es.Perm input.delegationEvents)
    (his : is.Perm input.ignoredLogs) :
    computeCycle p v { input with transfers := ts, delegationEvents := es, ignoredLogs := is } =
      computeCycle p v input`,
  },
  {
    id: "rawLogs",
    group: "p26",
    rounds: [4, 5, 6],
    refs: ["P26 §3.1", "P26 §3.2", "P26 §4.2", "P26 §6.1", "P26 §10"],
    status: "proved",
    proved: [
      "computeCycleFromSource_decoded",
      "computeCycle_typed",
      "computeCycleFromSource_typed",
    ],
    counterexamples: NONE,
    deferred: ["6.rules-are-definitions", "6.json-reader"],
    file: "Tdh/Logs.lean, Tdh/Proofs/Decoding.lean",
    lean: `theorem computeCycleFromSource_decoded (p : Params) (v : Variant) (src : CycleSource)
    (hl : src.logs = [])
    (hh : (src.headers.toList.all fun (b, t) => isUint 64 b && isUint 64 t) = true) :
    computeCycleFromSource p v src =
      (do p.check
          computeCycle p v { cutoffBlock := src.cutoffBlock, cutoffTime := src.cutoffTime,
                             transfers := src.transfers, delegationEvents := src.delegationEvents,
                             claimTotalMax := src.claimTotalMax, ignoredLogs := [] })

theorem computeCycle_typed (p : Params) (v : Variant) (input : CycleInput) (out : CycleOutput)
    (h : computeCycle p v input = .ok out) :
    p.checkTypes = .ok () ∧ checkInputTypes input = .ok ()

theorem computeCycleFromSource_typed (p : Params) (v : Variant) (src : CycleSource)
    (out : CycleOutput) (h : computeCycleFromSource p v src = .ok out) :
    checkLogTypes src.logs src.headers = .ok () ∧ ∃ input, src.decode p = .ok input ∧
      p.checkTypes = .ok () ∧ checkInputTypes input = .ok ()`,
  },
  {
    id: "lifo",
    group: "p26",
    kind: "lemma",
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
    round4: {
      copy: "factsTyped",
      refs: [
        "P26 §3.1",
        "P26 §4.1",
        "P26 §7.1",
        "P26 §8.1",
        "P26 §8.3",
        "P26 §8.4",
        "P26 §10",
      ],
    },
    round5: {
      copy: "factsRound5",
      refs: [
        "P26 §3.1",
        "P26 §3.2",
        "P26 §4.1",
        "P26 §5.2",
        "P26 §7.1",
        "P26 §8.1",
        "P26 §8.3",
        "P26 §8.4",
        "P26 §10",
      ],
    },
    round6: {
      copy: "factsRound6",
      refs: [
        "P26 §3.1",
        "P26 §3.2",
        "P26 §4.1",
        "P26 §5.2",
        "P26 §6.2",
        "P26 §6.3",
        "P26 §7.1",
        "P26 §8.1",
        "P26 §8.3",
        "P26 §8.4",
        "P26 §10",
      ],
    },
    file: "Tdh/Facts.lean",
    lean: null,
  },
  {
    // D136's limits (PROOFS.md section 7 at 2694e72): a cluster's size, its
    // confirmed links, and the gate past the ungated size.
    id: "clusters",
    group: "p26",
    rounds: [6],
    refs: ["P26 §6.2", "P26 §6.3", "P26 §10", "D136"],
    status: "proved",
    proved: [
      "computeCycle_clusters",
      "computeCycle_before_activation",
      "clusters_spec",
      "buildClusterMap_spec",
      "pairState_rows",
      "keptEvents_ok",
    ],
    counterexamples: NONE,
    deferred: ["7.greedy-order", "7.pair-key-order", "7.backend-code"],
    file: "Tdh/Proofs/Clusters.lean",
    lean: `theorem computeCycle_clusters (p : Params) (v : Variant) (input : CycleInput) (out : CycleOutput)
    (h : computeCycle p v input = .ok out) :
    ∃ kept, keptEvents p input.cutoffBlock input.cutoffTime input.delegationEvents = .ok kept ∧
      (∀ e ∈ kept, ∀ t, e.time = some t → t ≤ input.cutoffTime) ∧
      ∀ c ∈ out.clusters.clusters.toList, c.Nodup ∧ c.length ≤ p.consolidationMaxWallets ∧
        (∀ x ∈ c, ∀ y ∈ c, x ≠ y → ConfirmedLink (pairState kept) x y) ∧
        (p.consolidationUngatedMaxWallets < c.length →
          ∃ m ∈ c, ∀ x ∈ c, x ≠ m →
            FreshLink p.consolidationGateActivationS (pairState kept) m x)

theorem computeCycle_before_activation (p : Params) (v : Variant) (input : CycleInput)
    (out : CycleOutput) (h : computeCycle p v input = .ok out)
    (hT : input.cutoffTime < p.consolidationGateActivationS) :
    ∀ c ∈ out.clusters.clusters.toList, c.length ≤ p.consolidationUngatedMaxWallets`,
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

/** The statements about a round of the model, with that round's entries. */
export function statementsFor(round: LeanRound): readonly LeanStatement[] {
  return LEAN_STATEMENTS.filter(
    (statement) => statement.rounds?.includes(round) ?? true
  ).map((statement) => ({
    ...statement,
    ...(round >= 4 ? statement.round4 : undefined),
    ...(round >= 5 ? statement.round5 : undefined),
    ...(round >= 6 ? statement.round6 : undefined),
  }));
}

/** The definitions the netting theorem's hypotheses use, verbatim. */
export const NETTING_DEFINITIONS = `def SameNet (tx₁ tx₂ : List Transfer) : Prop :=
  ∃ ts hh,
    (∀ m ∈ tx₁, m.timestamp = ts ∧ m.txHash = hh) ∧
    (∀ m ∈ tx₂, m.timestamp = ts ∧ m.txHash = hh) ∧
    ∀ k w, netChange (tokenMovements tx₁ k) w =
      netChange (tokenMovements tx₂ k) w

inductive Corresponds :
    List (List Transfer) → List (List Transfer) → Prop
  | nil : Corresponds [] []
  | cons {tx₁ tx₂ : List Transfer} {gs₁ gs₂ : List (List Transfer)} :
      SameNet tx₁ tx₂ → Corresponds gs₁ gs₂ →
        Corresponds (tx₁ :: gs₁) (tx₂ :: gs₂)`;

/**
 * P26 §7.1's first netting rule against the current one, from
 * Tdh/Proofs/Counterexamples.lean at 6b32f3f: two inputs that differ only
 * inside one transaction, and the values each rule gives them. Not every
 * pair is a total: the file's table marks case B's first-rule values as
 * ZERO's record (its current-rule values are the totals its `#guard`s
 * check) and case C's as identity {A, B}'s final after a later sale.
 * `measure` names the message (`network.tdh.formal.cases.measure.<key>`).
 */
export const FIRST_RULE_CASES = [
  { id: "A", first: [20, 190], current: [20, 20], measure: "total" },
  { id: "B", first: [20, 10], current: [10, 10], measure: "B" },
  { id: "C", first: [50, 100], current: [100, 100], measure: "C" },
  { id: "D", first: [320, 490], current: [320, 320], measure: "total" },
  { id: "E", first: [100, 20], current: [100, 100], measure: "total" },
] as const;

/**
 * The claims the manifest's counterexamples show false. The five cases of
 * the first netting rule (A to E) refute one claim; each other counterexample
 * refutes its own: H the property as P26 §7.1 first stated it (every value),
 * I the one stated after H (stacks, balances and raws), G held = minted -
 * burned, F total = sum of wallets, and the two validator-rule findings
 * (PROOFS.md at 6b32f3f, sections 1 to 3, 5a and 5b). A counterexample the
 * list does not name counts as a claim of its own.
 */
export const REFUTED_CLAIMS: readonly (readonly string[])[] = [
  [
    "firstRule_reorder",
    "firstRule_sinks",
    "firstRule_trigger",
    "firstRule_insert",
    "firstRule_mintBurn",
  ],
  ["1.case-H"],
  ["1.case-I"],
  ["2.case-G"],
  ["3.case-F"],
  ["fivePasses_wrong"],
  ["pruned_recompute_shortens"],
];

interface ModelModule {
  readonly module: string;
  /** Message key suffix: `network.tdh.formal.module.<key>`. */
  readonly key: string;
  readonly section: string;
  readonly rounds?: readonly LeanRound[];
}

/**
 * The model's files and the P26 sections they cover (README, "Layout", of
 * each round).
 */
const MODEL_MODULES: readonly ModelModule[] = [
  { module: "Tdh.Basic, Tdh.Binary64", key: "basic", section: "§1" },
  {
    module: "Tdh.Registry, Tdh.Keccak, Tdh.RegistryHash",
    key: "registry",
    section: "§2, §10",
  },
  {
    module: "Tdh.Inputs",
    key: "inputs",
    section: "§2, §3, §6.1",
    rounds: [3],
  },
  {
    module: "Tdh.Inputs",
    key: "inputsTyped",
    section: "§2, §3, §6.1",
    rounds: [4],
  },
  {
    // Round 5 reads the claims' totalMax at its type (§5.2) and adds the
    // one-log rule to the canonical order (README at 6b32f3f, "Layout").
    module: "Tdh.Inputs",
    key: "inputsOneLog",
    section: "§2, §3, §5.2, §6.1",
    rounds: [5, 6],
  },
  {
    module: "Tdh.Logs",
    key: "logs",
    section: "§3.1, §3.2, §4.2, §6.1",
    rounds: [4, 5, 6],
  },
  { module: "Tdh.Cutoff", key: "cutoff", section: "§4" },
  { module: "Tdh.Eligibility", key: "eligibility", section: "§5" },
  {
    module: "Tdh.Consolidation",
    key: "consolidation",
    section: "§6",
    rounds: [3, 4, 5],
  },
  {
    // Round 6: each direction's registration time, the pair-key order and
    // the four-wallet gate (D136; README at 2694e72, "Layout").
    module: "Tdh.Consolidation",
    key: "consolidationGate",
    section: "§4.2, §6",
    rounds: [6],
  },
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
];

/** The modules of a round of the model. */
export function modulesFor(round: LeanRound): readonly ModelModule[] {
  return MODEL_MODULES.filter((row) => row.rounds?.includes(round) ?? true);
}
