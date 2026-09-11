#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const INPUT_CONTRACT = "runner-benchmark-inputs-v1";
const EVIDENCE_CONTRACT = "runner-benchmark-evidence-v1";
const CONTROLLER_EVIDENCE_CONTRACT = "runner-benchmark-controller-evidence-v1";
const {
  CANDIDATE_EVENTS,
  CANDIDATE_WORKFLOW_PATH,
  CONTROL_RUNNER_LABEL,
  CONTROLLER_NONCE_PATTERN,
  DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  MAX_COMPLETION_TIMEOUT_SECONDS,
  MAX_CONTROLLER_TIMEOUT_MINUTES,
  MAX_REPEAT_COUNT,
  MAX_TIMEOUT_SECONDS,
  MIN_COMPLETION_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  PINNED_PNPM_VERSION,
  PROFILES,
  RECONCILIATION_TIMEOUT_SECONDS,
  REQUEST_ID_PATTERN,
  RUNNER_LABEL_PATTERN,
  SOURCE_SHA_PATTERN,
  buildRequestId,
  calculateControllerTimeoutMinutes,
  CONTROLLER_RUN_ATTEMPT,
  normalizeCandidateInputs,
  normalizeInputs,
  requireControllerNonce,
  requireExactSha,
  requireInteger,
  requireRequestId,
  requireRunId,
  requireString,
  selectRunnerLabel,
  validateControllerRunMetadata,
  validateRunMetadata,
  validateTrustedSource,
} = require("./runner-benchmark-inputs.cjs");
const STATUSES = Object.freeze([
  "success",
  "failure",
  "unavailable",
  "cancelled",
]);
const TIMING_KEYS = Object.freeze([
  "queue_ms",
  "setup_ms",
  "checkout_ms",
  "install_ms",
  "build_ms",
  "package_ms",
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeTiming(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return requireInteger(value, label, 0, 24 * 60 * 60 * 1000);
}

function normalizeEnvironment(environment) {
  if (
    !environment ||
    typeof environment !== "object" ||
    Array.isArray(environment)
  ) {
    throw new Error("environment must be an object");
  }
  const allowed = [
    "runner_os",
    "runner_arch",
    "runner_environment",
    "node_version",
    "pnpm_version",
    "cpu_count",
    "kernel_release",
  ];
  const normalized = {};
  for (const key of allowed) {
    if (Object.hasOwn(environment, key)) {
      const value = environment[key];
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        throw new TypeError(`environment.${key} has an unsupported value`);
      }
      normalized[key] = value;
    }
  }
  return normalized;
}

function assertNoSecretShape(value, location = "evidence") {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) =>
      assertNoSecretShape(child, `${location}[${index}]`)
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (
      /(?:secret|password|credential|private[_-]?key|access[_-]?token|token)/iu.test(
        key
      )
    ) {
      throw new Error(
        `secret-shaped evidence field is forbidden: ${location}.${key}`
      );
    }
    assertNoSecretShape(child, `${location}.${key}`);
  }
}

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)))
      .map(([key, child]) => [key, sortValue(child)])
  );
}

