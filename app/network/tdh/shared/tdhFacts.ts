/**
 * The facts the TDH pages state about the specification and the programs
 * that implement it, in one place, so the pages cannot drift apart. Each
 * value names the commit it was read at. Updating one is a content change:
 * re-read the source, then change the value and the copy that cites it.
 *
 * Sources (6529's design repository, `6529chain`, and the validator code):
 * - P26 at f840096 (2026-10-16, its fifth round): §13 and
 *   `design/tdh-reference/README.md`; the commit records the Python
 *   reference's 89 of 89 with 1,257 checks and the Rust reference's 1,253.
 * - The validator's `crates/tdh-core/PORTING.md`: the version the daily job
 *   runs (validator e127676, deployed 2026-10-15) ports 6529chain 0621ed4,
 *   with 51 vectors and 976 checks; the validator's current code (round 4,
 *   merged at 28a6072 on 2026-10-15) ports a4db4ae and passes its 75, with
 *   1,207 checks. Program B (`crates/tdh-b`) passes the 75 of a4db4ae.
 *   Neither has followed P26's fifth round (vectors 75 to 88) yet.
 * - The validator's `tools/difftest/README.md`: four rounds of differential
 *   tests on 2026-10-15; P26's fifth round settled the fourth's findings
 *   (F8, F9, E12) on 2026-10-16.
 * - The Lean model's numbers come from its proof manifest, which the page
 *   reads from the feed; `LEAN_RUNS` in `formal/leanResults.ts` holds the
 *   runs the manifest does not carry.
 */

/** P26 as the pages describe it. */
export const P26 = {
  commit: "f840096",
  date: "2026-10-16",
  /** P26 changed six times on 15 October 2026 and once on 16 October. */
  changesOn15October: 6,
  changesOn16October: 1,
  vectorCount: 89,
  /** Vector files: 01 to 88, and 12b. */
  lastVector: 88,
  pythonChecks: 1_257,
  rustReferenceChecks: 1_253,
} as const;

/** P26's fourth round, which the validator's current code follows. */
export const P26_ROUND_4 = {
  commit: "a4db4ae",
  vectorCount: 75,
  rustChecks: 1_207,
} as const;

/** The P26 round each program follows, and the vectors it passes. */
export const PROGRAM_CONFORMANCE = {
  python: { specCommit: P26.commit, vectors: 89, checks: P26.pythonChecks },
  rustReference: {
    specCommit: P26.commit,
    vectors: 89,
    checks: P26.rustReferenceChecks,
  },
  /** The version the daily job runs, and the validator's current code. */
  rustCoreDaily: { specCommit: "0621ed4", vectors: 51, checks: 976 },
  rustCoreCurrent: {
    specCommit: P26_ROUND_4.commit,
    vectors: P26_ROUND_4.vectorCount,
    checks: P26_ROUND_4.rustChecks,
    merged: "28a6072",
  },
  programBCurrent: {
    specCommit: P26_ROUND_4.commit,
    vectors: P26_ROUND_4.vectorCount,
    merged: "28a6072",
  },
  /** The Python reference the daily job runs. */
  pythonDaily: { specCommit: "0621ed4", vectors: 51 },
} as const;

/**
 * The four-way differential tests of 15 October 2026 (tools/difftest): the
 * P26 commit that settled each round's findings, and the findings.
 */
export const DIFFTEST_ROUNDS = [
  {
    cases: 40_000,
    edge: 5_000,
    settledBy: "16d70d0",
    findings: ["F1", "E1-E7"],
  },
  {
    cases: 30_000,
    edge: 5_000,
    settledBy: "1c69528",
    findings: ["F2-F5", "E8", "E9"],
  },
  {
    cases: 30_000,
    edge: 5_000,
    settledBy: "a4db4ae",
    findings: ["F6", "F7", "E10", "E11"],
  },
  {
    cases: 30_000,
    edge: 5_000,
    settledBy: "f840096",
    findings: ["F8", "F9", "E12"],
  },
] as const;
