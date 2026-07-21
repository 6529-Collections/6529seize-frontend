#!/usr/bin/env node

import fs from "node:fs";

const STAGES = ["lint", "typecheck", "unit_tests", "build"];
const MAX_SUITES = 50;
const MAX_TESTS = 100;
const MAX_TEXT = 500;
const OUTCOME_STATUS = {
  success: "SUCCEEDED",
  failure: "FAILED",
  cancelled: "FAILED",
  skipped: "SKIPPED",
};

function stageStatus(name) {
  const key = `RELEASE_BUS_GATE_${name.toUpperCase()}_OUTCOME`;
  const outcome = String(process.env[key] ?? "skipped").toLowerCase();
  return OUTCOME_STATUS[outcome] ?? "PENDING";
}

function safeText(value) {
  if (typeof value !== "string") return null;
  const sanitized = Array.from(value)
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code <= 31 || code === 127 ? " " : character;
    })
    .join("")
    .trim();
  return sanitized ? sanitized.slice(0, MAX_TEXT) : null;
}

function safeCount(value, maximum) {
  return Number.isInteger(value) && value >= 0 ? Math.min(value, maximum) : 0;
}

function projectJestSummary(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const failingSuites = Array.isArray(value.failing_suites)
    ? value.failing_suites.map(safeText).filter(Boolean).slice(0, MAX_SUITES)
    : [];
  const failingTests = Array.isArray(value.failing_tests)
    ? value.failing_tests
        .map((item) => {
          const suite = safeText(item?.suite);
          const test = safeText(item?.test);
          return suite && test ? { suite, test } : null;
        })
        .filter(Boolean)
        .slice(0, MAX_TESTS)
    : [];
  return {
    num_failed_test_suites: safeCount(value.num_failed_test_suites, 10_000),
    num_failed_tests: safeCount(value.num_failed_tests, 100_000),
    failing_suites: failingSuites,
    failing_tests: failingTests,
  };
}

function readJestSummary() {
  const filename =
    process.env.RELEASE_BUS_JEST_SUMMARY ??
    "test-results/release-bus/jest-summary.json";
  if (!fs.existsSync(filename)) return null;
  try {
    return projectJestSummary(JSON.parse(fs.readFileSync(filename, "utf8")));
  } catch {
    process.stderr.write("Release Bus Jest summary is invalid; omitting it.\n");
    return null;
  }
}

export function buildProgressPayload() {
  const stages =
    process.env.RELEASE_BUS_REPORT_INCLUDE_STAGES === "false"
      ? []
      : STAGES.map((name) => ({ name, status: stageStatus(name) }));
  const jobStatus = String(
    process.env.RELEASE_BUS_JOB_STATUS ?? ""
  ).toLowerCase();
  const failed =
    ["failure", "cancelled"].includes(jobStatus) ||
    stages.some((stage) => stage.status === "FAILED");
  return {
    train_id: process.env.RELEASE_BUS_TRAIN_ID,
    operation_key: process.env.RELEASE_BUS_OPERATION_KEY,
    workflow_run_id: process.env.GITHUB_RUN_ID,
    phase: process.env.RELEASE_BUS_REPORT_PHASE ?? "complete",
    status: failed ? "FAILED" : "SUCCEEDED",
    stages,
    jest: readJestSummary(),
    summary: null,
  };
}

async function main() {
  const payload = buildProgressPayload();
  if (process.argv.includes("--payload-only")) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  const apiUrl = process.env.RELEASE_BUS_API_URL;
  const token = process.env.RELEASE_BUS_WORKFLOW_AUTH_TOKEN;
  if (!apiUrl || !token) {
    process.stderr.write(
      "Release Bus progress reporting is not configured; skipping.\n"
    );
    return;
  }
  // Only the strict, bounded projection above is sent to the configured Release
  // Bus endpoint. Unknown fields, failure messages, and raw logs are discarded.
  // lgtm[js/file-access-to-http]
  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/deploy/release-bus/report-progress`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    throw new Error(`Release Bus progress report failed (${response.status})`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
) {
  await main();
}
