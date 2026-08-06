#!/usr/bin/env node

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");

const MAX_INPUT_BYTES = 1024 * 1024;
const MAX_STRING_LENGTH = 512;
const MAX_JOBS = 100;
const MAX_STEPS = 100;
const RUN_ID = /^[1-9][0-9]{0,19}$/u;
const SHA = /^[a-f0-9]{40}$/u;
const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
  "startup_failure",
  "stale",
]);

function fail(message) {
  throw new Error(`failure-evidence:${message}`);
}

function plain(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function boundedString(value, code) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_STRING_LENGTH ||
    Buffer.byteLength(value, "utf8") > MAX_STRING_LENGTH
  )
    fail(code);
  return value;
}

function positiveInteger(value, code) {
  if (!Number.isInteger(value) || value < 1 || value > 1_000_000) fail(code);
  return value;
}

function runId(value, code) {
  const normalized = String(value);
  if (!RUN_ID.test(normalized)) fail(code);
  return normalized;
}

function exactString(value, expected, code) {
  if (value !== expected) fail(code);
  return value;
}

function repositoryName(value, code) {
  return exactString(value, "6529-Collections/6529seize-frontend", code);
}

function actionsActor(value, code) {
  if (!plain(value)) fail(code);
  return exactString(value.login, "github-actions[bot]", `${code}_LOGIN`);
}

function validateRun({
  run,
  kind,
  expectedRunId,
  expectedAttempt,
  expectedDeployRunId,
  expectedTargetSha,
}) {
  if (!plain(run)) fail("RUN_OBJECT");
  const runIdValue = runId(run.id, "RUN_ID");
  const attempt = positiveInteger(run.run_attempt, "RUN_ATTEMPT");
  if (runIdValue !== expectedRunId) fail("RUN_ID_MISMATCH");
  if (attempt !== expectedAttempt) fail("RUN_ATTEMPT_MISMATCH");
  exactString(run.status, "completed", "RUN_NOT_COMPLETED");
  if (!FAILURE_CONCLUSIONS.has(run.conclusion)) fail("RUN_NOT_FAILED");
  exactString(run.head_branch, "main", "RUN_BRANCH");
  exactString(run.event, "workflow_dispatch", "RUN_EVENT");
  repositoryName(run.repository?.full_name, "RUN_REPOSITORY");
  repositoryName(run.head_repository?.full_name, "RUN_HEAD_REPOSITORY");
  boundedString(run.name, "RUN_NAME");
  boundedString(run.path, "RUN_PATH");
  boundedString(run.display_title, "RUN_DISPLAY_TITLE");
  const headSha = boundedString(run.head_sha, "RUN_HEAD_SHA");
  if (!SHA.test(headSha)) fail("RUN_HEAD_SHA_FORMAT");
  if (kind === "deploy" && headSha !== expectedTargetSha)
    fail("RUN_TARGET_SHA_MISMATCH");

  if (kind === "deploy") {
    exactString(run.name, "Web Deploy - PROD", "DEPLOY_NAME");
    exactString(
      run.path,
      ".github/workflows/build-upload-deploy-prod.yml",
      "DEPLOY_PATH"
    );
    exactString(
      run.display_title,
      `Production deploy ${expectedTargetSha} [frontend-prod-${expectedRunId}]`,
      "DEPLOY_TITLE"
    );
  } else if (kind === "e2e") {
    exactString(run.name, "Production E2E", "E2E_NAME");
    exactString(run.path, ".github/workflows/production-e2e.yml", "E2E_PATH");
    const expectedTitle = `Production E2E automatic ${expectedDeployRunId}`;
    exactString(run.display_title, expectedTitle, "E2E_TITLE");
    actionsActor(run.actor, "E2E_ACTOR");
    actionsActor(run.triggering_actor, "E2E_TRIGGERING_ACTOR");
  } else {
    fail("KIND");
  }

  const normalized = {
    id: runIdValue,
    attempt,
    name: run.name,
    path: run.path,
    display_title: run.display_title,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    head_branch: run.head_branch,
    head_sha: headSha,
    repository: run.repository.full_name,
    head_repository: run.head_repository.full_name,
  };
  if (kind === "e2e") {
    normalized.actor_login = run.actor.login;
    normalized.triggering_actor_login = run.triggering_actor.login;
  }
  return normalized;
}

function normalizeStep(step) {
  if (!plain(step)) fail("STEP_OBJECT");
  const number = positiveInteger(step.number, "STEP_NUMBER");
  return {
    number,
    name: boundedString(step.name, "STEP_NAME"),
    status: boundedString(step.status, "STEP_STATUS"),
    conclusion:
      step.conclusion === null
        ? null
        : boundedString(step.conclusion, "STEP_CONCLUSION"),
  };
}

