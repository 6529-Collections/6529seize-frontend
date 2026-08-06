"use strict";

/* eslint-disable max-lines -- The controller keeps the network protocol, bounded polling, and output contract together. */

const fs = require("node:fs");
const zlib = require("node:zlib");

const {
  BUILDER_WORKFLOW_PATH,
  DISPATCH_EVENT,
  EXPECTED_REPOSITORY,
  MAIN_BRANCH,
  VERIFIER_WORKFLOW_PATH,
  canonicalJson,
  expectedSelectionArtifactName,
  selectTrustedWorkflowRun,
  validateArtifactMetadata,
  validateOperationBinding,
  validateOperationIdentity,
  validateSelectionArtifactMetadata,
} = require("./one-click-production-children.cjs");

const CONTRACT = "one-click-production-children-runner-v1";
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_ACCEPT = "application/vnd.github+json";
const DEFAULT_GITHUB_API_URL = "https://api.github.com";
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_OPERATION_TIMEOUT_MS = 60 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_JSON_BYTES = 4 * 1024 * 1024;
const MAX_SELECTION_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_SELECTION_JSON_BYTES = 512 * 1024;
const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 10;
const MAX_OUTPUT_BYTES = 32 * 1024;
const MAX_RUN_ATTEMPT = 1_000;
const BOUNDED_RESPONSE_ERROR =
  "GitHub response exceeds the bounded response size";
const OPERATION_ABORTED_ERROR = "operation aborted";
const RUN_ID_PATTERN = /^[1-9]\d{0,19}$/u;
const SHA_PATTERN = /^[a-f0-9]{40}$/u;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const HEX_DIGEST_PATTERN = /^[a-f0-9]{64}$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const WORKFLOW_PATHS = Object.freeze({
  builder: BUILDER_WORKFLOW_PATH,
  verifier: VERIFIER_WORKFLOW_PATH,
});
const OUTPUT_FIELDS = Object.freeze([
  "builder_run_id",
  "builder_run_attempt",
  "builder_workflow_sha",
  "verifier_run_id",
  "verifier_run_attempt",
  "verifier_workflow_sha",
  "artifact_id",
  "artifact_name",
  "artifact_api_digest",
  "selection_artifact_run_id",
  "selection_artifact_run_attempt",
  "selection_artifact_id",
  "selection_artifact_name",
  "selection_artifact_api_digest",
  "selection_digest",
]);

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireRepository(value) {
  const repository = requireString(value, "repository");
  if (!REPOSITORY_PATTERN.test(repository)) {
    throw new Error("repository must be an owner/name value");
  }
  if (repository !== EXPECTED_REPOSITORY) {
    throw new Error("repository is not the authorized frontend repository");
  }
  return repository;
}

function requireSha(value, label) {
  const sha = requireString(value, label);
  if (!SHA_PATTERN.test(sha)) {
    throw new Error(`${label} must be a lowercase 40-character commit SHA`);
  }
  return sha;
}

function requireRunId(value, label) {
  const normalized =
    typeof value === "number" && Number.isSafeInteger(value)
      ? String(value)
      : value;
  if (typeof normalized !== "string" || !RUN_ID_PATTERN.test(normalized)) {
    throw new Error(`${label} must be a positive numeric GitHub run ID`);
  }
  return normalized;
}

function requireRunAttempt(value, label) {
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

function requireWorkflowId(value, label) {
  return requireRunId(value, label);
}

function requireDigest(value, label) {
  const digest = requireString(value, label);
  if (!DIGEST_PATTERN.test(digest)) {
    throw new Error(`${label} must be sha256:<64 lowercase hex>`);
  }
  return digest;
}

function requireHexDigest(value, label) {
  const digest = requireString(value, label);
  if (!HEX_DIGEST_PATTERN.test(digest)) {
    throw new Error(`${label} must be a lowercase 64-character digest`);
  }
  return digest;
}

function normalizeBody(body) {
  if (body === undefined || body === null) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }
  return Buffer.from(JSON.stringify(body), "utf8");
}

function parseJsonBody(body, label) {
  const bytes = normalizeBody(body);
  if (bytes.length === 0) {
    return null;
  }
  if (bytes.length > MAX_JSON_BYTES) {
    throw new Error(`${label} exceeds the bounded JSON response size`);
  }
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }
}

