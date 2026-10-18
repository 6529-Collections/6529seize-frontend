/**
 * The facts the TDH pages state about the specification and the programs
 * that implement it, in one place, so the pages cannot drift apart. Each
 * value names the commit it was read at. Updating one is a content change:
 * re-read the source, then change the value and the copy that cites it.
 *
 * Sources (6529's design repository, `6529chain`, and the validator code):
 * - P26 at 3bfa7b0 (2026-10-18: D136's four-wallet consolidation and
 *   D137's names, TDH v1.4, rule version `tdh-v1.4`): §13 and
 *   `design/tdh-reference/README.md`; the commit records the Python
 *   reference's 104 of 104 with 1,311 checks and the Rust reference's 1,307.
 * - The validator's development branch at a1463f9 (2026-10-18, release
 *   0.1.0): the Rust core (`crates/tdh-core/PORTING.md`, 26d507d) ports
 *   6529chain 3bfa7b0 and passes all 104 vectors with 1,307 checks;
 *   program B (`crates/tdh-b`, dda1459) passes all 104 with 1,238 checks
 *   of its own count. The builds the daily job runs are read from each
 *   day's file, never fixed here.
 * - The validator's `tools/difftest/README.md`: five rounds of differential
 *   tests on 2026-10-15 and 16 and a sixth on 2026-10-18 (TDH v1.4); P26's
 *   fifth round settled the fourth's findings (F8, F9, E12); the fifth
 *   found E13, still open; the sixth found nothing new.
 * - The Lean model's numbers come from its proof manifest, which the page
 *   reads from the feed; `LEAN_RUNS` in `formal/leanResults.ts` holds the
 *   runs the manifest does not carry.
 */

/** P26 as the pages describe it. */
export const P26 = {
  commit: "3bfa7b0",
  date: "2026-10-18",
  /**
   * P26 changed six times on 15 October 2026, once on 16 October and once
   * on 18 October (D136, D137).
   */
  changesOn15October: 6,
  changesOn16October: 1,
  changesOn18October: 1,
  vectorCount: 104,
  /** Vector files: 01 to 103, and 12b. */
  lastVector: 103,
  pythonChecks: 1_311,
  rustReferenceChecks: 1_307,
} as const;

/**
 * The validator's development branch the pages describe: P26 at 3bfa7b0 in
 * the Rust core and program B, and the sixth round of differential tests
 * (6529validator a1463f9, 18 October 2026), the build the daily job runs
 * since that day. Its software is numbered below 1.0: release 0.1.0
 * (D137); "Validator v1" is the design's name.
 */
export const VALIDATOR_DEVELOPMENT = {
  commit: "a1463f9",
  date: "2026-10-18",
  release: "0.1.0",
} as const;

/** The P26 round each program follows, and the vectors it passes. */
export const PROGRAM_CONFORMANCE = {
  python: { specCommit: P26.commit, vectors: 104, checks: P26.pythonChecks },
  rustReference: {
    specCommit: P26.commit,
    vectors: 104,
    checks: P26.rustReferenceChecks,
  },
  /** The validator's development branch: crates/tdh-core/PORTING.md. */
  rustCoreCurrent: {
    specCommit: P26.commit,
    vectors: 104,
    checks: 1_307,
    merged: VALIDATOR_DEVELOPMENT.commit,
  },
  /** crates/tdh-b/README.md: its own count of the vectors' checks. */
  programBCurrent: {
    specCommit: P26.commit,
    vectors: 104,
    checks: 1_238,
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
 * it; 26d507d ports 3bfa7b0, and a1463f9, deployed on 18 October 2026,
 * adds program B and the difftest after it) and the 6529chain commit of
 * the Python reference (0621ed4, 51 vectors; f840096, 89; 3bfa7b0, 104).
 */
const KNOWN_BUILDS: Readonly<
  Record<string, { readonly spec: string; readonly vectors: number }>
> = {
  "2b17216": { spec: "0621ed4", vectors: 51 },
  e127676: { spec: "0621ed4", vectors: 51 },
  "30bf8f9": { spec: "f840096", vectors: 89 },
  "0d25aa6": { spec: "f840096", vectors: 89 },
  "26d507d": { spec: "3bfa7b0", vectors: 104 },
  a1463f9: { spec: "3bfa7b0", vectors: 104 },
  "0621ed4": { spec: "0621ed4", vectors: 51 },
  f840096: { spec: "f840096", vectors: 89 },
  "3bfa7b0": { spec: "3bfa7b0", vectors: 104 },
};

/** The P26 commit and vectors of a daily build, when known. */
export function knownBuild(
  commit: string
): { readonly spec: string; readonly vectors: number } | null {
  return KNOWN_BUILDS[commit.slice(0, 7)] ?? null;
}

/** The P26 commit a validator commit's Rust core follows, when known. */
export function rustCoreSpec(commit: string): string | null {
  return knownBuild(commit)?.spec ?? null;
}

/**
 * The four-way differential tests of 15, 16 and 18 October 2026 (the
 * validator's tools/difftest/README.md): the 6529chain commit that settled
 * each round's findings, and the findings. Each commit settled its round in
 * P26, except the second round's E8, which 1c69528 settled in the vector
 * format and the references. The fifth round's one finding, E13, is open;
 * the sixth, on TDH v1.4 (P26 3bfa7b0), found nothing new.
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
  {
    cases: 30_000,
    edge: 5_000,
    settledBy: null,
    findings: [],
  },
] as const satisfies readonly {
  readonly cases: number;
  readonly edge: number;
  readonly settledBy: string | null;
  readonly findings: readonly string[];
}[];
