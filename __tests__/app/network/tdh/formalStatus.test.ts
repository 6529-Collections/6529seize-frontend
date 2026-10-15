import {
  checkStatement,
  checkStatements,
  manifestFigures,
} from "@/app/network/tdh/formal/formalStatus";
import { LEAN_STATEMENTS } from "@/app/network/tdh/formal/leanResults";
import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import {
  formalManifestSchema,
  type FormalManifest,
} from "@/lib/tdh/formal/manifest";

const manifest: FormalManifest = formalManifestSchema.parse(
  BUNDLED_FORMAL_MANIFEST
);

function statement(id: string) {
  const found = LEAN_STATEMENTS.find((row) => row.id === id);
  if (!found) {
    throw new Error(`no statement ${id}`);
  }
  return found;
}

describe("formal statements against the proof manifest", () => {
  it("confirms every statement's own status from the bundled manifest", () => {
    const checks = checkStatements(LEAN_STATEMENTS, manifest);
    for (const row of LEAN_STATEMENTS) {
      expect([row.id, checks[row.id]?.status]).toEqual([row.id, row.status]);
      expect(checks[row.id]?.unconfirmed).toEqual([]);
    }
  });

  it("accounts for every audited theorem, each in exactly one statement", () => {
    const named = LEAN_STATEMENTS.flatMap((row) => [
      ...row.proved,
      ...row.counterexamples,
    ]);
    const audited = manifest.theorems.filter(
      (entry) => entry.checkedBy === "kernel"
    );
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
    expect(covered.size).toBe(audited.length);
    expect(new Set(named).size).toBe(named.length);
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
