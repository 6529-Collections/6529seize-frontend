import {
  checkStatement,
  checkStatements,
  leanRound,
  manifestFigures,
} from "@/app/network/tdh/formal/formalStatus";
import {
  LEAN_ROUND_5,
  LEAN_STATEMENTS,
  modulesFor,
  statementsFor,
  type LeanStatement,
} from "@/app/network/tdh/formal/leanResults";
import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import roundFive from "./fixtures/roundFiveManifest.json";
import roundThree from "./fixtures/roundThreeManifest.json";
import {
  formalManifestSchema,
  type FormalManifest,
} from "@/lib/tdh/formal/manifest";

/**
 * The feed's manifest of round 3 of the model (6529chain 7bf579a), as the
 * page bundled it until the feed published round 5: the base these tests
 * build older and newer rounds from.
 */
const manifest: FormalManifest = formalManifestSchema.parse(roundThree);
/** The bundled copy: the feed's manifest of round 5 (6b32f3f). */
const bundled: FormalManifest = formalManifestSchema.parse(
  BUNDLED_FORMAL_MANIFEST
);

function statement(id: string) {
  const found = LEAN_STATEMENTS.find((row) => row.id === id);
  if (!found) {
    throw new Error(`no statement ${id}`);
  }
  return found;
}

/**
 * What round 4 of the model (6529chain f854661) adds to the audit and to
 * PROOFS.md's claims not proved, for a manifest of that round. Test data:
 * round 3's manifest with them added; round 4's was never published.
 */
const ROUND_4_THEOREMS = [
  "checkInputTypes_perm",
  "checkLogPositions_perm",
  "checkLogTypes_perm",
  "checkRawOrDecoded_perm",
  "checkSelected_perm",
  "computeCycleFromSource_decoded",
  "computeCycleFromSource_perm",
  "computeCycleFromSource_typed",
  "computeCycle_typed",
  "decodeLogs_perm",
  "decode_perm",
  "logBlocks_perm",
  "mapM_perm",
];
const ROUND_4_DEFERRED = [
  "1.canonical-sort",
  "3.identity-wallets-field",
  "4.error-names",
  "6.rules-are-definitions",
  "6.json-reader",
];

function firstWith(status: FormalManifest["theorems"][number]["status"]) {
  const found = manifest.theorems.find((entry) => entry.status === status);
  if (!found) {
    throw new Error(`no ${status} entry`);
  }
  return found;
}

function roundFourManifest(): FormalManifest {
  const base = manifest.theorems.filter(
    (entry) => entry.id !== "4.raw-log-order"
  );
  const proved = ROUND_4_THEOREMS.map((name) => ({
    ...firstWith("proved"),
    id: `4.${name}`,
    leanName: `Tdh.Proofs.${name}`,
  }));
  const deferred = ROUND_4_DEFERRED.map((id) => ({
    ...firstWith("deferred"),
    id,
  }));
  return { ...manifest, theorems: [...base, ...proved, ...deferred] };
}

function auditedCoverage(
  statements: readonly LeanStatement[],
  of: FormalManifest
) {
  const named = statements.flatMap((row) => [
    ...row.proved,
    ...row.counterexamples,
  ]);
  const audited = of.theorems.filter((entry) => entry.checkedBy === "kernel");
  const covered = new Set(
    named.flatMap((name) =>
      audited
        .filter(
          (entry) =>
            entry.leanName === name ||
            (entry.leanName?.endsWith(`.${name}`) ?? false)
        )
        .map((entry) => entry.leanName)
    )
  );
  return { named, covered: covered.size, audited: audited.length };
}

/**
 * The statements refuted only by counterexamples the build evaluates
 * (#guard, cases F, G, H and I): their status says so, since evaluation
 * trusts Lean's compiler and a kernel-checked theorem does not.
 */
const EVALUATED_REFUTATIONS = new Set(["beyondStacks", "minted", "walletSum"]);

function expectedStatus(row: { readonly id: string; readonly status: string }) {
  return EVALUATED_REFUTATIONS.has(row.id) ? "shownFalseEval" : row.status;
}