function normalizeJob(job) {
  if (!plain(job)) fail("JOB_OBJECT");
  const id = runId(job.id, "JOB_ID");
  if (!Array.isArray(job.steps) || job.steps.length > MAX_STEPS)
    fail("JOB_STEPS");
  const steps = job.steps.map(normalizeStep).sort((left, right) => {
    if (left.number !== right.number) return left.number - right.number;
    return left.name.localeCompare(right.name);
  });
  return {
    id: String(id),
    name: boundedString(job.name, "JOB_NAME"),
    status: boundedString(job.status, "JOB_STATUS"),
    conclusion:
      job.conclusion === null
        ? null
        : boundedString(job.conclusion, "JOB_CONCLUSION"),
    steps,
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (plain(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  }
  return value;
}

function parseJobs(jobsResponse) {
  if (!plain(jobsResponse)) fail("JOBS_OBJECT");
  if (
    !Number.isInteger(jobsResponse.total_count) ||
    jobsResponse.total_count < 0 ||
    jobsResponse.total_count > MAX_JOBS ||
    !Array.isArray(jobsResponse.jobs) ||
    jobsResponse.jobs.length > MAX_JOBS ||
    jobsResponse.total_count !== jobsResponse.jobs.length
  )
    fail("JOBS_BOUND");
  const jobs = jobsResponse.jobs
    .map(normalizeJob)
    .sort((left, right) =>
      left.id.localeCompare(right.id, "en", { numeric: true })
    );
  if (new Set(jobs.map((job) => job.id)).size !== jobs.length)
    fail("DUPLICATE_JOB_ID");
  return jobs;
}

function buildFailureEvidence({
  kind,
  run,
  jobs,
  runId: expectedRunId,
  attempt: expectedAttempt,
  deployRunId,
  targetSha,
}) {
  const expectedTargetShaValue = boundedString(
    targetSha,
    "EXPECTED_TARGET_SHA"
  );
  if (!SHA.test(expectedTargetShaValue)) fail("EXPECTED_TARGET_SHA_FORMAT");
  const workflow = validateRun({
    run,
    kind,
    expectedRunId: runId(expectedRunId, "EXPECTED_RUN_ID"),
    expectedAttempt: positiveInteger(expectedAttempt, "EXPECTED_ATTEMPT"),
    expectedDeployRunId:
      kind === "e2e" ? runId(deployRunId, "EXPECTED_DEPLOY_RUN_ID") : null,
    expectedTargetSha: expectedTargetShaValue,
  });
  return stable({
    contract: "one-click-production-failure-evidence-v1",
    deployed_target_sha: expectedTargetShaValue,
    workflow,
    jobs: parseJobs(jobs),
  });
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function evidenceDigest(evidence) {
  return crypto
    .createHash("sha256")
    .update(canonicalJson(evidence))
    .digest("hex");
}

function readJson(file, label) {
  if (typeof file !== "string" || file.length === 0) fail(`${label}_FILE`);
  let stats;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Bounded local JSON input; no network or shell execution.
    stats = fs.statSync(file);
  } catch {
    fail(`${label}_READ`);
  }
  if (!stats.isFile() || stats.size > MAX_INPUT_BYTES) fail(`${label}_BOUND`);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Bounded local JSON input; no network or shell execution.
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    fail(`${label}_JSON`);
  }
}

function option(argv, name, required = true) {
  const index = argv.indexOf(name);
  if (index === -1) {
    if (required)
      fail(`MISSING_${name.slice(2).replaceAll("-", "_").toUpperCase()}`);
    return null;
  }
  const value = argv[index + 1];
  if (!value || value.startsWith("--"))
    fail(`INVALID_${name.slice(2).toUpperCase()}`);
  return value;
}

function cli(argv) {
  const kind = option(argv, "--kind");
  const runFile = option(argv, "--run-file");
  const jobsFile = option(argv, "--jobs-file");
  const expectedRunId = option(argv, "--run-id");
  const expectedAttempt = Number(option(argv, "--run-attempt"));
  const deployRunId = option(argv, "--deploy-run-id", false);
  const targetSha = option(argv, "--target-sha");
  const output = option(argv, "--output", false);
  const evidence = buildFailureEvidence({
    kind,
    run: readJson(runFile, "RUN"),
    jobs: readJson(jobsFile, "JOBS"),
    runId: expectedRunId,
    attempt: expectedAttempt,
    deployRunId,
    targetSha,
  });
  const canonical = canonicalJson(evidence);
  if (Buffer.byteLength(canonical, "utf8") > MAX_INPUT_BYTES)
    fail("CANONICAL_BOUND");
  if (output) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Explicit exclusive output path supplied by the bounded CLI caller.
    fs.writeFileSync(output, `${canonical}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
  }
  process.stdout.write(`${evidenceDigest(evidence)}\n`);
}

if (require.main === module) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "failure-evidence:FAILED"}\n`
    );
    process.exitCode = 1;
  }
}

module.exports = {
  FAILURE_CONCLUSIONS,
  MAX_INPUT_BYTES,
  buildFailureEvidence,
  canonicalJson,
  evidenceDigest,
};
