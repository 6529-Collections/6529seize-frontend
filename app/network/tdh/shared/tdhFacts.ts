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
 * - The validator's development branch at 30bf8f9 (2026-10-16): the Rust
 *   core (`crates/tdh-core/PORTING.md`) ports 6529chain f840096 and passes
 *   all 89 vectors with 1,253 checks; program B (`crates/tdh-b`) passes all
 *   89 with 1,184 checks of its own count. The builds the daily job runs
 *   are read from each day's file, never fixed here.
 * - The validator's `tools/difftest/README.md`: five rounds of differential
 *   tests on 2026-10-15 and 16; P26's fifth round settled the fourth's
 *   findings (F8, F9, E12); the fifth found E13, open.
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

/**
 * The validator's development branch the pages describe: the merge of P26's
 * fifth round into the Rust core and program B (6529validator
 * claude/blissful-perlman-914dca at 30bf8f9, 16 October 2026).
 */
export const VALIDATOR_DEVELOPMENT = {
  commit: "30bf8f9",
  date: "2026-10-16",
} as const;

/** The P26 round each program follows, and the vectors it passes. */
export const PROGRAM_CONFORMANCE = {
  python: { specCommit: P26.commit, vectors: 89, checks: P26.pythonChecks },
  rustReference: {
    specCommit: P26.commit,
    vectors: 89,
    checks: P26.rustReferenceChecks,
  },
  /** The validator's development branch: crates/tdh-core/PORTING.md. */
  rustCoreCurrent: {
    specCommit: P26.commit,
    vectors: 89,
    checks: 1_253,
    merged: VALIDATOR_DEVELOPMENT.commit,
  },
  /** crates/tdh-b/README.md: its own count of the vectors' checks. */
  programBCurrent: {
    specCommit: P26.commit,
    vectors: 89,
    checks: 1_184,
    merged: VALIDATOR_DEVELOPMENT.commit,
  },
} as const;

/**
 * What a build the daily job has run computes TDH by, when it is known:
 * the P26 commit it follows and that commit's vectors. The pages never
 * name the daily job's builds themselves: they read them from each day's
 * file and look them up here, so a redeployed job shows its new builds at
 * once, with no annotation until one is added. Sources: the validator's
 * `crates/tdh-core/PORTING.md` at each commit (2b17216 and e127676 port
 * 6529chain 0621ed4, with the same tdh-core; 30bf8f9 ports f840096, and
 * 0d25aa6, deployed on 16 October 2026, changes only the daily tools after
 * it) and the 6529chain commit of the Python reference (0621ed4, 51
 * vectors; f840096, 89).
 */
const KNOWN_BUILDS: Readonly<
  Record<string, { readonly spec: string; readonly vectors: number }>
> = {
  "2b17216": { spec: "0621ed4", vectors: 51 },
  e127676: { spec: "0621ed4", vectors: 51 },
  "30bf8f9": { spec: "f840096", vectors: 89 },
  "0d25aa6": { spec: "f840096", vectors: 89 },
  "0621ed4": { spec: "0621ed4", vectors: 51 },
  f840096: { spec: "f840096", vectors: 89 },
};

/** The P26 commit and vectors of a daily build, when known. */
export function knownBuild(
  commit: string
): { readonly spec: string; readonly vectors: number } | null {
  return KNOWN_BUILDS[commit.slice(0, 7)] ?? null;
}

/**
 * The four-way differential tests of 15 and 16 October 2026 (the validator's
 * tools/difftest/README.md): the 6529chain commit that settled each round's
 * findings, and the findings. Each commit settled its round in P26, except
 * the second round's E8, which 1c69528 settled in the vector format and the
 * references. The fifth round's one finding, E13, is open.
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
  {
    cases: 30_000,
    edge: 5_000,
    settledBy: null,
    findings: ["E13"],
  },
] as const;
