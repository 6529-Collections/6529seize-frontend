"use strict";

/* eslint-disable max-lines, max-lines-per-function */

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { parseArgs } = require("./cli-args.cjs");

const ARTIFACT_CONTRACT = "production-prebuild-v2";
const ARTIFACT_MANIFEST_REPOSITORY = "frontend";
const ARTIFACT_NAME_PREFIX = "production-frontend-";
const ARTIFACT_WORKFLOW_PATH =
  ".github/workflows/production-build-artifact.yml";
const MAX_PACKAGE_BYTES = 500 * 1024 * 1024;
const SELECTION_ARTIFACT_NAME_PREFIX =
  "one-click-production-selection-";
const SELECTION_CONTRACT = "production-artifact-selection-v1";
const SELECTION_SCHEMA_VERSION = 1;
const VERIFIER_WORKFLOW_PATH =
  ".github/workflows/production-artifact-verifier.yml";
const EXPECTED_ARTIFACT_FILES = Object.freeze([
  "SHA256SUMS",
  "artifact-portability.json",
  "manifest.json",
  "target/package.zip",
]);
const EXPECTED_ARTIFACT_DIRECTORIES = new Set(["target"]);

const SHA_RE = /^[a-f0-9]{40}$/u;
const DIGEST_RE = /^sha256:[a-f0-9]{64}$/u;
const HEX_DIGEST_RE = /^[a-f0-9]{64}$/u;
const ID_RE = /^[1-9][0-9]{0,19}$/u;
const OPERATION_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/u;
const REPOSITORY_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function requireRecord(value, label) {
  assert(isRecord(value), `${label} must be an object`);
  return value;
}

