"use strict";

/* eslint-disable max-lines -- The closed parent/child evidence contract stays dependency-free and atomic. */

const crypto = require("node:crypto");
const fs = require("node:fs");

const CONTRACT = "one-click-production-children-v1";
const EXPECTED_REPOSITORY = "6529-Collections/6529seize-frontend";
const MAIN_BRANCH = "main";
const DISPATCH_EVENT = "workflow_dispatch";
const BUILDER_WORKFLOW_PATH = ".github/workflows/production-build-artifact.yml";
const VERIFIER_WORKFLOW_PATH =
  ".github/workflows/production-artifact-verifier.yml";
const BUILDER_TITLE_PREFIX = "Build production artifact";
const VERIFIER_TITLE_PREFIX = "Verify production artifact";
const SELECTION_CONTRACT = "production-artifact-selection-v1";
const SELECTION_SCHEMA_VERSION = 1;
const SELECTION_ARTIFACT_NAME_PREFIX = "one-click-production-selection-";
const OPERATION_ID_PATTERN = /^frontend-prod-[1-9]\d{0,19}$/u;
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const RUN_ID_PATTERN = /^[1-9]\d{0,19}$/u;
const ARTIFACT_ID_PATTERN = /^[1-9]\d{0,19}$/u;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const MAX_INPUT_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 32 * 1024;
const MAX_WORKFLOW_RUNS = 1_000;
const MAX_ARTIFACTS = 1_000;
const MAX_RETAINED_FAILURES = 32;
const MAX_RUN_ATTEMPT = 1_000;

const ACTIVE_STATUSES = Object.freeze([
  "queued",
  "in_progress",
  "requested",
  "waiting",
  "pending",
]);
const TERMINAL_FAILURE_CONCLUSIONS = Object.freeze([
  "action_required",
  "cancelled",
  "failure",
  "neutral",
  "skipped",
  "stale",
  "startup_failure",
  "timed_out",
]);
const RUN_STATES = Object.freeze(["reusable", "active", "failed_terminal"]);
const SELECTABLE_RUN_STATES = Object.freeze(["reusable", "active"]);

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function expectedSelectionArtifactName(targetSha, verifierRunAttempt) {
  const normalizedTargetSha = requireSha(targetSha, "targetSha");
  const normalizedAttempt = requireRunAttempt(
    verifierRunAttempt,
    "verifierRunAttempt"
  );
  return `${SELECTION_ARTIFACT_NAME_PREFIX}${normalizedTargetSha}-a${normalizedAttempt}`;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireSha(value, label) {
  const normalized = requireString(value, label);
  if (!SHA_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a lowercase 40-character commit SHA`);
  }
  return normalized;
}

function normalizeNumericId(value) {
  if (typeof value === "string") {
    return value;
  }
  return Number.isSafeInteger(value) ? String(value) : "";
}

function requireRunId(value, label = "runId") {
  const normalized = normalizeNumericId(value);
  if (!RUN_ID_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a positive numeric GitHub run ID`);
  }
  return normalized;
}

