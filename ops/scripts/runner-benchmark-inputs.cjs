const crypto = require("node:crypto");

const DEFAULT_TIMEOUT_SECONDS = 90;
const MIN_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 900;
const DEFAULT_COMPLETION_TIMEOUT_SECONDS = 30 * 60;
const MIN_COMPLETION_TIMEOUT_SECONDS = 60;
const MAX_COMPLETION_TIMEOUT_SECONDS = 30 * 60;
const RECONCILIATION_TIMEOUT_SECONDS = 120;
const CONTROLLER_OVERHEAD_SECONDS = 120;
const MAX_CONTROLLER_TIMEOUT_MINUTES = 360;
const MAX_REPEAT_COUNT = 5;
const PINNED_PNPM_VERSION = "10.33.0";
const CONTROL_RUNNER_LABEL = "ubuntu-latest";
const GITHUB_ACTIONS_BOT_ACTOR = "github-actions[bot]";
const CONTROLLER_RUN_ATTEMPT = 1;
const CANDIDATE_WORKFLOW_PATH =
  ".github/workflows/runner-benchmark-candidate.yml";
const SOURCE_SHA_PATTERN = /^[a-f0-9]{40}$/u;
const RUNNER_LABEL_PATTERN = /^[A-Za-z0-9._-]{1,100}$/u;
const CONTROLLER_NONCE_PATTERN = /^[a-f0-9]{32}$/u;
const REQUEST_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,199}$/u;
const PROFILES = Object.freeze(["control", "candidate"]);
const CANDIDATE_EVENTS = Object.freeze(["workflow_dispatch", "workflow_call"]);

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireExactSha(value, label) {
  const normalized = requireString(value, label);
  if (!SOURCE_SHA_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a lowercase 40-hex commit SHA`);
  }
  return normalized;
}

function requireInteger(value, label, minimum, maximum) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(
      `${label} must be an integer from ${minimum} to ${maximum}`
    );
  }
  return parsed;
}

function requireControllerNonce(value, label = "controllerNonce") {
  const normalized = requireString(value, label);
  if (!CONTROLLER_NONCE_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a lowercase 32-hex controller nonce`);
  }
  return normalized;
}

function requireRequestId(value, controllerNonce, label = "requestId") {
  const normalized = requireString(value, label);
  if (!REQUEST_ID_PATTERN.test(normalized)) {
    throw new Error(
      `${label} must contain only lowercase letters, numbers, periods, underscores, or hyphens`
    );
  }
  const nonce = requireControllerNonce(controllerNonce);
  if (!normalized.endsWith(`-${nonce}`)) {
    throw new Error(`${label} must be bound to the controller nonce`);
  }
  return normalized;
}

function buildRequestId({
  sourceSha,
  candidateLabel,
  timeoutSeconds,
  completionTimeoutSeconds,
  profile,
  repeatNumber,
  repeatCount,
  controllerRunId,
  controllerRunAttempt,
  controllerNonce,
}) {
  const normalizedSourceSha = requireExactSha(sourceSha, "sourceSha");
  const normalizedCandidateLabel = requireString(
    candidateLabel,
    "candidateLabel"
  );
  if (!RUNNER_LABEL_PATTERN.test(normalizedCandidateLabel)) {
    throw new Error(
      "candidateLabel must contain only letters, numbers, periods, underscores, or hyphens"
    );
  }
  const normalizedTimeoutSeconds = requireInteger(
    timeoutSeconds,
    "timeoutSeconds",
    MIN_TIMEOUT_SECONDS,
    MAX_TIMEOUT_SECONDS
  );
  const normalizedCompletionTimeoutSeconds = normalizeCompletionTimeout(
    completionTimeoutSeconds
  );
  const normalizedProfile = requireString(profile, "profile");
  if (!PROFILES.includes(normalizedProfile)) {
    throw new Error(`profile must be one of: ${PROFILES.join(", ")}`);
  }
  const normalizedRepeatNumber = requireInteger(
    repeatNumber,
    "repeatNumber",
    1,
    requireInteger(repeatCount, "repeatCount", 1, MAX_REPEAT_COUNT)
  );
  const normalizedRepeatCount = requireInteger(
    repeatCount,
    "repeatCount",
    1,
    MAX_REPEAT_COUNT
  );
  const normalizedControllerRunId = requireRunId(
    controllerRunId,
    "controllerRunId"
  );
  const normalizedControllerRunAttempt = requireInteger(
    controllerRunAttempt,
    "controllerRunAttempt",
    CONTROLLER_RUN_ATTEMPT,
    CONTROLLER_RUN_ATTEMPT
  );
  const normalizedControllerNonce = requireControllerNonce(controllerNonce);
  const canonical = JSON.stringify({
    source_sha: normalizedSourceSha,
    candidate_label: normalizedCandidateLabel,
    timeout_seconds: normalizedTimeoutSeconds,
    completion_timeout_seconds: normalizedCompletionTimeoutSeconds,
    profile: normalizedProfile,
    repeat_number: normalizedRepeatNumber,
    repeat_count: normalizedRepeatCount,
    controller_run_id: normalizedControllerRunId,
    controller_run_attempt: normalizedControllerRunAttempt,
    controller_nonce: normalizedControllerNonce,
  });
  const fingerprint = crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex")
    .slice(0, 16);
  return `runner-${normalizedControllerRunId}-${normalizedControllerRunAttempt}-${normalizedRepeatNumber}-${fingerprint}-${normalizedControllerNonce}`;
}