function responseHeaders(response) {
  if (!response || response.headers === undefined) {
    return {};
  }
  if (response.headers instanceof Headers) {
    return Object.fromEntries(response.headers.entries());
  }
  if (response.headers && typeof response.headers === "object") {
    return Object.fromEntries(
      Object.entries(response.headers).map(([key, value]) => [
        key.toLowerCase(),
        String(value),
      ])
    );
  }
  return {};
}

async function readFetchBody(response, maxBytes, signal) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isSafeInteger(contentLength) && contentLength > maxBytes) {
    throw new Error(BOUNDED_RESPONSE_ERROR);
  }
  if (!response.body) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) {
      throw new Error(BOUNDED_RESPONSE_ERROR);
    }
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error("request aborted");
      }
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = Buffer.from(value);
      total += chunk.length;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error(BOUNDED_RESPONSE_ERROR);
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

function timeoutError(label) {
  return new Error(`${label} timed out`);
}

async function withTimeout(task, { parentSignal, timeoutMs, label }) {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromParent = () => {
    controller.abort();
  };
  if (parentSignal) {
    if (parentSignal.aborted) {
      throw new Error(OPERATION_ABORTED_ERROR);
    }
    parentSignal.addEventListener("abort", abortFromParent, { once: true });
  }
  const abortPromise = new Promise((_resolve, reject) => {
    controller.signal.addEventListener(
      "abort",
      () =>
        reject(
          timedOut ? timeoutError(label) : new Error(OPERATION_ABORTED_ERROR)
        ),
      { once: true }
    );
  });
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : undefined;
  try {
    return await Promise.race([task(controller.signal), abortPromise]);
  } catch (error) {
    if (timedOut) {
      throw timeoutError(label);
    }
    if (parentSignal?.aborted) {
      throw new Error(OPERATION_ABORTED_ERROR);
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
}

function defaultSleep(milliseconds, signal) {
  if (signal?.aborted) {
    return Promise.reject(new Error(OPERATION_ABORTED_ERROR));
  }
  if (milliseconds <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error(OPERATION_ABORTED_ERROR));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createGitHubClient({
  token,
  apiBase = process.env.GITHUB_API_URL || DEFAULT_GITHUB_API_URL,
  requestAdapter,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  maxResponseBytes = MAX_RESPONSE_BYTES,
}) {
  const normalizedToken =
    token === undefined ? undefined : requireString(token, "GH_TOKEN");
  if (!normalizedToken && !requestAdapter) {
    throw new Error("GH_TOKEN is required for GitHub network access");
  }
  const base = new URL(requireString(apiBase, "GitHub API URL"));
  if (base.protocol !== "https:" && base.hostname !== "localhost") {
    throw new Error("GitHub API URL must use HTTPS");
  }
  const adapter =
    requestAdapter ||
    (async ({ url, method, headers, body, signal }) => {
      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
        redirect: "follow",
      });
      return {
        status: response.status,
        headers: response.headers,
        body: await readFetchBody(response, maxResponseBytes, signal),
      };
    });

  return Object.freeze({
    async request({ method, path, body, signal }) {
      const normalizedMethod = requireString(
        method,
        "HTTP method"
      ).toUpperCase();
      const normalizedPath = requireString(path, "GitHub API path");
      if (!normalizedPath.startsWith("/repos/")) {
        throw new Error("GitHub API path must be repository-scoped");
      }
      const url = new URL(normalizedPath, base);
      const headers = {
        Accept: GITHUB_ACCEPT,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "6529seize-one-click-production",
      };
      if (normalizedToken) {
        headers.Authorization = `Bearer ${normalizedToken}`;
      }
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
      }
      let response;
      try {
        response = await withTimeout(
          (requestSignal) =>
            adapter({
              url: url.toString(),
              method: normalizedMethod,
              path: normalizedPath,
              headers,
              body,
              signal: requestSignal,
            }),
          {
            parentSignal: signal,
            timeoutMs: requestTimeoutMs,
            label: `${normalizedMethod} ${normalizedPath}`,
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.endsWith("timed out")) {
          throw error;
        }
        if (message === OPERATION_ABORTED_ERROR) {
          throw error;
        }
        throw new Error(
          `GitHub request failed for ${normalizedMethod} ${normalizedPath}`
        );
      }
      const status = Number(response?.status);
      if (!Number.isInteger(status) || status < 100 || status > 599) {
        throw new Error(
          `GitHub response has an invalid status for ${normalizedMethod} ${normalizedPath}`
        );
      }
      const bytes = normalizeBody(response.body);
      const declaredLength = Number(
        responseHeaders(response)["content-length"]
      );
      if (
        Number.isSafeInteger(declaredLength) &&
        declaredLength > maxResponseBytes
      ) {
        throw new Error(BOUNDED_RESPONSE_ERROR);
      }
      if (bytes.length > maxResponseBytes) {
        throw new Error(BOUNDED_RESPONSE_ERROR);
      }
      if (status < 200 || status >= 300) {
        throw new Error(
          `GitHub API returned HTTP ${status} for ${normalizedMethod} ${normalizedPath}`
        );
      }
      return Object.freeze({
        status,
        headers: responseHeaders(response),
        body: bytes,
      });
    },
  });
}

async function getJson(client, path, signal, label) {
  const response = await client.request({ method: "GET", path, signal });
  return parseJsonBody(response.body, label || `GET ${path}`);
}

async function postJson(client, path, body, signal) {
  return client.request({ method: "POST", path, body, signal });
}

function repositoryPath(repository, suffix) {
  return `/repos/${repository}${suffix}`;
}

async function resolveWorkflowId(client, repository, workflowPath, signal) {
  const matches = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getJson(
      client,
      repositoryPath(
        repository,
        `/actions/workflows?per_page=${MAX_PAGE_SIZE}&page=${page}`
      ),
      signal,
      "workflow inventory"
    );
    if (!isPlainObject(response) || !Array.isArray(response.workflows)) {
      throw new Error("workflow inventory must contain a workflows array");
    }
    if (response.workflows.length > MAX_PAGE_SIZE) {
      throw new Error("workflow inventory page exceeds the bounded page size");
    }
    matches.push(
      ...response.workflows.filter(
        (workflow) =>
          isPlainObject(workflow) &&
          workflow.path === workflowPath &&
          (workflow.repository === undefined ||
            (isPlainObject(workflow.repository) &&
              workflow.repository.full_name === repository))
      )
    );
    if (response.workflows.length < MAX_PAGE_SIZE) {
      break;
    }
    if (page === MAX_PAGES) {
      throw new Error(
        "workflow inventory pagination exceeded the bounded page count"
      );
    }
  }
  if (matches.length !== 1) {
    throw new Error(
      `fixed workflow path must resolve to exactly one workflow; found ${matches.length}`
    );
  }
  return requireWorkflowId(matches[0].id, "workflow metadata ID");
}

