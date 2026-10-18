/**
 * The rounds of the Lean 4 model of TDH v1.4 the formal model page knows,
 * and the results of each round's runs that its proof manifest does not
 * carry (the model's README and PROOFS.md at each round's commit). Which
 * round a manifest records is read from the manifest itself (`leanRound`
 * in `formalStatus.ts`); the statements are in `leanResults.ts`.
 */

/** A round of the model the page can show. */
export type LeanRound = 3 | 4 | 5 | 6;

/** A round of the model, from its commit in 6529's design repository. */
interface LeanRoundInfo {
  readonly round: LeanRound;
  readonly commit: string;
  readonly date: string;
  /** A theorem the round added: a manifest proving it is this round or later. */
  readonly theorem: string;
}

export const LEAN_ROUND_4: LeanRoundInfo = {
  round: 4,
  commit: "f854661",
  date: "2026-10-15",
  theorem: "computeCycleFromSource_perm",
};

/**
 * Round 5 (6529chain 6b32f3f, 2026-10-16 01:24 UTC), which follows P26
 * f840096, before D136: three wallets. Its proof manifest is the one the
 * feed publishes since 16 October 2026.
 */
export const LEAN_ROUND_5 = {
  round: 5,
  commit: "6b32f3f",
  date: "2026-10-16",
  theorem: "canonicalTransfers_oneLog",
  specCommit: "f840096",
  vectorsPassed: 89,
  vectorsTotal: 89,
  vectorChecks: 1_253,
  theoremsTdh: 55,
  theoremsP53: 30,
  facts: 46,
  /** SHA-256 of design/tdh-lean/proof-manifest.json at 6b32f3f. */
  manifestSha256:
    "6825ffa47980ea9c7baa35470a6ddd24e7383fcbbe95bec4e237dfd0a7f537e5",
} as const satisfies LeanRoundInfo & Record<string, unknown>;

/**
 * Round 6 (6529chain 2694e72, 2026-10-18 07:57 UTC), which follows P26
 * 3bfa7b0: TDH v1.4, with D136's four-wallet consolidation. Its proof
 * manifest is committed with the model (`design/tdh-lean/proof-manifest.json`);
 * the figures below are that manifest's, shown until the feed publishes it.
 */
export const LEAN_ROUND_6 = {
  round: 6,
  commit: "2694e72",
  date: "2026-10-18",
  theorem: "computeCycle_clusters",
  specCommit: "3bfa7b0",
  vectorsPassed: 104,
  vectorsTotal: 104,
  vectorChecks: 1_307,
  theoremsTdh: 61,
  theoremsP53: 30,
  facts: 54,
  /** SHA-256 of design/tdh-lean/proof-manifest.json at 2694e72. */
  manifestSha256:
    "cc5b11dca725c89bdbe11a8e013ca2633e690854ed921874632b7e58fa68f168",
} as const satisfies LeanRoundInfo & Record<string, unknown>;

/** The newest round of the model the page knows. */
export const LEAN_LATEST_ROUND: LeanRound = LEAN_ROUND_6.round;

export interface LeanRuns {
  /** The README commit whose "Results" section these figures are. */
  readonly readmeCommit: string;
  /** The logs in the 2026-10-11 cycle's file, after B included. */
  readonly logsRead: number;
  /** Those through the snapshot block B, which the cycle is computed from. */
  readonly logsThroughB: number;
  readonly fullDayRecords: number;
  readonly fullDayTotal: number;
  /** Seconds for the whole day from raw logs: about, or a range. */
  readonly fullDaySeconds: readonly [number, number];
  /** Random differential inputs, seeds 6529 and 7, each under both rules. */
  readonly randomInputs: number;
  readonly randomVectors: number;
  readonly randomChecks: number;
  /**
   * The whole-model audit (`Audit/All.lean`, from round 4): every theorem
   * and definition of the model, the P53 models and the vector runner on
   * Lean's three standard axioms; null for a round without it.
   */
  readonly wholeAudit: {
    readonly theorems: number;
    readonly definitions: number;
  } | null;
}

/**
 * Results of runs the manifest does not repeat, from the model's README:
 * round 3 at 6529chain 237c997, round 4 at f854661, round 5 at 6b32f3f,
 * round 6 at 2694e72.
 */
export const LEAN_RUNS: Readonly<Record<LeanRound, LeanRuns>> = {
  3: {
    readmeCommit: "237c997",
    // 414,007 logs through B, of 414,254 in the file; the later 247 are not
    // decoded.
    logsRead: 414_254,
    logsThroughB: 414_007,
    fullDayRecords: 21_410,
    fullDayTotal: 2_061_888_816,
    // About 15 s to read and parse the input, 30 s to compute.
    fullDaySeconds: [45, 45],
    randomInputs: 6_000,
    randomVectors: 12_000,
    randomChecks: 1_272_930,
    wholeAudit: null,
  },
  4: {
    readmeCommit: "f854661",
    // All 414,254 logs read at their types; the 414,007 through B decoded.
    logsRead: 414_254,
    logsThroughB: 414_007,
    fullDayRecords: 21_410,
    fullDayTotal: 2_061_888_816,
    // 19 to 29 s to read and parse, 38 to 42 s to type-check, decode and
    // compute.
    fullDaySeconds: [56, 72],
    randomInputs: 6_000,
    randomVectors: 12_000,
    // 195,510 (seed 6529) + 986,678 (seed 7).
    randomChecks: 1_182_188,
    // PROOFS.md at f854661, "How they are checked".
    wholeAudit: { theorems: 1_036, definitions: 1_458 },
  },
  5: {
    readmeCommit: "6b32f3f",
    // All 414,254 logs read at their types; the 414,007 through B decoded.
    logsRead: 414_254,
    logsThroughB: 414_007,
    fullDayRecords: 21_410,
    fullDayTotal: 2_061_888_816,
    // Under 3 s to read and parse with the strict parser, about 17 s to
    // type-check, select, decode and compute.
    fullDaySeconds: [20, 20],
    randomInputs: 6_000,
    randomVectors: 12_000,
    // 179,818 (seed 6529) + 947,332 (seed 7), against the Python reference
    // at f840096; all 40 + 210 files that are no vector fail.
    randomChecks: 1_127_150,
    // PROOFS.md at 6b32f3f, "How they are checked".
    wholeAudit: { theorems: 1_068, definitions: 1_538 },
  },
  6: {
    readmeCommit: "2694e72",
    // All 414,254 logs read at their types; the 414,007 through B decoded,
    // the 5,400 delegation events with their blocks' header timestamps.
    logsRead: 414_254,
    logsThroughB: 414_007,
    fullDayRecords: 21_410,
    fullDayTotal: 2_061_888_816,
    // About 36 s on the machine of these runs: about 4 to read and parse,
    // about 32 to type-check, select, decode and compute.
    fullDaySeconds: [36, 36],
    randomInputs: 6_000,
    randomVectors: 12_000,
    // 180,974 (seed 6529) + 911,756 (seed 7), against the Python reference
    // at 3bfa7b0; all 41 + 202 files that are no vector fail.
    randomChecks: 1_092_730,
    // PROOFS.md at 2694e72, "How they are checked".
    wholeAudit: { theorems: 1_156, definitions: 1_576 },
  },
};