function requireString(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} is required`);
  return value;
}

function normalizeId(value, label) {
  let normalized = "";
  if (typeof value === "string") {
    normalized = value;
  } else if (typeof value === "number" && Number.isSafeInteger(value)) {
    normalized = String(value);
  }
  assert(ID_RE.test(normalized), `${label} must be a positive decimal ID`);
  return normalized;
}

function requireSha(value, label) {
  const normalized = requireString(value, label);
  assert(SHA_RE.test(normalized), `${label} must be a lowercase 40-hex SHA`);
  return normalized;
}

function requireHexDigest(value, label) {
  const normalized = requireString(value, label);
  assert(
    HEX_DIGEST_RE.test(normalized),
    `${label} must be a lowercase 64-hex SHA256 digest`
  );
  return normalized;
}

function requireApiDigest(value, label) {
  const normalized = requireString(value, label);
  assert(
    DIGEST_RE.test(normalized),
    `${label} must be sha256:<64 lowercase hex characters>`
  );
  return normalized;
}

function requireOperationId(value, label = "operation_id") {
  const normalized = requireString(value, label);
  assert(
    OPERATION_ID_RE.test(normalized),
    `${label} must use the bounded operation-id character set`
  );
  return normalized;
}

function requireRepository(value) {
  const repository = requireString(value, "repository");
  assert(REPOSITORY_RE.test(repository), "repository must be owner/name");
  return repository;
}

function expectedArtifactName(targetSha, operationId) {
  const name = `${ARTIFACT_NAME_PREFIX}${targetSha}-${operationId}`;
  assert(
    name.length <= 180,
    "artifact_name exceeds the builder's 180-character limit"
  );
  return name;
}

function expectedSelectionArtifactName(targetSha, verifierRunAttempt) {
  const name = `${SELECTION_ARTIFACT_NAME_PREFIX}${targetSha}-a${verifierRunAttempt}`;
  assert(
    name.length <= 256,
    "selection_artifact_name exceeds GitHub's 256-character limit"
  );
  return name;
}

function artifactOperationIdFromName(artifactName, targetSha) {
  const prefix = ARTIFACT_NAME_PREFIX;
  const targetMarker = `${prefix}${targetSha}-`;
  assert(
    artifactName.startsWith(targetMarker),
    "artifact_name must bind an operation_id and target_sha"
  );
  const operationId = artifactName.slice(targetMarker.length);
  return requireOperationId(operationId, "artifact_name operation_id");
}

function requirePositiveInteger(value, label) {
  let normalized = NaN;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    normalized = value;
  } else if (typeof value === "string" && /^[1-9][0-9]*$/u.test(value)) {
    normalized = Number(value);
  }
  assert(Number.isSafeInteger(normalized) && normalized > 0, `${label} must be a positive integer`);
  return normalized;
}

function requireNonNegativeInteger(value, label) {
  let normalized = NaN;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    normalized = value;
  } else if (typeof value === "string" && /^[0-9]+$/u.test(value)) {
    normalized = Number(value);
  }
  assert(
    Number.isSafeInteger(normalized) && normalized >= 0,
    `${label} must be a non-negative integer`
  );
  return normalized;
}

function readJson(filePath, label) {
  let raw;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies exact metadata and artifact paths in the runner temp directory.
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`unable to read ${label}: ${error.message}`);
  }

  try {
    return requireRecord(JSON.parse(raw), label);
  } catch (error) {
    if (error instanceof SyntaxError) {
      fail(`${label} is not valid JSON`);
    }
    throw error;
  }
}

function readTextFile(filePath, label) {
  let raw;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies exact metadata paths in the runner temp directory.
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`unable to read ${label}: ${error.message}`);
  }
  return raw;
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies exact artifact paths in the runner temp directory.
    return sha256Buffer(fs.readFileSync(filePath));
  } catch (error) {
    fail(`unable to hash ${filePath}: ${error.message}`);
  }
}

function writeTextFile(filePath, contents) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies output paths in the runner temp directory.
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies output paths in the runner temp directory.
    fs.writeFileSync(filePath, contents);
  } catch (error) {
    fail(`unable to write ${filePath}: ${error.message}`);
  }
}

function writeJson(filePath, value) {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function validateArchiveMemberPath(member) {
  assert(
    typeof member === "string" && member.length > 0,
    "archive member path must be non-empty"
  );
  assert(
    !/[\u0000-\u001f\u007f]/u.test(member),
    "archive member path contains a control character"
  );
  assert(
    !member.includes("\\") &&
      !member.startsWith("/") &&
      !/^[A-Za-z]:/u.test(member),
    `archive member path is not a portable relative path: ${member}`
  );

  const isDirectory = member.endsWith("/");
  const relativePath = isDirectory ? member.slice(0, -1) : member;
  assert(relativePath.length > 0, "archive member path cannot be the root directory");
  const segments = relativePath.split("/");
  assert(
    segments.every((segment) => segment.length > 0 && segment !== "." && segment !== ".."),
    `archive member path contains an empty or traversal segment: ${member}`
  );
  assert(
    path.posix.normalize(relativePath) === relativePath,
    `archive member path is not normalized: ${member}`
  );

  if (isDirectory) {
    assert(
      EXPECTED_ARTIFACT_DIRECTORIES.has(relativePath),
      `archive member directory is outside the closed artifact root: ${member}`
    );
  } else {
    assert(
      EXPECTED_ARTIFACT_FILES.includes(relativePath),
      `archive member is outside the closed artifact root: ${member}`
    );
  }

  return { isDirectory, relativePath };
}

function validateArchiveMembers(memberList) {
  assert(
    typeof memberList === "string" && memberList.length > 0,
    "archive member list is required"
  );
  const lines = memberList.split("\n");
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  assert(lines.length > 0, "archive member list is empty");

  const seen = new Set();
  for (const member of lines) {
    const normalized = validateArchiveMemberPath(member);
    const key = `${normalized.isDirectory ? "directory" : "file"}:${normalized.relativePath}`;
    assert(!seen.has(key), `duplicate archive member: ${member}`);
    seen.add(key);
  }

  for (const requiredFile of EXPECTED_ARTIFACT_FILES) {
    assert(
      seen.has(`file:${requiredFile}`),
      `archive is missing required member: ${requiredFile}`
    );
  }
  return [...seen];
}

function validateVerifierInputs(options) {
  const targetSha = requireSha(options.targetSha, "target_sha");
  const operationId = requireOperationId(options.operationId);
  const repository = requireRepository(options.repository);
  const artifactRunId = normalizeId(options.artifactRunId, "artifact_run_id");
  const artifactRunAttempt = requirePositiveInteger(
    options.artifactRunAttempt,
    "artifact_run_attempt"
  );
  const artifactId = normalizeId(options.artifactId, "artifact_id");
  const artifactApiDigest = requireApiDigest(
    options.artifactApiDigest,
    "artifact_api_digest"
  );
  const artifactName = requireString(options.artifactName, "artifact_name");
  const artifactOperationId = artifactOperationIdFromName(artifactName, targetSha);

  return {
    artifactId,
    artifactApiDigest,
    artifactName,
    artifactOperationId,
    artifactRunId,
    artifactRunAttempt,
    operationId,
    repository,
    targetSha,
  };
}

function validateVerifierSource(options) {
  const verifierRunId = normalizeId(
    options.verifierRunId,
    "verifier_run_id"
  );
  const verifierRunAttempt = requirePositiveInteger(
    options.verifierRunAttempt,
    "verifier_run_attempt"
  );
  const verifierWorkflowSha = requireSha(
    options.verifierWorkflowSha,
    "verifier_workflow_sha"
  );
  const verifierRef = requireString(options.verifierRef, "verifier_ref");
  assert(
    verifierRef === "refs/heads/main",
    "verifier_ref must be refs/heads/main"
  );
  return {
    verifierRef,
    verifierRunAttempt,
    verifierRunId,
    verifierWorkflowSha,
  };
}

function assertRepositoryIdentity(value, expectedRepository, label) {
  assert(
    isRecord(value) && value.full_name === expectedRepository,
    `${label} must identify ${expectedRepository}`
  );
}

function verifyRunMetadata(runMetadata, expected) {
  requireRecord(runMetadata, "workflow run metadata");
  assert(
    normalizeId(runMetadata.id, "workflow run metadata.id") ===
      expected.artifactRunId,
    "workflow run metadata ID does not match artifact_run_id"
  );
  assert(
    requirePositiveInteger(
      runMetadata.run_attempt,
      "workflow run metadata.run_attempt"
    ) === expected.artifactRunAttempt,
    "workflow run metadata run_attempt does not match artifact_run_attempt"
  );
  assert(
    runMetadata.path === ARTIFACT_WORKFLOW_PATH,
    `artifact run must come from ${ARTIFACT_WORKFLOW_PATH}`
  );
  const runHeadSha = requireSha(
    runMetadata.head_sha,
    "workflow run metadata.head_sha"
  );
  assert(
    runMetadata.status === "completed" && runMetadata.conclusion === "success",
    "artifact workflow run must be completed successfully"
  );
  assert(
    runMetadata.event === "workflow_dispatch" ||
      runMetadata.event === "workflow_call",
    "artifact workflow run must be workflow_dispatch or workflow_call"
  );
  assert(
    runMetadata.head_branch === "main",
    "artifact workflow run must target the main branch"
  );
  assertRepositoryIdentity(
    runMetadata.repository,
    expected.repository,
    "artifact workflow repository"
  );
  assertRepositoryIdentity(
    runMetadata.head_repository,
    expected.repository,
    "artifact workflow head repository"
  );
  return { runHeadSha };
}

function verifyArtifactMetadata(artifactMetadata, expected) {
  requireRecord(artifactMetadata, "artifact metadata");
  const artifactName = requireString(
    artifactMetadata.name,
    "artifact metadata.name"
  );
  assert(
    normalizeId(artifactMetadata.id, "artifact metadata.id") ===
      expected.artifactId,
    "artifact metadata ID does not match artifact_id"
  );
  if (expected.artifactName !== undefined) {
    assert(
      artifactName === expected.artifactName,
      "artifact metadata name does not match artifact_name"
    );
  }
  assert(
    artifactMetadata.expired === false,
    "the exact artifact is expired or has no explicit non-expired state"
  );
  const size = requirePositiveInteger(
    artifactMetadata.size_in_bytes,
    "artifact metadata.size_in_bytes"
  );
  const digest = requireApiDigest(
    artifactMetadata.digest,
    "artifact metadata.digest"
  );
  assert(
    digest === expected.artifactApiDigest,
    "artifact metadata.digest does not match the explicit controller artifact digest"
  );
  const workflowRun = requireRecord(
    artifactMetadata.workflow_run,
    "artifact metadata.workflow_run"
  );
  assert(
    normalizeId(workflowRun.id, "artifact metadata.workflow_run.id") ===
      expected.artifactRunId,
    "artifact metadata is not attached to artifact_run_id"
  );
  assert(
    workflowRun.head_branch === "main" &&
      typeof workflowRun.head_sha === "string",
    "artifact metadata source identity is incomplete"
  );
  assert(
    requireSha(workflowRun.head_sha, "artifact metadata.workflow_run.head_sha") ===
      expected.runHeadSha,
    "artifact metadata workflow head_sha does not match the exact run attempt"
  );
  if (workflowRun.run_attempt !== undefined) {
    assert(
      requirePositiveInteger(
        workflowRun.run_attempt,
        "artifact metadata.workflow_run.run_attempt"
      ) === expected.artifactRunAttempt,
      "artifact metadata run_attempt does not match artifact_run_attempt"
    );
  }

  return {
    digest,
    name: artifactName,
    operationId: artifactOperationIdFromName(
      artifactName,
      expected.targetSha
    ),
    size,
  };
}

function verifyMetadata(options) {
  const expected = validateVerifierInputs(options);
  const runMetadata = readJson(
    options.runMetadataFile,
    "workflow run metadata"
  );
  const artifactMetadata = readJson(
    options.artifactMetadataFile,
    "artifact metadata"
  );
  const run = verifyRunMetadata(runMetadata, expected);
  const artifact = verifyArtifactMetadata(artifactMetadata, {
    ...expected,
    runHeadSha: run.runHeadSha,
  });
  return {
    artifact,
    artifactMetadata,
    expected: {
      ...expected,
      artifactName: artifact.name,
      artifactOperationId: artifact.operationId,
      runHeadSha: run.runHeadSha,
    },
    runMetadata,
  };
}

function verifyProtectedMainRef(refMetadata) {
  requireRecord(refMetadata, "protected main ref metadata");
  assert(
    refMetadata.ref === "refs/heads/main",
    "protected main ref metadata must be refs/heads/main"
  );
  const object = requireRecord(
    refMetadata.object,
    "protected main ref metadata.object"
  );
  assert(
    object.type === "commit",
    "protected main ref must resolve to a commit"
  );
  return requireSha(object.sha, "protected main ref object.sha");
}

function verifyCommitAncestryCompare(
  compareMetadata,
  expectedBaseSha,
  currentMainSha,
  label
) {
  requireRecord(compareMetadata, `${label} compare metadata`);
  const status = requireString(
    compareMetadata.status,
    `${label} compare status`
  );
  assert(
    status === "identical" || status === "ahead",
    `${label} is not an ancestor of current protected main`
  );

  const baseCommit = requireRecord(
    compareMetadata.base_commit,
    `${label} compare base_commit`
  );
  assert(
    requireSha(baseCommit.sha, `${label} compare base_commit.sha`) ===
      expectedBaseSha,
    `${label} compare base_commit does not match the expected base SHA`
  );
  const mergeBaseCommit = requireRecord(
    compareMetadata.merge_base_commit,
    `${label} compare merge_base_commit`
  );
  assert(
    requireSha(
      mergeBaseCommit.sha,
      `${label} compare merge_base_commit.sha`
    ) === expectedBaseSha,
    `${label} compare merge base does not match the expected base SHA`
  );

  const aheadBy = requireNonNegativeInteger(
    compareMetadata.ahead_by,
    `${label} compare ahead_by`
  );
  const behindBy = requireNonNegativeInteger(
    compareMetadata.behind_by,
    `${label} compare behind_by`
  );
  const totalCommits = requireNonNegativeInteger(
    compareMetadata.total_commits,
    `${label} compare total_commits`
  );
  assert(behindBy === 0, `${label} compare has commits behind the base`);
  if (status === "identical") {
    assert(
      aheadBy === 0 && totalCommits === 0,
      `${label} identical compare evidence is inconsistent`
    );
  } else {
    assert(
      aheadBy > 0 && totalCommits >= aheadBy,
      `${label} ahead compare evidence is inconsistent`
    );
  }

  if (compareMetadata.head_commit !== undefined) {
    const headCommit = requireRecord(
      compareMetadata.head_commit,
      `${label} compare head_commit`
    );
    assert(
      requireSha(headCommit.sha, `${label} compare head_commit.sha`) ===
        currentMainSha,
      `${label} compare head does not match current protected main`
    );
  }

  return { aheadBy, behindBy, status, totalCommits };
}

function verifyProtectedHistory(options) {
  const targetSha = requireSha(options.targetSha, "target_sha");
  const protectedMainSha = requireSha(
    options.protectedMainSha,
    "artifact manifest.protected_main_sha"
  );
  const protectedMainRefFile = requireString(
    options.protectedMainRefFile,
    "protected_main_ref"
  );
  const targetAncestryFile = requireString(
    options.targetAncestryFile,
    "target_ancestry"
  );
  const protectedMainAncestryFile = requireString(
    options.protectedMainAncestryFile,
    "protected_main_ancestry"
  );
  const currentMainSha = verifyProtectedMainRef(
    readJson(protectedMainRefFile, "protected main ref metadata")
  );
  const targetAncestry = verifyCommitAncestryCompare(
    readJson(targetAncestryFile, "target ancestry compare metadata"),
    targetSha,
    currentMainSha,
    "target_sha"
  );
  const protectedMainAncestry = verifyCommitAncestryCompare(
    readJson(
      protectedMainAncestryFile,
      "protected_main_sha ancestry compare metadata"
    ),
    protectedMainSha,
    currentMainSha,
    "protected_main_sha"
  );
  return {
    currentMainSha,
    protectedMainAncestry,
    targetAncestry,
  };
}

function assertSafeRelativePath(relativePath) {
  assert(
    typeof relativePath === "string" && relativePath.length > 0,
    "checksum entry path must be a non-empty string"
  );
  assert(
    !relativePath.includes("\0") &&
      !relativePath.includes("\\") &&
      !relativePath.startsWith("/") &&
      relativePath === path.posix.normalize(relativePath) &&
      !relativePath.split("/").includes("..") &&
      !relativePath.split("/").includes("."),
    `unsafe checksum entry path: ${relativePath}`
  );
  assert(relativePath !== "SHA256SUMS", "SHA256SUMS cannot checksum itself");
  return relativePath;
}

function safeArtifactPath(root, relativePath) {
  const rootPath = path.resolve(root);
  const safeRelativePath = assertSafeRelativePath(relativePath);
  const candidate = path.resolve(rootPath, ...safeRelativePath.split("/"));
  assert(
    candidate.startsWith(`${rootPath}${path.sep}`),
    `checksum entry escapes artifact root: ${relativePath}`
  );
  return candidate;
}

function requireRegularDirectory(directoryPath, label) {
  let stat;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies the fresh extraction directory in the runner temp directory.
    stat = fs.lstatSync(directoryPath);
  } catch (error) {
    fail(`unable to stat ${label}: ${error.message}`);
  }
  assert(
    stat.isDirectory() && !stat.isSymbolicLink(),
    `${label} must be a regular directory`
  );
  return stat;
}

function listRegularFiles(root, current = root, result = []) {
  let entries;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The extracted artifact root is controlled by this verifier and is checked recursively for links.
    entries = fs.readdirSync(current, { withFileTypes: true });
  } catch (error) {
    fail(`unable to enumerate artifact root: ${error.message}`);
  }

  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      fail(`symbolic links are not allowed in an artifact: ${entry.name}`);
    }
    if (entry.isDirectory()) {
      listRegularFiles(root, absolutePath, result);
      continue;
    }
    assert(entry.isFile(), `unsupported artifact entry: ${entry.name}`);
    const relativePath = path
      .relative(root, absolutePath)
      .split(path.sep)
      .join("/");
    result.push(relativePath);
  }
  return result;
}

function verifyChecksums(root, requiredFiles) {
  const rootPath = path.resolve(root);
  let checksumBytes;
  const checksumPath = path.join(rootPath, "SHA256SUMS");
  let checksumStat;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHA256SUMS is fixed relative to the extracted artifact root.
    checksumStat = fs.lstatSync(checksumPath);
  } catch (error) {
    fail(`unable to stat artifact SHA256SUMS: ${error.message}`);
  }
  assert(
    checksumStat.isFile() && !checksumStat.isSymbolicLink(),
    "artifact SHA256SUMS must be a regular file"
  );
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The checksum file is fixed relative to the extracted artifact root.
    checksumBytes = fs.readFileSync(checksumPath);
  } catch (error) {
    fail(`unable to read artifact SHA256SUMS: ${error.message}`);
  }
  const checksumText = checksumBytes.toString("utf8");
  assert(
    checksumText.endsWith("\n"),
    "SHA256SUMS must end with a newline"
  );
  const lines = checksumText.split("\n").slice(0, -1);
  assert(lines.length > 0, "SHA256SUMS must contain at least one entry");

  const entries = new Map();
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/u.exec(line);
    assert(match, `malformed SHA256SUMS entry: ${line}`);
    const relativePath = assertSafeRelativePath(match[2]);
    assert(!entries.has(relativePath), `duplicate SHA256SUMS entry: ${relativePath}`);
    entries.set(relativePath, match[1]);
  }

  for (const requiredFile of requiredFiles) {
    assert(
      entries.has(requiredFile),
      `SHA256SUMS is missing required file: ${requiredFile}`
    );
  }

  for (const [relativePath, expectedDigest] of entries) {
    const filePath = safeArtifactPath(rootPath, relativePath);
    let stat;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path was validated and is confined to the extracted artifact root.
      stat = fs.lstatSync(filePath);
    } catch (error) {
      fail(`SHA256SUMS references a missing file ${relativePath}: ${error.message}`);
    }
    assert(stat.isFile(), `SHA256SUMS entry is not a regular file: ${relativePath}`);
    const actualDigest = sha256File(filePath);
    assert(
      actualDigest === expectedDigest,
      `SHA256SUMS digest mismatch for ${relativePath}`
    );
  }

  const actualFiles = listRegularFiles(rootPath).filter(
    (relativePath) => relativePath !== "SHA256SUMS"
  );
  for (const relativePath of actualFiles) {
    assert(
      entries.has(relativePath),
      `artifact contains an unchecksummed file: ${relativePath}`
    );
  }
  for (const relativePath of entries.keys()) {
    assert(
      actualFiles.includes(relativePath),
      `SHA256SUMS entry was not found in the artifact: ${relativePath}`
    );
  }

  return {
    digest: sha256Buffer(checksumBytes),
    entries,
    files: actualFiles,
  };
}

function assertExactRegularFiles(actualFiles, expectedFiles, label) {
  const actual = new Set(actualFiles);
  const expected = new Set(expectedFiles);
  assert(
    actual.size === expected.size &&
      actualFiles.length === expectedFiles.length &&
      [...actual].every((relativePath) => expected.has(relativePath)),
    `${label} regular-file membership is not exact`
  );
}

function validateExtractedArtifact(root) {
  const rootPath = path.resolve(root);
  requireRegularDirectory(rootPath, "extracted artifact root");
  const checksums = verifyChecksums(rootPath, [
    "artifact-portability.json",
    "manifest.json",
    "target/package.zip",
  ]);
  assertExactRegularFiles(
    checksums.files,
    EXPECTED_ARTIFACT_FILES.filter((relativePath) => relativePath !== "SHA256SUMS"),
    "artifact"
  );
  return checksums;
}

function readManifest(root, expected) {
  const manifestPath = safeArtifactPath(root, "manifest.json");
  const manifest = readJson(manifestPath, "artifact manifest");
  assert(
    manifest.schema_version === 2 &&
      manifest.artifact_contract === ARTIFACT_CONTRACT,
    "artifact manifest contract is not production-prebuild-v2"
  );
  assert(
    manifest.repository === ARTIFACT_MANIFEST_REPOSITORY,
    "artifact manifest repository is not the frontend production contract"
  );
  assert(
    manifest.environment === "production",
    "artifact manifest is not production-bound"
  );
  assert(
    manifest.source_sha === expected.targetSha,
    "artifact manifest source_sha does not match target_sha"
  );
  assert(
    manifest.target_sha === expected.targetSha,
    "artifact manifest target_sha does not match target_sha"
  );
  const artifactOperationId = requireOperationId(
    manifest.operation_id,
    "artifact manifest.operation_id"
  );
  assert(
    artifactOperationId === expected.artifactOperationId,
    "artifact manifest operation_id does not match the operation bound to artifact_name"
  );
  assert(
    manifest.artifact_name === expected.artifactName,
    "artifact manifest artifact_name does not match the exact artifact name"
  );
  assert(
    normalizeId(manifest.workflow_run_id, "artifact manifest.workflow_run_id") ===
      expected.artifactRunId,
    "artifact manifest workflow_run_id does not match artifact_run_id"
  );
  assert(
    requirePositiveInteger(manifest.run_attempt, "artifact manifest.run_attempt") ===
      expected.artifactRunAttempt,
    "artifact manifest run_attempt does not match artifact_run_attempt"
  );
  const workflowSha = requireSha(
    manifest.workflow_sha,
    "artifact manifest.workflow_sha"
  );
  assert(
    workflowSha === expected.runHeadSha,
    "artifact manifest.workflow_sha does not match the exact builder run head"
  );
  const protectedMainSha = requireSha(
    manifest.protected_main_sha,
    "artifact manifest.protected_main_sha"
  );
  const packageSha256 = requireHexDigest(
    manifest.package_sha256,
    "artifact manifest.package_sha256"
  );
  assert(
    typeof manifest.build_timestamp === "string" &&
      manifest.build_timestamp.length >= 20 &&
      Number.isFinite(Date.parse(manifest.build_timestamp)),
    "artifact manifest.build_timestamp must be a valid timestamp"
  );
  return {
    artifactOperationId,
    manifest,
    packageSha256,
    protectedMainSha,
    workflowSha,
    manifestPath,
  };
}

function verifyArchiveDigest(archivePath, artifact) {
  let stat;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The workflow supplies the downloaded archive path in the runner temp directory.
    stat = fs.lstatSync(archivePath);
  } catch (error) {
    fail(`unable to stat downloaded artifact archive: ${error.message}`);
  }
  assert(
    stat.isFile() && !stat.isSymbolicLink(),
    "downloaded artifact archive must be a regular file"
  );
  assert(
    stat.size === artifact.size,
    `downloaded artifact archive size ${stat.size} does not match GitHub API size ${artifact.size}`
  );
  const actualDigest = `sha256:${sha256File(archivePath)}`;
  assert(
    actualDigest === artifact.digest,
    "downloaded artifact archive digest does not match the GitHub artifact API digest"
  );
  return { size: stat.size, digest: actualDigest };
}

function verifyArtifact(options) {
  const source = verifyMetadata(options);
  const archive = verifyArchiveDigest(options.archive, source.artifact);
  const rootPath = path.resolve(options.artifactRoot);
  const checksums = validateExtractedArtifact(rootPath);
  const {
    artifactOperationId,
    manifest,
    manifestPath,
    packageSha256,
    protectedMainSha,
    workflowSha,
  } = readManifest(
    rootPath,
    source.expected
  );
  const protectedHistory = verifyProtectedHistory({
    protectedMainAncestryFile: options.protectedMainAncestryFile,
    protectedMainRefFile: options.protectedMainRefFile,
    protectedMainSha,
    targetAncestryFile: options.targetAncestryFile,
    targetSha: source.expected.targetSha,
  });
  const packagePath = safeArtifactPath(rootPath, "target/package.zip");
  let packageStat;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The package path is fixed relative to the validated artifact root.
    packageStat = fs.lstatSync(packagePath);
  } catch (error) {
    fail(`unable to stat target/package.zip: ${error.message}`);
  }
  assert(
    packageStat.isFile() && !packageStat.isSymbolicLink(),
    "target/package.zip must be a regular file"
  );
  assert(
    packageStat.size <= MAX_PACKAGE_BYTES,
    "target/package.zip exceeds the 500 MiB production package limit"
  );
  const actualPackageSha256 = sha256File(packagePath);
  assert(
    actualPackageSha256 === packageSha256,
    "target/package.zip does not match artifact manifest.package_sha256"
  );

  const verifier = validateVerifierSource(options);
  const selectionArtifactName = expectedSelectionArtifactName(
    source.expected.targetSha,
    verifier.verifierRunAttempt
  );
  const unsignedSelection = {
    schema_version: SELECTION_SCHEMA_VERSION,
    contract: SELECTION_CONTRACT,
    repository: source.expected.repository,
    environment: "production",
    target_sha: source.expected.targetSha,
    source_sha: manifest.source_sha,
    operation_id: source.expected.operationId,
    artifact_operation_id: artifactOperationId,
    artifact_workflow_path: ARTIFACT_WORKFLOW_PATH,
    artifact_workflow_sha: workflowSha,
    protected_main_sha: protectedMainSha,
    protected_main_current_sha: protectedHistory.currentMainSha,
    artifact_run_id: source.expected.artifactRunId,
    artifact_run_attempt: source.expected.artifactRunAttempt,
    artifact_id: source.expected.artifactId,
    artifact_name: source.expected.artifactName,
    artifact_api_digest: source.artifact.digest,
    artifact_archive_size_bytes: archive.size,
    manifest_sha256: sha256File(manifestPath),
    checksums_sha256: checksums.digest,
    package_sha256: actualPackageSha256,
    package_size_bytes: packageStat.size,
    selection_artifact_name: selectionArtifactName,
    verifier_workflow_path: VERIFIER_WORKFLOW_PATH,
    verifier_workflow_sha: verifier.verifierWorkflowSha,
    verifier_ref: verifier.verifierRef,
    verifier_run_id: verifier.verifierRunId,
    verifier_run_attempt: verifier.verifierRunAttempt,
  };
  const selection = {
    ...unsignedSelection,
    selection_digest: sha256Buffer(Buffer.from(canonicalJson(unsignedSelection))),
  };
  writeJson(options.output, selection);
  writeTextFile(
    options.checksumsOutput,
    `${sha256File(options.output)}  selection.json\n`
  );
  return selection;
}

function verifySelectionArtifactMetadata(artifactMetadata, options) {
  requireRecord(artifactMetadata, "selection artifact metadata");
  assert(
    normalizeId(artifactMetadata.id, "selection artifact metadata.id") ===
      options.selectionArtifactId,
    "selection artifact metadata ID does not match selection_artifact_id"
  );
  assert(
    artifactMetadata.name === options.selectionArtifactName,
    "selection artifact metadata name does not match selection_artifact_name"
  );
  assert(
    artifactMetadata.expired === false,
    "the exact selection artifact is expired or has no explicit non-expired state"
  );
  const digest = requireApiDigest(
    artifactMetadata.digest,
    "selection artifact metadata.digest"
  );
  if (options.expectedSelectionArtifactDigest) {
    assert(
      digest === options.expectedSelectionArtifactDigest,
      "selection artifact API digest does not match the orchestrator value"
    );
  }
  const size = requirePositiveInteger(
    artifactMetadata.size_in_bytes,
    "selection artifact metadata.size_in_bytes"
  );
  const workflowRun = requireRecord(
    artifactMetadata.workflow_run,
    "selection artifact metadata.workflow_run"
  );
  assert(
    normalizeId(workflowRun.id, "selection artifact metadata.workflow_run.id") ===
      options.selectionArtifactRunId,
    "selection artifact metadata is not attached to selection_artifact_run_id"
  );
  return { digest, size };
}

function verifySelectionRunMetadata(runMetadata, options) {
  requireRecord(runMetadata, "selection workflow run metadata");
  assert(
    normalizeId(runMetadata.id, "selection workflow run metadata.id") ===
      options.selectionArtifactRunId,
    "selection workflow run metadata ID does not match selection_artifact_run_id"
  );
  assert(
    requirePositiveInteger(
      runMetadata.run_attempt,
      "selection workflow run metadata.run_attempt"
    ) === options.selectionArtifactRunAttempt,
    "selection workflow run metadata run_attempt does not match selection_artifact_run_attempt"
  );
  assert(
    runMetadata.path === VERIFIER_WORKFLOW_PATH,
    `selection run must come from ${VERIFIER_WORKFLOW_PATH}`
  );
  assert(
    runMetadata.status === "completed" && runMetadata.conclusion === "success",
    "selection verifier workflow run must be completed successfully"
  );
  assert(
    runMetadata.event === "workflow_call" ||
      runMetadata.event === "workflow_dispatch",
    "selection verifier workflow run must be workflow_call or workflow_dispatch"
  );
  assert(
    runMetadata.head_branch === "main",
    "selection verifier workflow run must target the main branch"
  );
  assertRepositoryIdentity(
    runMetadata.repository,
    options.repository,
    "selection verifier workflow repository"
  );
  assertRepositoryIdentity(
    runMetadata.head_repository,
    options.repository,
    "selection verifier workflow head repository"
  );
}

function verifySelection(options) {
  const expectedTargetSha = requireSha(
    options.expectedTargetSha,
    "expected_target_sha"
  );
  const expectedOperationId = requireOperationId(
    options.expectedOperationId,
    "expected_operation_id"
  );
  const repository = requireRepository(options.repository);
  const selectionArtifactRunId = normalizeId(
    options.selectionArtifactRunId,
    "selection_artifact_run_id"
  );
  const selectionArtifactRunAttempt = requirePositiveInteger(
    options.selectionArtifactRunAttempt,
    "selection_artifact_run_attempt"
  );
  const selectionArtifactId = normalizeId(
    options.selectionArtifactId,
    "selection_artifact_id"
  );
  const selectionArtifactName = requireString(
    options.selectionArtifactName,
    "selection_artifact_name"
  );
  assert(
    selectionArtifactName ===
      expectedSelectionArtifactName(
        expectedTargetSha,
        selectionArtifactRunAttempt
      ),
    "selection_artifact_name is not the canonical target-and-attempt-bound name"
  );
  const expectedArtifactRunId = normalizeId(
    options.expectedArtifactRunId,
    "expected_artifact_run_id"
  );
  const expectedArtifactRunAttempt = requirePositiveInteger(
    options.expectedArtifactRunAttempt,
    "expected_artifact_run_attempt"
  );
  const expectedArtifactId = normalizeId(
    options.expectedArtifactId,
    "expected_artifact_id"
  );
  const expectedArtifactNameInput = requireString(
    options.expectedArtifactName,
    "expected_artifact_name"
  );
  const expectedArtifactOperationId = artifactOperationIdFromName(
    expectedArtifactNameInput,
    expectedTargetSha
  );
  const expectedArtifactApiDigest = requireApiDigest(
    options.expectedArtifactApiDigest,
    "expected_artifact_api_digest"
  );

  const artifactMetadata = readJson(
    options.artifactMetadataFile,
    "selection artifact metadata"
  );
  const artifact = verifySelectionArtifactMetadata(artifactMetadata, {
    expectedSelectionArtifactDigest: options.expectedSelectionArtifactDigest,
    selectionArtifactId,
    selectionArtifactName,
    selectionArtifactRunId,
  });
  verifyArchiveDigest(options.archive, artifact);
  const rootPath = path.resolve(options.selectionRoot);
  requireRegularDirectory(rootPath, "selection artifact root");
  const selectionChecksums = verifyChecksums(rootPath, ["selection.json"]);
  assertExactRegularFiles(
    selectionChecksums.files,
    ["selection.json"],
    "selection artifact"
  );

  const selection = readJson(
    safeArtifactPath(rootPath, "selection.json"),
    "production artifact selection"
  );
  const selectionRunMetadata = readJson(
    options.selectionRunMetadataFile,
    "selection workflow run metadata"
  );
  verifySelectionRunMetadata(selectionRunMetadata, {
    repository,
    selectionArtifactRunAttempt,
    selectionArtifactRunId,
  });
  assert(
    selection.schema_version === SELECTION_SCHEMA_VERSION &&
      selection.contract === SELECTION_CONTRACT,
    "selection artifact contract is invalid"
  );
  assert(
    selection.repository === repository &&
      selection.environment === "production",
    "selection artifact repository or environment is invalid"
  );
  assert(
    selection.target_sha === expectedTargetSha &&
      selection.source_sha === expectedTargetSha,
    "selection artifact source identity does not match expected_target_sha"
  );
  assert(
    selection.operation_id === expectedOperationId,
    "selection artifact operation_id does not match expected_operation_id"
  );
  assert(
    selection.artifact_run_id === expectedArtifactRunId &&
      selection.artifact_run_attempt === expectedArtifactRunAttempt &&
      selection.artifact_id === expectedArtifactId &&
      selection.artifact_name === expectedArtifactNameInput &&
      selection.artifact_operation_id === expectedArtifactOperationId &&
      selection.artifact_api_digest === expectedArtifactApiDigest,
    "selection artifact does not bind the exact original artifact identity"
  );
  assert(
    selection.artifact_workflow_path === ARTIFACT_WORKFLOW_PATH &&
      typeof selection.artifact_workflow_sha === "string" &&
      typeof selection.protected_main_sha === "string",
    "selection artifact builder workflow identity is invalid"
  );
  requireSha(
    selection.artifact_workflow_sha,
    "selection.artifact_workflow_sha"
  );
  requireSha(selection.protected_main_sha, "selection.protected_main_sha");
  requireSha(
    selection.protected_main_current_sha,
    "selection.protected_main_current_sha"
  );
  assert(
    selection.selection_artifact_name === selectionArtifactName &&
      selection.verifier_workflow_path === VERIFIER_WORKFLOW_PATH &&
      selection.verifier_ref === "refs/heads/main" &&
      selection.verifier_run_id === selectionArtifactRunId &&
      selection.verifier_run_attempt === selectionArtifactRunAttempt,
    "selection artifact verifier identity is invalid"
  );
  requireSha(selection.verifier_workflow_sha, "selection.verifier_workflow_sha");
  requireHexDigest(selection.manifest_sha256, "selection.manifest_sha256");
  requireHexDigest(selection.checksums_sha256, "selection.checksums_sha256");
  requireHexDigest(selection.package_sha256, "selection.package_sha256");
  requirePositiveInteger(
    selection.package_size_bytes,
    "selection.package_size_bytes"
  );
  requirePositiveInteger(
    selection.artifact_archive_size_bytes,
    "selection.artifact_archive_size_bytes"
  );
  const { selection_digest: claimedDigest, ...unsignedSelection } = selection;
  assert(
    requireHexDigest(claimedDigest, "selection.selection_digest") ===
      sha256Buffer(Buffer.from(canonicalJson(unsignedSelection))),
    "selection_digest verification failed"
  );
  return selection;
}

function requiredArg(args, name) {
  return requireString(args[name], `--${name}`);
}

function commonVerifierOptions(args) {
  return {
    artifactApiDigest: requiredArg(args, "artifact-api-digest"),
    artifactId: requiredArg(args, "artifact-id"),
    artifactMetadataFile: requiredArg(args, "artifact-metadata"),
    artifactName: requiredArg(args, "artifact-name"),
    artifactRunAttempt: requiredArg(args, "artifact-run-attempt"),
    artifactRunId: requiredArg(args, "artifact-run-id"),
    operationId: requiredArg(args, "operation-id"),
    repository: requiredArg(args, "repository"),
    runMetadataFile: requiredArg(args, "run-metadata"),
    targetSha: requiredArg(args, "target-sha"),
  };
}

function usage() {
  return `Usage:
  node ops/scripts/verify-production-artifact-selection.cjs validate-archive-members --archive-members <file>
  node ops/scripts/verify-production-artifact-selection.cjs validate-extracted-artifact --artifact-root <dir>
  node ops/scripts/verify-production-artifact-selection.cjs validate-inputs --target-sha <sha> --operation-id <id> --artifact-run-id <id> --artifact-run-attempt <n> --artifact-id <id> --artifact-api-digest sha256:<digest> --artifact-name <name> --repository <owner/name>
  node ops/scripts/verify-production-artifact-selection.cjs verify-metadata --target-sha <sha> --operation-id <id> --artifact-run-id <id> --artifact-run-attempt <n> --artifact-id <id> --artifact-api-digest sha256:<digest> --artifact-name <name> --repository <owner/name> --run-metadata <file> --artifact-metadata <file>
  node ops/scripts/verify-production-artifact-selection.cjs verify-artifact --target-sha <sha> --operation-id <id> --artifact-run-id <id> --artifact-run-attempt <n> --artifact-id <id> --artifact-api-digest sha256:<digest> --artifact-name <name> --repository <owner/name> --run-metadata <file> --artifact-metadata <file> --archive <file> --artifact-root <dir> --protected-main-ref <file> --target-ancestry <file> --protected-main-ancestry <file> --verifier-run-id <id> --verifier-run-attempt <n> --verifier-workflow-sha <sha> --verifier-ref refs/heads/main --output <file> --checksums-output <file>
  node ops/scripts/verify-production-artifact-selection.cjs verify-selection --expected-target-sha <sha> --expected-operation-id <id> --expected-artifact-run-id <id> --expected-artifact-run-attempt <n> --expected-artifact-id <id> --expected-artifact-name <name> --expected-artifact-api-digest sha256:<digest> --selection-artifact-run-id <id> --selection-artifact-run-attempt <n> --selection-artifact-id <id> --selection-artifact-name <name> --selection-artifact-metadata <file> --selection-run-metadata <file> --selection-archive <file> --selection-root <dir> --repository <owner/name>`;
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const command = args._[0];
    if (args.help || !command) {
      process.stdout.write(`${usage()}\n`);
      return;
    }

    if (command === "validate-archive-members") {
      process.stdout.write(
        `${JSON.stringify(
          validateArchiveMembers(
            readTextFile(
              requiredArg(args, "archive-members"),
              "archive member list"
            )
          )
        )}\n`
      );
      return;
    }

    if (command === "validate-extracted-artifact") {
      process.stdout.write(
        `${JSON.stringify(
          validateExtractedArtifact(requiredArg(args, "artifact-root"))
        )}\n`
      );
      return;
    }

    if (command === "validate-inputs") {
      process.stdout.write(`${JSON.stringify(validateVerifierInputs({
        artifactApiDigest: requiredArg(args, "artifact-api-digest"),
        artifactId: requiredArg(args, "artifact-id"),
        artifactName: requiredArg(args, "artifact-name"),
        artifactRunAttempt: requiredArg(args, "artifact-run-attempt"),
        artifactRunId: requiredArg(args, "artifact-run-id"),
        operationId: requiredArg(args, "operation-id"),
        repository: requiredArg(args, "repository"),
        targetSha: requiredArg(args, "target-sha"),
      }))}\n`);
      return;
    }

    if (command === "verify-metadata") {
      process.stdout.write(`${JSON.stringify(verifyMetadata(commonVerifierOptions(args)))}\n`);
      return;
    }

    if (command === "verify-artifact") {
      const selection = verifyArtifact({
        ...commonVerifierOptions(args),
        archive: requiredArg(args, "archive"),
        artifactRoot: requiredArg(args, "artifact-root"),
        checksumsOutput: requiredArg(args, "checksums-output"),
        output: requiredArg(args, "output"),
        protectedMainAncestryFile: requiredArg(
          args,
          "protected-main-ancestry"
        ),
        protectedMainRefFile: requiredArg(args, "protected-main-ref"),
        targetAncestryFile: requiredArg(args, "target-ancestry"),
        verifierRef: requiredArg(args, "verifier-ref"),
        verifierRunId: requiredArg(args, "verifier-run-id"),
        verifierRunAttempt: requiredArg(args, "verifier-run-attempt"),
        verifierWorkflowSha: requiredArg(args, "verifier-workflow-sha"),
      });
      process.stdout.write(`${JSON.stringify(selection)}\n`);
      return;
    }

    if (command === "verify-selection") {
      const selection = verifySelection({
        archive: requiredArg(args, "selection-archive"),
        artifactMetadataFile: requiredArg(args, "selection-artifact-metadata"),
        expectedArtifactApiDigest: requiredArg(
          args,
          "expected-artifact-api-digest"
        ),
        expectedArtifactId: requiredArg(args, "expected-artifact-id"),
        expectedArtifactName: requiredArg(args, "expected-artifact-name"),
        expectedArtifactRunAttempt: requiredArg(
          args,
          "expected-artifact-run-attempt"
        ),
        expectedArtifactRunId: requiredArg(args, "expected-artifact-run-id"),
        expectedOperationId: requiredArg(args, "expected-operation-id"),
        expectedTargetSha: requiredArg(args, "expected-target-sha"),
        repository: requiredArg(args, "repository"),
        selectionArtifactId: requiredArg(args, "selection-artifact-id"),
        selectionArtifactName: requiredArg(args, "selection-artifact-name"),
        selectionArtifactRunAttempt: requiredArg(
          args,
          "selection-artifact-run-attempt"
        ),
        selectionArtifactRunId: requiredArg(
          args,
          "selection-artifact-run-id"
        ),
        selectionRunMetadataFile: requiredArg(args, "selection-run-metadata"),
        selectionRoot: requiredArg(args, "selection-root"),
        expectedSelectionArtifactDigest: args[
          "expected-selection-artifact-digest"
        ]
          ? requireApiDigest(
              args["expected-selection-artifact-digest"],
              "--expected-selection-artifact-digest"
            )
          : undefined,
      });
      process.stdout.write(`${JSON.stringify(selection)}\n`);
      return;
    }

    fail(`unknown command: ${command}`);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ARTIFACT_CONTRACT,
  ARTIFACT_MANIFEST_REPOSITORY,
  ARTIFACT_NAME_PREFIX,
  ARTIFACT_WORKFLOW_PATH,
  EXPECTED_ARTIFACT_FILES,
  SELECTION_ARTIFACT_NAME_PREFIX,
  SELECTION_CONTRACT,
  VERIFIER_WORKFLOW_PATH,
  artifactOperationIdFromName,
  canonicalJson,
  expectedArtifactName,
  expectedSelectionArtifactName,
  main,
  validateArchiveMembers,
  validateExtractedArtifact,
  validateVerifierInputs,
  verifyArtifact,
  verifyChecksums,
  verifyMetadata,
  verifyProtectedHistory,
  verifySelection,
  verifySelectionRunMetadata,
};