async function listWorkflowRuns(client, repository, workflowId, signal) {
  const runs = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getJson(
      client,
      repositoryPath(
        repository,
        `/actions/workflows/${workflowId}/runs?event=${DISPATCH_EVENT}&branch=${MAIN_BRANCH}&per_page=${MAX_PAGE_SIZE}&page=${page}`
      ),
      signal,
      "workflow run list"
    );
    if (!isPlainObject(response) || !Array.isArray(response.workflow_runs)) {
      throw new Error("workflow run list must contain a workflow_runs array");
    }
    if (response.workflow_runs.length > MAX_PAGE_SIZE) {
      throw new Error("workflow run list page exceeds the bounded page size");
    }
    runs.push(...response.workflow_runs);
    if (response.workflow_runs.length < MAX_PAGE_SIZE) {
      return { workflow_runs: runs };
    }
  }
  throw new Error("workflow run pagination exceeded the bounded page count");
}

async function listRunArtifacts(client, repository, runId, signal) {
  const artifacts = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await getJson(
      client,
      repositoryPath(
        repository,
        `/actions/runs/${runId}/artifacts?per_page=${MAX_PAGE_SIZE}&page=${page}`
      ),
      signal,
      "artifact metadata list"
    );
    if (!isPlainObject(response) || !Array.isArray(response.artifacts)) {
      throw new Error("artifact metadata must contain an artifacts array");
    }
    if (response.artifacts.length > MAX_PAGE_SIZE) {
      throw new Error("artifact metadata page exceeds the bounded page size");
    }
    artifacts.push(...response.artifacts);
    if (response.artifacts.length < MAX_PAGE_SIZE) {
      return artifacts;
    }
  }
  throw new Error("artifact pagination exceeded the bounded page count");
}

