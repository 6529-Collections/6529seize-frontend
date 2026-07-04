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
//   - Any tracked percentage more than the tolerance above its baseline passes
//     with a warning suggesting a baseline bump so the gain is locked in.
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
const TOLERANCE_POINTS = 0.1;
const TRACKED_METRICS = ["lines", "statements", "functions", "branches"];

const roundPct = (value) => Math.round(value * 100) / 100;

function readSummaryTotals() {
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error(
      `Coverage summary not found at ${SUMMARY_PATH}. ` +
        "Run Jest with --coverage --coverageReporters=json-summary first."
    );
    process.exit(1);
  }
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
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
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  if (baseline.schema_version !== SCHEMA_VERSION) {
    console.error(
      `Baseline schema_version ${baseline.schema_version} does not match ` +
        `script schema_version ${SCHEMA_VERSION}. Regenerate with --update.`
    );
    process.exit(1);
  }
  return baseline;
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
    if (delta < -TOLERANCE_POINTS) {
      status = "DROP";
      failures.push(
        `Global ${metric} coverage dropped ${Math.abs(delta).toFixed(2)} ` +
          `points (baseline ${baselinePct.toFixed(2)}%, actual ` +
          `${actualPct.toFixed(2)}%, tolerance ${TOLERANCE_POINTS}). ` +
          "Add or restore tests for the changed code."
      );
    } else if (delta > TOLERANCE_POINTS) {
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
  const baseline = {
    schema_version: SCHEMA_VERSION,
    tolerance_points: TOLERANCE_POINTS,
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

module.exports = { TOLERANCE_POINTS, TRACKED_METRICS };