function normalizeCommonEvidence(raw) {
  const inputs = normalizeCandidateInputs({
    eventName: raw.event_name,
    sourceSha: raw.source_sha,
    candidateLabel: raw.candidate_label,
    timeoutSeconds: raw.timeout_seconds,
    completionTimeoutSeconds: raw.completion_timeout_seconds,
    profile: raw.profile,
    repeatNumber: raw.repeat,
    repeatCount: raw.repeat_count ?? 1,
    requestId: raw.request_id,
    controllerNonce: raw.controller_nonce,
    controllerRunId: raw.controller_run_id,
    controllerRunAttempt: raw.controller_run_attempt,
  });
  if (!STATUSES.includes(raw.status)) {
    throw new Error(`status must be one of: ${STATUSES.join(", ")}`);
  }
  const timings = {};
  for (const key of TIMING_KEYS) {
    timings[key] = normalizeTiming(raw.timings_ms?.[key], `timings_ms.${key}`);
  }
  const observedAt = requireString(raw.observed_at, "observed_at");
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new TypeError("observed_at must be an ISO timestamp");
  }
  if (raw.metadata_verified !== true) {
    throw new Error("candidate evidence requires verified run metadata");
  }
  const environment = normalizeEnvironment(raw.environment);
  if (
    raw.status === "success" &&
    environment.pnpm_version !== PINNED_PNPM_VERSION
  ) {
    throw new Error(
      `successful candidate evidence must report pnpm ${PINNED_PNPM_VERSION}`
    );
  }
  return {
    contract: EVIDENCE_CONTRACT,
    status: raw.status,
    source_sha: inputs.source_sha,
    candidate_label: inputs.candidate_label,
    profile: inputs.profile,
    timeout_seconds: inputs.timeout_seconds,
    completion_timeout_seconds: inputs.completion_timeout_seconds,
    repeat_count: inputs.repeat_count,
    repeat: inputs.repeat_number,
    repository: requireString(raw.repository, "repository"),
    workflow_sha: requireExactSha(raw.workflow_sha, "workflow_sha"),
    run_id: requireRunId(raw.run_id),
    request_id: inputs.request_id,
    controller_nonce: inputs.controller_nonce,
    controller_run_id: inputs.controller_run_id,
    controller_run_attempt: inputs.controller_run_attempt,
    event_name: inputs.event_name,
    metadata_verified: true,
    observed_at: observedAt,
    timings_ms: timings,
    environment,
    failure_class: raw.failure_class ? String(raw.failure_class) : null,
    failure_reason: raw.failure_reason ? String(raw.failure_reason) : null,
  };
}

function assertExactEvidenceBinding(evidence, inputs, expected) {
  const exactFields = [
    ["source_sha", inputs.source_sha],
    ["candidate_label", inputs.candidate_label],
    ["timeout_seconds", inputs.timeout_seconds],
    ["completion_timeout_seconds", inputs.completion_timeout_seconds],
    ["profile", inputs.profile],
    ["repeat", inputs.repeat_number],
    ["repeat_count", inputs.repeat_count],
    ["request_id", inputs.request_id],
    ["controller_nonce", inputs.controller_nonce],
    ["controller_run_id", inputs.controller_run_id],
    ["controller_run_attempt", inputs.controller_run_attempt],
    ["event_name", inputs.event_name],
  ];
  for (const [field, expectedValue] of exactFields) {
    if (evidence[field] !== expectedValue) {
      throw new Error(`untrusted candidate observation changed ${field}`);
    }
  }
  if (
    evidence.repository !== requireString(expected.repository, "repository")
  ) {
    throw new Error("untrusted candidate observation changed repository");
  }
  if (
    evidence.workflow_sha !==
    requireExactSha(expected.workflowSha, "workflowSha")
  ) {
    throw new Error("untrusted candidate observation changed workflow SHA");
  }
  if (evidence.run_id !== requireRunId(expected.runId, "runId")) {
    throw new Error("untrusted candidate observation changed run ID");
  }
  if (expected.status !== undefined && evidence.status !== expected.status) {
    throw new Error(
      "untrusted candidate observation status does not match the job result"
    );
  }
}

function assertCompleteSuccessfulEvidence(evidence) {
  if (evidence.status !== "success") {
    return;
  }
  for (const key of TIMING_KEYS.filter(
    (timingKey) => timingKey !== "queue_ms"
  )) {
    if (evidence.timings_ms[key] === null) {
      throw new Error(`successful candidate observation is missing ${key}`);
    }
  }
}

function verifyCandidateEvidence(raw, expected) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("untrusted candidate observation must be an object");
  }
  assertNoSecretShape(raw);
  if (raw.metadata_verified === true) {
    throw new Error(
      "untrusted candidate observation cannot self-attest metadata verification"
    );
  }
  const inputs = normalizeCandidateInputs({
    eventName: expected.eventName,
    sourceSha: expected.sourceSha,
    candidateLabel: expected.candidateLabel,
    timeoutSeconds: expected.timeoutSeconds,
    completionTimeoutSeconds: expected.completionTimeoutSeconds,
    profile: expected.profile,
    repeatNumber: expected.repeatNumber,
    repeatCount: expected.repeatCount,
    requestId: expected.requestId,
    controllerNonce: expected.controllerNonce,
    controllerRunId: expected.controllerRunId,
    controllerRunAttempt: expected.controllerRunAttempt,
  });
  const evidence = normalizeCommonEvidence({
    ...raw,
    metadata_verified: true,
  });
  assertExactEvidenceBinding(evidence, inputs, expected);
  assertCompleteSuccessfulEvidence(evidence);
  return evidence;
}

