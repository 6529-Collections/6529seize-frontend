#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { parseArgs } = require("./cli-args.cjs");

const SCHEMA_VERSION = "elastic-beanstalk-readiness.v1";
const CONTRACT = "elastic-beanstalk-adaptive-readiness.v1";
const REQUIRED_CONSECUTIVE_SAMPLES = 2;
const BACKOFF_SECONDS = Object.freeze([5, 10, 20, 30]);
const DEFAULT_TIMEOUT_SECONDS = 1320;
const DEFAULT_CALL_TIMEOUT_SECONDS = 30;
const HEX_SHA_PATTERN = /^[a-f0-9]{40}$/;
const execFileAsync = promisify(execFile);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parsePositiveInteger(value, fallback, optionName) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  invariant(
    Number.isInteger(parsed) && parsed > 0,
    `${optionName} must be a positive integer`
  );
  return parsed;
}

function sanitizeError(error) {
  if (!error) {
    return "unknown error";
  }
  return String(error.message || error)
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
}

function normalizeSnapshot(value) {
  let environment = value;
  if (value && Array.isArray(value.Environments)) {
    environment =
      value.Environments.length === 1 ? value.Environments[0] : null;
  }

  invariant(
    environment &&
      typeof environment === "object" &&
      !Array.isArray(environment),
    "Elastic Beanstalk returned no unique environment"
  );

  const health = environment.Health ?? environment.health;
  const status = environment.Status ?? environment.status;
  const versionLabel =
    environment.VersionLabel ??
    environment.versionLabel ??
    environment.version_label;

  invariant(typeof health === "string", "Elastic Beanstalk health is missing");
  invariant(typeof status === "string", "Elastic Beanstalk status is missing");
  invariant(
    typeof versionLabel === "string",
    "Elastic Beanstalk VersionLabel is missing"
  );

  return {
    health,
    status,
    version_label: versionLabel,
  };
}

async function describeEnvironmentWithAws({
  environmentName,
  timeoutMs,
  execFileImpl = execFileAsync,
}) {
  invariant(
    Number.isInteger(timeoutMs) && timeoutMs > 0,
    "Elastic Beanstalk call timeout must be a positive integer"
  );
  try {
    const { stdout } = await execFileImpl(
      "aws",
      [
        "elasticbeanstalk",
        "describe-environments",
        "--environment-names",
        environmentName,
        "--output",
        "json",
      ],
      {
        encoding: "utf8",
        timeout: timeoutMs,
        killSignal: "SIGTERM",
        windowsHide: true,
      }
    );
    return normalizeSnapshot(JSON.parse(stdout));
  } catch (error) {
    const detail = error?.stderr || error?.message || "AWS CLI request failed";
    throw new Error(detail);
  }
}

function buildObservation({
  sequence,
  observedAt,
  elapsedMs,
  snapshot,
  expectedVersion,
  consecutiveSamples,
  withinDeadline,
  error,
}) {
  const health = snapshot?.health ?? null;
  const status = snapshot?.status ?? null;
  const versionLabel = snapshot?.version_label ?? null;
  const healthReady = health === "Green" && status === "Ready";
  const versionMatch = versionLabel === expectedVersion;

  return {
    sequence,
    observed_at: observedAt,
    elapsed_ms: Math.max(0, elapsedMs),
    health,
    status,
    version_label: versionLabel,
    health_ready: healthReady,
    version_match: versionMatch,
    within_deadline: withinDeadline,
    healthy_exact_version: withinDeadline && healthReady && versionMatch,
    consecutive_healthy_exact_samples: consecutiveSamples,
    error: error ? sanitizeError(error) : null,
  };
}

function makeEvidence({
  environmentName,
  expectedVersion,
  timeoutMs,
  callTimeoutMs,
  startedAt,
  finishedAt,
  elapsedMs,
  observations,
  status,
  failure,
}) {
  const last = observations.at(-1) || null;
  return {
    schema_version: SCHEMA_VERSION,
    contract: CONTRACT,
    environment_name: environmentName,
    expected_version: expectedVersion,
    required_consecutive_samples: REQUIRED_CONSECUTIVE_SAMPLES,
    backoff_seconds: [...BACKOFF_SECONDS],
    timeout_seconds: timeoutMs / 1000,
    per_call_timeout_seconds: callTimeoutMs / 1000,
    started_at: startedAt,
    finished_at: finishedAt,
    elapsed_ms: Math.max(0, elapsedMs),
    status,
    attempts: observations.length,
    observations,
    result:
      status === "passed" && last
        ? {
            health: last.health,
            status: last.status,
            version_label: last.version_label,
            consecutive_samples: last.consecutive_healthy_exact_samples,
          }
        : null,
    failure: failure || null,
  };
}

async function observeEnvironment(describeEnvironment, context) {
  try {
    return {
      snapshot: normalizeSnapshot(await describeEnvironment(context)),
      error: null,
    };
  } catch (error) {
    return { snapshot: null, error };
  }
}

function isHealthyExactVersion(snapshot, expectedVersion) {
  return (
    snapshot?.health === "Green" &&
    snapshot.status === "Ready" &&
    snapshot.version_label === expectedVersion
  );
}

function resolveEnvironmentSampler(describeEnvironment, environmentName) {
  if (describeEnvironment) {
    return describeEnvironment;
  }
  return (context) =>
    describeEnvironmentWithAws({
      environmentName,
      timeoutMs: context.timeoutMs,
    });
}

