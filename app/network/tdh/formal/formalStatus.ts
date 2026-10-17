import {
  conformanceRun,
  findFormalEntry,
  formalEntryMatches,
  type FormalManifest,
  type FormalStatus,
} from "@/lib/tdh/formal/manifest";
import {
  LEAN_ROUND_4,
  LEAN_ROUND_5,
  REFUTED_CLAIMS,
  type LeanRound,
  type LeanStatement,
  type StatementStatus,
} from "./leanResults";

/**
 * The round of the model a manifest records: 5 when it proves round 5's
 * one-log theorem, 4 when it proves round 4's order theorem for raw logs,
 * else 3.
 */
export function leanRound(manifest: FormalManifest): LeanRound {
  const proves = (name: string) =>
    findFormalEntry(manifest, name)?.status === "proved";
  if (proves(LEAN_ROUND_5.theorem)) {
    return 5;
  }
  return proves(LEAN_ROUND_4.theorem) ? 4 : 3;
}

/** One manifest entry behind a statement, as the statement's details show it. */
export interface CheckedEntry {
  /** The name the page uses: a theorem's short name or a case's id. */
  readonly name: string;
  /** What the statement needs it to be. */
  readonly expected: FormalStatus;
  /** What the manifest says; null when the manifest does not have it. */
  readonly status: FormalStatus | null;
  readonly leanName: string | null;
  readonly axioms: readonly string[] | null;
  /** `kernel` for a theorem, `evaluation` for a #guard check. */
  readonly checkedBy: string | null;
  /** How many #guard checks a counterexample case has. */
  readonly checks: number | null;
  readonly file: string | null;
  readonly line: number | null;
  /** The manifest's English reading of the theorem or case. */
  readonly statement: string | null;
}

export interface StatementCheck {
  readonly id: string;
  /** The statement's own status when the manifest confirms it. */
  readonly status: StatementStatus;
  readonly entries: readonly CheckedEntry[];
  /** Entries the manifest lacks or gives another status. */
  readonly unconfirmed: readonly string[];
}

function checkEntry(
  manifest: FormalManifest,
  name: string,
  expected: FormalStatus
): CheckedEntry {
  const entry = findFormalEntry(manifest, name);
  return {
    name,
    expected,
    status: entry?.status ?? null,
    leanName: entry?.leanName ?? null,
    axioms: entry?.axioms ?? null,
    checkedBy: entry?.checkedBy ?? null,
    checks: entry?.checks ?? null,
    file: entry?.file ?? null,
    line: entry?.line ?? null,
    statement: entry?.statement ?? null,
  };
}

/**
 * A statement checked against the manifest: its status stands only when every
 * theorem it rests on is proved, every counterexample it cites is one and
 * every claim it calls unproved is deferred. P26's stated facts need the
 * build's facts to have run. Anything else shows as unverified.
 */
export function checkStatement(
  statement: LeanStatement,
  manifest: FormalManifest
): StatementCheck {
  const entries = [
    ...statement.proved.map((name) => checkEntry(manifest, name, "proved")),
    ...statement.counterexamples.map((name) =>
      checkEntry(manifest, name, "counterexample")
    ),
    ...statement.deferred.map((name) => checkEntry(manifest, name, "deferred")),
  ];
  const unconfirmed = entries
    .filter((entry) => entry.status !== entry.expected)
    .map((entry) => entry.name);
  const factsRan =
    statement.status !== "checkedBuild" || manifest.facts.checks > 0;
  let status: StatementStatus =
    unconfirmed.length === 0 && factsRan ? statement.status : "unverified";
  // A claim refuted only by evaluated counterexamples says so: evaluation
  // trusts Lean's compiler, a kernel-checked theorem does not.
  const refutations = entries.filter(
    (entry) => entry.expected === "counterexample"
  );
  if (
    status === "shownFalse" &&
    refutations.length > 0 &&
    refutations.every((entry) => entry.checkedBy === "evaluation")
  ) {
    status = "shownFalseEval";
  }
  return { id: statement.id, status, entries, unconfirmed };
}

export function checkStatements(
  statements: readonly LeanStatement[],
  manifest: FormalManifest
): Readonly<Record<string, StatementCheck>> {
  return Object.fromEntries(
    statements.map((statement) => [
      statement.id,
      checkStatement(statement, manifest),
    ])
  );
}