function normalizeCompletionTimeout(value) {
  const normalized = requireInteger(
    value ?? DEFAULT_COMPLETION_TIMEOUT_SECONDS,
    "completionTimeoutSeconds",
    MIN_COMPLETION_TIMEOUT_SECONDS,
    MAX_COMPLETION_TIMEOUT_SECONDS
  );
  if (normalized % 60 !== 0) {
    throw new Error(
      "completionTimeoutSeconds must be a whole number of minutes"
    );
  }
  return normalized;
}

function normalizeInputs(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("benchmark inputs must be an object");
  }
  const sourceSha = requireExactSha(input.sourceSha, "sourceSha");
  const candidateLabel = requireString(input.candidateLabel, "candidateLabel");
  if (!RUNNER_LABEL_PATTERN.test(candidateLabel)) {
    throw new Error(
      "candidateLabel must contain only letters, numbers, periods, underscores, or hyphens"
    );
  }
  const profile = requireString(input.profile, "profile");
  if (!PROFILES.includes(profile)) {
    throw new Error(`profile must be one of: ${PROFILES.join(", ")}`);
  }
  if (profile === "control" && candidateLabel !== CONTROL_RUNNER_LABEL) {
    throw new Error("control profile must use ubuntu-latest");
  }
  if (profile === "candidate" && candidateLabel === CONTROL_RUNNER_LABEL) {
    throw new Error(
      "candidate profile must use an explicit candidate label; use control for ubuntu-latest"
    );
  }
  return Object.freeze({
    contract: "runner-benchmark-inputs-v1",
    source_sha: sourceSha,
    candidate_label: candidateLabel,
    timeout_seconds: requireInteger(
      input.timeoutSeconds,
      "timeoutSeconds",
      MIN_TIMEOUT_SECONDS,
      MAX_TIMEOUT_SECONDS
    ),
    completion_timeout_seconds: normalizeCompletionTimeout(
      input.completionTimeoutSeconds
    ),
    profile,
    repeat_count: requireInteger(
      input.repeatCount,
      "repeatCount",
      1,
      MAX_REPEAT_COUNT
    ),
  });
}

function normalizeCandidateInputs({
  eventName,
  sourceSha,
  candidateLabel,
  timeoutSeconds,
  completionTimeoutSeconds,
  profile,
  repeatNumber,
  repeatCount,
  requestId,
  controllerNonce,
  controllerRunId,
  controllerRunAttempt,
}) {
  const normalizedEvent = requireString(eventName, "eventName");
  if (!CANDIDATE_EVENTS.includes(normalizedEvent)) {
    throw new Error(`eventName must be one of: ${CANDIDATE_EVENTS.join(", ")}`);
  }
  const nonce = requireControllerNonce(controllerNonce);
  const normalizedRequestId = requireRequestId(requestId, nonce);
  const normalizedInputs = normalizeInputs({
    sourceSha,
    candidateLabel,
    timeoutSeconds,
    completionTimeoutSeconds,
    profile,
    repeatCount,
  });
  const normalizedRepeatNumber = requireInteger(
    repeatNumber,
    "repeatNumber",
    1,
    normalizedInputs.repeat_count
  );
  const isReusableCall = normalizedEvent === "workflow_call";
  const normalizedProfile = isReusableCall
    ? "control"
    : normalizedInputs.profile;
  const normalizedCandidateLabel = isReusableCall
    ? CONTROL_RUNNER_LABEL
    : normalizedInputs.candidate_label;
  const normalizedControllerRunId = requireRunId(
    controllerRunId,
    "controllerRunId"
  );
  const normalizedControllerRunAttempt = requireInteger(
    controllerRunAttempt,
    "controllerRunAttempt",
    CONTROLLER_RUN_ATTEMPT,
    CONTROLLER_RUN_ATTEMPT
  );
  const expectedRequestId = buildRequestId({
    sourceSha: normalizedInputs.source_sha,
    candidateLabel: normalizedCandidateLabel,
    timeoutSeconds: normalizedInputs.timeout_seconds,
    completionTimeoutSeconds: normalizedInputs.completion_timeout_seconds,
    profile: normalizedProfile,
    repeatNumber: normalizedRepeatNumber,
    repeatCount: normalizedInputs.repeat_count,
    controllerRunId: normalizedControllerRunId,
    controllerRunAttempt: normalizedControllerRunAttempt,
    controllerNonce: nonce,
  });
  if (normalizedRequestId !== expectedRequestId) {
    throw new Error(
      "requestId is not bound to every intended benchmark input and controller attempt"
    );
  }
  return Object.freeze({
    ...normalizedInputs,
    event_name: normalizedEvent,
    repeat_number: normalizedRepeatNumber,
    request_id: normalizedRequestId,
    controller_nonce: nonce,
    controller_run_id: normalizedControllerRunId,
    controller_run_attempt: normalizedControllerRunAttempt,
    profile: normalizedProfile,
    candidate_label: normalizedCandidateLabel,
  });
}