async function getWorkflowRun(client, repository, runId, signal) {
  return getJson(
    client,
    repositoryPath(repository, `/actions/runs/${runId}`),
    signal,
    "workflow run metadata"
  );
}

async function downloadArtifactZip(client, repository, artifactId, signal) {
  const response = await client.request({
    method: "GET",
    path: repositoryPath(repository, `/actions/artifacts/${artifactId}/zip`),
    signal,
  });
  if (response.body.length > MAX_SELECTION_ARCHIVE_BYTES) {
    throw new Error(
      "selection artifact archive exceeds the bounded archive size"
    );
  }
  return response.body;
}

function expectedArtifactName(targetSha, operationId) {
  return `production-frontend-${targetSha}-${operationId}`;
}

function childSelection({
  workflowRuns,
  repository,
  workflowPath,
  workflowId,
  operationId,
  targetSha,
  artifact,
}) {
  return selectTrustedWorkflowRun({
    workflowRunsJson: workflowRuns,
    repository,
    workflowPath,
    workflowId,
    operationId,
    targetSha,
    sourceArtifact: artifact,
  });
}

function runKey(run) {
  return `${run.id}:${run.run_attempt}`;
}

function failedRunKeys(selection) {
  return new Set(
    (selection.failed_terminal_runs || []).map((run) => runKey(run))
  );
}

function childFailure(stage, selection, key) {
  const failed = (selection.failed_terminal_runs || []).find(
    (run) => runKey(run) === key
  );
  if (failed) {
    throw new Error(
      `${stage} child ${failed.id} attempt ${failed.run_attempt} failed terminally`
    );
  }
  throw new Error(`${stage} child failed terminally`);
}

async function dispatchChild({
  client,
  repository,
  workflowId,
  workflowKind,
  operationId,
  targetSha,
  artifact,
  signal,
}) {
  const inputs =
    workflowKind === "builder"
      ? {
          target_sha: targetSha,
          operation_id: operationId,
        }
      : {
          target_sha: targetSha,
          operation_id: operationId,
          artifact_run_id: artifact.run_id,
          artifact_run_attempt: String(artifact.run_attempt),
          artifact_id: artifact.id,
          artifact_api_digest: artifact.api_digest,
          artifact_name: artifact.name,
          artifact_workflow_sha: artifact.workflow_sha,
        };
  await postJson(
    client,
    repositoryPath(repository, `/actions/workflows/${workflowId}/dispatches`),
    { ref: MAIN_BRANCH, inputs },
    signal
  );
}

async function sleepBeforeNextPoll({ sleep, milliseconds, signal }) {
  await sleep(milliseconds, signal);
}

function processSelectedChild(selection, state, workflowKind) {
  const currentKey = runKey(selection.run);
  if (state.observedKey && currentKey !== state.observedKey) {
    throw new Error(
      `${workflowKind} child identity changed after an eligible run was observed`
    );
  }
  state.observedKey ||= currentKey;
  if (selection.state === "reusable") {
    return true;
  }
  if (selection.state === "active") {
    return false;
  }
  throw new Error(
    `${workflowKind} child returned an unsupported eligible state`
  );
}

function processAbsentChild(selection, state, workflowKind) {
  const failures = failedRunKeys(selection);
  if (state.observedKey && failures.has(state.observedKey)) {
    childFailure(workflowKind, selection, state.observedKey);
  }
  if (state.dispatchIssued) {
    const newlyFailed = [...failures].find(
      (key) => !state.preDispatchFailed.has(key)
    );
    if (newlyFailed) {
      childFailure(workflowKind, selection, newlyFailed);
    }
    return false;
  }
  if (state.observedKey) {
    return false;
  }
  state.preDispatchFailed = failures;
  return true;
}