async function waitForElasticBeanstalkReadiness(options = {}) {
  const environmentName = options.environmentName;
  const expectedVersion = options.expectedVersion;
  invariant(
    typeof environmentName === "string" && environmentName.trim().length > 0,
    "environmentName is required"
  );
  invariant(
    typeof expectedVersion === "string" &&
      HEX_SHA_PATTERN.test(expectedVersion),
    "expectedVersion must be a lowercase 40-character commit SHA"
  );

  const timeoutSeconds = parsePositiveInteger(
    options.timeoutSeconds,
    DEFAULT_TIMEOUT_SECONDS,
    "timeoutSeconds"
  );
  const timeoutMs = timeoutSeconds * 1000;
  const callTimeoutSeconds = parsePositiveInteger(
    options.callTimeoutSeconds,
    DEFAULT_CALL_TIMEOUT_SECONDS,
    "callTimeoutSeconds"
  );
  const callTimeoutMs = callTimeoutSeconds * 1000;
  const sampleEnvironment = resolveEnvironmentSampler(
    options.describeEnvironment,
    environmentName
  );
  const sleep =
    options.sleep ||
    ((milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const now = options.now || (() => new Date().toISOString());
  const monotonicNow = options.monotonicNow || (() => Date.now());
  const startedAt = now();
  const startedMs = monotonicNow();
  const observations = [];
  let consecutiveSamples = 0;

  while (monotonicNow() - startedMs < timeoutMs) {
    const beforeSampleMs = monotonicNow() - startedMs;
    const remainingBeforeCallMs = timeoutMs - beforeSampleMs;
    const currentCallTimeoutMs = Math.max(
      1,
      Math.min(callTimeoutMs, remainingBeforeCallMs)
    );
    const sequence = observations.length + 1;
    const { snapshot, error } = await observeEnvironment(sampleEnvironment, {
      timeoutMs: currentCallTimeoutMs,
      deadlineMs: startedMs + timeoutMs,
      sequence,
    });
    const sampleElapsedMs = monotonicNow() - startedMs;
    const withinDeadline = sampleElapsedMs < timeoutMs;
    const healthyExactVersion =
      withinDeadline && isHealthyExactVersion(snapshot, expectedVersion);
    consecutiveSamples = healthyExactVersion ? consecutiveSamples + 1 : 0;

    observations.push(
      buildObservation({
        sequence,
        observedAt: now(),
        elapsedMs: sampleElapsedMs,
        snapshot,
        expectedVersion,
        consecutiveSamples,
        withinDeadline,
        error,
      })
    );

    if (consecutiveSamples >= REQUIRED_CONSECUTIVE_SAMPLES) {
      const finishedAt = now();
      return {
        ok: true,
        evidence: makeEvidence({
          environmentName,
          expectedVersion,
          timeoutMs,
          callTimeoutMs,
          startedAt,
          finishedAt,
          elapsedMs: monotonicNow() - startedMs,
          observations,
          status: "passed",
        }),
      };
    }

    const elapsedMs = monotonicNow() - startedMs;
    const remainingMs = timeoutMs - elapsedMs;
    if (remainingMs <= 0) {
      break;
    }

    const backoffIndex = Math.min(sequence - 1, BACKOFF_SECONDS.length - 1);
    await sleep(Math.min(BACKOFF_SECONDS[backoffIndex] * 1000, remainingMs));
  }

  const finishedAt = now();
  const elapsedMs = monotonicNow() - startedMs;
  const onlyApiFailures =
    observations.length > 0 &&
    observations.every((observation) => observation.error);
  const failure = {
    code: onlyApiFailures ? "api_failure" : "timeout",
    message: onlyApiFailures
      ? "Elastic Beanstalk observations failed before a valid health sample was received."
      : "Elastic Beanstalk did not produce two consecutive healthy exact-version samples within the timeout.",
  };

  return {
    ok: false,
    evidence: makeEvidence({
      environmentName,
      expectedVersion,
      timeoutMs,
      callTimeoutMs,
      startedAt,
      finishedAt,
      elapsedMs,
      observations,
      status: "failed",
      failure,
    }),
  };
}

function writeEvidenceFile(output, evidence) {
  if (!output) {
    return;
  }

  const target = path.resolve(output);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.writeFileSync(target, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await waitForElasticBeanstalkReadiness({
    environmentName: args["environment-name"],
    expectedVersion: args["expected-version"],
    timeoutSeconds: args["timeout-seconds"],
    callTimeoutSeconds: args["call-timeout-seconds"],
  });
  writeEvidenceFile(args.output, result.evidence);

  if (result.ok) {
    process.stdout.write(
      `Elastic Beanstalk is Green/Ready at exact VersionLabel ${result.evidence.expected_version} after ${result.evidence.attempts} observations.\n`
    );
    return;
  }

  console.error(
    `Elastic Beanstalk readiness failed (${result.evidence.failure.code}): ${result.evidence.failure.message}`
  );
  process.exitCode = 1;
}

if (require.main === module) {
  (async () => {
    try {
      await main();
    } catch (error) {
      console.error(
        `Elastic Beanstalk readiness failed: ${sanitizeError(error)}`
      );
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  BACKOFF_SECONDS,
  CONTRACT,
  DEFAULT_TIMEOUT_SECONDS,
  DEFAULT_CALL_TIMEOUT_SECONDS,
  REQUIRED_CONSECUTIVE_SAMPLES,
  SCHEMA_VERSION,
  buildObservation,
  describeEnvironmentWithAws,
  makeEvidence,
  normalizeSnapshot,
  waitForElasticBeanstalkReadiness,
  writeEvidenceFile,
};
