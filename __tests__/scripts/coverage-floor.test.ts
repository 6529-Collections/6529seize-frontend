import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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
