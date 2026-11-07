#!/usr/bin/env node

/* eslint-disable security/detect-non-literal-fs-filename -- This local-only skill CLI intentionally reads the run directory named on the command line. */

// Computes the fe-polish-judge decision for a run directory.
//
// Usage: node ops/skills/fe-polish-judge/scripts/score.mjs <run-dir>
//
// Run from the repository root; <run-dir> must sit inside the current working
// directory (for example ops/workstreams/<slug>/judge/<run-id>).
//
// <run-dir>/run.json holds the frozen run record. <run-dir>/rounds/ holds one
// entry per round, ordered by its leading number (00-baseline.json, 01.json,
// ...): a judge output file or, for lens reviews such as the Museum profile, a
// directory with curatorial.json, visual.json, and copy.json that is merged into
// one ledger. Prints the decision as JSON. Exits 2 on unreadable input.

import fs from "node:fs";
import path from "node:path";

const RUBRIC_VERSION = "fe-polish-judge/2.1";
const CALIBRATION_STATUS = "partially calibrated";
const FLOOR = 8;
const TARGET = 8.5;
const DEFAULT_BUDGET = 6;
const DEFAULT_STATE = "default";
const DEFAULT_LOCALE = "en-US";
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
  J14: 10,
};
const INTEGRITY_CHECKS = ["I1", "I2", "I3"];
const CRYPTO_CHECKS = ["S1", "S2", "S3", "S4", "S5", "S6"];
const MUSEUM_CHECKS = ["M1", "M2", "M3", "M4"];
// S checks for a lifecycle stage outside the reviewed states may be pinned N/A.
// I, M, and S6 checks apply to everything a reviewer can see.
const PINNABLE_CHECKS = new Set(["S1", "S2", "S3", "S4", "S5"]);
const PROFILES = new Set(["general", "museum"]);
const MUSEUM_VIEWPORTS = Object.freeze(["1440x1000", "820x1000", "390x844"]);
const LENS_PREFIXES = Object.freeze({
  curatorial: "C-",
  visual: "V-",
  copy: "E-",
});
const LENSES = {
  curatorial: ["J01", "J14", ...MUSEUM_CHECKS],
  visual: [
    "J02",
    "J03",
    "J04",
    "J05",
    "J06",
    "J08",
    "J09",
    "J10",
    "J11",
    "J13",
    ...CRYPTO_CHECKS,
  ],
  copy: ["J07", "J12", ...INTEGRITY_CHECKS],
};
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
    return JSON.parse(fs.readFileSync(file, "utf8")); // NOSONAR S8707: operator-selected run directory, confined to the working directory by resolveRunDir.
  } catch (error) {
    return fail(`Cannot read ${file}: ${error.message}`);
  }
}

