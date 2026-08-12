#!/usr/bin/env node

"use strict";

/* eslint-disable max-lines -- Keep the parser, schema, and CLI in one dependency-free trust boundary. */

const fs = require("node:fs");

const CONTRACT = "release-bus-v2-production-authority-client-v1";
const AUTHORITY_PATH = "/deploy/release-bus-v2/production-authority";
const MAX_OPTION_BYTES = 4 * 1024;
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 128 * 1024;
const MAX_PATH_BYTES = 1024;
const MAX_JSON_DEPTH = 16;
const ACQUIRE_BIND = "acquire-bind";
const REAUTHORIZE = "reauthorize";
const COMPLETE = "complete";
const FAIL = "fail";
const COMMON_INPUT_KEYS = [
  "parent_run_id",
  "target_sha",
  "workflow_run_attempt",
  "workflow_run_id",
];
const IDENTITY_KEYS = [
  "controller_identity",
  "environment",
  "operation_id",
  "repository",
  "selection_digest",
  "service",
  "target_sha",
  "workflow_run_attempt",
  "workflow_run_id",
];
const COMMANDS = new Set([ACQUIRE_BIND, REAUTHORIZE, COMPLETE, FAIL]);
const BINDING_COMMANDS = new Set([ACQUIRE_BIND, REAUTHORIZE]);
const MODES = new Set(["OFF", "STAGING", "PRODUCTION"]);
const STATUSES = new Set([
  "PREPARED",
  "BOUND",
  "COMPLETED",
  "FAILED",
  "DENIED",
  "EXPIRED",
]);
const DENIAL_CODES = new Set([
  "LANE_ON",
  "LANE_NOT_CHANGEABLE",
  "ACTIVE_WORKFLOW",
  "ACTIVE_TRAIN",
  "ACTIVE_OPERATION",
  "ENVIRONMENT_LOCK_HELD",
  "CONTROL_EPOCH_CHANGED",
  "TARGET_NOT_IN_PROTECTED_MAIN_HISTORY",
  "SELECTION_DIGEST_MISMATCH",
  "WORKFLOW_IDENTITY_MISMATCH",
  "QUALIFIER_WORKFLOW_IDENTITY_MISMATCH",
  "EVIDENCE_DIGEST_MISMATCH",
  "OWNER_MISMATCH",
  "AUTHORITY_NOT_FOUND",
  "AUTHORITY_NOT_BOUND",
  "AUTHORITY_TERMINAL",
  "LEASE_EXPIRED",
  "LEASE_LOST",
  "HARD_TTL_EXPIRED",
  "AUTHORITY_UNAVAILABLE",
]);
const FAILURE_CODES = new Set([
  "AWS_MUTATION_FAILED",
  "WORKFLOW_FAILED",
  "ABORTED",
  "CONTROL_REVOKED",
  "LEASE_EXPIRED",
  "LEASE_LOST",
]);
const POSITIVE_RUN = /^[1-9]\d{0,19}$/u;
const SHA = /^[a-f0-9]{40}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const EVIDENCE_DIGEST_OPTION = "--evidence-digest";
const QUALIFIER_ATTEMPT_OPTION = "--qualifier-workflow-run-attempt";
const QUALIFIER_ID_OPTION = "--qualifier-workflow-run-id";
const OPERATION = /^frontend-prod-[1-9]\d{0,19}$/u;
const SENSITIVE_KEY =
  /(?:secret|token|password|authorization|credential|private[_-]?key|api[_-]?key)/iu;
const UNSAFE_KEY = /^(?:__proto__|prototype|constructor)$/u;

class AuthorityClientError extends Error {
  constructor(code) {
    super(code);
    this.name = "AuthorityClientError";
    this.code = code;
  }
}

function fail(code) {
  throw new AuthorityClientError(code);
}

function own(value, key) {
  return Object.hasOwn(value, key);
}

function plain(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function exact(value, requiredKeys, optionalKeys, code) {
  if (!plain(value)) fail(`${code}_OBJECT`);
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  if (
    requiredKeys.some((key) => !own(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    fail(code);
  }
  for (const key of Object.keys(value)) {
    if (UNSAFE_KEY.test(key)) fail("UNSAFE_JSON_KEY");
    if (SENSITIVE_KEY.test(key)) fail("SENSITIVE_FIELD");
  }
}

function string(value, code, max = 256) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > max ||
    Buffer.byteLength(value, "utf8") > max
  ) {
    fail(code);
  }
}

function runId(value, code) {
  if (typeof value !== "string" || !POSITIVE_RUN.test(value)) fail(code);
}

function attempt(value, code) {
  if (!Number.isInteger(value) || value < 1 || value > 1_000_000) fail(code);
}

function sha(value, code = "INVALID_TARGET_SHA") {
  if (typeof value !== "string" || !SHA.test(value)) fail(code);
}

function digest(value, code = "INVALID_SELECTION_DIGEST") {
  if (typeof value !== "string" || !DIGEST.test(value)) fail(code);
}

function nullableDigest(value, code) {
  if (value !== null) digest(value, code);
}

function bool(value, code) {
  if (typeof value !== "boolean") fail(code);
}

function integer(value, code, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) fail(code);
}

