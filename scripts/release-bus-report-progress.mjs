#!/usr/bin/env node

import fs from "node:fs";

const STAGES = ["lint", "typecheck", "unit_tests", "build"];
const MAX_SUITES = 50;
const MAX_TESTS = 100;
const MAX_TEXT = 500;
const MAX_FILES = 200;
const MAX_DURATION_MS = 24 * 60 * 60 * 1000;
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

function safeDuration(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_DURATION_MS) {
    throw new Error("Release Bus summary contains an invalid duration");
  }
  return value;
}

function strictCount(value, maximum) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error("Release Bus summary contains an invalid count");
  }
  return value;
}

function safePath(value) {
  const text = safeText(value);
  const allowed =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._/@+-";
  const segments = text?.split("/") ?? [];
  if (
    !text ||
    text.length > MAX_TEXT ||
    text.startsWith("/") ||
    segments.some(
      (segment) => !segment || segment === "." || segment === ".."
    ) ||
    Array.from(text).some((character) => !allowed.includes(character))
  ) {
    throw new Error("Release Bus summary contains an invalid path");
  }
  return text;
}

function safePathList(value) {
  if (!Array.isArray(value) || value.length > MAX_FILES) {
    throw new Error("Release Bus summary contains an invalid path list");
  }
  const paths = value.map(safePath);
  if (new Set(paths).size !== paths.length) {
    throw new Error("Release Bus summary path list contains duplicates");
  }
  return paths;
}

function isVersionedAggregate(value) {
  return (
    /^[a-f0-9]{40}$/.test(String(value?.base_sha ?? "")) &&
    value?.environment === "orchestration" &&
    /^[a-f0-9]{64}$/.test(String(value?.gate_fingerprint ?? "")) &&
    /^[a-f0-9]{40}$/.test(String(value?.workflow_sha ?? "")) &&
    /^[a-f0-9]{64}$/.test(String(value?.workflow_digest ?? "")) &&
    typeof value?.node_version === "string" &&
    value.node_version.length > 0 &&
    value.node_version.length <= 64 &&
    typeof value?.package_manager === "string" &&
    value.package_manager.length > 0 &&
    value.package_manager.length <= 128 &&
    ["legacy", "shadow", "sharded"].includes(value?.gate_mode)
  );
}

function projectAggregateProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Release Bus aggregate summary is invalid");
  }
  const status = value.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED";
  const phases = Array.isArray(value.phases) ? value.phases : [];
  const stages = STAGES.map((name) => {
    const phase = phases.find((item) => item?.name === name);
    const phaseStatus = [
      "PENDING",
      "RUNNING",
      "SUCCEEDED",
      "FAILED",
      "SKIPPED",
    ].includes(phase?.status)
      ? phase.status
      : "FAILED";
    return { name, status: phaseStatus };
  });
  const totals = value.totals ?? {};
  const jest = projectJestSummary({
    num_failed_test_suites: totals.failed_test_suites,
    num_failed_tests: totals.failed_tests,
    failing_suites: value.failing_suites,
    failing_tests: value.failing_tests,
  });
  if (!isVersionedAggregate(value)) {
    return { status, stages, jest, summary: null };
  }
  const artifactDigest = String(
    process.env.RELEASE_BUS_SUMMARY_ARTIFACT_DIGEST ?? ""
  ).replace(/^sha256:/, "");
  if (!/^[a-f0-9]{64}$/.test(artifactDigest)) {
    throw new Error("Release Bus summary artifact digest is invalid");
  }
  const phaseDurations = Object.fromEntries(
    STAGES.map((name) => [name, safeDuration(value.phase_durations_ms?.[name])])
  );
  const durationValues = Object.values(phaseDurations);
  const totalDuration =
    value.gate_mode === "sharded"
      ? Math.max(...durationValues)
      : durationValues.reduce((total, duration) => total + duration, 0);
  const shardCount = strictCount(value.shard_count, 256);
  if (![1, 2, 4].includes(shardCount)) {
    throw new Error("Release Bus shard count is invalid");
  }
  if (!Array.isArray(value.shards) || value.shards.length !== shardCount) {
    throw new Error("Release Bus shard summary is incomplete");
  }
  const shards = value.shards.map((shard) => {
    const index = strictCount(shard?.index, 255);
    const count = strictCount(shard?.count, 256);
    if (index < 1 || index > shardCount || count !== shardCount) {
      throw new Error("Release Bus shard coordinate is invalid");
    }
    return {
      index,
      count,
      coordinate: `${index}/${count}`,
      status: ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "SKIPPED"].includes(
        shard?.status
      )
        ? shard.status
        : "FAILED",
      duration_ms: safeDuration(shard?.duration_ms),
      files: strictCount(shard?.counts?.test_files, 10_000_000),
      test_suites: strictCount(shard?.counts?.test_suites, 10_000_000),
      tests: strictCount(shard?.counts?.tests, 10_000_000),
      failed_test_suites: strictCount(
        shard?.counts?.failed_test_suites,
        10_000_000
      ),
      failed_tests: strictCount(shard?.counts?.failed_tests, 10_000_000),
    };
  });
  if (new Set(shards.map((shard) => shard.index)).size !== shardCount) {
    throw new Error("Release Bus shard coordinates contain duplicates");
  }
  return {
    status,
    stages,
    jest,
    summary: {
      base_sha: value.base_sha,
      environment: value.environment,
      gate_fingerprint: value.gate_fingerprint,
      workflow_sha: value.workflow_sha,
      workflow_digest: value.workflow_digest,
      node_version: safeText(value.node_version),
      package_manager: safeText(value.package_manager),
      shard_count: shardCount,
      summary_artifact_name: safePath(value.summary_artifact_name),
      summary_artifact_digest: artifactDigest,
      phase_durations_ms: {
        ...phaseDurations,
        total: safeDuration(totalDuration),
      },
      totals: {
        files: strictCount(totals.test_files, 10_000_000),
        test_suites: strictCount(totals.test_suites, 10_000_000),
        tests: strictCount(totals.tests, 10_000_000),
        failed_test_suites: strictCount(totals.failed_test_suites, 10_000_000),
        failed_tests: strictCount(totals.failed_tests, 10_000_000),
        skipped_tests: strictCount(
          strictCount(totals.pending_tests, 10_000_000) +
            strictCount(totals.todo_tests, 10_000_000),
          10_000_000
        ),
      },
      fresh_or_reused: "fresh",
      shards,
      missing_files: safePathList(value.missing_files),
      duplicate_files: safePathList(value.duplicate_files),
    },
  };
}

function readAggregateProgress() {
  const filename = process.env.RELEASE_BUS_AGGREGATE_SUMMARY;
  if (!filename) return null;
  if (!fs.existsSync(filename)) {
    throw new Error("Release Bus aggregate summary is missing");
  }
  return projectAggregateProgress(
    JSON.parse(fs.readFileSync(filename, "utf8"))
  );
}

export function buildProgressPayload() {
  const aggregate = readAggregateProgress();
  if (aggregate) {
    return {
      train_id: process.env.RELEASE_BUS_TRAIN_ID,
      operation_key: process.env.RELEASE_BUS_OPERATION_KEY,
      workflow_run_id: process.env.GITHUB_RUN_ID,
      phase: "complete",
      ...aggregate,
    };
  }
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