function roundOrder(name) {
  const match = /^\d+/.exec(name);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function readLensRound(dir) {
  const lenses = {};
  for (const lens of Object.keys(LENSES)) {
    const file = path.join(dir, `${lens}.json`);
    const present = fs.existsSync(file); // NOSONAR S8707: lens file inside the confined run directory.
    lenses[lens] = present ? readJson(file) : null;
  }
  return lenses;
}

function loadRun(runDir) {
  const run = readJson(path.join(runDir, "run.json"));
  const roundsDir = path.join(runDir, "rounds");
  const roundsExist = fs.existsSync(roundsDir); // NOSONAR S8707: derived from the run directory confined by resolveRunDir.
  if (!roundsExist) {
    fail(`Missing ${roundsDir}`);
  }
  const entries = fs
    .readdirSync(roundsDir, { withFileTypes: true }) // NOSONAR S8707: operator-selected rounds directory, confined to the working directory by resolveRunDir.
    .filter((entry) => entry.isDirectory() || entry.name.endsWith(".json"))
    .sort(
      (a, b) =>
        roundOrder(a.name) - roundOrder(b.name) || a.name.localeCompare(b.name)
    );
  if (entries.length === 0) {
    fail(`No judge rounds in ${roundsDir}`);
  }
  const rounds = entries.map((entry) => {
    const location = path.join(roundsDir, entry.name);
    return entry.isDirectory()
      ? { file: entry.name, lenses: readLensRound(location) }
      : { file: entry.name, output: readJson(location) };
  });
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

function isMuseum(run) {
  return run.profile === "museum";
}

function pinnedNotApplicable(run) {
  const pinned = { ...run.not_applicable };
  if (!isMuseum(run)) {
    pinned.J14 = "Museum profile only";
  }
  return pinned;
}

function applicableChecks(run) {
  const pinned = pinnedNotApplicable(run);
  const checks = [...INTEGRITY_CHECKS];
  if (!("J13" in pinned)) {
    checks.push(...CRYPTO_CHECKS.filter((id) => !(id in pinned)));
  }
  if (isMuseum(run)) {
    checks.push(...MUSEUM_CHECKS);
  }
  return checks;
}

function notApplicableErrors(run) {
  const pinned = run.not_applicable ?? {};
  return Object.entries(pinned).flatMap(([id, reason]) => {
    if (!(id in WEIGHTS) && !PINNABLE_CHECKS.has(id)) {
      return [`${id} cannot be pinned N/A; pin dimensions or S1-S5 only`];
    }
    if (typeof reason !== "string" || reason.trim() === "") {
      return [`${id} is pinned N/A without a reason`];
    }
    return [];
  });
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
    ...MUSEUM_CHECKS,
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
  const pinned = pinnedNotApplicable(run);
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
  for (const id of CRYPTO_CHECKS) {
    const judged = checks[id] !== undefined && checks[id] !== "not_applicable";
    if (!applicable.includes(id) && judged && id in (run.not_applicable ?? {})) {
      errors.push(`${id} is pinned N/A but was judged`);
    }
  }
  for (const id of applicable) {
    const value = checks[id];
    if (value === "not_applicable") {
      errors.push(`${id} applies to this run and cannot be not_applicable`);
      continue;
    }
    if (!CHECK_VALUES.has(value)) {
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

function cellKey(cell) {
  return [
    cell.route,
    cell.state ?? DEFAULT_STATE,
    cell.viewport,
    cell.locale ?? DEFAULT_LOCALE,
  ].join(" · ");
}

// Pinned cells are routes x states x viewports x locales, unless the run
// record lists non-Cartesian combinations in scope.cells.
function expectedCells(run) {
  const scope = run.scope ?? {};
  if (Array.isArray(scope.cells)) {
    return scope.cells.map(cellKey);
  }
  const states = scope.states ?? [DEFAULT_STATE];
  const locales = scope.locales ?? [DEFAULT_LOCALE];
  return (scope.routes ?? []).flatMap((route) =>
    states.flatMap((state) =>
      (scope.viewports ?? []).flatMap((viewport) =>
        locales.map((locale) => cellKey({ route, state, viewport, locale }))
      )
    )
  );
}

function checkCoverageStatus(cell, key, errors, unverified) {
  if (!COVERAGE_VALUES.has(cell.status)) {
    errors.push(`Coverage cell ${key}: invalid status`);
    return;
  }
  if (cell.status !== "verified" && !String(cell.reason ?? "").trim()) {
    errors.push(`Coverage cell ${key}: ${cell.status} needs a reason`);
  }
  if (cell.status === "unverified") {
    unverified.push(key);
  }
}

function evaluateCoverage(run, output, errors) {
  const coverage = Array.isArray(output.coverage) ? output.coverage : [];
  const pinned = new Set(expectedCells(run));
  const seen = new Set();
  const unverified = [];
  for (const cell of coverage) {
    const key = cellKey(cell);
    if (!pinned.has(key)) {
      errors.push(`Coverage cell ${key} is outside the pinned scope`);
    } else if (seen.has(key)) {
      errors.push(`Coverage cell ${key} is listed twice`);
    }
    seen.add(key);
    checkCoverageStatus(cell, key, errors, unverified);
  }
  for (const key of pinned) {
    if (!seen.has(key)) {
      errors.push(`Coverage is missing pinned cell ${key}`);
    }
  }
  return unverified;
}

// Each lens must list every pinned cell; an omitted cell is invalid output. A
// cell that any lens marks unverified is a coverage gap.
function evaluateRoundCoverage(run, output, errors) {
  if (!output.coverageByLens) {
    return evaluateCoverage(run, output, errors);
  }
  const gaps = new Set();
  for (const [lens, coverage] of Object.entries(output.coverageByLens)) {
    const lensErrors = [];
    for (const key of evaluateCoverage(run, { coverage }, lensErrors)) {
      gaps.add(key);
    }
    errors.push(...lensErrors.map((error) => `${lens}: ${error}`));
  }
  return [...gaps];
}

function mergeOwned(lens, owned, source, target, errors) {
  for (const [id, value] of Object.entries(source ?? {})) {
    if (owned.has(id)) {
      target[id] = value;
    } else {
      errors.push(`${lens} lens reported ${id}, which it does not own`);
    }
  }
}

function mergeLensFindings(lens, owned, findings, merged, errors) {
  for (const finding of findings ?? []) {
    if (targetsOf(finding).some((target) => !owned.has(target))) {
      errors.push(`${finding.id}: ${lens} finding targets outside its lens`);
    }
    if (!String(finding.id ?? "").startsWith(LENS_PREFIXES[lens])) {
      errors.push(
        `${finding.id}: ${lens} finding ids must start with ${LENS_PREFIXES[lens]}`
      );
    }
    merged.push({ ...finding, lens });
  }
}

// The Museum gate always reviews a production build at all three widths.
function museumRunErrors(run) {
  const viewports = run.scope?.viewports ?? [];
  const missing = MUSEUM_VIEWPORTS.filter((size) => !viewports.includes(size));
  const errors = [];
  if (missing.length > 0) {
    errors.push(`Museum runs must pin viewports ${missing.join(", ")}`);
  }
  if (run.candidate?.build !== "production") {
    errors.push('Museum runs must judge a "production" build');
  }
  return errors;
}

function mergeLenses(lenses, errors) {
  const merged = {
    coverageByLens: {},
    dimensions: {},
    checks: {},
    findings: [],
    preserve: [],
  };
  const versions = new Set();
  const candidates = new Set();
  for (const [lens, ownedIds] of Object.entries(LENSES)) {
    const output = lenses[lens];
    if (!output) {
      errors.push(`Lens round is missing ${lens}.json`);
      continue;
    }
    const owned = new Set(ownedIds);
    versions.add(output.rubric_version);
    candidates.add(output.candidate);
    mergeOwned(lens, owned, output.dimensions, merged.dimensions, errors);
    mergeOwned(lens, owned, output.checks, merged.checks, errors);
    mergeLensFindings(lens, owned, output.findings, merged.findings, errors);
    merged.coverageByLens[lens] = output.coverage ?? [];
    merged.preserve.push(...(output.preserve ?? []));
  }
  if (versions.size > 1 || candidates.size > 1) {
    errors.push("Lens outputs disagree on rubric_version or candidate");
  }
  merged.rubric_version = [...versions][0];
  merged.candidate = [...candidates][0];
  return merged;
}

function roundOutput(run, round, errors) {
  if (round.lenses) {
    return mergeLenses(round.lenses, errors);
  }
  if (isMuseum(run)) {
    errors.push("Museum profile rounds must be lens directories");
  }
  return round.output;
}

function evaluateRound(run, round) {
  const errors = [];
  const output = roundOutput(run, round, errors);
  if (output.rubric_version !== run.rubric_version) {
    errors.push(
      `Round rubric ${output.rubric_version} does not match run ${run.rubric_version}`
    );
  }
  // Repair batches are counted by candidate change, so every round must name
  // the commit it judged.
  if (typeof output.candidate !== "string" || output.candidate.trim() === "") {
    errors.push("Round must name the candidate commit it judged");
  }
  const findings = Array.isArray(output.findings) ? output.findings : [];
  validateFindings(findings, errors);
  const dims = scoreDimensions(run, output, findings, errors);
  const { total, applicableWeight } = weightedTotal(
    dims.scored,
    dims.unverified
  );
  const checks = evaluateChecks(run, output, findings, errors);
  const coverageGaps = evaluateRoundCoverage(run, output, errors);
  const openRequired = findings.filter(isRequired).map((finding) => finding.id);
  // The total is null while any dimension is unverified. Such a round cannot be
  // accepted (it is incomplete), so the 8.5 consistency check waits until every
  // applicable dimension is scored.
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

// A repair batch is a new candidate. Rejudging the same candidate (after
// invalid output or added evidence) records a round but spends no budget.
function evaluateRun(run, rounds) {
  const results = [];
  let streak = 0;
  rounds.forEach((round, index) => {
    const result = evaluateRound(run, round);
    result.round = index;
    result.file = round.file;
    result.batch = 0;
    const previous = results[index - 1];
    if (previous) {
      compareLedgers(previous, result, result.errors);
      const repaired = result.candidate !== previous.candidate;
      result.batch = previous.batch + (repaired ? 1 : 0);
      if (repaired) {
        streak = madeProgress(previous, result) ? 0 : streak + 1;
      }
    }
    result.noProgressStreak = streak;
    results.push(result);
  });
  checkLatestCandidate(run, results.at(-1));
  return results;
}

function checkLatestCandidate(run, latest) {
  const expected = run.candidate?.commit;
  if (expected && latest.candidate !== expected) {
    latest.errors.push(
      `Latest round judged ${latest.candidate}, but run.json candidate is ${expected}`
    );
  }
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
    latest.batch >= budget || latest.noProgressStreak > NO_PROGRESS_LIMIT;
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
      used: latest.batch,
      remaining: Math.max(budget - latest.batch, 0),
      no_progress_streak: latest.noProgressStreak,
      recovery_batch:
        decision === "repair" && latest.noProgressStreak === NO_PROGRESS_LIMIT,
    },
    best: best ? { round: best.round, candidate: best.candidate } : null,
  };
}

function resolveRunDir(argument) {
  const base = path.resolve(process.cwd());
  const resolved = path.resolve(base, argument);
  if (!resolved.startsWith(base + path.sep)) {
    fail("The run directory must be inside the current working directory");
  }
  return resolved;
}

function main() {
  const runDir = process.argv[2];
  if (!runDir) {
    fail("Usage: score.mjs <run-dir>");
  }
  const { run, rounds } = loadRun(resolveRunDir(runDir));
  if (run.rubric_version !== RUBRIC_VERSION) {
    fail(`run.json rubric_version must be ${RUBRIC_VERSION}`);
  }
  if (run.profile !== undefined && !PROFILES.has(run.profile)) {
    fail(`run.json profile must be one of: ${[...PROFILES].join(", ")}`);
  }
  const pinErrors = notApplicableErrors(run);
  if (pinErrors.length > 0) {
    fail(`run.json: ${pinErrors.join("; ")}`);
  }
  if (isMuseum(run)) {
    const errors = museumRunErrors(run);
    if (errors.length > 0) {
      fail(`run.json: ${errors.join("; ")}`);
    }
  }
  if (expectedCells(run).length === 0) {
    fail("run.json scope must pin routes and viewports, or list scope.cells");
  }
  const summary = summarize(run, evaluateRun(run, rounds));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