function normalizeControllerEvidence(raw) {
  const inputs = normalizeInputs({
    sourceSha: raw.source_sha,
    candidateLabel: raw.candidate_label,
    timeoutSeconds: raw.timeout_seconds,
    completionTimeoutSeconds: raw.completion_timeout_seconds,
    profile: raw.profile,
    repeatCount: raw.repeat_count,
  });
  const controllerNonce = requireControllerNonce(raw.controller_nonce);
  const controllerRunId = requireRunId(
    raw.controller_run_id,
    "controller_run_id"
  );
  const controllerRunAttempt = requireInteger(
    raw.controller_run_attempt,
    "controller_run_attempt",
    CONTROLLER_RUN_ATTEMPT,
    CONTROLLER_RUN_ATTEMPT
  );
  const results = Array.isArray(raw.results) ? raw.results : [];
  if (results.length !== inputs.repeat_count) {
    throw new Error("controller results must contain one entry per repeat");
  }
  const seenRepeats = new Set();
  const seenRequestIds = new Set();
  const normalizedResults = results.map((result, index) => {
    const status = requireString(result.status, `results[${index}].status`);
    if (!STATUSES.includes(status)) {
      throw new Error(`results[${index}].status is not a valid status`);
    }
    const repeat = requireInteger(
      result.repeat,
      `results[${index}].repeat`,
      1,
      inputs.repeat_count
    );
    if (seenRepeats.has(repeat)) {
      throw new Error(`results[${index}].repeat is duplicated`);
    }
    seenRepeats.add(repeat);
    const requestId = requireRequestId(
      result.request_id,
      controllerNonce,
      `results[${index}].request_id`
    );
    const expectedRequestId = buildRequestId({
      sourceSha: inputs.source_sha,
      candidateLabel: inputs.candidate_label,
      timeoutSeconds: inputs.timeout_seconds,
      completionTimeoutSeconds: inputs.completion_timeout_seconds,
      profile: inputs.profile,
      repeatNumber: repeat,
      repeatCount: inputs.repeat_count,
      controllerRunId,
      controllerRunAttempt,
      controllerNonce,
    });
    if (requestId !== expectedRequestId) {
      throw new Error(
        `results[${index}].request_id is not bound to every controller input`
      );
    }
    if (seenRequestIds.has(requestId)) {
      throw new Error(`results[${index}].request_id is duplicated`);
    }
    seenRequestIds.add(requestId);
    const runId =
      result.run_id === null || result.run_id === undefined
        ? null
        : requireRunId(result.run_id, `results[${index}].run_id`);
    if (result.cancellation_requested === true && runId === null) {
      throw new Error(
        `results[${index}] cannot request cancellation without a verified run`
      );
    }
    if (runId !== null && result.metadata_verified !== true) {
      throw new Error(
        `results[${index}] requires verified metadata for an identified run`
      );
    }
    return {
      repeat,
      request_id: requestId,
      run_id: runId,
      controller_nonce: controllerNonce,
      status,
      failure_class: result.failure_class ? String(result.failure_class) : null,
      dispatch_ms: normalizeTiming(
        result.dispatch_ms,
        `results[${index}].dispatch_ms`
      ),
      observed_ms: normalizeTiming(
        result.observed_ms,
        `results[${index}].observed_ms`
      ),
      cancellation_requested: result.cancellation_requested === true,
      metadata_verified: result.metadata_verified === true,
      reconciliation_pending: result.reconciliation_pending === true,
    };
  });
  for (let repeat = 1; repeat <= inputs.repeat_count; repeat += 1) {
    if (!seenRepeats.has(repeat)) {
      throw new Error(`controller results are missing repeat ${repeat}`);
    }
  }
  const observedAt = requireString(raw.observed_at, "observed_at");
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new TypeError("observed_at must be an ISO timestamp");
  }
  if (raw.reconciliation_completed !== true) {
    throw new Error("controller evidence must complete final reconciliation");
  }
  if (raw.cleanup_complete !== true) {
    throw new Error(
      "controller evidence cannot complete while cleanup remains pending"
    );
  }
  if (normalizedResults.some((result) => result.reconciliation_pending)) {
    throw new Error(
      "controller evidence cannot complete with reconciliation-pending runs"
    );
  }
  return {
    contract: CONTROLLER_EVIDENCE_CONTRACT,
    source_sha: inputs.source_sha,
    candidate_label: inputs.candidate_label,
    profile: inputs.profile,
    timeout_seconds: inputs.timeout_seconds,
    completion_timeout_seconds: inputs.completion_timeout_seconds,
    repeat_count: inputs.repeat_count,
    repository: requireString(raw.repository, "repository"),
    controller_nonce: controllerNonce,
    controller_run_id: controllerRunId,
    controller_run_attempt: controllerRunAttempt,
    workflow_sha: requireExactSha(raw.workflow_sha, "workflow_sha"),
    observed_at: observedAt,
    controller_elapsed_ms: normalizeTiming(
      raw.controller_elapsed_ms,
      "controller_elapsed_ms"
    ),
    reconciliation_completed: true,
    cleanup_complete: true,
    results: normalizedResults,
    cost_usd: null,
    cost_evidence: "not supplied by GitHub-hosted benchmark",
  };
}

