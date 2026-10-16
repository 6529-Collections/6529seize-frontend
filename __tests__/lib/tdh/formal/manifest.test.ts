/**
 * @jest-environment node
 */
import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import {
  conformanceRun,
  findFormalEntry,
  parseFormalManifest,
  type FormalManifest,
} from "@/lib/tdh/formal/manifest";

function bundled(): FormalManifest {
  const parsed = parseFormalManifest(BUNDLED_FORMAL_MANIFEST);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }
  return parsed.data;
}

function withChanges(change: (manifest: FormalManifest) => unknown) {
  return parseFormalManifest(change(structuredClone(bundled())));
}

describe("formal manifest schema", () => {
  it("accepts the bundled manifest, a copy of the published one", () => {
    const manifest = bundled();
    expect(manifest.source.commit).toBe(
      "6b32f3f63a348eb6c1c694a18a215f4ddca3c752"
    );
    expect(manifest.lean.version).toBe("4.35.0");
    expect(manifest.summary).toEqual({
      proved: 78,
      counterexample: 11,
      deferred: 9,
      entries: 98,
      audited: 85,
      auditedTdh: 55,
      auditedP53: 30,
    });
    expect(conformanceRun(manifest)).toEqual({
      id: "p26",
      passed: 89,
      total: 89,
      failed: 0,
      checks: 1_253,
    });
    expect(manifest.facts.checks).toBe(46);
    expect(manifest.documents?.specification?.lastChange.slice(0, 7)).toBe(
      "f840096"
    );
  });

  it("counts every audited theorem once, with only Lean's standard axioms", () => {
    const manifest = bundled();
    const kernel = manifest.theorems.filter(
      (entry) => entry.checkedBy === "kernel"
    );
    expect(kernel).toHaveLength(manifest.summary.audited);
    expect(new Set(kernel.map((entry) => entry.leanName)).size).toBe(
      kernel.length
    );
    for (const entry of kernel) {
      expect(entry.axioms).not.toBeNull();
    }
  });

  it("rejects a manifest from a dirty tree, a failed build or a failed vector run", () => {
    expect(
      withChanges((m) => ({ ...m, source: { ...m.source, dirty: true } }))
        .success
    ).toBe(false);
    expect(
      withChanges((m) => ({ ...m, build: { ...m.build, ok: false } })).success
    ).toBe(false);
    expect(
      withChanges((m) => ({
        ...m,
        build: { ...m.build, audit: { ...m.build.audit, ok: null } },
      })).success
    ).toBe(false);
    expect(
      withChanges((m) => ({
        ...m,
        vectors: m.vectors.map((run) => ({
          ...run,
          passed: run.total - 1,
          failed: 1,
        })),
      })).success
    ).toBe(false);
  });

  it("rejects an axiom beyond Lean's three, an unknown status or a wrong count", () => {
    expect(
      withChanges((m) => ({
        ...m,
        theorems: m.theorems.map((entry, index) =>
          index === 0 ? { ...entry, axioms: ["sorryAx"] } : entry
        ),
      })).success
    ).toBe(false);
    expect(
      withChanges((m) => ({
        ...m,
        theorems: m.theorems.map((entry, index) =>
          index === 0 ? { ...entry, status: "assumed" as never } : entry
        ),
      })).success
    ).toBe(false);
    expect(
      withChanges((m) => ({ ...m, theorems: m.theorems.slice(1) })).success
    ).toBe(false);
    expect(
      withChanges((m) => ({ ...m, format: "tdh-lean.v2" as never })).success
    ).toBe(false);
  });

  it("finds theorems by their PROOFS.md names and cases by id", () => {
    const manifest = bundled();
    expect(findFormalEntry(manifest, "replay_ok")?.leanName).toBe(
      "Tdh.Proofs.replay_ok"
    );
    expect(findFormalEntry(manifest, "Stack.takeLast_some")?.leanName).toBe(
      "Tdh.Stack.takeLast_some"
    );
    expect(findFormalEntry(manifest, "step_prune")?.leanName).toBe(
      "P53.Incidents.step_prune"
    );
    expect(findFormalEntry(manifest, "1.case-I")?.status).toBe(
      "counterexample"
    );
    expect(
      findFormalEntry(manifest, "1.balance-raw-same-eligibility")?.status
    ).toBe("deferred");
    expect(findFormalEntry(manifest, "prune")).toBeNull();
  });
});
