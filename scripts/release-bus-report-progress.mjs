#!/usr/bin/env node

import fs from "node:fs";

const STAGES = ["lint", "typecheck", "unit_tests", "build"];
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

function readJestSummary() {
  const filename =
    process.env.RELEASE_BUS_JEST_SUMMARY ??
    "test-results/release-bus/jest-summary.json";
  if (!fs.existsSync(filename)) return null;
  const value = JSON.parse(fs.readFileSync(filename, "utf8"));
  return {
    num_failed_test_suites: value.num_failed_test_suites ?? 0,
    num_failed_tests: value.num_failed_tests ?? 0,
    failing_suites: Array.isArray(value.failing_suites)
      ? value.failing_suites.slice(0, 50)
      : [],
    failing_tests: Array.isArray(value.failing_tests)
      ? value.failing_tests.slice(0, 100)
      : [],
  };
}

export function buildProgressPayload() {
  const stages = STAGES.map((name) => ({ name, status: stageStatus(name) }));
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
  if (!apiUrl || !token)
    throw new Error("Release Bus reporting is not configured");
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
