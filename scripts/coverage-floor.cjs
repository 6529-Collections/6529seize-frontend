#!/usr/bin/env node

// Coverage floor: keeps global Jest coverage from silently eroding.
//
// Compares coverage/coverage-summary.json against the checked-in baseline
// (scripts/coverage-floor-baseline.json). A single Jest run produces the summary
// with --coverageReporters=json-summary. Sharded runs use --coverageReporters=json
// and this script's --merge mode combines their raw coverage into that same format.
//
//   node scripts/coverage-floor.cjs            -> check against baseline (CI mode)
//   node scripts/coverage-floor.cjs --update   -> rewrite the baseline from actuals
//   node scripts/coverage-floor.cjs --merge <files...> -> merge shards, then check
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
// Default check/update modes are dependency-free. --merge uses the pinned
// istanbul-lib-coverage dependency to combine raw Jest coverage before checking.

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

// Reads and parses a JSON file in one step (no exists-then-read race).
// Returns null when the file does not exist; exits with a friendly error
// for any other read or parse failure.
function readJsonFileOrNull(filePath, label) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
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
  const summary = readJsonFileOrNull(SUMMARY_PATH, "Coverage summary");
  if (summary === null) {
    console.error(
      `Coverage summary not found at ${SUMMARY_PATH}. ` +
        "Run Jest with --coverage --coverageReporters=json-summary first, " +
        "or use --merge with every shard's coverage-final.json."
    );
    process.exit(1);
  }
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
  const baseline = readJsonFileOrNull(BASELINE_PATH, "Coverage baseline");
  if (baseline === null) {
    console.error(
      `Baseline not found at ${path.relative(REPO_ROOT, BASELINE_PATH)}. ` +
        "Run `node scripts/coverage-floor.cjs --update` and commit the result."
    );
    process.exit(1);
  }
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
  const existingBaseline = readJsonFileOrNull(
    BASELINE_PATH,
    "Coverage baseline"
  );
  const existingTolerance = existingBaseline
    ? toleranceFromBaseline(existingBaseline)
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

function mergeCoverageFiles(inputPaths) {
  if (inputPaths.length === 0) {
    throw new Error("--merge requires every shard's coverage-final.json path.");
  }
  const { createCoverageMap } = require("istanbul-lib-coverage");
  const merged = createCoverageMap({});
  for (const inputPath of inputPaths) {
    const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const shard = createCoverageMap(data);
    if (shard.files().length === 0) {
      throw new Error(`Coverage shard is empty: ${inputPath}`);
    }
    merged.merge(shard);
  }
  // Merge counters before calculating percentages. Averaging shard summaries
  // would lose complementary branch hits and double-count untested files.
  const summary = { total: merged.getCoverageSummary().toJSON() };
  for (const file of merged.files()) {
    summary[file] = merged.fileCoverageFor(file).toSummary().toJSON();
  }
  fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary)}\n`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--merge") {
    try {
      mergeCoverageFiles(args.slice(1));
    } catch (error) {
      console.error(`Could not merge coverage: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  } else if (args.includes("--update")) {
    runUpdate();
    return;
  }
  runCheck();
}

if (require.main === module) {
  main();
}
