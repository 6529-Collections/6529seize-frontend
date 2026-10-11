#!/usr/bin/env node

/* eslint-disable security/detect-non-literal-fs-filename -- This local-only skill CLI intentionally reads the run directory named on the command line. */

// Computes the fe-polish-judge decision for a run directory.
//
// Usage: node ops/skills/fe-polish-judge/scripts/score.mjs <run-dir>
//
// <run-dir>/run.json holds the frozen run record; <run-dir>/rounds/*.json hold
// one judge output per round, ordered by filename (00-baseline.json, 01.json,
// ...). Prints the decision as JSON. Exits 2 on unreadable input.

import fs from "node:fs";
import path from "node:path";

const RUBRIC_VERSION = "fe-polish-judge/2.0";
const CALIBRATION_STATUS = "uncalibrated";
const FLOOR = 8;
const TARGET = 8.5;
const DEFAULT_BUDGET = 6;
const NO_PROGRESS_LIMIT = 2;

const WEIGHTS = {
  J01: 11,
  J02: 7,
  J03: 7,
  J04: 8,
  J05: 4,
  J06: 7,
  J07: 10,
  J08: 9,
  J09: 8,
  J10: 8,
  J11: 5,
  J12: 6,
  J13: 10,
};
const INTEGRITY_CHECKS = ["I1", "I2", "I3"];
const CRYPTO_CHECKS = ["S1", "S2", "S3", "S4", "S5", "S6"];
const CHECK_VALUES = new Set(["pass", "fail", "unverified", "not_applicable"]);
const COVERAGE_VALUES = new Set(["verified", "unverified", "not_applicable"]);
const SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const REQUIRED_SEVERITIES = new Set(["P0", "P1", "P2"]);
const BLOCKER_SEVERITIES = new Set(["P0", "P1"]);
const LATE_ADMISSIONS = new Set([
  "regression",
  "missed_p0_p1",
  "resolved_unverified",
]);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fail(`Cannot read ${file}: ${error.message}`);
  }
}

function loadRun(runDir) {
  const run = readJson(path.join(runDir, "run.json"));
  const roundsDir = path.join(runDir, "rounds");
  if (!fs.existsSync(roundsDir)) {
    fail(`Missing ${roundsDir}`);
  }
  const files = fs
    .readdirSync(roundsDir)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));
  if (files.length === 0) {
    fail(`No judge rounds in ${roundsDir}`);
  }
  const rounds = files.map((name) => ({
    file: name,
    output: readJson(path.join(roundsDir, name)),
  }));
  return { run, rounds };
}

function isRequired(finding) {
  return finding.status === "open" && REQUIRED_SEVERITIES.has(finding.severity);
}

function isOpenBlocker(finding) {
  return finding.status === "open" && BLOCKER_SEVERITIES.has(finding.severity);
}

function targetsOf(finding) {
  return Array.isArray(finding.targets) ? finding.targets : [];
}

function applicableDimensions(run) {
  const pinned = run.not_applicable ?? {};
  return Object.keys(WEIGHTS).filter((id) => !(id in pinned));
}

function applicableChecks(run) {
  const cryptoApplies = applicableDimensions(run).includes("J13");
  return cryptoApplies
    ? [...INTEGRITY_CHECKS, ...CRYPTO_CHECKS]
    : INTEGRITY_CHECKS;
}

function isHalfStep(score) {
  return (
    typeof score === "number" &&
    score >= 0 &&
    score <= 10 &&
    Number.isInteger(score * 2)
  );
}

function validateFindings(findings, errors) {
  const known = new Set([
    ...Object.keys(WEIGHTS),
    ...INTEGRITY_CHECKS,
    ...CRYPTO_CHECKS,
  ]);
  const ids = new Set();
  for (const finding of findings) {
    if (typeof finding.id !== "string" || ids.has(finding.id)) {
      errors.push(`Finding id missing or duplicated: ${finding.id}`);
    }
    ids.add(finding.id);
    if (!SEVERITIES.has(finding.severity)) {
      errors.push(`${finding.id}: severity must be P0-P3`);
    }
    if (finding.status !== "open" && finding.status !== "resolved") {
      errors.push(`${finding.id}: status must be open or resolved`);
    }
    const targets = targetsOf(finding);
    if (targets.length === 0 || targets.some((target) => !known.has(target))) {
      errors.push(
        `${finding.id}: targets must name known dimensions or checks`
      );
    }
  }
}