function writeHashedDocument(outputDir, basename, value) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies an isolated temporary evidence directory.
  fs.mkdirSync(outputDir, { recursive: true });
  const sorted = sortValue(value);
  const unsigned = `${JSON.stringify(sorted)}\n`;
  const digest = sha256(unsigned);
  const document = sortValue({ ...sorted, evidence_sha256: digest });
  const json = `${JSON.stringify(document, null, 2)}\n`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Basename is a fixed internal evidence filename.
  fs.writeFileSync(path.join(outputDir, `${basename}.json`), json, {
    encoding: "utf8",
    flag: "wx",
  });
  return { document, digest };
}

function markdownFor(document) {
  const isController = document.contract === CONTROLLER_EVIDENCE_CONTRACT;
  const lines = [
    isController
      ? "# Runner benchmark controller evidence"
      : "# Runner benchmark evidence",
    "",
    `- Status: **${document.status ?? "dispatch recorded"}**`,
    "- Source SHA: " + "`" + document.source_sha + "`",
    "- Profile: " + "`" + document.profile + "`",
    "- Candidate label: " + "`" + document.candidate_label + "`",
    `- Repeats: ${document.repeat_count}`,
    `- Availability timeout: ${document.timeout_seconds}s`,
    `- Completion timeout: ${document.completion_timeout_seconds}s`,
    "- Evidence SHA-256: " + "`" + document.evidence_sha256 + "`",
    "",
  ];
  if (isController) {
    lines.splice(
      -2,
      0,
      `- Cleanup complete: **${document.cleanup_complete ? "yes" : "no"}**`,
      ""
    );
    lines.push(
      "| Repeat | Status | Candidate run | Dispatch (ms) | Observed (ms) | Cancellation requested |",
      "| ---: | --- | ---: | ---: | ---: | --- |",
      ...document.results.map(
        (result) =>
          `| ${result.repeat} | ${result.status} | ${result.run_id ?? "not created"} | ${result.dispatch_ms ?? "—"} | ${result.observed_ms ?? "—"} | ${result.cancellation_requested ? "yes" : "no"} |`
      ),
      "",
      "Cost evidence: not supplied by this workflow; activation requires an external measured cost record."
    );
  } else {
    lines.push(
      "| Stage | Duration (ms) |",
      "| --- | ---: |",
      ...TIMING_KEYS.map(
        (key) =>
          `| ${key.replaceAll("_", " ")} | ${document.timings_ms[key] ?? "—"} |`
      ),
      "",
      "Environment metadata is limited to non-secret runner and toolchain facts."
    );
  }
  return `${lines.join("\n")}\n`;
}