function selectRunnerLabel({
  eventName,
  actor,
  profile,
  candidateLabel,
  authorized,
}) {
  if (eventName === "workflow_call") {
    return CONTROL_RUNNER_LABEL;
  }
  if (
    eventName !== "workflow_dispatch" ||
    actor !== GITHUB_ACTIONS_BOT_ACTOR ||
    authorized !== true
  ) {
    return CONTROL_RUNNER_LABEL;
  }
  return profile === "candidate" ? candidateLabel : CONTROL_RUNNER_LABEL;
}

function calculateControllerTimeoutMinutes({
  timeoutSeconds,
  availabilityTimeoutSeconds,
  completionTimeoutSeconds,
  repeatCount,
}) {
  const availability = requireInteger(
    availabilityTimeoutSeconds ?? timeoutSeconds,
    "timeoutSeconds",
    MIN_TIMEOUT_SECONDS,
    MAX_TIMEOUT_SECONDS
  );
  const completion = normalizeCompletionTimeout(completionTimeoutSeconds);
  const repeats = requireInteger(
    repeatCount,
    "repeatCount",
    1,
    MAX_REPEAT_COUNT
  );
  const totalSeconds =
    repeats * (availability + completion) +
    RECONCILIATION_TIMEOUT_SECONDS +
    CONTROLLER_OVERHEAD_SECONDS;
  const timeoutMinutes = Math.ceil(totalSeconds / 60);
  if (timeoutMinutes > MAX_CONTROLLER_TIMEOUT_MINUTES) {
    throw new Error(
      `controller timeout exceeds the ${MAX_CONTROLLER_TIMEOUT_MINUTES}-minute GitHub Actions limit`
    );
  }
  return timeoutMinutes;
}

function validateTrustedSource({
  sourceSha,
  checkedOutSha,
  mainSha,
  isAncestor,
}) {
  const expected = requireExactSha(sourceSha, "sourceSha");
  const checkedOut = requireExactSha(checkedOutSha, "checkedOutSha");
  const trustedMainSha = requireExactSha(mainSha, "mainSha");
  if (expected !== checkedOut) {
    throw new Error(
      "checked-out source does not match the requested source SHA"
    );
  }
  if (expected !== trustedMainSha && isAncestor !== true) {
    throw new Error("source SHA is not an ancestor of the trusted main ref");
  }
  return Object.freeze({
    source_sha: expected,
    checked_out_sha: checkedOut,
    main_sha: trustedMainSha,
  });
}

function requireRunId(value, label = "runId") {
  const normalized = requireString(String(value), label);
  if (!/^\d+$/u.test(normalized)) {
    throw new Error(`${label} must be a numeric GitHub Actions run ID`);
  }
  return normalized;
}

function assertCandidateRunIdentity(
  run,
  {
    expectedEvent,
    expectedActor,
    expectedBranch,
    expectedTitle,
    expectedRunId,
    normalizedRunId,
    normalizedRunAttempt,
  }
) {
  if (normalizedRunAttempt !== CONTROLLER_RUN_ATTEMPT) {
    throw new Error("candidate run reruns are not admissible");
  }
  if (normalizedRunId !== expectedRunId) {
    throw new Error("candidate run ID does not match the requested run");
  }
  if (run.event !== expectedEvent) {
    throw new Error("candidate run event does not match the requested event");
  }
  if (expectedActor !== undefined && run.actor?.login !== expectedActor) {
    throw new Error("candidate run actor is not the authenticated GitHub bot");
  }
  if (run.head_branch !== expectedBranch) {
    throw new Error("candidate run is not on the trusted main branch");
  }
  if (run.display_title !== expectedTitle) {
    throw new Error("candidate run title is not bound to this request");
  }
}