function classifyDimension(id, entry, pinned) {
  if (id in pinned) {
    return entry.score === undefined
      ? { kind: "pinned" }
      : { kind: "error", message: `${id} is pinned N/A but was scored` };
  }
  if (entry.status === "not_applicable") {
    return {
      kind: "error",
      message: `${id} marked N/A without a pinned reason in run.json`,
    };
  }
  if (entry.status === "unverified") {
    return { kind: "unverified" };
  }
  if (isHalfStep(entry.score)) {
    return { kind: "scored" };
  }
  return {
    kind: "error",
    message: `${id}: score must be 0-10 in half steps, or a status`,
  };
}

function scoreDimensions(run, output, findings, errors) {
  const pinned = run.not_applicable ?? {};
  const dimensions = output.dimensions ?? {};
  const scored = [];
  const unverified = [];
  for (const id of Object.keys(dimensions)) {
    if (!(id in WEIGHTS)) {
      errors.push(`Unknown dimension ${id}`);
    }
  }
  for (const id of Object.keys(WEIGHTS)) {
    const entry = dimensions[id] ?? {};
    const result = classifyDimension(id, entry, pinned);
    if (result.kind === "error") {
      errors.push(result.message);
    } else if (result.kind === "unverified") {
      unverified.push(id);
    } else if (result.kind === "scored") {
      scored.push({ id, score: entry.score });
    }
  }
  const failedFloors = scored.filter((d) => d.score < FLOOR).map((d) => d.id);
  for (const id of failedFloors) {
    const explained = findings.some(
      (finding) => isRequired(finding) && targetsOf(finding).includes(id)
    );
    if (!explained) {
      errors.push(`${id} is below ${FLOOR} with no open required finding`);
    }
  }
  return { scored, unverified, failedFloors };
}

function weightedTotal(scored, unverified) {
  if (unverified.length > 0 || scored.length === 0) {
    return { total: null, applicableWeight: null };
  }
  const applicableWeight = scored.reduce((sum, d) => sum + WEIGHTS[d.id], 0);
  const weighted = scored.reduce((sum, d) => sum + WEIGHTS[d.id] * d.score, 0);
  return { total: weighted / applicableWeight, applicableWeight };
}

function evaluateChecks(run, output, findings, errors) {
  const checks = output.checks ?? {};
  const applicable = applicableChecks(run);
  const failed = [];
  const unverified = [];
  for (const id of applicable) {
    const value = checks[id];
    if (!CHECK_VALUES.has(value) || value === "not_applicable") {
      errors.push(`${id} must be pass, fail, or unverified`);
      continue;
    }
    const blocker = findings.some(
      (finding) => isOpenBlocker(finding) && targetsOf(finding).includes(id)
    );
    if (value === "fail") {
      failed.push(id);
      if (!blocker) {
        errors.push(`${id} failed with no open P0/P1 finding`);
      }
    } else if (blocker) {
      errors.push(`${id} has an open P0/P1 finding but is marked ${value}`);
    }
    if (value === "unverified") {
      unverified.push(id);
    }
  }
  return { failed, unverified };
}

function evaluateCoverage(output, errors) {
  const coverage = Array.isArray(output.coverage) ? output.coverage : [];
  if (coverage.length === 0) {
    errors.push("Coverage must list at least one pinned cell");
  }
  const unverified = [];
  for (const cell of coverage) {
    if (!COVERAGE_VALUES.has(cell.status)) {
      errors.push(`Coverage cell ${cell.cell}: invalid status`);
    } else if (cell.status === "unverified") {
      unverified.push(cell.cell);
    }
  }
  return unverified;
}

function evaluateRound(run, output) {
  const errors = [];
  if (output.rubric_version !== run.rubric_version) {
    errors.push(
      `Round rubric ${output.rubric_version} does not match run ${run.rubric_version}`
    );
  }
  const findings = Array.isArray(output.findings) ? output.findings : [];
  validateFindings(findings, errors);
  const dims = scoreDimensions(run, output, findings, errors);
  const { total, applicableWeight } = weightedTotal(
    dims.scored,
    dims.unverified
  );
  const checks = evaluateChecks(run, output, findings, errors);
  const coverageGaps = evaluateCoverage(output, errors);
  const openRequired = findings.filter(isRequired).map((finding) => finding.id);
  if (total !== null && total < TARGET && openRequired.length === 0) {
    errors.push(
      `Total ${total.toFixed(3)} is below ${TARGET} with no open required finding`
    );
  }
  return {
    candidate: output.candidate ?? null,
    errors,
    findings,
    total,
    applicableWeight,
    failedFloors: dims.failedFloors,
    failedChecks: checks.failed,
    openRequired,
    openBlockers: findings.filter(isOpenBlocker).length,
    unverified: {
      coverage: coverageGaps,
      dimensions: dims.unverified,
      checks: checks.unverified,
    },
  };
}

