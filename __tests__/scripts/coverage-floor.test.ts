/** @jest-environment node */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "coverage-floor.cjs");

const writeSummary = (
  root: string,
  pcts: { [metric: string]: number }
): void => {
  const summaryPath = path.join(root, "coverage", "coverage-summary.json");
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  const total: { [metric: string]: { pct: number } } = {};
  for (const [metric, pct] of Object.entries(pcts)) {
    total[metric] = { pct };
  }
  fs.writeFileSync(summaryPath, JSON.stringify({ total }));
};

const runFloor = (root: string, args: string[] = []) =>
  spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
    env: { ...process.env, COVERAGE_FLOOR_ROOT: root, GITHUB_ACTIONS: "" },
  });

const BASE = { lines: 75, statements: 74, functions: 70, branches: 61 };

describe("coverage-floor check mode", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "coverage-floor-"));
    writeSummary(root, BASE);
    expect(runFloor(root, ["--update"]).status).toBe(0);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("passes when actuals match the baseline", () => {
    const check = runFloor(root);
    expect(check.status).toBe(0);
    expect(check.stdout).toContain("Coverage floor passed.");
  });

  it("passes on a drop of exactly the tolerance", () => {
    writeSummary(root, { ...BASE, lines: 74.9 });
    const check = runFloor(root);
    expect(check.status).toBe(0);
  });

  it("fails on a drop beyond the tolerance", () => {
    writeSummary(root, { ...BASE, lines: 74.89 });
    const check = runFloor(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("lines coverage dropped 0.11 points");
  });

  it("warns and passes on a rise beyond the tolerance", () => {
    writeSummary(root, { ...BASE, branches: 61.5 });
    const check = runFloor(root);
    expect(check.status).toBe(0);
    expect(check.stdout).toContain("branches coverage rose 0.50 points");
    expect(check.stdout).toContain("--update");
  });

  it("honors tolerance_points from the baseline file", () => {
    const baselinePath = path.join(
      root,
      "scripts",
      "coverage-floor-baseline.json"
    );
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    baseline.tolerance_points = 1;
    fs.writeFileSync(baselinePath, JSON.stringify(baseline));

    writeSummary(root, { ...BASE, lines: 74.1 });
    const wideCheck = runFloor(root);
    expect(wideCheck.status).toBe(0);
    expect(wideCheck.stdout).toContain("(tolerance: 1 points)");

    writeSummary(root, { ...BASE, lines: 73.9 });
    expect(runFloor(root).status).toBe(1);
  });

  it("preserves a customized tolerance across --update", () => {
    const baselinePath = path.join(
      root,
      "scripts",
      "coverage-floor-baseline.json"
    );
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    baseline.tolerance_points = 0.5;
    fs.writeFileSync(baselinePath, JSON.stringify(baseline));

    writeSummary(root, { ...BASE, lines: 80 });
    expect(runFloor(root, ["--update"]).status).toBe(0);
    const updated = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    expect(updated.tolerance_points).toBe(0.5);
    expect(updated.totals.lines).toBe(80);
  });

  it("fails cleanly on a corrupt summary", () => {
    fs.writeFileSync(
      path.join(root, "coverage", "coverage-summary.json"),
      "{ not json"
    );
    const check = runFloor(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("not valid JSON");
  });

  it("fails when the baseline is missing", () => {
    fs.rmSync(path.join(root, "scripts", "coverage-floor-baseline.json"));
    const check = runFloor(root);
    expect(check.status).toBe(1);
    expect(check.stderr).toContain("Baseline not found");
  });
});