/** The numbers the page's summary and commands take from the manifest. */
export interface ManifestFigures {
  readonly commit: string;
  readonly commitDate: string;
  readonly generatedAt: string;
  readonly leanVersion: string;
  /** The last change to P26 at the manifest's commit, when recorded. */
  readonly specCommit: string | null;
  readonly vectorsPassed: number | null;
  readonly vectorsTotal: number | null;
  readonly vectorChecks: number | null;
  readonly reasonChecks: number | null;
  readonly nettingPassed: number | null;
  readonly nettingTotal: number | null;
  readonly facts: number;
  readonly theoremsTdh: number;
  readonly theoremsP53: number;
  /** The manifest's own summary: entries by status, and audited theorems. */
  readonly proved: number;
  readonly counterexamples: number;
  readonly deferred: number;
  readonly entries: number;
  readonly audited: number;
  /** Counterexamples by how they are checked: a kernel theorem or #guard. */
  readonly counterexampleTheorems: number;
  readonly counterexampleEvaluations: number;
  /** The claims those counterexamples show false (`refutedClaimCount`). */
  readonly claimsShownFalse: number;
  /** The counterexamples of the first netting rule, which refute one claim. */
  readonly firstRuleCases: number;
  /** Claims not proved here, about TDH-v1 and about the validator rules. */
  readonly deferredTdh: number;
  readonly deferredP53: number;
}

/**
 * How many claims the manifest's counterexamples show false: one for each
 * claim of `REFUTED_CLAIMS` that has a counterexample in the manifest, and
 * one for each counterexample the list does not name. Counterexamples are
 * not claims: the first netting rule's five cases refute one.
 */
export function refutedClaimCount(manifest: FormalManifest): number {
  const counterexamples = manifest.theorems.filter(
    (entry) => entry.status === "counterexample"
  );
  const refutes = (
    entry: (typeof counterexamples)[number],
    claim: readonly string[]
  ) => claim.some((name) => formalEntryMatches(entry, name));
  const named = REFUTED_CLAIMS.filter((claim) =>
    counterexamples.some((entry) => refutes(entry, claim))
  ).length;
  const unnamed = counterexamples.filter(
    (entry) => !REFUTED_CLAIMS.some((claim) => refutes(entry, claim))
  ).length;
  return named + unnamed;
}

export function manifestFigures(manifest: FormalManifest): ManifestFigures {
  const count = (
    test: (entry: FormalManifest["theorems"][number]) => boolean
  ) => manifest.theorems.filter(test).length;
  const p26 = conformanceRun(manifest, "p26");
  const reasons = conformanceRun(manifest, "p26-reasons");
  const netting = conformanceRun(manifest, "netting");
  return {
    commit: manifest.source.commit,
    commitDate: manifest.source.commitDate,
    generatedAt: manifest.generatedAt,
    leanVersion: manifest.lean.version,
    specCommit: manifest.documents?.specification?.lastChange ?? null,
    vectorsPassed: p26?.passed ?? null,
    vectorsTotal: p26?.total ?? null,
    vectorChecks: p26?.checks ?? null,
    reasonChecks: reasons?.checks ?? null,
    nettingPassed: netting?.passed ?? null,
    nettingTotal: netting?.total ?? null,
    facts: manifest.facts.checks,
    theoremsTdh: manifest.summary.auditedTdh,
    theoremsP53: manifest.summary.auditedP53,
    proved: manifest.summary.proved,
    counterexamples: manifest.summary.counterexample,
    deferred: manifest.summary.deferred,
    entries: manifest.summary.entries,
    audited: manifest.summary.audited,
    counterexampleTheorems: count(
      (entry) =>
        entry.status === "counterexample" && entry.checkedBy === "kernel"
    ),
    counterexampleEvaluations: count(
      (entry) =>
        entry.status === "counterexample" && entry.checkedBy === "evaluation"
    ),
    claimsShownFalse: refutedClaimCount(manifest),
    firstRuleCases: count(
      (entry) =>
        entry.status === "counterexample" &&
        (REFUTED_CLAIMS[0] ?? []).some((name) =>
          formalEntryMatches(entry, name)
        )
    ),
    deferredTdh: count(
      (entry) => entry.status === "deferred" && entry.library === "tdh"
    ),
    deferredP53: count(
      (entry) => entry.status === "deferred" && entry.library === "p53"
    ),
  };
}
