#!/usr/bin/env node

// Coverage floor: keeps global Jest coverage from silently eroding.
//
// Compares the totals in coverage/coverage-summary.json (produced by
// `jest --coverage --coverageReporters=json-summary`) against the checked-in
// baseline (scripts/coverage-floor-baseline.json).
//
//   node scripts/coverage-floor.cjs            -> check against baseline (CI mode)
//   node scripts/coverage-floor.cjs --update   -> rewrite the baseline from actuals
//
// Rules enforced by the check:
//   - Any tracked percentage more than the tolerance below its baseline fails.
//     The tolerance comes from the baseline's `tolerance_points` field
//     (default 0.1), so the checked-in value is authoritative.
//   - Any tracked percentage more than the tolerance above its baseline passes
//     with a warning suggesting a baseline bump so the gain is locked in.
//   - A drop of exactly the tolerance passes: the gate is "more than
//     `tolerance_points` points", intentionally, to absorb coverage jitter.
//
// Dependency-free so it can run before or without node_modules.

const fs = require("node:fs");
const path = require("node:path");

// COVERAGE_FLOOR_ROOT / COVERAGE_SUMMARY_PATH are test seams; production runs
// use the repo root and the default Jest coverage output location.
const REPO_ROOT = process.env["COVERAGE_FLOOR_ROOT"]
  ? path.resolve(process.env["COVERAGE_FLOOR_ROOT"])
  : path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(
  REPO_ROOT,
  "scripts",
  "coverage-floor-baseline.json"
);
const SUMMARY_PATH = process.env["COVERAGE_SUMMARY_PATH"]
  ? path.resolve(process.env["COVERAGE_SUMMARY_PATH"])
  : path.join(REPO_ROOT, "coverage", "coverage-summary.json");

const SCHEMA_VERSION = 1;
const DEFAULT_TOLERANCE_POINTS = 0.1;
const TRACKED_METRICS = ["lines", "statements", "functions", "branches"];

const roundPct = (value) => Math.round(value * 100) / 100;