function requirePositiveId(value, label) {
  const normalized = normalizeNumericId(value);
  if (!ARTIFACT_ID_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a positive numeric GitHub ID`);
  }
  return normalized;
}

function requireRunAttempt(value, label = "runAttempt") {
  let parsed = Number.NaN;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && /^\d+$/u.test(value)) {
    parsed = Number(value);
  }
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_RUN_ATTEMPT) {
    throw new Error(`${label} must be an integer from 1 to ${MAX_RUN_ATTEMPT}`);
  }
  return parsed;
}

function requireWorkflowId(value, label = "workflowId") {
  return requirePositiveId(value, label);
}

function requireRepository(value, label = "repository") {
  const normalized = requireString(value, label);
  if (!REPOSITORY_PATTERN.test(normalized)) {
    throw new Error(`${label} must be an owner/name repository`);
  }
  return normalized;
}

function requireOperationId(value) {
  const normalized = requireString(value, "operationId");
  if (!OPERATION_ID_PATTERN.test(normalized)) {
    throw new Error(
      "operationId must be frontend-prod-<positive parent run id>"
    );
  }
  return normalized;
}

function validateOperationIdentity({ parentRunId, targetSha }) {
  const normalizedParentRunId = requireRunId(parentRunId, "parentRunId");
  const normalizedTargetSha = requireSha(targetSha, "targetSha");
  return Object.freeze({
    contract: CONTRACT,
    parent_run_id: normalizedParentRunId,
    operation_id: `frontend-prod-${normalizedParentRunId}`,
    target_sha: normalizedTargetSha,
  });
}

function validateOperationBinding({ operationId, targetSha }) {
  const normalizedOperationId = requireOperationId(operationId);
  const normalizedTargetSha = requireSha(targetSha, "targetSha");
  return Object.freeze({
    operation_id: normalizedOperationId,
    target_sha: normalizedTargetSha,
  });
}

function computeDisplayTitles({ operationId, targetSha }) {
  const binding = validateOperationBinding({ operationId, targetSha });
  return Object.freeze({
    contract: CONTRACT,
    operation_id: binding.operation_id,
    target_sha: binding.target_sha,
    builder_display_title: `${BUILDER_TITLE_PREFIX} ${binding.target_sha} [${binding.operation_id}]`,
    verifier_display_title: `${VERIFIER_TITLE_PREFIX} ${binding.target_sha} [${binding.operation_id}]`,
  });
}

function expectedVerifierDisplayTitle({
  operationId,
  targetSha,
  sourceArtifact,
}) {
  const binding = validateOperationBinding({ operationId, targetSha });
  const source = requirePlainObject(
    sourceArtifact,
    "verifier source artifact identity"
  );
  const runId = requireRunId(source.run_id, "verifier source artifact run ID");
  const runAttempt = requireRunAttempt(
    source.run_attempt,
    "verifier source artifact run attempt"
  );
  const artifactId = requirePositiveId(
    source.id,
    "verifier source artifact ID"
  );
  const artifactName = requireString(
    source.name,
    "verifier source artifact name"
  );
  const expectedArtifactName = `production-frontend-${binding.target_sha}-${binding.operation_id}`;
  if (artifactName !== expectedArtifactName) {
    throw new Error(
      "verifier source artifact name is not bound to the target and operation"
    );
  }
  const artifactApiDigest = requireString(
    source.api_digest,
    "verifier source artifact API digest"
  );
  if (!DIGEST_PATTERN.test(artifactApiDigest)) {
    throw new Error(
      "verifier source artifact API digest must be sha256:<64 lowercase hex>"
    );
  }
  const artifactWorkflowSha = requireSha(
    source.workflow_sha,
    "verifier source artifact workflow SHA"
  );
  return `${VERIFIER_TITLE_PREFIX} ${binding.target_sha} [${binding.operation_id}] [builder ${runId}/${runAttempt} ${artifactId} ${artifactApiDigest} ${artifactWorkflowSha}]`;
}

function expectedDisplayTitle({
  workflowPath,
  operationId,
  targetSha,
  sourceArtifact,
}) {
  const titles = computeDisplayTitles({ operationId, targetSha });
  if (workflowPath === BUILDER_WORKFLOW_PATH) {
    return titles.builder_display_title;
  }
  if (workflowPath === VERIFIER_WORKFLOW_PATH) {
    return expectedVerifierDisplayTitle({
      operationId,
      targetSha,
      sourceArtifact,
    });
  }
  throw new Error(
    `workflowPath is not a supported child workflow: ${workflowPath}`
  );
}

function repositoryFullName(value) {
  const candidate = isPlainObject(value) ? value.full_name : value;
  if (typeof candidate !== "string" || !REPOSITORY_PATTERN.test(candidate)) {
    return null;
  }
  return candidate;
}

function requirePlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function classifyWorkflowRun(run) {
  requirePlainObject(run, "workflow run");
  const status = requireString(run.status, "workflow run status");
  const conclusion =
    run.conclusion === null || run.conclusion === undefined
      ? null
      : requireString(run.conclusion, "workflow run conclusion");

  if (ACTIVE_STATUSES.includes(status)) {
    if (conclusion !== null) {
      throw new Error("active workflow run has a terminal conclusion");
    }
    return "active";
  }

  if (status === "completed" && conclusion === "success") {
    return "reusable";
  }

  if (
    status === "completed" &&
    conclusion !== null &&
    TERMINAL_FAILURE_CONCLUSIONS.includes(conclusion)
  ) {
    return "failed_terminal";
  }

  throw new Error(
    `workflow run has an unsupported state: ${status}/${conclusion ?? "null"}`
  );
}

function normalizeAllowedStates(value) {
  const states = value === undefined ? SELECTABLE_RUN_STATES : value;
  const list = Array.isArray(states) ? states : [states];
  if (list.length === 0) {
    throw new Error("allowedStates must contain at least one run state");
  }
  const normalized = [];
  for (const state of list) {
    if (typeof state !== "string" || !SELECTABLE_RUN_STATES.includes(state)) {
      throw new Error(
        `unsupported allowed workflow run state: ${String(state)}`
      );
    }
    if (!normalized.includes(state)) {
      normalized.push(state);
    }
  }
  return new Set(normalized);
}

function parseBoundedJson(value, label) {
  if (typeof value !== "string") {
    if (!isPlainObject(value) && !Array.isArray(value)) {
      throw new Error(`${label} must be an object or array`);
    }
    return value;
  }
  if (Buffer.byteLength(value, "utf8") > MAX_INPUT_BYTES) {
    throw new Error(`${label} exceeds the ${MAX_INPUT_BYTES}-byte bound`);
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function readBoundedJsonFile(file, label) {
  const filePath = requireString(file, `${label} path`);
  let bytes;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CLI callers supply an explicit JSON evidence path.
    bytes = fs.readFileSync(filePath);
  } catch (error) {
    throw new Error(`${label} cannot be read: ${error.message}`);
  }
  if (bytes.length > MAX_INPUT_BYTES) {
    throw new Error(`${label} exceeds the ${MAX_INPUT_BYTES}-byte bound`);
  }
  return parseBoundedJson(bytes.toString("utf8"), label);
}

function workflowRunsFromJson(value) {
  const parsed = parseBoundedJson(value, "workflow run list");
  const runs = Array.isArray(parsed) ? parsed : parsed.workflow_runs;
  if (!Array.isArray(runs)) {
    throw new TypeError("workflow run list must contain a workflow_runs array");
  }
  if (runs.length > MAX_WORKFLOW_RUNS) {
    throw new Error(
      `workflow run list exceeds the ${MAX_WORKFLOW_RUNS}-run bound`
    );
  }
  return runs;
}

function workflowRunHasExactIdentity(
  run,
  { repository, workflowPath, workflowId, displayTitle }
) {
  if (!isPlainObject(run)) {
    return false;
  }
  return (
    repositoryFullName(run.repository) === repository &&
    repositoryFullName(run.head_repository) === repository &&
    run.path === workflowPath &&
    String(run.workflow_id) === workflowId &&
    run.display_title === displayTitle &&
    run.head_branch === MAIN_BRANCH &&
    run.event === DISPATCH_EVENT
  );
}

function summarizeWorkflowRun(run, expected) {
  const id = requireRunId(run.id);
  const runAttempt = requireRunAttempt(run.run_attempt);
  const state = classifyWorkflowRun(run);
  return Object.freeze({
    id,
    run_attempt: runAttempt,
    workflow_id: expected.workflowId,
    path: expected.workflowPath,
    event: DISPATCH_EVENT,
    status: run.status,
    conclusion: run.conclusion ?? null,
    head_branch: MAIN_BRANCH,
    head_sha: requireSha(run.head_sha, "workflow run head SHA"),
    display_title: expected.displayTitle,
    repository: expected.repository,
    head_repository: expected.repository,
    state,
  });
}

function selectTrustedWorkflowRun({
  workflowRunsJson,
  repository = EXPECTED_REPOSITORY,
  workflowPath,
  workflowId,
  operationId,
  targetSha,
  sourceArtifact,
  allowedStates,
}) {
  const normalizedRepository = requireRepository(repository);
  const normalizedWorkflowPath = requireString(workflowPath, "workflowPath");
  const normalizedWorkflowId = requireWorkflowId(workflowId);
  const binding = validateOperationBinding({ operationId, targetSha });
  const displayTitle = expectedDisplayTitle({
    workflowPath: normalizedWorkflowPath,
    operationId: binding.operation_id,
    targetSha: binding.target_sha,
    sourceArtifact,
  });
  const allowed = normalizeAllowedStates(allowedStates);
  const matches = [];

  for (const run of workflowRunsFromJson(workflowRunsJson)) {
    if (
      workflowRunHasExactIdentity(run, {
        repository: normalizedRepository,
        workflowPath: normalizedWorkflowPath,
        workflowId: normalizedWorkflowId,
        displayTitle,
      })
    ) {
      matches.push(
        summarizeWorkflowRun(run, {
          repository: normalizedRepository,
          workflowPath: normalizedWorkflowPath,
          workflowId: normalizedWorkflowId,
          displayTitle,
        })
      );
    }
  }

  const failedTerminalRuns = matches.filter(
    (match) => match.state === "failed_terminal"
  );
  if (failedTerminalRuns.length > MAX_RETAINED_FAILURES) {
    throw new Error(
      `too many failed terminal child runs to retain safely: ${failedTerminalRuns.length}`
    );
  }
  const eligibleMatches = matches.filter((match) => allowed.has(match.state));

  if (eligibleMatches.length > 1) {
    throw new Error(
      `ambiguous eligible child workflow identity: ${eligibleMatches.length} matches`
    );
  }

  const base = {
    contract: CONTRACT,
    operation_id: binding.operation_id,
    target_sha: binding.target_sha,
    workflow_id: normalizedWorkflowId,
    workflow_path: normalizedWorkflowPath,
    expected_display_title: displayTitle,
    failed_terminal_runs: failedTerminalRuns,
  };

  if (matches.length === 0) {
    return Object.freeze({
      ...base,
      result: "absent",
      state: null,
      reason: "no_exact_identity_match",
      run: null,
      failed_terminal_runs: [],
    });
  }

  if (eligibleMatches.length === 0) {
    if (failedTerminalRuns.length > 0) {
      return Object.freeze({
        ...base,
        result: "absent",
        state: "failed_terminal",
        reason: "failed_terminal_only",
        run: null,
      });
    }
    const state = matches.length === 1 ? matches[0].state : null;
    return Object.freeze({
      ...base,
      result: "absent",
      state,
      reason: "state_not_allowed",
      run: null,
    });
  }

  const match = eligibleMatches[0];
  return Object.freeze({
    ...base,
    result: "selected",
    state: match.state,
    reason: null,
    run: match,
  });
}

function normalizeArtifactRequest(options) {
  const normalizedRepository = requireRepository(
    options.repository ?? EXPECTED_REPOSITORY
  );
  const normalizedWorkflowPath = requireString(
    options.workflowPath,
    "workflowPath"
  );
  const normalizedWorkflowId = requireWorkflowId(options.workflowId);
  const binding = validateOperationBinding({
    operationId: options.operationId,
    targetSha: options.targetSha,
  });
  const artifactRunId = requireRunId(options.artifactRunId, "artifactRunId");
  const artifactRunAttempt = requireRunAttempt(
    options.artifactRunAttempt,
    "artifactRunAttempt"
  );
  const artifactId = requirePositiveId(options.artifactId, "artifactId");
  const artifactName = requireString(options.artifactName, "artifactName");
  const expectedArtifactName = `production-frontend-${binding.target_sha}-${binding.operation_id}`;
  if (artifactName !== expectedArtifactName) {
    throw new Error("artifactName is not bound to the target and operation");
  }
  const artifactApiDigest = requireString(
    options.artifactApiDigest,
    "artifactApiDigest"
  );
  if (!DIGEST_PATTERN.test(artifactApiDigest)) {
    throw new Error("artifactApiDigest must be sha256:<64 lowercase hex>");
  }
  const displayTitle = expectedDisplayTitle({
    workflowPath: normalizedWorkflowPath,
    operationId: binding.operation_id,
    targetSha: binding.target_sha,
  });
  return {
    repository: normalizedRepository,
    workflowPath: normalizedWorkflowPath,
    workflowId: normalizedWorkflowId,
    binding,
    artifactRunId,
    artifactRunAttempt,
    artifactId,
    artifactName,
    artifactApiDigest,
    expectedIdentity: {
      repository: normalizedRepository,
      workflowPath: normalizedWorkflowPath,
      workflowId: normalizedWorkflowId,
      displayTitle,
    },
  };
}

function validateSelectedBuilderRun(selectedRun, rawRun, request) {
  const selected = normalizeSelectedRun(selectedRun);
  if (
    selected.state !== "reusable" ||
    selected.path !== request.workflowPath ||
    selected.workflow_id !== request.workflowId ||
    selected.display_title !== request.expectedIdentity.displayTitle ||
    selected.repository !== request.repository ||
    selected.head_repository !== request.repository ||
    selected.head_branch !== MAIN_BRANCH ||
    selected.event !== DISPATCH_EVENT
  ) {
    throw new Error(
      "selected child run is not bound to the exact successful operation identity"
    );
  }
  if (!workflowRunHasExactIdentity(rawRun, request.expectedIdentity)) {
    throw new Error(
      "artifact producer run does not match exact child identity"
    );
  }
  const producerRun = summarizeWorkflowRun(rawRun, request.expectedIdentity);
  if (producerRun.state !== "reusable") {
    throw new Error("artifact producer run is not a completed successful run");
  }
  if (producerRun.id !== request.artifactRunId) {
    throw new Error("artifact run ID does not match the producer run");
  }
  if (producerRun.run_attempt !== request.artifactRunAttempt) {
    throw new Error("artifact run attempt does not match the producer run");
  }
  if (!workflowRunMatchesSelectedRun(producerRun, selected)) {
    throw new Error(
      "artifact producer run does not match the selected child run"
    );
  }
  return producerRun;
}

function validateBuilderArtifactRecord(artifacts, request, producerRun) {
  if (!Array.isArray(artifacts)) {
    throw new TypeError(
      "artifact metadata bundle must contain an artifacts array"
    );
  }
  if (artifacts.length > MAX_ARTIFACTS) {
    throw new Error(
      `artifact metadata exceeds the ${MAX_ARTIFACTS}-item bound`
    );
  }
  const candidates = artifacts.filter(
    (artifact) =>
      isPlainObject(artifact) &&
      (String(artifact.id) === request.artifactId ||
        artifact.name === request.artifactName)
  );
  if (candidates.length !== 1) {
    throw new Error(
      `artifact metadata must contain exactly one matching artifact; found ${candidates.length}`
    );
  }
  const artifact = candidates[0];
  if (
    requirePositiveId(artifact.id, "artifact metadata ID") !==
    request.artifactId
  ) {
    throw new Error(
      "artifact metadata ID does not match the requested artifact"
    );
  }
  if (artifact.name !== request.artifactName) {
    throw new Error(
      "artifact metadata name does not match the target and operation"
    );
  }
  if (artifact.expired !== false) {
    throw new Error("artifact is missing a false expired flag or is expired");
  }
  if (artifact.digest !== request.artifactApiDigest) {
    throw new Error(
      "artifact API SHA-256 digest does not match the expected digest"
    );
  }
  if (!DIGEST_PATTERN.test(artifact.digest)) {
    throw new Error("artifact API SHA-256 digest is malformed");
  }
  const attachment = requirePlainObject(
    artifact.workflow_run,
    "artifact workflow run"
  );
  if (
    requireRunId(attachment.id, "artifact workflow run ID") !==
    request.artifactRunId
  ) {
    throw new Error("artifact is not attached to the exact producer run");
  }
  if (
    attachment.run_attempt !== undefined &&
    requireRunAttempt(
      attachment.run_attempt,
      "artifact workflow run attempt"
    ) !== request.artifactRunAttempt
  ) {
    throw new Error("artifact workflow run attempt does not match");
  }
  if (
    attachment.head_sha !== undefined &&
    attachment.head_sha !== producerRun.head_sha
  ) {
    throw new Error(
      "artifact workflow head SHA does not match the producer run"
    );
  }
  return artifact;
}

function validateArtifactMetadata(options) {
  const request = normalizeArtifactRequest(options);
  const bundle = requirePlainObject(
    options.metadataBundle,
    "artifact metadata bundle"
  );
  const rawRun = requirePlainObject(bundle.run, "artifact producer run");
  const producerRun = validateSelectedBuilderRun(
    options.selectedRun,
    rawRun,
    request
  );
  validateBuilderArtifactRecord(bundle.artifacts, request, producerRun);
  if (bundle.manifest !== undefined) {
    validateOptionalManifest(bundle.manifest, {
      repository: request.repository,
      operationId: request.binding.operation_id,
      targetSha: request.binding.target_sha,
      artifactName: request.artifactName,
      artifactRunId: request.artifactRunId,
      artifactRunAttempt: request.artifactRunAttempt,
      workflowHeadSha: producerRun.head_sha,
    });
  }
  return Object.freeze({
    contract: CONTRACT,
    valid: true,
    operation_id: request.binding.operation_id,
    target_sha: request.binding.target_sha,
    artifact: {
      id: request.artifactId,
      name: request.artifactName,
      expired: false,
      digest: request.artifactApiDigest,
      workflow_run_id: request.artifactRunId,
      workflow_run_attempt: request.artifactRunAttempt,
    },
    producer_run: producerRun,
    head_identity: {
      target_sha: request.binding.target_sha,
      workflow_sha: producerRun.head_sha,
      target_is_workflow_head:
        request.binding.target_sha === producerRun.head_sha,
    },
  });
}

function requireHexDigest(value, label) {
  const normalized = requireString(value, label);
  if (!/^[a-f0-9]{64}$/u.test(normalized)) {
    throw new Error(`${label} must be a lowercase 64-character SHA-256 digest`);
  }
  return normalized;
}

function requirePositiveInteger(value, label) {
  let normalized = Number.NaN;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    normalized = value;
  } else if (typeof value === "string" && /^[1-9]\d*$/u.test(value)) {
    normalized = Number(value);
  }
  if (!Number.isSafeInteger(normalized) || normalized < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return normalized;
}

function normalizeSelectionRequest(options) {
  const repository = requireRepository(
    options.repository ?? EXPECTED_REPOSITORY
  );
  const workflowPath = requireString(options.workflowPath, "workflowPath");
  const workflowId = requireWorkflowId(options.workflowId);
  const binding = validateOperationBinding({
    operationId: options.operationId,
    targetSha: options.targetSha,
  });
  const verifierRunId = requireRunId(options.verifierRunId, "verifierRunId");
  const verifierRunAttempt = requireRunAttempt(
    options.verifierRunAttempt,
    "verifierRunAttempt"
  );
  const selectionArtifactId = requirePositiveId(
    options.selectionArtifactId,
    "selectionArtifactId"
  );
  const selectionArtifactName = requireString(
    options.selectionArtifactName,
    "selectionArtifactName"
  );
  const expectedName = expectedSelectionArtifactName(
    binding.target_sha,
    verifierRunAttempt
  );
  if (selectionArtifactName !== expectedName) {
    throw new Error(
      "selectionArtifactName is not bound to the target and verifier attempt"
    );
  }
  const selectionArtifactApiDigest = requireString(
    options.selectionArtifactApiDigest,
    "selectionArtifactApiDigest"
  );
  if (!DIGEST_PATTERN.test(selectionArtifactApiDigest)) {
    throw new Error(
      "selectionArtifactApiDigest must be sha256:<64 lowercase hex>"
    );
  }
  const sourceArtifact = requirePlainObject(
    options.sourceArtifact,
    "source artifact identity"
  );
  const source = {
    run_id: requireRunId(sourceArtifact.run_id, "source artifact run ID"),
    run_attempt: requireRunAttempt(
      sourceArtifact.run_attempt,
      "source artifact run attempt"
    ),
    id: requirePositiveId(sourceArtifact.id, "source artifact ID"),
    name: requireString(sourceArtifact.name, "source artifact name"),
    api_digest: requireString(
      sourceArtifact.api_digest,
      "source artifact API digest"
    ),
    workflow_sha: requireSha(
      sourceArtifact.workflow_sha,
      "source artifact workflow SHA"
    ),
  };
  if (!DIGEST_PATTERN.test(source.api_digest)) {
    throw new Error(
      "source artifact API digest must be sha256:<64 lowercase hex>"
    );
  }
  const expectedSourceName = `production-frontend-${binding.target_sha}-${binding.operation_id}`;
  if (source.name !== expectedSourceName) {
    throw new Error(
      "source artifact name is not bound to the target and operation"
    );
  }
  const expectedDisplayTitleValue = expectedDisplayTitle({
    workflowPath,
    operationId: binding.operation_id,
    targetSha: binding.target_sha,
    sourceArtifact: source,
  });
  return {
    repository,
    workflowPath,
    workflowId,
    binding,
    verifierRunId,
    verifierRunAttempt,
    selectionArtifactId,
    selectionArtifactName,
    selectionArtifactApiDigest,
    source,
    expectedIdentity: {
      repository,
      workflowPath,
      workflowId,
      displayTitle: expectedDisplayTitleValue,
    },
  };
}

function validateSelectedVerifierRun(selectedRun, rawRun, request) {
  const selected = normalizeSelectedRun(selectedRun);
  if (
    selected.state !== "reusable" ||
    selected.path !== request.workflowPath ||
    selected.workflow_id !== request.workflowId ||
    selected.display_title !== request.expectedIdentity.displayTitle ||
    selected.repository !== request.repository ||
    selected.head_repository !== request.repository ||
    selected.head_branch !== MAIN_BRANCH ||
    selected.event !== DISPATCH_EVENT
  ) {
    throw new Error(
      "selected verifier run is not bound to the exact successful identity"
    );
  }
  if (!workflowRunHasExactIdentity(rawRun, request.expectedIdentity)) {
    throw new Error(
      "selection producer run does not match exact verifier identity"
    );
  }
  const verifierRun = summarizeWorkflowRun(rawRun, request.expectedIdentity);
  if (verifierRun.state !== "reusable") {
    throw new Error("selected verifier run is not a completed successful run");
  }
  if (
    verifierRun.id !== request.verifierRunId ||
    verifierRun.run_attempt !== request.verifierRunAttempt
  ) {
    throw new Error("selection producer run ID or attempt does not match");
  }
  if (!workflowRunMatchesSelectedRun(verifierRun, selected)) {
    throw new Error(
      "selection producer run does not match selected verifier run"
    );
  }
  return verifierRun;
}

function validateSelectionArtifactRecord(artifacts, request, verifierRun) {
  if (!Array.isArray(artifacts)) {
    throw new TypeError(
      "selection artifact metadata bundle must contain an artifacts array"
    );
  }
  if (artifacts.length > MAX_ARTIFACTS) {
    throw new Error(
      `selection artifact metadata exceeds the ${MAX_ARTIFACTS}-item bound`
    );
  }
  const candidates = artifacts.filter(
    (artifact) =>
      isPlainObject(artifact) &&
      (String(artifact.id) === request.selectionArtifactId ||
        artifact.name === request.selectionArtifactName)
  );
  if (candidates.length !== 1) {
    throw new Error(
      `selection artifact metadata must contain exactly one matching artifact; found ${candidates.length}`
    );
  }
  const artifact = candidates[0];
  if (
    requirePositiveId(artifact.id, "selection artifact metadata ID") !==
    request.selectionArtifactId
  ) {
    throw new Error("selection artifact metadata ID does not match");
  }
  if (artifact.name !== request.selectionArtifactName) {
    throw new Error("selection artifact metadata name does not match");
  }
  if (artifact.expired !== false) {
    throw new Error(
      "selection artifact is missing a false expired flag or is expired"
    );
  }
  if (artifact.digest !== request.selectionArtifactApiDigest) {
    throw new Error("selection artifact API digest does not match");
  }
  if (!DIGEST_PATTERN.test(artifact.digest)) {
    throw new Error("selection artifact API digest is malformed");
  }
  const attachment = requirePlainObject(
    artifact.workflow_run,
    "selection artifact workflow run"
  );
  if (
    requireRunId(attachment.id, "selection artifact workflow run ID") !==
    request.verifierRunId
  ) {
    throw new Error(
      "selection artifact is not attached to the exact verifier run"
    );
  }
  if (
    requireRunAttempt(
      attachment.run_attempt,
      "selection artifact workflow run attempt"
    ) !== request.verifierRunAttempt
  ) {
    throw new Error("selection artifact workflow run attempt does not match");
  }
  if (attachment.head_sha !== verifierRun.head_sha) {
    throw new Error(
      "selection artifact workflow SHA does not match verifier run"
    );
  }
  return artifact;
}

function requireSelectionField(selection, field, expected) {
  if (selection[field] !== expected) {
    throw new Error(
      `selection.json ${field} does not match the selected identity`
    );
  }
}

function validateSelectionJson(selection, request, verifierRun, artifact) {
  requirePlainObject(selection, "selection.json metadata");
  requireSelectionField(selection, "schema_version", SELECTION_SCHEMA_VERSION);
  requireSelectionField(selection, "contract", SELECTION_CONTRACT);
  requireSelectionField(selection, "repository", request.repository);
  requireSelectionField(selection, "environment", "production");
  requireSelectionField(selection, "target_sha", request.binding.target_sha);
  requireSelectionField(selection, "source_sha", request.binding.target_sha);
  requireSelectionField(
    selection,
    "operation_id",
    request.binding.operation_id
  );
  requireSelectionField(
    selection,
    "artifact_operation_id",
    request.binding.operation_id
  );
  requireSelectionField(
    selection,
    "artifact_workflow_path",
    BUILDER_WORKFLOW_PATH
  );
  requireSelectionField(
    selection,
    "artifact_workflow_sha",
    request.source.workflow_sha
  );
  requireSelectionField(selection, "artifact_run_id", request.source.run_id);
  requireSelectionField(
    selection,
    "artifact_run_attempt",
    request.source.run_attempt
  );
  requireSelectionField(selection, "artifact_id", request.source.id);
  requireSelectionField(selection, "artifact_name", request.source.name);
  requireSelectionField(
    selection,
    "artifact_api_digest",
    request.source.api_digest
  );
  requireSelectionField(
    selection,
    "selection_artifact_name",
    request.selectionArtifactName
  );
  requireSelectionField(
    selection,
    "verifier_workflow_path",
    VERIFIER_WORKFLOW_PATH
  );
  requireSelectionField(
    selection,
    "verifier_workflow_sha",
    verifierRun.head_sha
  );
  requireSelectionField(selection, "verifier_ref", "refs/heads/main");
  requireSelectionField(selection, "verifier_run_id", request.verifierRunId);
  requireSelectionField(
    selection,
    "verifier_run_attempt",
    request.verifierRunAttempt
  );
  requireSha(selection.protected_main_sha, "selection.protected_main_sha");
  requireSha(
    selection.protected_main_current_sha,
    "selection.protected_main_current_sha"
  );
  requireHexDigest(selection.manifest_sha256, "selection.manifest_sha256");
  requireHexDigest(selection.checksums_sha256, "selection.checksums_sha256");
  requireHexDigest(selection.package_sha256, "selection.package_sha256");
  requirePositiveInteger(
    selection.artifact_archive_size_bytes,
    "selection.artifact_archive_size_bytes"
  );
  requirePositiveInteger(
    selection.package_size_bytes,
    "selection.package_size_bytes"
  );
  if (artifact.digest !== request.selectionArtifactApiDigest) {
    throw new Error(
      "selection.json digest is not bound to the selected artifact"
    );
  }
  const claimedDigest = requireHexDigest(
    selection.selection_digest,
    "selection.selection_digest"
  );
  const unsignedSelection = { ...selection };
  delete unsignedSelection.selection_digest;
  if (
    claimedDigest !==
    sha256Buffer(Buffer.from(canonicalJson(unsignedSelection), "utf8"))
  ) {
    throw new Error("selection_digest verification failed");
  }
  return selection;
}

function validateSelectionArtifactMetadata(options) {
  const request = normalizeSelectionRequest(options);
  const bundle = requirePlainObject(
    options.metadataBundle,
    "selection artifact metadata bundle"
  );
  const rawRun = requirePlainObject(bundle.run, "selection verifier run");
  const verifierRun = validateSelectedVerifierRun(
    options.selectedRun,
    rawRun,
    request
  );
  const artifact = validateSelectionArtifactRecord(
    bundle.artifacts,
    request,
    verifierRun
  );
  const hasSelection = Object.hasOwn(bundle, "selection");
  const hasSelectionJson = Object.hasOwn(bundle, "selection_json");
  if (hasSelection && hasSelectionJson) {
    throw new Error("selection metadata must use one selection field");
  }
  const selection = hasSelection ? bundle.selection : bundle.selection_json;
  if (hasSelection || hasSelectionJson) {
    validateSelectionJson(selection, request, verifierRun, artifact);
  }
  return Object.freeze({
    contract: CONTRACT,
    valid: true,
    operation_id: request.binding.operation_id,
    target_sha: request.binding.target_sha,
    selection_artifact: {
      id: request.selectionArtifactId,
      name: request.selectionArtifactName,
      expired: false,
      digest: request.selectionArtifactApiDigest,
      workflow_run_id: request.verifierRunId,
      workflow_run_attempt: request.verifierRunAttempt,
    },
    verifier_run: verifierRun,
    source_artifact: request.source,
    selection_json_validated: hasSelection || hasSelectionJson,
  });
}

function normalizeSelectedRun(value) {
  const selected = requirePlainObject(value, "selected child run");
  const state = requireString(selected.state, "selected child run state");
  if (!RUN_STATES.includes(state)) {
    throw new Error("selected child run state is unsupported");
  }
  return Object.freeze({
    id: requireRunId(selected.id, "selected child run ID"),
    run_attempt: requireRunAttempt(
      selected.run_attempt,
      "selected child run attempt"
    ),
    workflow_id: requireWorkflowId(
      selected.workflow_id,
      "selected child workflow ID"
    ),
    path: requireString(selected.path, "selected child workflow path"),
    event: requireString(selected.event, "selected child event"),
    status: requireString(selected.status, "selected child status"),
    conclusion:
      selected.conclusion === null || selected.conclusion === undefined
        ? null
        : requireString(selected.conclusion, "selected child conclusion"),
    head_branch: requireString(
      selected.head_branch,
      "selected child head branch"
    ),
    head_sha: requireSha(selected.head_sha, "selected child head SHA"),
    display_title: requireString(
      selected.display_title,
      "selected child display title"
    ),
    repository: requireRepository(
      selected.repository,
      "selected child repository"
    ),
    head_repository: requireRepository(
      selected.head_repository,
      "selected child head repository"
    ),
    state,
  });
}

function workflowRunMatchesSelectedRun(run, selected) {
  return (
    run.id === selected.id &&
    run.run_attempt === selected.run_attempt &&
    run.workflow_id === selected.workflow_id &&
    run.path === selected.path &&
    run.event === selected.event &&
    run.status === selected.status &&
    run.conclusion === selected.conclusion &&
    run.head_branch === selected.head_branch &&
    run.head_sha === selected.head_sha &&
    run.display_title === selected.display_title &&
    run.repository === selected.repository &&
    run.head_repository === selected.head_repository &&
    run.state === selected.state
  );
}

function validateOptionalManifest(
  manifest,
  {
    repository,
    operationId,
    targetSha,
    artifactName,
    artifactRunId,
    artifactRunAttempt,
    workflowHeadSha,
  }
) {
  requirePlainObject(manifest, "artifact manifest");
  if (manifest.artifact_contract !== "production-prebuild-v2") {
    throw new Error("artifact manifest contract is not production-prebuild-v2");
  }
  if (manifest.repository !== "frontend") {
    throw new Error("artifact manifest repository is not frontend");
  }
  if (manifest.environment !== "production") {
    throw new Error("artifact manifest environment is not production");
  }
  if (manifest.target_sha !== targetSha || manifest.source_sha !== targetSha) {
    throw new Error(
      "artifact manifest target/source SHA is not frozen to the target"
    );
  }
  if (manifest.operation_id !== operationId) {
    throw new Error("artifact manifest operation ID does not match");
  }
  if (manifest.artifact_name !== artifactName) {
    throw new Error("artifact manifest name does not match");
  }
  if (
    requireRunId(
      manifest.workflow_run_id,
      "artifact manifest workflow run ID"
    ) !== artifactRunId
  ) {
    throw new Error("artifact manifest workflow run ID does not match");
  }
  if (
    requireRunAttempt(manifest.run_attempt, "artifact manifest run attempt") !==
    artifactRunAttempt
  ) {
    throw new Error("artifact manifest run attempt does not match");
  }
  if (manifest.workflow_sha !== workflowHeadSha) {
    throw new Error(
      "artifact manifest workflow SHA does not match the producer head"
    );
  }
  if (manifest.protected_main_sha !== undefined) {
    requireSha(
      manifest.protected_main_sha,
      "artifact manifest protected_main_sha"
    );
  }
  if (repository !== EXPECTED_REPOSITORY) {
    throw new Error(
      "artifact metadata repository is not the frontend repository"
    );
  }
}

function emitBoundedJson(value) {
  const output = JSON.stringify(value);
  if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
    throw new Error(`JSON output exceeds the ${MAX_OUTPUT_BYTES}-byte bound`);
  }
  process.stdout.write(`${output}\n`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`unexpected argument: ${token}`);
    }
    const key = token.slice(2).replaceAll("-", "_");
    const value = argv[index + 1];
    if (!key || value === undefined || value.startsWith("--")) {
      throw new Error(`argument ${token} requires a value`);
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function requireArgument(args, name) {
  return requireString(args[name], `--${name.replaceAll("_", "-")}`);
}

function runCli(argv) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);
  if (command === "validate-operation") {
    emitBoundedJson(
      validateOperationIdentity({
        parentRunId: requireArgument(args, "parent_run_id"),
        targetSha: requireArgument(args, "target_sha"),
      })
    );
    return;
  }
  if (command === "titles") {
    emitBoundedJson(
      computeDisplayTitles({
        operationId: requireArgument(args, "operation_id"),
        targetSha: requireArgument(args, "target_sha"),
      })
    );
    return;
  }
  if (command === "select-run") {
    const allowedStates = args.allowed_states
      ? args.allowed_states.split(",")
      : undefined;
    emitBoundedJson(
      selectTrustedWorkflowRun({
        workflowRunsJson: readBoundedJsonFile(
          requireArgument(args, "input"),
          "workflow run list"
        ),
        repository: args.repository ?? EXPECTED_REPOSITORY,
        workflowPath: requireArgument(args, "workflow_path"),
        workflowId: requireArgument(args, "workflow_id"),
        operationId: requireArgument(args, "operation_id"),
        targetSha: requireArgument(args, "target_sha"),
        allowedStates,
      })
    );
    return;
  }
  if (command === "validate-artifact") {
    emitBoundedJson(
      validateArtifactMetadata({
        metadataBundle: readBoundedJsonFile(
          requireArgument(args, "input"),
          "artifact metadata bundle"
        ),
        selectedRun: readBoundedJsonFile(
          requireArgument(args, "selected_run"),
          "selected child run"
        ),
        repository: args.repository ?? EXPECTED_REPOSITORY,
        workflowPath: requireArgument(args, "workflow_path"),
        workflowId: requireArgument(args, "workflow_id"),
        operationId: requireArgument(args, "operation_id"),
        targetSha: requireArgument(args, "target_sha"),
        artifactRunId: requireArgument(args, "artifact_run_id"),
        artifactRunAttempt: requireArgument(args, "artifact_run_attempt"),
        artifactId: requireArgument(args, "artifact_id"),
        artifactName: requireArgument(args, "artifact_name"),
        artifactApiDigest: requireArgument(args, "artifact_api_digest"),
      })
    );
    return;
  }
  if (command === "validate-selection") {
    emitBoundedJson(
      validateSelectionArtifactMetadata({
        metadataBundle: readBoundedJsonFile(
          requireArgument(args, "input"),
          "selection artifact metadata bundle"
        ),
        selectedRun: readBoundedJsonFile(
          requireArgument(args, "selected_run"),
          "selected verifier run"
        ),
        repository: args.repository ?? EXPECTED_REPOSITORY,
        workflowPath: requireArgument(args, "workflow_path"),
        workflowId: requireArgument(args, "workflow_id"),
        operationId: requireArgument(args, "operation_id"),
        targetSha: requireArgument(args, "target_sha"),
        verifierRunId: requireArgument(args, "verifier_run_id"),
        verifierRunAttempt: requireArgument(args, "verifier_run_attempt"),
        selectionArtifactId: requireArgument(args, "selection_artifact_id"),
        selectionArtifactName: requireArgument(args, "selection_artifact_name"),
        selectionArtifactApiDigest: requireArgument(
          args,
          "selection_artifact_api_digest"
        ),
        sourceArtifact: {
          run_id: requireArgument(args, "source_artifact_run_id"),
          run_attempt: requireArgument(args, "source_artifact_run_attempt"),
          id: requireArgument(args, "source_artifact_id"),
          name: requireArgument(args, "source_artifact_name"),
          api_digest: requireArgument(args, "source_artifact_api_digest"),
          workflow_sha: requireArgument(args, "source_artifact_workflow_sha"),
        },
      })
    );
    return;
  }
  throw new Error(
    "command must be validate-operation, titles, select-run, validate-artifact, or validate-selection"
  );
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`one-click-production-children: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  ACTIVE_STATUSES,
  BUILDER_WORKFLOW_PATH,
  CONTRACT,
  DISPATCH_EVENT,
  EXPECTED_REPOSITORY,
  MAIN_BRANCH,
  OPERATION_ID_PATTERN,
  RUN_STATES,
  SELECTION_ARTIFACT_NAME_PREFIX,
  SELECTION_CONTRACT,
  SELECTION_SCHEMA_VERSION,
  VERIFIER_WORKFLOW_PATH,
  canonicalJson,
  classifyWorkflowRun,
  computeDisplayTitles,
  expectedDisplayTitle,
  expectedSelectionArtifactName,
  selectTrustedWorkflowRun,
  validateArtifactMetadata,
  validateOperationBinding,
  validateOperationIdentity,
  validateSelectionArtifactMetadata,
  sha256Buffer,
};