function nullableInteger(value, code, minimum = 0) {
  if (value !== null) integer(value, code, minimum);
}

function denial(value, code = "INVALID_REASON_CODE") {
  if (typeof value !== "string" || !DENIAL_CODES.has(value)) fail(code);
}

function failure(value, code = "INVALID_REASON_CODE") {
  if (typeof value !== "string" || !FAILURE_CODES.has(value)) fail(code);
}

function epoch(value, code = "INVALID_CONTROL_EPOCH") {
  exact(value, ["all", "mode", "production"], [], code);
  integer(value.all, `${code}_ALL`, 1);
  integer(value.production, `${code}_PRODUCTION`, 1);
  if (typeof value.mode !== "string" || !MODES.has(value.mode))
    fail(`${code}_MODE`);
}

function commonIdentity(input) {
  return {
    parent_run_id: input.parent_run_id,
    target_sha: input.target_sha,
    workflow_run_attempt: input.workflow_run_attempt,
    workflow_run_id: input.workflow_run_id,
  };
}

function identity(input, selectionDigest) {
  const common = commonIdentity(input);
  exact(common, COMMON_INPUT_KEYS, [], "INVALID_IDENTITY_INPUT");
  runId(common.parent_run_id, "INVALID_PARENT_RUN_ID");
  sha(common.target_sha);
  runId(common.workflow_run_id, "INVALID_WORKFLOW_RUN_ID");
  attempt(common.workflow_run_attempt, "INVALID_WORKFLOW_RUN_ATTEMPT");
  nullableDigest(selectionDigest, "INVALID_SELECTION_DIGEST");
  return {
    controller_identity: "frontend-production-workflow",
    environment: "prod",
    operation_id: `frontend-prod-${common.parent_run_id}`,
    repository: "frontend",
    selection_digest: selectionDigest,
    service: "frontend",
    target_sha: common.target_sha,
    workflow_run_attempt: common.workflow_run_attempt,
    workflow_run_id: common.workflow_run_id,
  };
}

function buildAcquireBindPayload(input) {
  exact(input, COMMON_INPUT_KEYS, [], "INVALID_ACQUIRE_BIND_INPUT");
  return identity(input, null);
}

function buildReauthorizePayload(input) {
  exact(
    input,
    [...COMMON_INPUT_KEYS, "selection_digest"],
    [],
    "INVALID_REAUTHORIZE_INPUT"
  );
  digest(input.selection_digest);
  return identity(input, input.selection_digest);
}

function buildCompletePayload(input) {
  exact(
    input,
    [
      ...COMMON_INPUT_KEYS,
      "evidence_digest",
      "qualifier_workflow_run_attempt",
      "qualifier_workflow_run_id",
      "selection_digest",
    ],
    [],
    "INVALID_COMPLETE_INPUT"
  );
  digest(input.selection_digest);
  digest(input.evidence_digest, "INVALID_EVIDENCE_DIGEST");
  runId(input.qualifier_workflow_run_id, "INVALID_QUALIFIER_WORKFLOW_RUN_ID");
  attempt(
    input.qualifier_workflow_run_attempt,
    "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
  );
  return {
    ...identity(input, input.selection_digest),
    evidence_digest: input.evidence_digest,
    qualifier_workflow_run_attempt: input.qualifier_workflow_run_attempt,
    qualifier_workflow_run_id: input.qualifier_workflow_run_id,
  };
}

function buildFailPayload(input) {
  exact(
    input,
    [
      ...COMMON_INPUT_KEYS,
      "evidence_digest",
      "qualifier_workflow_run_attempt",
      "qualifier_workflow_run_id",
      "reason_code",
      "selection_digest",
    ],
    [],
    "INVALID_FAIL_INPUT"
  );
  failure(input.reason_code);
  nullableDigest(input.selection_digest, "INVALID_SELECTION_DIGEST");
  digest(input.evidence_digest, "INVALID_EVIDENCE_DIGEST");
  runId(input.qualifier_workflow_run_id, "INVALID_QUALIFIER_WORKFLOW_RUN_ID");
  attempt(
    input.qualifier_workflow_run_attempt,
    "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
  );
  return {
    ...identity(input, input.selection_digest),
    evidence_digest: input.evidence_digest,
    qualifier_workflow_run_attempt: input.qualifier_workflow_run_attempt,
    qualifier_workflow_run_id: input.qualifier_workflow_run_id,
    reason_code: input.reason_code,
  };
}