describe("coverage-floor workflow", () => {
  const workflow = YAML.parse(
    fs.readFileSync(".github/workflows/coverage-floor.yml", "utf8")
  );

  it("names both checks and preserves their failures", () => {
    expect(workflow.name).toBe("Full Jest suite and coverage");
    for (const [job, id] of [
      ["jest", "jest"],
      ["coverage-floor", "coverage"],
    ] as const) {
      const steps = workflow.jobs[job].steps;
      const step = steps.find(
        (candidate: { id?: string }) => candidate.id === id
      );
      expect(step).toBeDefined();
      expect(step).not.toHaveProperty("continue-on-error");
    }
  });

  it.each([
    ["failure", "success", "The Jest shards did not all pass."],
    ["success", "failure", "The coverage floor step failed."],
    ["failure", "skipped", "Coverage was not checked."],
    ["skipped", "skipped", "The Jest shards did not all pass."],
    ["cancelled", "success", "The Jest shards did not all pass."],
    ["success", "success", "| Coverage floor | success |"],
  ])(
    "summarizes Jest %s and coverage %s independently",
    (jestOutcome, coverageOutcome, message) => {
      const step = workflow.jobs["coverage-floor"].steps.find(
        (candidate: { name?: string }) =>
          candidate.name === "Summarize test and coverage outcomes"
      );
      expect(step.if).toBe("always()");
      expect(step.env).toEqual({
        JEST_OUTCOME: "${{ needs.jest.result }}",
        COVERAGE_OUTCOME: "${{ steps.coverage.outcome }}",
      });
      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), "coverage-step-summary-")
      );
      const summaryPath = path.join(root, "summary.md");
      try {
        const result = spawnSync(
          "bash",
          ["-e", "-o", "pipefail", "-c", step.run],
          {
            encoding: "utf8",
            env: {
              ...process.env,
              JEST_OUTCOME: jestOutcome,
              COVERAGE_OUTCOME: coverageOutcome,
              GITHUB_STEP_SUMMARY: summaryPath,
            },
          }
        );
        expect(result.status).toBe(0);
        const summary = fs.readFileSync(summaryPath, "utf8");
        expect(summary).toContain(`| Full Jest suite | ${jestOutcome} |`);
        expect(summary).toContain(`| Coverage floor | ${coverageOutcome} |`);
        expect(summary).toContain(message);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  );

  it("collects all four raw shards without cancelling peers after failure", () => {
    const shards = workflow.jobs.jest;
    const gate = workflow.jobs["coverage-floor"];
    expect(shards.strategy).toEqual({
      "fail-fast": false,
      matrix: { shard: [1, 2, 3, 4] },
    });
    expect(shards).not.toHaveProperty("continue-on-error");
    expect(gate.needs).toBe("jest");
    expect(gate.if).toContain("always()");
    for (const job of [shards, gate]) {
      expect(job.if).toContain(
        "github.event.pull_request.head.repo.full_name == github.repository"
      );
    }
    const run = shards.steps.find(
      (step: { id?: string }) => step.id === "jest"
    );
    expect(run.run).toContain('--shard="$JEST_SHARD"');
    expect(run.env.JEST_SHARD).toBe(
      "${{ matrix.shard }}/${{ strategy.job-total }}"
    );
    expect(run.run).toContain("--coverageReporters=json");
    const upload = shards.steps.find((step: { uses?: string }) =>
      step.uses?.startsWith("actions/upload-artifact@")
    );
    expect(upload.if).toBe("always()");
    expect(upload.with).toMatchObject({
      name: "jest-coverage-${{ matrix.shard }}",
      path: "coverage/coverage-final.json",
      "if-no-files-found": "error",
    });
    const merge = gate.steps.find(
      (step: { id?: string }) => step.id === "coverage"
    );
    expect(merge.run).toContain("--merge");
    expect(merge.run).toContain("jest-coverage-{1,2,3,4}/coverage-final.json");
    expect(merge).not.toHaveProperty("continue-on-error");
    expect(merge).not.toHaveProperty("if");
  });

  it.each(["success", "failure", "cancelled", "skipped"])(
    "only passes the aggregate Jest check for success, received %s",
    (outcome) => {
      const step = workflow.jobs["coverage-floor"].steps.find(
        (candidate: { name?: string }) =>
          candidate.name === "Require all Jest shards to pass"
      );
      expect(step.if).toBe("always()");
      expect(step.env.JEST_OUTCOME).toBe("${{ needs.jest.result }}");
      const result = spawnSync(
        "bash",
        ["-e", "-o", "pipefail", "-c", step.run],
        {
          encoding: "utf8",
          env: { ...process.env, JEST_OUTCOME: outcome },
        }
      );
      expect(result.status).toBe(outcome === "success" ? 0 : 1);
    }
  );
});