function readJsonFile(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Could not read ${label} at ${filePath}: ${error.message}`);
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(
      `${label} at ${filePath} is not valid JSON: ${error.message}`
    );
    process.exit(1);
  }
}

function readSummaryTotals() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error(
      `Coverage summary not found at ${SUMMARY_PATH}. ` +
        "Run Jest with --coverage --coverageReporters=json-summary first."
    );
    process.exit(1);
  }
  const summary = readJsonFile(SUMMARY_PATH, "Coverage summary");
  const totals = summary.total;
  if (!totals) {
    console.error("Coverage summary has no `total` section.");
    process.exit(1);
  }
  const result = {};
  for (const metric of TRACKED_METRICS) {
    const pct = totals[metric]?.pct;
    if (typeof pct !== "number" || Number.isNaN(pct)) {
      console.error(`Coverage summary total.${metric}.pct is missing.`);
      process.exit(1);
    }
    result[metric] = roundPct(pct);
  }
  return result;
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(
      `Baseline not found at ${path.relative(REPO_ROOT, BASELINE_PATH)}. ` +
        "Run `node scripts/coverage-floor.cjs --update` and commit the result."
    );
    process.exit(1);
  }
  const baseline = readJsonFile(BASELINE_PATH, "Coverage baseline");
  if (baseline.schema_version !== SCHEMA_VERSION) {
    console.error(
      `Baseline schema_version ${baseline.schema_version} does not match ` +
        `script schema_version ${SCHEMA_VERSION}. Regenerate with --update.`
    );
    process.exit(1);
  }
  return baseline;
}

function toleranceFromBaseline(baseline) {
  const tolerance = baseline.tolerance_points;
  if (typeof tolerance !== "number" || tolerance < 0 || tolerance > 5) {
    return DEFAULT_TOLERANCE_POINTS;
  }
  return tolerance;
}

function emitAnnotation(kind, message) {
  if (process.env["GITHUB_ACTIONS"] === "true") {
    console.log(`::${kind}::${message}`);
  }
}

function appendStepSummary(lines) {
  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function runCheck() {
  const baseline = readBaseline();
  const tolerancePoints = toleranceFromBaseline(baseline);
  const actuals = readSummaryTotals();
  const failures = [];
  const warnings = [];
  const rows = [];

  for (const metric of TRACKED_METRICS) {
    const baselinePct = baseline.totals?.[metric];
    const actualPct = actuals[metric];
    if (typeof baselinePct !== "number") {
      failures.push(
        `Baseline is missing metric "${metric}". Regenerate with --update.`
      );
      continue;
    }

    const delta = roundPct(actualPct - baselinePct);
    let status = "ok";
    if (delta < -tolerancePoints) {
      status = "DROP";
      failures.push(
        `Global ${metric} coverage dropped ${Math.abs(delta).toFixed(2)} ` +
          `points (baseline ${baselinePct.toFixed(2)}%, actual ` +
          `${actualPct.toFixed(2)}%, tolerance ${tolerancePoints}). ` +
          "Add or restore tests for the changed code."
      );
    } else if (delta > tolerancePoints) {
      status = "stale baseline";
      warnings.push(
        `Global ${metric} coverage rose ${delta.toFixed(2)} points above ` +
          "baseline. Lock in the gain: run `node scripts/coverage-floor.cjs " +
          "--update` and commit the new baseline."
      );
    }
    rows.push({ metric, baseline: baselinePct, actual: actualPct, status });
  }

  console.log("Coverage floor report");
  console.log(`(tolerance: ${tolerancePoints} points)`);
  console.log("=====================");
  for (const row of rows) {
    console.log(
      `${row.metric.padEnd(12)} baseline ${row.baseline.toFixed(2).padStart(6)}% ` +
        `actual ${row.actual.toFixed(2).padStart(6)}%  ${row.status}`
    );
  }

  for (const warning of warnings) {
    console.log(`\nWARNING: ${warning}`);
    emitAnnotation("warning", warning);
  }
  for (const failure of failures) {
    console.error(`\nFAIL: ${failure}`);
    emitAnnotation("error", failure);
  }

  appendStepSummary([
    "## Coverage floor",
    "",
    "| Metric | Baseline | Actual | Status |",
    "| --- | ---: | ---: | --- |",
    ...rows.map(
      (row) =>
        `| ${row.metric} | ${row.baseline.toFixed(2)}% | ` +
        `${row.actual.toFixed(2)}% | ${row.status} |`
    ),
    ...(failures.length > 0
      ? ["", "**Failures**", ...failures.map((failure) => `- ${failure}`)]
      : []),
    ...(warnings.length > 0
      ? ["", "**Warnings**", ...warnings.map((warning) => `- ${warning}`)]
      : []),
  ]);

  if (failures.length > 0) {
    console.error("\nCoverage floor failed.");
    process.exit(1);
  }

  console.log("\nCoverage floor passed.");
}

function runUpdate() {
  const totals = readSummaryTotals();
  const existingTolerance = fs.existsSync(BASELINE_PATH)
    ? toleranceFromBaseline(readJsonFile(BASELINE_PATH, "Coverage baseline"))
    : DEFAULT_TOLERANCE_POINTS;
  const baseline = {
    schema_version: SCHEMA_VERSION,
    tolerance_points: existingTolerance,
    totals,
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `Baseline written to ${path.relative(REPO_ROOT, BASELINE_PATH)}:`
  );
  for (const metric of TRACKED_METRICS) {
    console.log(`  ${metric}: ${totals[metric].toFixed(2)}%`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--update")) {
    runUpdate();
    return;
  }
  runCheck();
}

if (require.main === module) {
  main();
}

module.exports = { DEFAULT_TOLERANCE_POINTS, TRACKED_METRICS };