function assertPollBudget({
  signal,
  now,
  deadline,
  polls,
  maxPolls,
  workflowKind,
}) {
  if (signal?.aborted) {
    throw new Error(OPERATION_ABORTED_ERROR);
  }
  if (now() >= deadline) {
    throw new Error(`${workflowKind} child polling timed out`);
  }
  if (polls >= maxPolls) {
    throw new Error(
      `${workflowKind} child polling exceeded the bounded poll count`
    );
  }
}

async function resolveChild({
  client,
  repository,
  workflowKind,
  workflowPath,
  workflowId,
  operationId,
  targetSha,
  artifact,
  deadline,
  pollIntervalMs,
  maxPolls,
  sleep,
  now,
  signal,
}) {
  const state = {
    dispatchIssued: false,
    preDispatchFailed: new Set(),
    observedKey: null,
  };
  let polls = 0;

  while (true) {
    assertPollBudget({ signal, now, deadline, polls, maxPolls, workflowKind });
    polls += 1;
    const runs = await listWorkflowRuns(client, repository, workflowId, signal);
    const selection = childSelection({
      workflowRuns: runs,
      repository,
      workflowPath,
      workflowId,
      operationId,
      targetSha,
      artifact,
    });

    if (
      selection.result === "selected" &&
      processSelectedChild(selection, state, workflowKind)
    ) {
      return selection;
    }

    if (
      selection.result !== "selected" &&
      processAbsentChild(selection, state, workflowKind)
    ) {
      await dispatchChild({
        client,
        repository,
        workflowId,
        workflowKind,
        operationId,
        targetSha,
        artifact,
        signal,
      });
      state.dispatchIssued = true;
    }
    await sleepBeforeNextPoll({ sleep, milliseconds: pollIntervalMs, signal });
  }
}