function compareLedgers(previous, current, errors) {
  const before = new Map(previous.findings.map((f) => [f.id, f]));
  const now = new Set(current.findings.map((f) => f.id));
  for (const id of before.keys()) {
    if (!now.has(id)) {
      errors.push(`${id} disappeared from the ledger; resolve it instead`);
    }
  }
  for (const finding of current.findings) {
    const prior = before.get(finding.id);
    const reopened = prior?.status === "resolved" && finding.status === "open";
    if (!prior) {
      checkLateAdmission(finding, errors);
    } else if (reopened && !finding.reopen_reason) {
      errors.push(`${finding.id} reopened without reopen_reason`);
    }
  }
}

function checkLateAdmission(finding, errors) {
  if (!REQUIRED_SEVERITIES.has(finding.severity)) {
    return;
  }
  if (!LATE_ADMISSIONS.has(finding.admission)) {
    errors.push(
      `${finding.id}: late required finding needs admission regression, missed_p0_p1, or resolved_unverified`
    );
  } else if (
    finding.admission === "missed_p0_p1" &&
    !BLOCKER_SEVERITIES.has(finding.severity)
  ) {
    errors.push(`${finding.id}: missed_p0_p1 admission requires P0 or P1`);
  }
}

function unverifiedCount(result) {
  const { coverage, dimensions, checks } = result.unverified;
  return coverage.length + dimensions.length + checks.length;
}

function madeProgress(previous, current) {
  const closed = previous.openRequired.some(
    (id) => !current.openRequired.includes(id)
  );
  const fewerGaps = unverifiedCount(current) < unverifiedCount(previous);
  const higherTotal =
    current.total !== null &&
    (previous.total === null || current.total > previous.total);
  return closed || fewerGaps || higherTotal;
}

function pickBest(results) {
  const valid = results.filter((result) => result.errors.length === 0);
  if (valid.length === 0) {
    return null;
  }
  return [...valid].sort(
    (a, b) =>
      a.openBlockers - b.openBlockers ||
      a.openRequired.length - b.openRequired.length ||
      (b.total ?? -1) - (a.total ?? -1) ||
      b.round - a.round
  )[0];
}

function evaluateRun(run, rounds) {
  const results = [];
  let streak = 0;
  rounds.forEach(({ file, output }, index) => {
    const result = evaluateRound(run, output);
    result.round = index;
    result.file = file;
    const previous = results[index - 1];
    if (previous) {
      compareLedgers(previous, result, result.errors);
      streak = madeProgress(previous, result) ? 0 : streak + 1;
    }
    result.noProgressStreak = streak;
    results.push(result);
  });
  return results;
}

function decide(latest, budget) {
  if (latest.errors.length > 0) {
    return "invalid_judge_output";
  }
  const pending = latest.openRequired.length > 0 || unverifiedCount(latest) > 0;
  if (!pending) {
    return "accepted";
  }
  const exhausted =
    latest.round >= budget || latest.noProgressStreak > NO_PROGRESS_LIMIT;
  if (exhausted) {
    return "threshold_not_reached";
  }
  return unverifiedCount(latest) > 0 ? "incomplete" : "repair";
}

function summarize(run, results) {
  const latest = results.at(-1);
  const budget = run.budget?.repair_batches ?? DEFAULT_BUDGET;
  const decision = decide(latest, budget);
  const best = pickBest(results);
  return {
    rubric_version: run.rubric_version,
    run_id: run.run_id ?? null,
    calibration: CALIBRATION_STATUS,
    decision,
    label:
      decision === "accepted" ? `judge-accepted (${CALIBRATION_STATUS})` : null,
    round: latest.round,
    file: latest.file,
    candidate: latest.candidate,
    total: latest.total === null ? null : Number(latest.total.toFixed(3)),
    applicable_weight: latest.applicableWeight,
    failed_floors: latest.failedFloors,
    failed_checks: latest.failedChecks,
    open_required: latest.openRequired,
    unverified: latest.unverified,
    errors: latest.errors,
    budget: {
      repair_batches: budget,
      used: latest.round,
      remaining: Math.max(budget - latest.round, 0),
      no_progress_streak: latest.noProgressStreak,
      recovery_batch:
        decision === "repair" && latest.noProgressStreak === NO_PROGRESS_LIMIT,
    },
    best: best ? { round: best.round, candidate: best.candidate } : null,
  };
}

function main() {
  const runDir = process.argv[2];
  if (!runDir) {
    fail("Usage: score.mjs <run-dir>");
  }
  const { run, rounds } = loadRun(path.resolve(runDir));
  if (run.rubric_version !== RUBRIC_VERSION) {
    fail(`run.json rubric_version must be ${RUBRIC_VERSION}`);
  }
  const summary = summarize(run, evaluateRun(run, rounds));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