function buildPayload(command, input) {
  if (command === ACQUIRE_BIND) return buildAcquireBindPayload(input);
  if (command === REAUTHORIZE) return buildReauthorizePayload(input);
  if (command === COMPLETE) return buildCompletePayload(input);
  if (command === FAIL) return buildFailPayload(input);
  fail("UNKNOWN_COMMAND");
}

function requestExtras(command) {
  let extra = [];
  if (command === COMPLETE) {
    extra = [
      "evidence_digest",
      "qualifier_workflow_run_attempt",
      "qualifier_workflow_run_id",
    ];
  } else if (command === FAIL) {
    extra = [
      "evidence_digest",
      "qualifier_workflow_run_attempt",
      "qualifier_workflow_run_id",
      "reason_code",
    ];
  }
  return extra;
}

function validateRequestIdentity(request) {
  if (!OPERATION.test(request.operation_id)) fail("INVALID_OPERATION_ID");
  if (request.controller_identity !== "frontend-production-workflow")
    fail("INVALID_CONTROLLER_IDENTITY");
  if (request.repository !== "frontend") fail("INVALID_REPOSITORY");
  if (request.environment !== "prod") fail("INVALID_ENVIRONMENT");
  if (request.service !== "frontend") fail("INVALID_SERVICE");
  sha(request.target_sha);
  runId(request.workflow_run_id, "INVALID_WORKFLOW_RUN_ID");
  attempt(request.workflow_run_attempt, "INVALID_WORKFLOW_RUN_ATTEMPT");
}