describe("formal statements against the proof manifest", () => {
  it("confirms every round-5 statement from the bundled copy of the feed's manifest", () => {
    expect(bundled.source.commit.startsWith("6b32f3f")).toBe(true);
    expect(leanRound(bundled)).toBe(5);
    const statements = statementsFor(5);
    const checks = checkStatements(statements, bundled);
    for (const row of statements) {
      expect([row.id, checks[row.id]?.status]).toEqual([
        row.id,
        expectedStatus(row),
      ]);
      expect(checks[row.id]?.unconfirmed).toEqual([]);
    }
    expect(manifestFigures(bundled)).toMatchObject({
      proved: 78,
      counterexamples: 11,
      deferred: 9,
      entries: 98,
      audited: 85,
      vectorsPassed: 89,
      vectorsTotal: 89,
    });
  });

  it("confirms every statement's own status from round 3's manifest", () => {
    expect(leanRound(manifest)).toBe(3);
    const statements = statementsFor(3);
    const checks = checkStatements(statements, manifest);
    for (const row of statements) {
      expect([row.id, checks[row.id]?.status]).toEqual([
        row.id,
        expectedStatus(row),
      ]);
      expect(checks[row.id]?.unconfirmed).toEqual([]);
    }
    expect(statements.map((row) => row.id)).not.toContain("rawLogs");
  });

  it("accounts for every audited theorem, each in exactly one statement", () => {
    const { named, covered, audited } = auditedCoverage(
      statementsFor(3),
      manifest
    );
    expect(covered).toBe(audited);
    expect(new Set(named).size).toBe(named.length);
  });

  it("follows round 4 of the model when its manifest proves the raw-log theorems", () => {
    const round4 = roundFourManifest();
    expect(leanRound(round4)).toBe(4);
    const statements = statementsFor(4);
    const checks = checkStatements(statements, round4);
    for (const row of statements) {
      expect([row.id, checks[row.id]?.status]).toEqual([
        row.id,
        expectedStatus(row),
      ]);
      expect(checks[row.id]?.unconfirmed).toEqual([]);
    }
    const { named, covered, audited } = auditedCoverage(statements, round4);
    expect(audited).toBe(manifest.summary.audited + ROUND_4_THEOREMS.length);
    expect(covered).toBe(audited);
    expect(new Set(named).size).toBe(named.length);
    expect(statements.find((row) => row.id === "order")?.copy).toBe("orderRaw");
    expect(statements.find((row) => row.id === "rawLogs")?.status).toBe(
      "proved"
    );
    expect(modulesFor(4).map((row) => row.key)).toEqual(
      expect.arrayContaining(["logs", "inputsTyped"])
    );
    expect(modulesFor(3).map((row) => row.key)).not.toContain("logs");
    // A round-3 manifest cannot confirm round 4's statements.
    const early = checkStatements(statementsFor(4), manifest);
    expect(early["order"]?.status).toBe("unverified");
    expect(early["rawLogs"]?.status).toBe("unverified");
    expect(LEAN_STATEMENTS.length).toBe(statementsFor(4).length);
  });

  it("follows round 5 of the model from its committed manifest's entries", () => {
    // The theorem entries of 6529chain 6b32f3f's committed proof manifest,
    // on the published manifest's frame (source and build), as the feed
    // would publish it.
    const round5 = formalManifestSchema.parse({
      ...manifest,
      summary: roundFive.summary,
      facts: roundFive.facts,
      vectors: roundFive.vectors,
      theorems: roundFive.theorems,
    });
    expect(leanRound(round5)).toBe(5);
    const statements = statementsFor(5);
    const checks = checkStatements(statements, round5);
    for (const row of statements) {
      expect([row.id, checks[row.id]?.status]).toEqual([
        row.id,
        expectedStatus(row),
      ]);
      expect(checks[row.id]?.unconfirmed).toEqual([]);
    }
    const { named, covered, audited } = auditedCoverage(statements, round5);
    expect(audited).toBe(85);
    expect(covered).toBe(audited);
    expect(new Set(named).size).toBe(named.length);
    expect(statements.find((row) => row.id === "order")?.copy).toBe(
      "orderOneLog"
    );
    expect(manifestFigures(round5)).toMatchObject({
      vectorsPassed: 89,
      vectorsTotal: 89,
      vectorChecks: 1_253,
      facts: 46,
      theoremsTdh: 55,
      theoremsP53: 30,
    });
    expect(LEAN_ROUND_5).toMatchObject({
      vectorsPassed: 89,
      vectorChecks: 1_253,
      theoremsTdh: 55,
      theoremsP53: 30,
      facts: 46,
    });
    // A round-4 manifest cannot confirm round 5's statements.
    expect(leanRound(roundFourManifest())).toBe(4);
    const early = checkStatements(statementsFor(5), roundFourManifest());
    expect(early["order"]?.status).toBe("unverified");
  });

  it("shows a statement as unverified when the manifest lacks a theorem or disagrees", () => {
    const without: FormalManifest = {
      ...manifest,
      theorems: manifest.theorems.filter(
        (entry) => entry.leanName !== "Tdh.Proofs.replayHoldings_invariance"
      ),
    };
    const missing = checkStatement(statement("netting"), without);
    expect(missing.status).toBe("unverified");
    expect(missing.unconfirmed).toEqual(["replayHoldings_invariance"]);

    const flipped: FormalManifest = {
      ...manifest,
      theorems: manifest.theorems.map((entry) =>
        entry.id === "1.case-H" ? { ...entry, status: "proved" } : entry
      ),
    };
    expect(checkStatement(statement("beyondStacks"), flipped).status).toBe(
      "unverified"
    );
    expect(
      checkStatement(statement("facts"), {
        ...manifest,
        facts: { checks: 0 },
      }).status
    ).toBe("unverified");
  });

  it("lists each theorem's axioms and each case's checks for the details", () => {
    const netting = checkStatement(statement("netting"), manifest);
    const featured = netting.entries.find(
      (entry) => entry.name === "replayHoldings_invariance"
    );
    expect(featured).toMatchObject({
      status: "proved",
      checkedBy: "kernel",
      axioms: ["propext", "Classical.choice", "Quot.sound"],
      file: "Tdh/Proofs/NetInvariance.lean",
    });
    const cases = checkStatement(statement("beyondStacks"), manifest).entries;
    expect(cases.map((entry) => [entry.name, entry.checkedBy])).toEqual([
      ["1.case-H", "evaluation"],
      ["1.case-I", "evaluation"],
    ]);
    expect(cases.every((entry) => (entry.checks ?? 0) > 0)).toBe(true);
  });

  it("takes the page's figures from the manifest", () => {
    expect(manifestFigures(manifest)).toMatchObject({
      commit: "7bf579a5433825b42975ebf03d96d0255b184c0c",
      leanVersion: "4.35.0",
      specCommit: "1c695283f38c5067e164ae674377599b978469ff",
      vectorsPassed: 68,
      vectorsTotal: 68,
      vectorChecks: 1_190,
      reasonChecks: 1_210,
      nettingPassed: 4,
      nettingTotal: 4,
      facts: 21,
      theoremsTdh: 40,
      theoremsP53: 30,
    });
  });
});
