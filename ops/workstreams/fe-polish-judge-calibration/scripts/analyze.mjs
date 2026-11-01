#!/usr/bin/env node
// Scores every calibration case in an answer key with score.mjs and compares
// the judge's output with the key. Writes the results file and prints a summary
// table. score.mjs only scores runs of its own rubric version, so the rubric 2.0
// results were produced by the 2.0 scorer and are kept as results-2.0.json.
//
// Usage (from the repository root):
//   node ops/workstreams/fe-polish-judge-calibration/scripts/analyze.mjs [labels] [results]
// Defaults: labels-2.1.json and results-2.1.json.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(ROOT, "../../..");
const SCORE = path.join(REPO, "ops/skills/fe-polish-judge/scripts/score.mjs");
const REQUIRED = new Set(["P0", "P1", "P2"]);

const [labelsFile = "labels-2.1.json", resultsFile = "results-2.1.json"] =
  process.argv.slice(2);
const labels = JSON.parse(fs.readFileSync(path.join(ROOT, labelsFile), "utf8"));

function readRound(id) {
  const rounds = path.join(ROOT, "cases", id, "rounds");
  const single = path.join(rounds, "00-baseline.json");
  if (fs.existsSync(single)) {
    return JSON.parse(fs.readFileSync(single, "utf8"));
  }
  const lensDir = path.join(rounds, "00");
  if (!fs.existsSync(lensDir)) {
    return null;
  }
  const merged = { findings: [], checks: {}, dimensions: {} };
  for (const lens of ["curatorial", "visual", "copy"]) {
    const file = path.join(lensDir, `${lens}.json`);
    if (!fs.existsSync(file)) {
      return null;
    }
    const output = JSON.parse(fs.readFileSync(file, "utf8"));
    merged.findings.push(...(output.findings ?? []));
    Object.assign(merged.checks, output.checks ?? {});
    Object.assign(merged.dimensions, output.dimensions ?? {});
  }
  return merged;
}

function score(id) {
  const relative = path.relative(REPO, path.join(ROOT, "cases", id));
  try {
    return JSON.parse(
      execFileSync(process.execPath, [SCORE, relative], {
        cwd: REPO,
        encoding: "utf8",
      })
    );
  } catch (error) {
    return { decision: "script_error", errors: [String(error.stderr || error.message)] };
  }
}

const results = {};
for (const [id, label] of Object.entries(labels)) {
  const round = readRound(id);
  if (!round) {
    results[id] = { label, missing: true };
    continue;
  }
  const scored = score(id);
  const required = round.findings.filter(
    (finding) => finding.status === "open" && REQUIRED.has(finding.severity)
  );
  const requiredTargets = new Set(required.flatMap((finding) => finding.targets ?? []));
  const failedChecks = Object.entries(round.checks)
    .filter(([, value]) => value === "fail")
    .map(([check]) => check);
  let outcome;
  if (Array.isArray(label.expect)) {
    const hits = label.expect.filter(
      (target) => requiredTargets.has(target) || failedChecks.includes(target)
    );
    outcome = hits.length === label.expect.length ? "detected" : "missed";
  } else if (label.expect === "required") {
    outcome = required.length > 0 ? "agrees" : "disagrees";
  } else if (label.expect === "accepted") {
    outcome = scored.decision === "accepted" ? "agrees" : "disagrees";
  } else if (label.expect === "adjudicate") {
    outcome = "adjudicate";
  } else {
    outcome = required.length === 0 ? "agrees" : "false-required";
  }
  results[id] = {
    label,
    decision: scored.decision,
    total: scored.total ?? null,
    errors: scored.errors ?? [],
    required: required.map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      targets: finding.targets,
      observation: finding.observation,
    })),
    failed_checks: failedChecks,
    outcome,
  };
}

const repeats = ["c01", "c09", "c10"]
  .map((id) => results[id])
  .filter((result) => result && !result.missing && result.total !== null);
const totals = repeats.map((result) => result.total);
const mean = totals.reduce((sum, value) => sum + value, 0) / (totals.length || 1);
const spread = totals.length > 1 ? Math.max(...totals) - Math.min(...totals) : null;
const summary = {
  repeat_totals: totals,
  repeat_mean: totals.length ? Number(mean.toFixed(3)) : null,
  repeat_spread: spread === null ? null : Number(spread.toFixed(3)),
  repeat_outcomes: repeats.map((result) => result.outcome),
};

fs.writeFileSync(
  path.join(ROOT, resultsFile),
  `${JSON.stringify({ summary, results }, null, 2)}\n`
);
for (const [id, result] of Object.entries(results)) {
  if (result.missing) {
    process.stdout.write(`${id} missing\n`);
    continue;
  }
  const failed = result.failed_checks.join("|") || "-";
  const errors = result.errors.length ? " errors=" + result.errors.length : "";
  process.stdout.write(
    `${id} ${result.label.kind} ${result.outcome} decision=${result.decision} total=${result.total} required=${result.required.length} failed=${failed}${errors}\n`
  );
}
process.stdout.write(`${JSON.stringify(summary)}\n`);