function validateRequest(command, request) {
  if (!COMMANDS.has(command)) fail("UNKNOWN_COMMAND");
  const extra = requestExtras(command);
  exact(request, [...IDENTITY_KEYS, ...extra], [], "INVALID_REQUEST");
  validateRequestIdentity(request);
  if (command === ACQUIRE_BIND) {
    if (request.selection_digest !== null) fail("SELECTION_MUST_BE_NULL");
  } else {
    nullableDigest(request.selection_digest, "INVALID_SELECTION_DIGEST");
    if (command !== FAIL && request.selection_digest === null)
      fail("SELECTION_MUST_BE_DIGEST");
  }
  if (command === COMPLETE) {
    runId(
      request.qualifier_workflow_run_id,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ID"
    );
    attempt(
      request.qualifier_workflow_run_attempt,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    digest(request.evidence_digest, "INVALID_EVIDENCE_DIGEST");
  }
  if (command === FAIL) {
    failure(request.reason_code);
    runId(
      request.qualifier_workflow_run_id,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ID"
    );
    attempt(
      request.qualifier_workflow_run_attempt,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    digest(request.evidence_digest, "INVALID_EVIDENCE_DIGEST");
  }
  return request;
}

function canonicalize(value, depth = 0) {
  if (depth > MAX_JSON_DEPTH) fail("JSON_TOO_DEEP");
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER");
    return value;
  }
  if (Array.isArray(value))
    return value.map((item) => canonicalize(item, depth + 1));
  if (!plain(value)) fail("INVALID_JSON_VALUE");
  const sorted = {};
  for (const key of Object.keys(value).sort((left, right) =>
    left.localeCompare(right, "en")
  )) {
    if (UNSAFE_KEY.test(key)) fail("UNSAFE_JSON_KEY");
    if (SENSITIVE_KEY.test(key)) fail("SENSITIVE_FIELD");
    sorted[key] = canonicalize(value[key], depth + 1);
  }
  return sorted;
}

function canonicalJson(value) {
  const json = JSON.stringify(canonicalize(value));
  if (typeof json !== "string") fail("INVALID_JSON_VALUE");
  return json;
}

function whitespace(text, index) {
  let cursor = index;
  while (cursor < text.length) {
    const code = text.codePointAt(cursor);
    if (code !== 9 && code !== 10 && code !== 13 && code !== 32) break;
    cursor += 1;
  }
  return cursor;
}

function scanJsonString(text, state) {
  const start = state.index;
  if (text[state.index] !== '"') fail("MALFORMED_JSON");
  state.index += 1;
  while (state.index < text.length) {
    const char = text[state.index];
    if (char === "\\") state.index += 2;
    else {
      state.index += 1;
      if (char === '"') {
        try {
          return JSON.parse(text.slice(start, state.index));
        } catch {
          fail("MALFORMED_JSON");
        }
      }
    }
  }
  fail("MALFORMED_JSON");
}

function scanJsonPrimitive(text, state) {
  const start = state.index;
  while (
    state.index < text.length &&
    ![" ", "\t", "\r", "\n", "}", "]", ","].includes(text[state.index])
  ) {
    state.index += 1;
  }
  if (start === state.index) fail("MALFORMED_JSON");
  try {
    const parsed = JSON.parse(text.slice(start, state.index));
    if (typeof parsed === "number" && !Number.isFinite(parsed))
      fail("NON_FINITE_NUMBER");
  } catch {
    fail("MALFORMED_JSON");
  }
}

function scanJsonObject(text, state, depth) {
  state.index += 1;
  state.index = whitespace(text, state.index);
  const keys = new Set();
  if (text[state.index] === "}") {
    state.index += 1;
    return;
  }
  while (state.index < text.length) {
    state.index = whitespace(text, state.index);
    const key = scanJsonString(text, state);
    if (UNSAFE_KEY.test(key)) fail("UNSAFE_JSON_KEY");
    if (SENSITIVE_KEY.test(key)) fail("SENSITIVE_FIELD");
    if (keys.has(key)) fail("DUPLICATE_JSON_KEY");
    keys.add(key);
    state.index = whitespace(text, state.index);
    if (text[state.index] !== ":") fail("MALFORMED_JSON");
    state.index += 1;
    scanJsonValue(text, state, depth + 1);
    state.index = whitespace(text, state.index);
    if (text[state.index] === "}") {
      state.index += 1;
      return;
    }
    if (text[state.index] !== ",") fail("MALFORMED_JSON");
    state.index += 1;
  }
  fail("MALFORMED_JSON");
}

function scanJsonArray(text, state, depth) {
  state.index += 1;
  state.index = whitespace(text, state.index);
  if (text[state.index] === "]") {
    state.index += 1;
    return;
  }
  while (state.index < text.length) {
    scanJsonValue(text, state, depth + 1);
    state.index = whitespace(text, state.index);
    if (text[state.index] === "]") {
      state.index += 1;
      return;
    }
    if (text[state.index] !== ",") fail("MALFORMED_JSON");
    state.index += 1;
  }
  fail("MALFORMED_JSON");
}

function scanJsonValue(text, state, depth) {
  if (depth > MAX_JSON_DEPTH) fail("JSON_TOO_DEEP");
  state.index = whitespace(text, state.index);
  if (text[state.index] === '"') return void scanJsonString(text, state);
  if (text[state.index] === "{") return scanJsonObject(text, state, depth);
  if (text[state.index] === "[") return scanJsonArray(text, state, depth);
  return scanJsonPrimitive(text, state);
}

function scanJson(text) {
  const state = { index: 0 };
  scanJsonValue(text, state, 0);
  state.index = whitespace(text, state.index);
  if (state.index !== text.length) fail("MALFORMED_JSON");
}

function parseStrictJson(input, label, maxBytes) {
  if (typeof input !== "string" && !Buffer.isBuffer(input))
    fail(`${label}_INPUT_INVALID`);
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  if (buffer.length > maxBytes) fail(`${label}_TOO_LARGE`);
  const text = buffer.toString("utf8");
  scanJson(text);
  try {
    return JSON.parse(text);
  } catch {
    fail("MALFORMED_JSON");
  }
}

function validateResponseIdentity(request, response) {
  for (const key of [
    "operation_id",
    "controller_identity",
    "repository",
    "environment",
    "service",
    "target_sha",
    "selection_digest",
  ]) {
    if (response[key] !== request[key])
      fail(`RESPONSE_${key.toUpperCase()}_MISMATCH`);
  }
  const nullBinding =
    response.workflow_run_id === null && response.workflow_run_attempt === null;
  if (!nullBinding) {
    runId(response.workflow_run_id, "INVALID_RESPONSE_WORKFLOW_RUN_ID");
    attempt(
      response.workflow_run_attempt,
      "INVALID_RESPONSE_WORKFLOW_RUN_ATTEMPT"
    );
    if (
      response.workflow_run_id !== request.workflow_run_id ||
      response.workflow_run_attempt !== request.workflow_run_attempt
    ) {
      fail("RESPONSE_WORKFLOW_BINDING_MISMATCH");
    }
  }
  sha(response.target_sha, "INVALID_RESPONSE_TARGET_SHA");
  nullableDigest(
    response.selection_digest,
    "INVALID_RESPONSE_SELECTION_DIGEST"
  );
  nullableInteger(response.lease_expires_at, "INVALID_RESPONSE_LEASE_EXPIRY");
  nullableInteger(response.hard_expires_at, "INVALID_RESPONSE_HARD_EXPIRY");
  nullableInteger(
    response.lock_row_version,
    "INVALID_RESPONSE_LOCK_ROW_VERSION",
    1
  );
  epoch(response.control_epoch, "INVALID_RESPONSE_CONTROL_EPOCH");
}

function validateBindingResponse(request, response, expected) {
  exact(
    response,
    [
      ...IDENTITY_KEYS,
      "bound",
      "authorized",
      "control_epoch",
      "hard_expires_at",
      "lease_expires_at",
      "lock_row_version",
      "reused",
      "status",
    ],
    ["observed_epoch", "reason_code"],
    "INVALID_BIND_RESPONSE"
  );
  validateResponseIdentity(request, response);
  if (response.status !== expected.status) fail("RESPONSE_STATUS_MISMATCH");
  if (response.authorized !== expected.authorized)
    fail("RESPONSE_AUTHORIZED_MISMATCH");
  if (response.bound !== expected.bound) fail("RESPONSE_BOUND_MISMATCH");
  bool(response.authorized, "INVALID_RESPONSE_AUTHORIZED");
  bool(response.bound, "INVALID_RESPONSE_BOUND");
  bool(response.reused, "INVALID_RESPONSE_REUSED");
  if (
    canonicalJson(response.control_epoch) !==
    canonicalJson(expected.control_epoch)
  )
    fail("RESPONSE_CONTROL_EPOCH_MISMATCH");
  if (response.lock_row_version !== expected.lock_row_version)
    fail("RESPONSE_LOCK_ROW_VERSION_MISMATCH");
  if (response.authorized) {
    if (
      response.status !== "BOUND" ||
      !response.bound ||
      response.workflow_run_id !== request.workflow_run_id ||
      response.workflow_run_attempt !== request.workflow_run_attempt ||
      own(response, "reason_code") ||
      own(response, "observed_epoch")
    ) {
      fail("INVALID_AUTHORIZED_RESPONSE_STATE");
    }
  } else {
    if (
      response.bound ||
      !own(response, "reason_code") ||
      !own(response, "observed_epoch")
    )
      fail("INVALID_DENIED_RESPONSE_STATE");
    denial(response.reason_code, "INVALID_RESPONSE_REASON_CODE");
    epoch(response.observed_epoch, "INVALID_RESPONSE_OBSERVED_EPOCH");
  }
  return response;
}

function validateCompletionResponse(command, request, response, expected) {
  const flag = command === COMPLETE ? "completed" : "failed";
  exact(
    response,
    ["lock_row_version", "operation_id", "reused", "status", flag],
    ["observed_epoch", "reason_code"],
    "INVALID_COMPLETION_RESPONSE"
  );
  if (response.operation_id !== request.operation_id)
    fail("RESPONSE_OPERATION_ID_MISMATCH");
  if (response.status !== expected.status) fail("RESPONSE_STATUS_MISMATCH");
  if (response[flag] !== expected[flag])
    fail(`RESPONSE_${flag.toUpperCase()}_MISMATCH`);
  bool(response[flag], `INVALID_RESPONSE_${flag.toUpperCase()}`);
  bool(response.reused, "INVALID_RESPONSE_REUSED");
  nullableInteger(
    response.lock_row_version,
    "INVALID_RESPONSE_LOCK_ROW_VERSION",
    1
  );
  if (response.lock_row_version !== expected.lock_row_version)
    fail("RESPONSE_LOCK_ROW_VERSION_MISMATCH");
  if (response[flag]) {
    const terminal = command === COMPLETE ? "COMPLETED" : "FAILED";
    if (
      response.status !== terminal ||
      own(response, "reason_code") ||
      own(response, "observed_epoch")
    )
      fail("INVALID_TERMINAL_RESPONSE_STATE");
  } else {
    if (!own(response, "reason_code") || !own(response, "observed_epoch"))
      fail("INVALID_DENIED_RESPONSE_STATE");
    denial(response.reason_code, "INVALID_RESPONSE_REASON_CODE");
    epoch(response.observed_epoch, "INVALID_RESPONSE_OBSERVED_EPOCH");
  }
  return response;
}

const EXPECTED_KEYS = {
  [ACQUIRE_BIND]: [
    "authorized",
    "bound",
    "control_epoch",
    "lock_row_version",
    "parent_run_id",
    "selection_digest",
    "status",
    "target_sha",
    "workflow_run_attempt",
    "workflow_run_id",
  ],
  [REAUTHORIZE]: [
    "authorized",
    "bound",
    "control_epoch",
    "lock_row_version",
    "parent_run_id",
    "selection_digest",
    "status",
    "target_sha",
    "workflow_run_attempt",
    "workflow_run_id",
  ],
  [COMPLETE]: [
    "completed",
    "evidence_digest",
    "lock_row_version",
    "parent_run_id",
    "qualifier_workflow_run_attempt",
    "qualifier_workflow_run_id",
    "selection_digest",
    "status",
    "target_sha",
    "workflow_run_attempt",
    "workflow_run_id",
  ],
  [FAIL]: [
    "failed",
    "evidence_digest",
    "lock_row_version",
    "parent_run_id",
    "qualifier_workflow_run_attempt",
    "qualifier_workflow_run_id",
    "reason_code",
    "selection_digest",
    "status",
    "target_sha",
    "workflow_run_attempt",
    "workflow_run_id",
  ],
};

function validateExpected(command, expected) {
  exact(expected, EXPECTED_KEYS[command], [], "INVALID_EXPECTED_RESPONSE");
  runId(expected.parent_run_id, "INVALID_PARENT_RUN_ID");
  sha(expected.target_sha);
  runId(expected.workflow_run_id, "INVALID_WORKFLOW_RUN_ID");
  attempt(expected.workflow_run_attempt, "INVALID_WORKFLOW_RUN_ATTEMPT");
  nullableDigest(
    expected.selection_digest,
    "INVALID_EXPECTED_SELECTION_DIGEST"
  );
  if (command === ACQUIRE_BIND && expected.selection_digest !== null)
    fail("SELECTION_MUST_BE_NULL");
  if (command !== ACQUIRE_BIND && command !== FAIL)
    digest(expected.selection_digest);
  if (typeof expected.status !== "string" || !STATUSES.has(expected.status))
    fail("INVALID_EXPECTED_STATUS");
  nullableInteger(
    expected.lock_row_version,
    "INVALID_EXPECTED_LOCK_ROW_VERSION",
    1
  );
  if (BINDING_COMMANDS.has(command)) {
    bool(expected.authorized, "INVALID_EXPECTED_AUTHORIZED");
    bool(expected.bound, "INVALID_EXPECTED_BOUND");
    epoch(expected.control_epoch);
  }
  if (command === COMPLETE) {
    bool(expected.completed, "INVALID_EXPECTED_COMPLETED");
    runId(
      expected.qualifier_workflow_run_id,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ID"
    );
    attempt(
      expected.qualifier_workflow_run_attempt,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    digest(expected.evidence_digest, "INVALID_EVIDENCE_DIGEST");
  }
  if (command === FAIL) {
    bool(expected.failed, "INVALID_EXPECTED_FAILED");
    runId(
      expected.qualifier_workflow_run_id,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ID"
    );
    attempt(
      expected.qualifier_workflow_run_attempt,
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    digest(expected.evidence_digest, "INVALID_EVIDENCE_DIGEST");
    failure(expected.reason_code);
  }
}

function expectedRequest(command, expected) {
  const common = {
    parent_run_id: expected.parent_run_id,
    target_sha: expected.target_sha,
    workflow_run_attempt: expected.workflow_run_attempt,
    workflow_run_id: expected.workflow_run_id,
  };
  if (command === ACQUIRE_BIND) return buildAcquireBindPayload(common);
  if (command === REAUTHORIZE)
    return buildReauthorizePayload({
      ...common,
      selection_digest: expected.selection_digest,
    });
  if (command === FAIL) {
    return buildFailPayload({
      ...common,
      evidence_digest: expected.evidence_digest,
      qualifier_workflow_run_attempt: expected.qualifier_workflow_run_attempt,
      qualifier_workflow_run_id: expected.qualifier_workflow_run_id,
      reason_code: expected.reason_code,
      selection_digest: expected.selection_digest,
    });
  }
  return buildCompletePayload({
    ...common,
    evidence_digest: expected.evidence_digest,
    qualifier_workflow_run_attempt: expected.qualifier_workflow_run_attempt,
    qualifier_workflow_run_id: expected.qualifier_workflow_run_id,
    selection_digest: expected.selection_digest,
  });
}

function validateResponse(command, request, response, expected) {
  if (!COMMANDS.has(command)) fail("UNKNOWN_COMMAND");
  validateRequest(command, request);
  validateExpected(command, expected);
  if (
    canonicalJson(request) !== canonicalJson(expectedRequest(command, expected))
  )
    fail("REQUEST_IDENTITY_MISMATCH");
  if (!plain(response)) fail("INVALID_RESPONSE_OBJECT");
  return BINDING_COMMANDS.has(command)
    ? validateBindingResponse(request, response, expected)
    : validateCompletionResponse(command, request, response, expected);
}

function cliInteger(value, code) {
  if (typeof value !== "string" || !/^[1-9]\d{0,6}$/u.test(value)) fail(code);
  const parsed = Number(value);
  attempt(parsed, code);
  return parsed;
}

function cliBoolean(value, code) {
  if (value === "true") return true;
  if (value === "false") return false;
  fail(code);
}

function cliSelection(value, allowNull, code) {
  if (allowNull && value === "null") return null;
  digest(value, code);
  return value;
}

const BUILD_OPTIONS = {
  [ACQUIRE_BIND]: [...COMMON_INPUT_KEYS].map(
    (key) => `--${key.replaceAll("_", "-")}`
  ),
  [REAUTHORIZE]: [...COMMON_INPUT_KEYS, "selection_digest"].map(
    (key) => `--${key.replaceAll("_", "-")}`
  ),
  [COMPLETE]: [
    ...COMMON_INPUT_KEYS,
    "evidence_digest",
    "qualifier_workflow_run_attempt",
    "qualifier_workflow_run_id",
    "selection_digest",
  ].map((key) => `--${key.replaceAll("_", "-")}`),
  [FAIL]: [
    ...COMMON_INPUT_KEYS,
    "evidence_digest",
    "qualifier_workflow_run_attempt",
    "qualifier_workflow_run_id",
    "reason_code",
    "selection_digest",
  ].map((key) => `--${key.replaceAll("_", "-")}`),
};

function validationOptions(command) {
  const allowed = new Set([
    "--expected-control-epoch-json",
    "--expected-lock-row-version",
    "--expected-selection-digest",
    "--expected-status",
    "--parent-run-id",
    "--request-file",
    "--response-file",
    "--target-sha",
    "--workflow-run-attempt",
    "--workflow-run-id",
  ]);
  if (BINDING_COMMANDS.has(command)) allowed.add("--expected-authorized");
  if (BINDING_COMMANDS.has(command)) allowed.add("--expected-bound");
  if (command === COMPLETE) {
    allowed.add(EVIDENCE_DIGEST_OPTION);
    allowed.add("--expected-completed");
    allowed.add(QUALIFIER_ATTEMPT_OPTION);
    allowed.add(QUALIFIER_ID_OPTION);
  }
  if (command === FAIL) {
    allowed.add("--expected-failed");
    allowed.add(EVIDENCE_DIGEST_OPTION);
    allowed.add(QUALIFIER_ATTEMPT_OPTION);
    allowed.add(QUALIFIER_ID_OPTION);
    allowed.add("--reason-code");
  }
  return allowed;
}

function parseOptions(argv, allowed) {
  const result = Object.create(null);
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(key)) fail("UNKNOWN_ARGUMENT");
    if (own(result, key)) fail("DUPLICATE_ARGUMENT");
    if (value === undefined || (value.startsWith("--") && value !== "-"))
      fail("MISSING_ARGUMENT_VALUE");
    if (Buffer.byteLength(value, "utf8") > MAX_OPTION_BYTES)
      fail("ARGUMENT_TOO_LARGE");
    result[key] = value;
  }
  return result;
}

function required(result, key) {
  if (!own(result, key)) fail("MISSING_ARGUMENT");
  return result[key];
}

function requestFromOptions(command, o) {
  const common = {
    parent_run_id: required(o, "--parent-run-id"),
    target_sha: required(o, "--target-sha"),
    workflow_run_attempt: cliInteger(
      required(o, "--workflow-run-attempt"),
      "INVALID_WORKFLOW_RUN_ATTEMPT"
    ),
    workflow_run_id: required(o, "--workflow-run-id"),
  };
  if (command === ACQUIRE_BIND) return common;
  const selection_digest = cliSelection(
    required(o, "--selection-digest"),
    command === FAIL,
    "INVALID_SELECTION_DIGEST"
  );
  if (command === REAUTHORIZE) return { ...common, selection_digest };
  if (command === FAIL)
    return {
      ...common,
      evidence_digest: required(o, EVIDENCE_DIGEST_OPTION),
      qualifier_workflow_run_attempt: cliInteger(
        required(o, QUALIFIER_ATTEMPT_OPTION),
        "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
      ),
      qualifier_workflow_run_id: required(o, QUALIFIER_ID_OPTION),
      reason_code: required(o, "--reason-code"),
      selection_digest,
    };
  return {
    ...common,
    evidence_digest: required(o, EVIDENCE_DIGEST_OPTION),
    qualifier_workflow_run_attempt: cliInteger(
      required(o, QUALIFIER_ATTEMPT_OPTION),
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    ),
    qualifier_workflow_run_id: required(o, QUALIFIER_ID_OPTION),
    selection_digest,
  };
}

function expectedFromOptions(command, o) {
  const expected = {
    parent_run_id: required(o, "--parent-run-id"),
    target_sha: required(o, "--target-sha"),
    workflow_run_attempt: cliInteger(
      required(o, "--workflow-run-attempt"),
      "INVALID_WORKFLOW_RUN_ATTEMPT"
    ),
    workflow_run_id: required(o, "--workflow-run-id"),
    selection_digest: cliSelection(
      required(o, "--expected-selection-digest"),
      command === FAIL || command === ACQUIRE_BIND,
      "INVALID_EXPECTED_SELECTION_DIGEST"
    ),
    status: required(o, "--expected-status"),
    lock_row_version:
      required(o, "--expected-lock-row-version") === "null"
        ? null
        : cliInteger(
            required(o, "--expected-lock-row-version"),
            "INVALID_EXPECTED_LOCK_ROW_VERSION"
          ),
  };
  if (BINDING_COMMANDS.has(command)) {
    expected.authorized = cliBoolean(
      required(o, "--expected-authorized"),
      "INVALID_EXPECTED_AUTHORIZED"
    );
    expected.bound = cliBoolean(
      required(o, "--expected-bound"),
      "INVALID_EXPECTED_BOUND"
    );
    expected.control_epoch = parseStrictJson(
      required(o, "--expected-control-epoch-json"),
      "EXPECTED_CONTROL_EPOCH",
      MAX_OPTION_BYTES
    );
  }
  if (command === COMPLETE) {
    expected.completed = cliBoolean(
      required(o, "--expected-completed"),
      "INVALID_EXPECTED_COMPLETED"
    );
    expected.evidence_digest = required(o, EVIDENCE_DIGEST_OPTION);
    expected.qualifier_workflow_run_attempt = cliInteger(
      required(o, QUALIFIER_ATTEMPT_OPTION),
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    expected.qualifier_workflow_run_id = required(o, QUALIFIER_ID_OPTION);
  }
  if (command === FAIL) {
    expected.failed = cliBoolean(
      required(o, "--expected-failed"),
      "INVALID_EXPECTED_FAILED"
    );
    expected.evidence_digest = required(o, EVIDENCE_DIGEST_OPTION);
    expected.qualifier_workflow_run_attempt = cliInteger(
      required(o, QUALIFIER_ATTEMPT_OPTION),
      "INVALID_QUALIFIER_WORKFLOW_RUN_ATTEMPT"
    );
    expected.qualifier_workflow_run_id = required(o, QUALIFIER_ID_OPTION);
    expected.reason_code = required(o, "--reason-code");
  }
  return expected;
}

function readBounded(file, label, maxBytes, allowStdin) {
  string(file, `${label}_FILE_INVALID`, MAX_PATH_BYTES);
  const readDescriptor = (descriptor) => {
    const chunks = [];
    let total = 0;
    const chunk = Buffer.alloc(Math.min(8192, maxBytes + 1));
    while (true) {
      const count = fs.readSync(
        descriptor,
        chunk,
        0,
        chunk.length,
        null
      );
      if (count === 0) break;
      total += count;
      if (total > maxBytes) fail(`${label}_TOO_LARGE`);
      chunks.push(Buffer.from(chunk.subarray(0, count)));
    }
    return Buffer.concat(chunks, total);
  };
  if (file === "-") {
    if (!allowStdin) fail(`${label}_STDIN_NOT_ALLOWED`);
    return readDescriptor(0);
  }
  let descriptor;
  try {
    const noFollow = fs.constants.O_NOFOLLOW ?? 0;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The descriptor pins one local file for both validation and the bounded read.
    descriptor = fs.openSync(file, fs.constants.O_RDONLY | noFollow);
    const stats = fs.fstatSync(descriptor);
    if (!stats.isFile() || stats.size > maxBytes) fail(`${label}_TOO_LARGE`);
    return readDescriptor(descriptor);
  } catch (error) {
    if (error instanceof AuthorityClientError) throw error;
    fail(`${label}_FILE_READ_FAILED`);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function parseCli(argv) {
  const first = argv[0];
  if (first === "validate-response") {
    const command = argv[1];
    if (!COMMANDS.has(command)) fail("UNKNOWN_COMMAND");
    return {
      command,
      mode: "validate",
      o: parseOptions(argv.slice(2), validationOptions(command)),
    };
  }
  if (!COMMANDS.has(first)) fail("UNKNOWN_COMMAND");
  return {
    command: first,
    mode: "build",
    o: parseOptions(argv.slice(1), new Set(BUILD_OPTIONS[first])),
  };
}

function runCli(argv) {
  const parsed = parseCli(argv);
  if (parsed.mode === "build") {
    process.stdout.write(
      `${canonicalJson(buildPayload(parsed.command, requestFromOptions(parsed.command, parsed.o)))}\n`
    );
    return;
  }
  const request = parseStrictJson(
    readBounded(
      required(parsed.o, "--request-file"),
      "REQUEST",
      MAX_REQUEST_BYTES,
      false
    ),
    "REQUEST",
    MAX_REQUEST_BYTES
  );
  const response = parseStrictJson(
    readBounded(
      parsed.o["--response-file"] || "-",
      "RESPONSE",
      MAX_RESPONSE_BYTES,
      true
    ),
    "RESPONSE",
    MAX_RESPONSE_BYTES
  );
  validateResponse(
    parsed.command,
    request,
    response,
    expectedFromOptions(parsed.command, parsed.o)
  );
  process.stdout.write("VALID\n");
}

if (require.main === module) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    const code =
      error instanceof AuthorityClientError ? error.code : "CLIENT_FAILURE";
    process.stderr.write(`authority-client-error:${code}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  AUTHORITY_PATH,
  CONTRACT,
  MAX_RESPONSE_BYTES,
  AuthorityClientError,
  buildAcquireBindPayload,
  buildCompletePayload,
  buildFailPayload,
  buildPayload,
  buildReauthorizePayload,
  canonicalJson,
  parseStrictJson,
  validateRequest,
  validateResponse,
};