function artifactCandidate(artifacts, name, label) {
  const matches = artifacts.filter(
    (artifact) => isPlainObject(artifact) && artifact.name === name
  );
  if (matches.length !== 1) {
    throw new Error(
      `${label} must contain exactly one canonical artifact; found ${matches.length}`
    );
  }
  return matches[0];
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function findEndOfCentralDirectory(zip) {
  if (zip.length < 22) {
    throw new Error("selection artifact is not a supported ZIP archive");
  }
  const minimum = Math.max(0, zip.length - 22 - 65_535);
  for (let offset = zip.length - 22; offset >= minimum; offset -= 1) {
    if (zip.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("selection artifact is not a supported ZIP archive");
}

function readZipCentralEntry(zip, offset) {
  if (offset + 46 > zip.length || zip.readUInt32LE(offset) !== 0x02014b50) {
    throw new Error("selection artifact ZIP entry is invalid");
  }
  const flags = zip.readUInt16LE(offset + 8);
  const method = zip.readUInt16LE(offset + 10);
  const expectedCrc = zip.readUInt32LE(offset + 16);
  const compressedSize = zip.readUInt32LE(offset + 20);
  const uncompressedSize = zip.readUInt32LE(offset + 24);
  const nameLength = zip.readUInt16LE(offset + 28);
  const extraLength = zip.readUInt16LE(offset + 30);
  const commentLength = zip.readUInt16LE(offset + 32);
  const localOffset = zip.readUInt32LE(offset + 42);
  const nameStart = offset + 46;
  const nameEnd = nameStart + nameLength;
  const entryName = zip.subarray(nameStart, nameEnd).toString("utf8");
  if (
    !["selection.json", "SHA256SUMS"].includes(entryName) ||
    entryName.includes("..") ||
    entryName.startsWith("/") ||
    entryName.includes("\\")
  ) {
    throw new Error("selection artifact contains an unexpected ZIP entry");
  }
  if (flags & 0x1) {
    throw new Error("selection artifact ZIP entry is encrypted");
  }
  if (method !== 0 && method !== 8) {
    throw new Error("selection artifact ZIP compression is unsupported");
  }
  if (uncompressedSize > MAX_SELECTION_JSON_BYTES) {
    throw new Error("selection.json exceeds the bounded JSON size");
  }
  if (
    localOffset + 30 > zip.length ||
    zip.readUInt32LE(localOffset) !== 0x04034b50
  ) {
    throw new Error("selection artifact ZIP local entry is invalid");
  }
  const localNameLength = zip.readUInt16LE(localOffset + 26);
  const localExtraLength = zip.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + localNameLength + localExtraLength;
  const dataEnd = dataStart + compressedSize;
  if (dataEnd > zip.length) {
    throw new Error("selection artifact ZIP entry exceeds the archive");
  }
  const compressed = zip.subarray(dataStart, dataEnd);
  const bytes = method === 0 ? compressed : zlib.inflateRawSync(compressed);
  if (bytes.length !== uncompressedSize || crc32(bytes) !== expectedCrc) {
    throw new Error("selection artifact ZIP entry checksum is invalid");
  }
  return {
    name: entryName,
    bytes,
    nextOffset: nameEnd + extraLength + commentLength,
  };
}

function extractSelectionJson(zip) {
  if (!Buffer.isBuffer(zip) || zip.length > MAX_SELECTION_ARCHIVE_BYTES) {
    throw new Error(
      "selection artifact archive exceeds the bounded archive size"
    );
  }
  const eocd = findEndOfCentralDirectory(zip);
  const entryCount = zip.readUInt16LE(eocd + 10);
  const centralSize = zip.readUInt32LE(eocd + 12);
  const centralOffset = zip.readUInt32LE(eocd + 16);
  if (entryCount === 0 || centralOffset + centralSize > zip.length) {
    throw new Error("selection artifact ZIP central directory is invalid");
  }
  let offset = centralOffset;
  let selectionBytes = null;
  for (let index = 0; index < entryCount; index += 1) {
    const entry = readZipCentralEntry(zip, offset);
    if (entry.name === "selection.json") {
      if (selectionBytes) {
        throw new Error(
          "selection artifact contains duplicate selection.json entries"
        );
      }
      selectionBytes = entry.bytes;
    }
    offset = entry.nextOffset;
  }
  if (!selectionBytes) {
    throw new Error("selection artifact does not contain selection.json");
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(selectionBytes)
    );
  } catch {
    throw new Error("selection.json is not valid UTF-8 JSON");
  }
}

async function validateBuilderArtifact({
  client,
  repository,
  workflowId,
  operationId,
  targetSha,
  selected,
  signal,
}) {
  const rawRun = await getWorkflowRun(
    client,
    repository,
    selected.run.id,
    signal
  );
  const artifacts = await listRunArtifacts(
    client,
    repository,
    selected.run.id,
    signal
  );
  const name = expectedArtifactName(targetSha, operationId);
  const candidate = artifactCandidate(
    artifacts,
    name,
    "builder artifact metadata"
  );
  const artifactId = requireRunId(candidate.id, "builder artifact ID");
  const artifactApiDigest = requireDigest(
    candidate.digest,
    "builder artifact API digest"
  );
  const validated = validateArtifactMetadata({
    metadataBundle: { run: rawRun, artifacts },
    selectedRun: selected.run,
    repository,
    workflowPath: BUILDER_WORKFLOW_PATH,
    workflowId,
    operationId,
    targetSha,
    artifactRunId: selected.run.id,
    artifactRunAttempt: selected.run.run_attempt,
    artifactId,
    artifactName: name,
    artifactApiDigest,
  });
  return Object.freeze({
    id: validated.artifact.id,
    name: validated.artifact.name,
    api_digest: validated.artifact.digest,
    run_id: validated.artifact.workflow_run_id,
    run_attempt: validated.artifact.workflow_run_attempt,
    workflow_sha: validated.producer_run.head_sha,
    selected_run: validated.producer_run,
  });
}

async function validateVerifierSelection({
  client,
  repository,
  workflowId,
  operationId,
  targetSha,
  selected,
  sourceArtifact,
  signal,
}) {
  const rawRun = await getWorkflowRun(
    client,
    repository,
    selected.run.id,
    signal
  );
  const artifacts = await listRunArtifacts(
    client,
    repository,
    selected.run.id,
    signal
  );
  const name = expectedSelectionArtifactName(
    targetSha,
    selected.run.run_attempt
  );
  const candidate = artifactCandidate(
    artifacts,
    name,
    "verifier selection artifact metadata"
  );
  const artifactId = requireRunId(candidate.id, "selection artifact ID");
  const artifactApiDigest = requireDigest(
    candidate.digest,
    "selection artifact API digest"
  );
  const selection = extractSelectionJson(
    await downloadArtifactZip(client, repository, artifactId, signal)
  );
  const validated = validateSelectionArtifactMetadata({
    metadataBundle: { run: rawRun, artifacts, selection },
    selectedRun: selected.run,
    repository,
    workflowPath: VERIFIER_WORKFLOW_PATH,
    workflowId,
    operationId,
    targetSha,
    verifierRunId: selected.run.id,
    verifierRunAttempt: selected.run.run_attempt,
    selectionArtifactId: artifactId,
    selectionArtifactName: name,
    selectionArtifactApiDigest: artifactApiDigest,
    sourceArtifact,
  });
  const selectionDigest = requireHexDigest(
    selection.selection_digest,
    "selection_digest"
  );
  return Object.freeze({
    run_id: validated.selection_artifact.workflow_run_id,
    run_attempt: validated.selection_artifact.workflow_run_attempt,
    id: validated.selection_artifact.id,
    name: validated.selection_artifact.name,
    api_digest: validated.selection_artifact.digest,
    selection_digest: selectionDigest,
    workflow_sha: validated.verifier_run.head_sha,
    selected_run: validated.verifier_run,
  });
}

function outputRecord({
  repository,
  targetSha,
  operationId,
  parentRunId,
  parentRunAttempt,
  builder,
  verifier,
  selection,
}) {
  return Object.freeze({
    contract: CONTRACT,
    repository,
    target_sha: targetSha,
    operation_id: operationId,
    parent_run_id: parentRunId,
    parent_run_attempt: parentRunAttempt,
    builder_run_id: builder.run_id,
    builder_run_attempt: builder.run_attempt,
    builder_workflow_sha: builder.workflow_sha,
    verifier_run_id: verifier.run_id,
    verifier_run_attempt: verifier.run_attempt,
    verifier_workflow_sha: verifier.workflow_sha,
    artifact_id: builder.id,
    artifact_name: builder.name,
    artifact_api_digest: builder.api_digest,
    selection_artifact_run_id: selection.run_id,
    selection_artifact_run_attempt: selection.run_attempt,
    selection_artifact_id: selection.id,
    selection_artifact_name: selection.name,
    selection_artifact_api_digest: selection.api_digest,
    selection_digest: selection.selection_digest,
  });
}

function boundedOutput(value) {
  const output = canonicalJson(value);
  if (Buffer.byteLength(output, "utf8") > MAX_OUTPUT_BYTES) {
    throw new Error("controller output exceeds the bounded output size");
  }
  return `${output}\n`;
}

function writeOutputs(record, { outputFile, githubOutputFile }) {
  const canonical = boundedOutput(record);
  if (outputFile) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies an explicit bounded output path.
    fs.writeFileSync(outputFile, canonical, { encoding: "utf8" });
  }
  if (githubOutputFile) {
    const lines = OUTPUT_FIELDS.map((field) => {
      const value = record[field];
      if (
        value === undefined ||
        value === null ||
        String(value).includes("\n")
      ) {
        throw new Error(`missing or unsafe GITHUB_OUTPUT field: ${field}`);
      }
      return `${field}=${String(value)}`;
    });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- GITHUB_OUTPUT is the explicit GitHub Actions output file.
    fs.appendFileSync(githubOutputFile, `${lines.join("\n")}\n`, {
      encoding: "utf8",
    });
  }
  return canonical;
}

async function runOneClickProductionChildren(options) {
  const repository = requireRepository(options.repository);
  const targetSha = requireSha(options.targetSha, "targetSha");
  const parentRunId = requireRunId(options.parentRunId, "parentRunId");
  const parentRunAttempt = requireRunAttempt(
    options.parentRunAttempt,
    "parentRunAttempt"
  );
  const operationId = requireString(options.operationId, "operationId");
  const identity = validateOperationIdentity({
    parentRunId,
    targetSha,
  });
  if (operationId !== identity.operation_id) {
    throw new Error("operationId is not derived from the parent run ID");
  }
  validateOperationBinding({ operationId, targetSha });
  const client =
    options.client ||
    createGitHubClient({
      token: options.token ?? process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN,
      apiBase: options.apiBase,
      requestAdapter: options.requestAdapter,
      requestTimeoutMs: options.requestTimeoutMs,
      maxResponseBytes: options.maxResponseBytes,
    });
  if (!client || typeof client.request !== "function") {
    throw new Error("a GitHub client with a request method is required");
  }
  const now = options.now || Date.now;
  const sleep = options.sleep || defaultSleep;
  const operationTimeoutMs =
    options.operationTimeoutMs ?? DEFAULT_OPERATION_TIMEOUT_MS;
  if (
    !Number.isFinite(operationTimeoutMs) ||
    operationTimeoutMs <= 0 ||
    operationTimeoutMs > DEFAULT_OPERATION_TIMEOUT_MS
  ) {
    throw new Error(
      "operationTimeoutMs must be within the 60-minute production ceiling"
    );
  }
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 0) {
    throw new Error("pollIntervalMs must be a non-negative number");
  }
  const maxPolls =
    options.maxPolls ??
    Math.max(
      1,
      Math.ceil(operationTimeoutMs / Math.max(pollIntervalMs, 1)) + 2
    );
  if (!Number.isSafeInteger(maxPolls) || maxPolls < 1) {
    throw new Error("maxPolls must be a positive integer");
  }
  const deadline = now() + operationTimeoutMs;
  const builderWorkflowId = await resolveWorkflowId(
    client,
    repository,
    WORKFLOW_PATHS.builder,
    options.signal
  );
  const verifierWorkflowId = await resolveWorkflowId(
    client,
    repository,
    WORKFLOW_PATHS.verifier,
    options.signal
  );
  const builderRun = await resolveChild({
    client,
    repository,
    workflowKind: "builder",
    workflowPath: WORKFLOW_PATHS.builder,
    workflowId: builderWorkflowId,
    operationId,
    targetSha,
    deadline,
    pollIntervalMs,
    maxPolls,
    sleep,
    now,
    signal: options.signal,
  });
  const builderArtifact = await validateBuilderArtifact({
    client,
    repository,
    workflowId: builderWorkflowId,
    operationId,
    targetSha,
    selected: builderRun,
    signal: options.signal,
  });
  const verifierRun = await resolveChild({
    client,
    repository,
    workflowKind: "verifier",
    workflowPath: WORKFLOW_PATHS.verifier,
    workflowId: verifierWorkflowId,
    operationId,
    targetSha,
    artifact: builderArtifact,
    deadline,
    pollIntervalMs,
    maxPolls,
    sleep,
    now,
    signal: options.signal,
  });
  const selectionArtifact = await validateVerifierSelection({
    client,
    repository,
    workflowId: verifierWorkflowId,
    operationId,
    targetSha,
    selected: verifierRun,
    sourceArtifact: builderArtifact,
    signal: options.signal,
  });
  const record = outputRecord({
    repository,
    targetSha,
    operationId,
    parentRunId,
    parentRunAttempt,
    builder: builderArtifact,
    verifier: selectionArtifact,
    selection: selectionArtifact,
  });
  const canonical = writeOutputs(record, {
    outputFile: options.outputFile,
    githubOutputFile: options.githubOutputFile,
  });
  return Object.freeze({ record, canonical });
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

async function runCli(argv) {
  const args = parseArgs(argv);
  const result = await runOneClickProductionChildren({
    repository: requireArgument(args, "repository"),
    targetSha: requireArgument(args, "target_sha"),
    operationId: requireArgument(args, "operation_id"),
    parentRunId: requireArgument(args, "parent_run_id"),
    parentRunAttempt: requireArgument(args, "parent_run_attempt"),
    outputFile: args.output_file,
    githubOutputFile: args.github_output || process.env.GITHUB_OUTPUT,
  });
  process.stdout.write(result.canonical);
}

if (require.main === module) {
  (async () => {
    try {
      await runCli(process.argv.slice(2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      process.stderr.write(`run-one-click-production-children: ${message}\n`);
      process.exitCode = 1;
    }
  })();
}

module.exports = {
  CONTRACT,
  DEFAULT_OPERATION_TIMEOUT_MS,
  GITHUB_API_VERSION,
  OUTPUT_FIELDS,
  WORKFLOW_PATHS,
  canonicalJson,
  createGitHubClient,
  extractSelectionJson,
  runOneClickProductionChildren,
};