function writeEvidence(inputPath, outputDir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies a temporary JSON input path.
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  assertNoSecretShape(raw);
  const evidence = normalizeCommonEvidence(raw);
  const { document, digest } = writeHashedDocument(
    outputDir,
    "runner-benchmark-evidence",
    evidence
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Output is the isolated temporary evidence directory.
  fs.writeFileSync(
    path.join(outputDir, "runner-benchmark-evidence.md"),
    markdownFor(document),
    { encoding: "utf8", flag: "wx" }
  );
  return { digest, document };
}

function writeControllerEvidence(inputPath, outputDir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies a temporary JSON input path.
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  assertNoSecretShape(raw);
  const evidence = normalizeControllerEvidence(raw);
  const { document, digest } = writeHashedDocument(
    outputDir,
    "runner-benchmark-controller-evidence",
    evidence
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Output is the isolated temporary evidence directory.
  fs.writeFileSync(
    path.join(outputDir, "runner-benchmark-controller-evidence.md"),
    markdownFor(document),
    { encoding: "utf8", flag: "wx" }
  );
  return { digest, document };
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`unexpected argument: ${argument}`);
    }
    const key = argument.slice(2).replaceAll("-", "_");
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value`);
    }
    result[key] = value;
    index += 1;
  }
  return result;
}

function validateContract(root = path.resolve(__dirname, "../..")) {
  return require("./runner-benchmark-workflow-contract.cjs").validateContract(
    root
  );
}

function readJsonFile(inputPath, label) {
  const filePath = requireString(inputPath, label);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Workflow supplies an isolated temporary JSON path.
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function emitJson(value) {
  process.stdout.write(JSON.stringify(value) + "\n");
}

function candidateArgs(args) {
  return {
    eventName: args.event_name,
    sourceSha: args.source_sha,
    candidateLabel: args.candidate_label,
    timeoutSeconds: args.timeout_seconds,
    completionTimeoutSeconds: args.completion_timeout_seconds,
    profile: args.profile,
    repeatNumber: args.repeat_number,
    repeatCount: args.repeat_count,
    requestId: args.request_id,
    controllerNonce: args.controller_nonce,
    controllerRunId: args.controller_run_id,
    controllerRunAttempt: args.controller_run_attempt,
  };
}

// prettier-ignore
function handleValidate(args) {
  emitJson(normalizeInputs({ sourceSha: args.source_sha, candidateLabel: args.candidate_label,
    timeoutSeconds: args.timeout_seconds, completionTimeoutSeconds: args.completion_timeout_seconds,
    profile: args.profile, repeatCount: args.repeat_count }));
}

function handleValidateCandidate(args) {
  emitJson(normalizeCandidateInputs(candidateArgs(args)));
}

function handleRequestId(args) {
  process.stdout.write(buildRequestId(candidateArgs(args)) + "\n");
}

// prettier-ignore
function handleSelectRunner(args) {
  emitJson({ runner_label: selectRunnerLabel({ eventName: args.event_name, actor: args.actor,
    profile: args.profile, candidateLabel: args.candidate_label,
    authorized: args.authorized === "true" }) });
}

// prettier-ignore
function handleControllerTimeout(args) {
  emitJson({ timeout_minutes: calculateControllerTimeoutMinutes({ timeoutSeconds: args.timeout_seconds,
    completionTimeoutSeconds: args.completion_timeout_seconds,
    repeatCount: args.repeat_count }) });
}

// prettier-ignore
function handleVerifySource(args) {
  emitJson(validateTrustedSource({ sourceSha: args.source_sha, checkedOutSha: args.checked_out_sha,
    mainSha: args.main_sha, isAncestor: args.is_ancestor === "true" }));
}

// prettier-ignore
function handleVerifyRun(args) {
  emitJson(validateRunMetadata(readJsonFile(args.input, "input"), { eventName: args.event_name,
    workflowPath: args.workflow_path, runId: args.run_id, runAttempt: args.run_attempt,
    headSha: args.head_sha, headBranch: args.head_branch, displayTitle: args.display_title,
    requestId: args.request_id, controllerNonce: args.controller_nonce, expectedActor: args.expected_actor }));
}

// prettier-ignore
function handleVerifyControllerRun(args) {
  emitJson(validateControllerRunMetadata(readJsonFile(args.input, "input"), { runId: args.run_id,
    runAttempt: args.run_attempt, headSha: args.head_sha, headBranch: args.head_branch,
    workflowPath: args.workflow_path }));
}

// prettier-ignore
function handleVerifyEvidence(args) {
  emitJson(verifyCandidateEvidence(readJsonFile(args.input, "input"), { ...candidateArgs(args),
    repository: args.repository, workflowSha: args.workflow_sha,
    runId: args.run_id, status: args.status }));
}

function handleWriteEvidence(command, args) {
  const inputPath = requireString(args.input, "input");
  const outputDir = requireString(args.output_dir, "output-dir");
  const result =
    command === "write-evidence"
      ? writeEvidence(inputPath, outputDir)
      : writeControllerEvidence(inputPath, outputDir);
  emitJson({ evidence_sha256: result.digest });
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "validate") {
    handleValidate(parseArgs(rest));
    return;
  }
  if (command === "validate-candidate") {
    handleValidateCandidate(parseArgs(rest));
    return;
  }
  if (command === "request-id") {
    handleRequestId(parseArgs(rest));
    return;
  }
  if (command === "select-runner") {
    handleSelectRunner(parseArgs(rest));
    return;
  }
  if (command === "controller-timeout") {
    handleControllerTimeout(parseArgs(rest));
    return;
  }
  if (command === "verify-source") {
    handleVerifySource(parseArgs(rest));
    return;
  }
  if (command === "verify-run") {
    handleVerifyRun(parseArgs(rest));
    return;
  }
  if (command === "verify-controller-run") {
    handleVerifyControllerRun(parseArgs(rest));
    return;
  }
  if (command === "verify-evidence") {
    handleVerifyEvidence(parseArgs(rest));
    return;
  }
  if (command === "write-evidence" || command === "write-controller-evidence") {
    handleWriteEvidence(command, parseArgs(rest));
    return;
  }
  if (command === "validate-contract") {
    emitJson(validateContract());
    return;
  }
  throw new Error(
    "usage: runner-benchmark.cjs <validate|validate-candidate|request-id|select-runner|controller-timeout|verify-source|verify-run|verify-controller-run|verify-evidence|write-evidence|write-controller-evidence|validate-contract> ..."
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  CANDIDATE_EVENTS,
  CANDIDATE_WORKFLOW_PATH,
  CONTROL_RUNNER_LABEL,
  CONTROLLER_EVIDENCE_CONTRACT,
  CONTROLLER_RUN_ATTEMPT,
  CONTROLLER_NONCE_PATTERN,
  DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  EVIDENCE_CONTRACT,
  INPUT_CONTRACT,
  MAX_REPEAT_COUNT,
  MAX_COMPLETION_TIMEOUT_SECONDS,
  MAX_CONTROLLER_TIMEOUT_MINUTES,
  MAX_TIMEOUT_SECONDS,
  MIN_COMPLETION_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  PINNED_PNPM_VERSION,
  PROFILES,
  RECONCILIATION_TIMEOUT_SECONDS,
  REQUEST_ID_PATTERN,
  RUNNER_LABEL_PATTERN,
  SOURCE_SHA_PATTERN,
  TIMING_KEYS,
  buildRequestId,
  calculateControllerTimeoutMinutes,
  normalizeCandidateInputs,
  normalizeInputs,
  normalizeCommonEvidence,
  normalizeControllerEvidence,
  selectRunnerLabel,
  validateContract,
  validateControllerRunMetadata,
  verifyCandidateEvidence,
  validateRunMetadata,
  validateTrustedSource,
  writeControllerEvidence,
  writeEvidence,
};