const fileCoverage = (file: string, hits: [number, number]) => ({
  path: file,
  statementMap: {
    0: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
    1: { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } },
  },
  fnMap: {
    0: {
      name: "example",
      decl: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
      loc: { start: { line: 1, column: 0 }, end: { line: 2, column: 10 } },
      line: 1,
    },
  },
  branchMap: {
    0: {
      type: "if",
      loc: { start: { line: 1, column: 0 }, end: { line: 2, column: 10 } },
      locations: [
        { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
        { start: { line: 2, column: 0 }, end: { line: 2, column: 10 } },
      ],
      line: 1,
    },
  },
  s: { 0: hits[0], 1: hits[1] },
  f: { 0: hits[0] + hits[1] },
  b: { 0: hits },
});

describe("coverage-floor shard merging", () => {
  let root: string;
  let shards: string[];

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "coverage-shards-"));
    writeSummary(root, {
      lines: 50,
      statements: 50,
      functions: 50,
      branches: 50,
    });
    expect(runFloor(root, ["--update"]).status).toBe(0);
    const source = path.join(root, "source.ts");
    const untested = path.join(root, "untested.ts");
    const counts: [number, number][] = [
      [1, 0],
      [0, 1],
      [0, 0],
      [0, 0],
    ];
    shards = counts.map((hits, index) => {
      const file = path.join(root, `shard-${index}.json`);
      fs.writeFileSync(
        file,
        JSON.stringify({
          [source]: fileCoverage(source, hits),
          [untested]: fileCoverage(untested, [0, 0]),
        })
      );
      return file;
    });
    fs.rmSync(path.join(root, "coverage", "coverage-summary.json"));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("unions complementary hits and counts untested files once", () => {
    const result = runFloor(root, ["--merge", ...shards]);
    expect({ status: result.status, stderr: result.stderr }).toEqual({
      status: 0,
      stderr: "",
    });
    const summary = JSON.parse(
      fs.readFileSync(
        path.join(root, "coverage", "coverage-summary.json"),
        "utf8"
      )
    );
    for (const metric of ["lines", "statements", "branches"]) {
      expect(summary.total[metric]).toMatchObject({
        total: 4,
        covered: 2,
        pct: 50,
      });
    }
    expect(summary.total.functions).toMatchObject({
      total: 2,
      covered: 1,
      pct: 50,
    });
    expect(Object.keys(summary)).toHaveLength(3);
  });

  it("still fails the unchanged baseline when merged coverage regresses", () => {
    const data = JSON.parse(
      fs.readFileSync(path.join(root, "shard-1.json"), "utf8")
    );
    const source = path.join(root, "source.ts");
    data[source] = fileCoverage(source, [0, 0]);
    fs.writeFileSync(path.join(root, "shard-1.json"), JSON.stringify(data));
    const result = runFloor(root, ["--merge", ...shards]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("branches coverage dropped 25.00 points");
  });

  it.each(["missing", "invalid", "empty"])(
    "fails closed on a %s shard",
    (kind) => {
      const broken = path.join(root, "shard-3.json");
      if (kind === "missing") fs.rmSync(broken);
      else fs.writeFileSync(broken, kind === "empty" ? "{}" : "not json");
      const result = runFloor(root, ["--merge", ...shards]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Could not merge coverage:");
      if (kind === "missing") expect(result.stderr).toContain(broken);
      expect(
        fs.existsSync(path.join(root, "coverage", "coverage-summary.json"))
      ).toBe(false);
    }
  );

  it("rejects merge mode with no shard inputs", () => {
    const result = runFloor(root, ["--merge"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--merge requires every shard");
  });
});