function assertCandidateRunTrust(run, { expectedHeadSha, workflowPath }) {
  if (run.head_sha !== expectedHeadSha) {
    throw new Error("candidate run head SHA does not match trusted main");
  }
  if (run.name !== "Runner benchmark candidate") {
    throw new Error("candidate run name is not the benchmark workflow");
  }
  if (workflowPath !== undefined && run.path !== workflowPath) {
    throw new Error(
      "candidate run workflow path is not the benchmark workflow"
    );
  }
}

function validateRunMetadata(
  run,
  {
    eventName = "workflow_dispatch",
    workflowPath,
    runId,
    runAttempt,
    headSha,
    headBranch = "main",
    displayTitle,
    requestId,
    controllerNonce,
    expectedActor = GITHUB_ACTIONS_BOT_ACTOR,
  }
) {
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    throw new Error("candidate run metadata must be an object");
  }
  const expectedEvent = requireString(eventName, "eventName");
  const expectedHeadSha = requireExactSha(headSha, "headSha");
  const expectedBranch = requireString(headBranch, "headBranch");
  const expectedTitle = requireString(displayTitle, "displayTitle");
  const nonce = requireControllerNonce(controllerNonce);
  const normalizedRequestId = requireRequestId(requestId, nonce);
  const normalizedRunId = requireRunId(run.id);
  const normalizedRunAttempt = requireInteger(
    run.run_attempt,
    "runAttempt",
    1,
    1000
  );
  assertCandidateRunIdentity(run, {
    expectedEvent,
    expectedActor,
    expectedBranch,
    expectedTitle,
    expectedRunId: requireRunId(runId ?? run.id, "runId"),
    normalizedRunId,
    normalizedRunAttempt,
  });
  assertCandidateRunTrust(run, { expectedHeadSha, workflowPath });
  if (
    runAttempt !== undefined &&
    normalizedRunAttempt !== requireInteger(runAttempt, "runAttempt", 1, 1000)
  ) {
    throw new Error("candidate run attempt does not match the requested run");
  }
  return Object.freeze({
    run_id: normalizedRunId,
    run_attempt: normalizedRunAttempt,
    event: expectedEvent,
    path: typeof run.path === "string" ? run.path : null,
    head_branch: expectedBranch,
    head_sha: expectedHeadSha,
    display_title: expectedTitle,
    request_id: normalizedRequestId,
    controller_nonce: nonce,
    metadata_verified: true,
    actor: run.actor?.login ?? null,
  });
}

function validateControllerRunMetadata(
  run,
  {
    runId,
    runAttempt,
    headSha,
    headBranch = "main",
    workflowPath = ".github/workflows/runner-benchmark.yml",
  }
) {
  if (!run || typeof run !== "object" || Array.isArray(run)) {
    throw new Error("controller run metadata must be an object");
  }
  const normalizedRunId = requireRunId(run.id);
  const expectedRunId = requireRunId(runId, "runId");
  const normalizedRunAttempt = requireInteger(
    run.run_attempt,
    "runAttempt",
    CONTROLLER_RUN_ATTEMPT,
    CONTROLLER_RUN_ATTEMPT
  );
  const expectedRunAttempt = requireInteger(
    runAttempt,
    "runAttempt",
    CONTROLLER_RUN_ATTEMPT,
    CONTROLLER_RUN_ATTEMPT
  );
  const expectedHeadSha = requireExactSha(headSha, "headSha");
  if (normalizedRunId !== expectedRunId) {
    throw new Error("controller run ID does not match the request");
  }
  if (normalizedRunAttempt !== expectedRunAttempt) {
    throw new Error("controller run attempt does not match the request");
  }
  if (run.event !== "workflow_dispatch") {
    throw new Error("controller run was not manually dispatched");
  }
  if (run.name !== "Runner benchmark controller") {
    throw new Error("controller run name is not the benchmark controller");
  }
  if (run.path !== workflowPath) {
    throw new Error("controller run workflow path is not trusted");
  }
  if (run.head_branch !== headBranch) {
    throw new Error("controller run is not on the trusted main branch");
  }
  if (run.head_sha !== expectedHeadSha) {
    throw new Error("controller run head SHA does not match the candidate run");
  }
  return Object.freeze({
    run_id: normalizedRunId,
    run_attempt: normalizedRunAttempt,
    event: run.event,
    path: run.path,
    head_branch: run.head_branch,
    head_sha: run.head_sha,
    actor: run.actor?.login ?? null,
  });
}

module.exports = {
  CANDIDATE_EVENTS,
  CANDIDATE_WORKFLOW_PATH,
  CONTROL_RUNNER_LABEL,
  CONTROLLER_RUN_ATTEMPT,
  CONTROLLER_NONCE_PATTERN,
  DEFAULT_COMPLETION_TIMEOUT_SECONDS,
  DEFAULT_TIMEOUT_SECONDS,
  GITHUB_ACTIONS_BOT_ACTOR,
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
  calculateControllerTimeoutMinutes,
  buildRequestId,
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
};
