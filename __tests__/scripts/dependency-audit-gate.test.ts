import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type AuditEntry = {
  id: string;
  severity: string;
  packageName: string;
  vulnerableVersions: string;
  patchedVersions: string;
  title: string;
  url: string;
  firstPath: string;
};

type Classification = { fixable: AuditEntry[]; unfixable: AuditEntry[] };

type DependencyAuditGate = {
  classifyAudit: (report: unknown) => Classification;
  formatReport: (classification: Classification) => string;
};

const gatePath = path.resolve(
  __dirname,
  "../../scripts/dependency-audit-gate.cjs"
);
const gate = require(gatePath) as DependencyAuditGate;

function advisory(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    github_advisory_id: "GHSA-aaaa-bbbb-cccc",
    severity: "high",
    module_name: "example-package",
    vulnerable_versions: "<1.2.3",
    patched_versions: ">=1.2.3",
    title: "Example advisory",
    url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
    findings: [{ version: "1.2.2", paths: [".>example-package"] }],
    ...overrides,
  };
}

describe("dependency audit gate", () => {
  it("fails on high and critical advisories that have a fix", () => {
    const result = gate.classifyAudit({
      advisories: {
        "1": advisory({ id: 1 }),
        "2": advisory({
          id: 2,
          github_advisory_id: "GHSA-dddd-eeee-ffff",
          severity: "critical",
          module_name: "other-package",
        }),
      },
    });

    expect(result.fixable.map((entry) => entry.packageName)).toEqual([
      "example-package",
      "other-package",
    ]);
    expect(result.unfixable).toEqual([]);
  });

  it("reports advisories without a published fix but does not fail on them", () => {
    const result = gate.classifyAudit({
      advisories: {
        "1": advisory({ patched_versions: "<0.0.0", module_name: "braces" }),
      },
    });

    expect(result.fixable).toEqual([]);
    expect(result.unfixable).toHaveLength(1);
    expect(gate.formatReport(result)).toContain("no published fix");
    expect(gate.formatReport(result)).toContain("braces");
  });

  it("ignores advisories below high severity", () => {
    const result = gate.classifyAudit({
      advisories: {
        "1": advisory({ severity: "moderate" }),
        "2": advisory({ severity: "low" }),
      },
    });

    expect(result).toEqual({ fixable: [], unfixable: [] });
  });

  it("rejects output that is not an audit report", () => {
    expect(() => gate.classifyAudit(null)).toThrow("advisories");
    expect(() => gate.classifyAudit({})).toThrow("advisories");
    expect(() => gate.classifyAudit({ advisories: null })).toThrow(
      "advisories"
    );
  });

  describe("command line", () => {
    let directory: string;

    beforeEach(() => {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), "audit-gate-"));
    });

    afterEach(() => {
      fs.rmSync(directory, { recursive: true, force: true });
    });

    function run(contents: string | null) {
      const args = [gatePath];
      if (contents !== null) {
        const reportPath = path.join(directory, "report.json");
        fs.writeFileSync(reportPath, contents);
        args.push(reportPath);
      }
      return spawnSync(process.execPath, args, { encoding: "utf8" });
    }

    it("exits 0 for an empty report", () => {
      const result = run(JSON.stringify({ advisories: {} }));

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("No high or critical advisories");
    });

    it("exits 1 when a fixable high advisory is present", () => {
      const result = run(JSON.stringify({ advisories: { "1": advisory({}) } }));

      expect(result.status).toBe(1);
      expect(result.stdout).toContain("example-package");
    });

    it("exits 0 when only an unfixable advisory is present", () => {
      const result = run(
        JSON.stringify({
          advisories: { "1": advisory({ patched_versions: "<0.0.0" }) },
        })
      );

      expect(result.status).toBe(0);
    });

    it("fails closed on empty or invalid reports", () => {
      expect(run("").status).toBe(2);
      expect(run("not json").status).toBe(2);
      expect(run(null).status).toBe(2);
    });
  });
});
