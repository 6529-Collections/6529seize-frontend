#!/usr/bin/env node
"use strict";

const { execFileSync, spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const os = require("node:os");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const {
  compareReviewVersions,
  invariant,
  isSafeRepositoryPath,
  stableJson,
  validateConfig,
} = require("./solidity-reference-lib.cjs");

const CONFIG_PATH = "config/public-reviews/6529-stream.reference.json";
const PUBLICATION_CONFIG_PATH =
  "config/public-reviews/6529-stream.publication.json";
const REVIEW_ROOT = "public/review-data/6529-stream";
const FRONTEND_REMOTE =
  "https://github.com/6529-Collections/6529seize-frontend.git";
const STREAM_REPOSITORY = "6529-Collections/6529Stream";
const STREAM_REMOTE = "https://github.com/6529-Collections/6529Stream.git";
const SOLC_LONG_VERSION = "0.8.19+commit.7dd6d404";
const SOLC_URL =
  "https://binaries.soliditylang.org/linux-amd64/solc-linux-amd64-v0.8.19+commit.7dd6d404";
const SOLC_SHA256 =
  "7a5c1d3dc9a8eba62bb2ec37192c9178ae5fe8a54a56e5573fd3c9c17cd9eb48";
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DECIMAL_PATTERN = /^[1-9][0-9]*$/;
const GIT_REGULAR_MODE = "100644";
const PROTECTED_TRUST_ROOT_PATHS = new Set([
  ".gitattributes",
  ".github/workflows/public-review-snapshot-trust.yml",
  "ops/scripts/testing-strategy.cjs",
  "scripts/public-reviews/solidity-reference-lib.cjs",
  "scripts/public-reviews/solidity-reference.cjs",
  "scripts/public-reviews/verify-snapshot-pr.cjs",
]);
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });
const MAX_BUFFER = 512 * 1024 * 1024;
const MAX_BLOB_BYTES = 64 * 1024 * 1024;
const MAX_CANDIDATE_BLOBS = 10_000;
const MAX_CANDIDATE_BYTES = 256 * 1024 * 1024;
const MAX_CONFIG_BYTES = 1024 * 1024;
const MAX_SOLC_BYTES = 32 * 1024 * 1024;

function parseArgs(argv) {
  invariant(
    argv.length === 6,
    "Verifier requires --pr-number, --head-sha, and --base-sha."
  );
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    invariant(
      ["--pr-number", "--head-sha", "--base-sha"].includes(key) && value,
      `Invalid verifier argument: ${key ?? "(missing)"}.`
    );
    invariant(
      parsed[key] === undefined,
      `Duplicate verifier argument: ${key}.`
    );
    parsed[key] = value;
  }
  return {
    prNumber: parsed["--pr-number"],
    headSha: parsed["--head-sha"],
    baseSha: parsed["--base-sha"],
  };
}

function validateIdentifiers({ prNumber, headSha, baseSha }) {
  invariant(DECIMAL_PATTERN.test(prNumber), "PR number must be decimal.");
  invariant(
    SHA_PATTERN.test(headSha),
    "PR head SHA must be lowercase full SHA."
  );
  invariant(
    SHA_PATTERN.test(baseSha),
    "PR base SHA must be lowercase full SHA."
  );
  invariant(headSha !== baseSha, "PR head and base SHAs must differ.");
}

function defaultRun(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: options.encoding,
    input: options.input,
    maxBuffer: options.maxBuffer ?? MAX_BUFFER,
    timeout: options.timeout,
    windowsHide: true,
  });
}

function defaultStatus(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    maxBuffer: options.maxBuffer ?? MAX_BUFFER,
    timeout: options.timeout,
    windowsHide: true,
  });
}

function decodeUtf8(buffer, label) {
  try {
    return UTF8_DECODER.decode(buffer);
  } catch {
    throw new Error(`${label} is not valid UTF-8.`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function gitBuffer(repositoryRoot, args, run = defaultRun) {
  return run("git", ["-C", repositoryRoot, ...args]);
}

function gitText(repositoryRoot, args, run = defaultRun) {
  return decodeUtf8(
    gitBuffer(repositoryRoot, args, run),
    `git ${args.join(" ")}`
  ).trim();
}

function validateCandidatePath(candidatePath) {
  invariant(
    candidatePath.length > 0 &&
      !candidatePath.includes("\\") &&
      !/[\u0000-\u001f\u007f]/.test(candidatePath) &&
      isSafeRepositoryPath(candidatePath),
    `Unsafe candidate path: ${JSON.stringify(candidatePath)}.`
  );
}

function parseNameStatus(buffer) {
  if (buffer.length === 0) {
    return [];
  }
  const tokens = decodeUtf8(buffer, "candidate diff").split("\0");
  invariant(tokens.at(-1) === "", "Candidate diff is not NUL-terminated.");
  tokens.pop();
  invariant(
    tokens.every((token) => token.length > 0),
    "Candidate diff contains an empty record."
  );
  const entries = [];
  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index++];
    invariant(
      /^(?:[ADMTUXB]|[RC][0-9]{1,3})$/.test(status),
      `Invalid Git status ${status}.`
    );
    const pathCount = status.startsWith("R") || status.startsWith("C") ? 2 : 1;
    invariant(index + pathCount <= tokens.length, "Truncated Git name-status.");
    const paths = tokens.slice(index, index + pathCount);
    index += pathCount;
    for (const candidatePath of paths) {
      validateCandidatePath(candidatePath);
    }
    entries.push({ status, paths });
  }
  return entries;
}

function parseLsTree(buffer) {
  if (buffer.length === 0) {
    return new Map();
  }
  const records = decodeUtf8(buffer, "Git tree").split("\0");
  invariant(records.at(-1) === "", "Git tree is not NUL-terminated.");
  records.pop();
  invariant(
    records.every((record) => record.length > 0),
    "Git tree contains an empty record."
  );
  const entries = new Map();
  for (const record of records) {
    const tabIndex = record.indexOf("\t");
    invariant(tabIndex > 0, `Invalid Git tree record: ${record}.`);
    const metadata = record.slice(0, tabIndex).split(" ");
    invariant(metadata.length === 3, `Invalid Git tree metadata: ${record}.`);
    const [mode, type, oid] = metadata;
    const candidatePath = record.slice(tabIndex + 1);
    validateCandidatePath(candidatePath);
    invariant(
      !entries.has(candidatePath),
      `Duplicate Git path: ${candidatePath}.`
    );
    invariant(
      /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(oid),
      `Invalid Git object: ${oid}.`
    );
    entries.set(candidatePath, { mode, type, oid, path: candidatePath });
  }
  return entries;
}

function readGitBlob(repositoryRoot, entry, run = defaultRun) {
  invariant(
    entry.mode === GIT_REGULAR_MODE && entry.type === "blob",
    `${entry.path} must be a non-executable regular Git blob.`
  );
  const buffer = gitBuffer(
    repositoryRoot,
    ["cat-file", "blob", entry.oid],
    run
  );
  invariant(
    buffer.length <= MAX_BLOB_BYTES,
    `${entry.path} exceeds the trusted blob size limit.`
  );
  invariant(
    !buffer
      .subarray(0, 200)
      .toString("utf8")
      .startsWith("version https://git-lfs.github.com/spec/v1"),
    `${entry.path} must not be a Git LFS pointer.`
  );
  return buffer;
}

function isReviewDataPath(candidatePath) {
  return (
    candidatePath === REVIEW_ROOT || candidatePath.startsWith(`${REVIEW_ROOT}/`)
  );
}

function snapshotChangePolicy(entries) {
  const flattenedPaths = entries.flatMap((entry) => entry.paths);
  const protectedPaths = flattenedPaths.filter((candidatePath) =>
    PROTECTED_TRUST_ROOT_PATHS.has(candidatePath)
  );
  invariant(
    protectedPaths.length === 0,
    `Protected public-review trust-root changes require explicit maintainer bypass: ${protectedPaths.join(", ")}.`
  );
  const touchesSnapshot = flattenedPaths.some(
    (candidatePath) =>
      candidatePath === CONFIG_PATH || isReviewDataPath(candidatePath)
  );
  if (!touchesSnapshot) {
    return { touchesSnapshot: false };
  }
  for (const entry of entries) {
    invariant(
      !entry.status.startsWith("R") && !entry.status.startsWith("C"),
      "Snapshot PRs must not contain renamed or copied paths."
    );
    invariant(
      entry.paths.every(
        (candidatePath) =>
          candidatePath === CONFIG_PATH ||
          candidatePath === PUBLICATION_CONFIG_PATH ||
          isReviewDataPath(candidatePath)
      ),
      "Snapshot PRs may change only the fixed reference config, publication config, and review-data tree."
    );
    if (entry.paths[0] === CONFIG_PATH) {
      invariant(
        ["A", "M"].includes(entry.status),
        "Snapshot reference config must be added or modified, never deleted."
      );
    }
  }
  const publicationChanges = entries.filter((entry) =>
    entry.paths.includes(PUBLICATION_CONFIG_PATH)
  );
  invariant(
    flattenedPaths.includes(CONFIG_PATH) &&
      publicationChanges.length === 1 &&
      publicationChanges[0].status === "M" &&
      publicationChanges[0].paths.length === 1,
    "Snapshot PRs must update the fixed reference config and modify exactly one fixed publication config."
  );
  return { touchesSnapshot: true };
}

function readTreeAtPaths(
  repositoryRoot,
  revision,
  candidatePaths,
  run = defaultRun
) {
  return parseLsTree(
    gitBuffer(
      repositoryRoot,
      ["ls-tree", "-r", "-z", "--full-tree", revision, "--", ...candidatePaths],
      run
    )
  );
}

function exactCandidateBlobMaps(repositoryRoot, headSha, run = defaultRun) {
  const configEntries = readTreeAtPaths(
    repositoryRoot,
    headSha,
    [CONFIG_PATH],
    run
  );
  invariant(
    configEntries.size === 1 && configEntries.has(CONFIG_PATH),
    "Candidate snapshot must contain exactly one fixed config blob."
  );
  const configEntry = configEntries.get(CONFIG_PATH);
  const configBuffer = readGitBlob(repositoryRoot, configEntry, run);
  invariant(
    configBuffer.length <= MAX_CONFIG_BYTES,
    "Candidate snapshot config exceeds the trusted size limit."
  );
  const publicationEntries = readTreeAtPaths(
    repositoryRoot,
    headSha,
    [PUBLICATION_CONFIG_PATH],
    run
  );
  invariant(
    publicationEntries.size === 1 &&
      publicationEntries.has(PUBLICATION_CONFIG_PATH),
    "Candidate snapshot must contain exactly one fixed publication config blob."
  );
  const publicationEntry = publicationEntries.get(PUBLICATION_CONFIG_PATH);
  const publicationBuffer = readGitBlob(repositoryRoot, publicationEntry, run);
  invariant(
    publicationBuffer.length <= MAX_CONFIG_BYTES,
    "Candidate publication config exceeds the trusted size limit."
  );
  const reviewEntries = readTreeAtPaths(
    repositoryRoot,
    headSha,
    [REVIEW_ROOT],
    run
  );
  invariant(reviewEntries.size > 0, "Candidate review-data tree is empty.");
  invariant(
    reviewEntries.size <= MAX_CANDIDATE_BLOBS,
    "Candidate review-data tree exceeds the trusted file-count limit."
  );
  const reviewBlobs = new Map();
  let totalBytes = 0;
  for (const [candidatePath, entry] of reviewEntries) {
    invariant(
      isReviewDataPath(candidatePath),
      `Unexpected candidate review path: ${candidatePath}.`
    );
    const buffer = readGitBlob(repositoryRoot, entry, run);
    totalBytes += buffer.length;
    invariant(
      totalBytes <= MAX_CANDIDATE_BYTES,
      "Candidate review-data tree exceeds the trusted aggregate size limit."
    );
    reviewBlobs.set(candidatePath, {
      ...entry,
      buffer,
    });
  }
  return {
    configBuffer,
    configEntry,
    publicationBuffer,
    publicationEntry,
    reviewBlobs,
  };
}

function fetchAndBindCandidate(context, dependencies = {}) {
  const run = dependencies.run ?? defaultRun;
  validateIdentifiers(context);
  const checkoutHead = gitText(
    context.repositoryRoot,
    ["rev-parse", "HEAD^{commit}"],
    run
  );
  invariant(
    checkoutHead === context.baseSha,
    `Trusted checkout head ${checkoutHead} does not match event base ${context.baseSha}.`
  );
  invariant(
    gitText(
      context.repositoryRoot,
      ["status", "--porcelain=v1", "--untracked-files=no"],
      run
    ) === "",
    "Trusted base checkout contains tracked modifications."
  );
  const candidateRef = `refs/codex-public-review/pr-${context.prNumber}-${context.headSha}`;
  const baseRef = `refs/codex-public-review/base-${context.prNumber}-${context.baseSha}`;
  fetchAndAssertRemoteRefs(context, candidateRef, baseRef, run);
  const resolvedHead = gitText(
    context.repositoryRoot,
    ["rev-parse", `${candidateRef}^{commit}`],
    run
  );
  invariant(
    resolvedHead === context.headSha,
    `Fetched PR head ${resolvedHead} does not match event head ${context.headSha}.`
  );
  const resolvedBase = gitText(
    context.repositoryRoot,
    ["rev-parse", `${context.baseSha}^{commit}`],
    run
  );
  invariant(
    resolvedBase === context.baseSha,
    `Resolved base ${resolvedBase} does not match event base ${context.baseSha}.`
  );
  const mergeBase = gitText(
    context.repositoryRoot,
    ["merge-base", context.baseSha, context.headSha],
    run
  );
  const changes = parseNameStatus(
    gitBuffer(
      context.repositoryRoot,
      [
        "diff",
        "--name-status",
        "-z",
        "--find-renames",
        mergeBase,
        context.headSha,
      ],
      run
    )
  );
  const policy = snapshotChangePolicy(changes);
  if (policy.touchesSnapshot) {
    invariant(
      mergeBase === context.baseSha,
      "Snapshot PR head must be rebased onto the exact event base."
    );
  }
  return { candidateRef, baseRef, changes, mergeBase, ...policy };
}

function fetchAndAssertRemoteRefs(
  context,
  candidateRef,
  baseRef,
  run = defaultRun
) {
  run("git", [
    "-C",
    context.repositoryRoot,
    "fetch",
    "--no-tags",
    "--force",
    FRONTEND_REMOTE,
    `refs/pull/${context.prNumber}/head:${candidateRef}`,
    `refs/heads/main:${baseRef}`,
  ]);
  const currentHead = gitText(
    context.repositoryRoot,
    ["rev-parse", `${candidateRef}^{commit}`],
    run
  );
  invariant(
    currentHead === context.headSha,
    `PR head advanced from event head ${context.headSha} to ${currentHead}.`
  );
  const currentBase = gitText(
    context.repositoryRoot,
    ["rev-parse", `${baseRef}^{commit}`],
    run
  );
  invariant(
    currentBase === context.baseSha,
    `Frontend main advanced from event base ${context.baseSha} to ${currentBase}.`
  );
}

function deleteCandidateRef(
  repositoryRoot,
  candidateRef,
  status = defaultStatus
) {
  const result = status(
    "git",
    ["-C", repositoryRoot, "update-ref", "-d", candidateRef],
    {}
  );
  requireSuccessfulStatus(result, "Candidate-ref cleanup");
}

function parseJson(buffer, label) {
  const text = decodeUtf8(buffer, label);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function immutableConfigProjection(config) {
  const projection = JSON.parse(JSON.stringify(config));
  projection.reviewVersion = "<mutable-review-version>";
  projection.source.commit = "<mutable-commit>";
  projection.source.tree = "<mutable-tree>";
  projection.output.directory = "<mutable-output-directory>";
  projection.output.retainedVersions = ["<mutable-retained-versions>"];
  return projection;
}

function baseIndexVersions(repositoryRoot) {
  const indexPath = path.join(
    repositoryRoot,
    ...`${REVIEW_ROOT}/index.json`.split("/")
  );
  if (!fs.existsSync(indexPath)) {
    return null;
  }
  const index = parseJson(fs.readFileSync(indexPath), "trusted base index");
  invariant(
    index?.reviewId === "6529-stream" &&
      Array.isArray(index.versions) &&
      index.versions.length > 0,
    "Trusted base review index is invalid."
  );
  const versions = index.versions.map((entry) => entry.version);
  invariant(
    new Set(versions).size === versions.length &&
      versions.every((version) => typeof version === "string"),
    "Trusted base review index versions are invalid."
  );
  return versions;
}

function validateTrustedConfigPolicy(baseConfig, candidateConfig, versions) {
  validateConfig(baseConfig);
  validateConfig(candidateConfig);
  invariant(
    stableJson(immutableConfigProjection(candidateConfig)) ===
      stableJson(immutableConfigProjection(baseConfig)),
    "Candidate config changed immutable trusted policy."
  );
  invariant(
    candidateConfig.reviewId === "6529-stream" &&
      candidateConfig.source.repository === STREAM_REPOSITORY &&
      candidateConfig.source.compilerVersion === SOLC_LONG_VERSION,
    "Candidate config changed the trusted review, repository, or compiler."
  );
  if (versions === null) {
    invariant(
      candidateConfig.reviewVersion === baseConfig.reviewVersion,
      "Initial snapshot must use the base-configured review version."
    );
    invariant(
      stableJson(candidateConfig.output.retainedVersions) ===
        stableJson([candidateConfig.reviewVersion]),
      "Initial snapshot must retain exactly its own review version."
    );
    return;
  }
  const latestVersion = versions.at(-1);
  invariant(
    compareReviewVersions(candidateConfig.reviewVersion, latestVersion) > 0,
    "New snapshot reviewVersion must be strictly greater than base history."
  );
  invariant(
    stableJson(candidateConfig.output.retainedVersions) ===
      stableJson([...versions, candidateConfig.reviewVersion]),
    "Candidate retainedVersions must append to exact base history."
  );
}

function validateTrustedPublicationPolicy(
  basePublication,
  candidatePublication,
  candidateConfig,
  baseVersions
) {
  invariant(
    baseVersions !== null &&
      basePublication !== null &&
      typeof basePublication === "object" &&
      !Array.isArray(basePublication) &&
      Array.isArray(basePublication.versions),
    "Trusted base publication requires an existing review history."
  );
  invariant(
    candidatePublication !== null &&
      typeof candidatePublication === "object" &&
      !Array.isArray(candidatePublication) &&
      Array.isArray(candidatePublication.versions),
    "Candidate publication config is invalid."
  );
  invariant(
    stableJson(basePublication.versions.map((entry) => entry.version)) ===
      stableJson(baseVersions),
    "Trusted base publication versions drifted from trusted review history."
  );
  const candidateVersions = candidateConfig.output.retainedVersions;
  invariant(
    stableJson(candidatePublication.versions.map((entry) => entry.version)) ===
      stableJson(candidateVersions),
    "Candidate publication versions must match retained review history."
  );
  const expectedPublication = JSON.parse(JSON.stringify(basePublication));
  expectedPublication.versions.push({
    version: candidateConfig.reviewVersion,
    lifecycleState: "DRAFT",
  });
  invariant(
    stableJson(candidatePublication) === stableJson(expectedPublication),
    "Candidate publication must preserve trusted state and append exactly one DRAFT version."
  );
}

function requireSuccessfulStatus(result, label) {
  if (result.error) {
    throw result.error;
  }
  invariant(
    result.status === 0,
    `${label} failed with status ${String(result.status)}: ${String(
      result.stderr ?? ""
    ).trim()}`
  );
}

function verifyOfficialStreamInputs(
  streamRepository,
  baseConfig,
  candidateConfig,
  dependencies = {}
) {
  const run = dependencies.run ?? defaultRun;
  const status = dependencies.status ?? defaultStatus;
  const resolvedCommit = gitText(
    streamRepository,
    ["rev-parse", `${candidateConfig.source.commit}^{commit}`],
    run
  );
  const resolvedTree = gitText(
    streamRepository,
    ["rev-parse", `${candidateConfig.source.commit}^{tree}`],
    run
  );
  invariant(
    resolvedCommit === candidateConfig.source.commit,
    "Configured Stream commit did not resolve exactly."
  );
  invariant(
    resolvedTree === candidateConfig.source.tree,
    "Configured Stream tree did not resolve exactly."
  );
  requireSuccessfulStatus(
    status(
      "git",
      [
        "-C",
        streamRepository,
        "merge-base",
        "--is-ancestor",
        candidateConfig.source.commit,
        "refs/remotes/origin/main",
      ],
      {}
    ),
    "Configured Stream main-ancestry check"
  );
  requireSuccessfulStatus(
    status(
      "git",
      [
        "-C",
        streamRepository,
        "merge-base",
        "--is-ancestor",
        baseConfig.source.commit,
        candidateConfig.source.commit,
      ],
      {}
    ),
    "Stream pin rollback check"
  );
  const tree = readTreeAtPaths(
    streamRepository,
    candidateConfig.source.commit,
    ["."],
    run
  );
  const roots = candidateConfig.source.roots.map((entry) => entry.path);
  const rootCounts = new Map(roots.map((root) => [root, 0]));
  for (const [sourcePath, entry] of tree) {
    if (sourcePath.endsWith(".sol")) {
      invariant(
        entry.mode === GIT_REGULAR_MODE && entry.type === "blob",
        `${sourcePath} must be a regular Solidity blob.`
      );
      const root = roots.find(
        (candidateRoot) =>
          sourcePath === candidateRoot ||
          sourcePath.startsWith(`${candidateRoot}/`)
      );
      invariant(root, `${sourcePath} is outside the authoritative roots.`);
      invariant(
        readGitBlob(streamRepository, entry, run).length > 0,
        `${sourcePath} must not be empty.`
      );
      rootCounts.set(root, rootCounts.get(root) + 1);
    }
  }
  for (const [root, count] of rootCounts) {
    invariant(count > 0, `Authoritative Solidity root ${root} is empty.`);
  }
  for (const artifact of candidateConfig.releaseArtifacts) {
    const entry = tree.get(artifact.path);
    invariant(entry, `Missing trusted release artifact ${artifact.path}.`);
    invariant(
      entry.mode === GIT_REGULAR_MODE && entry.type === "blob",
      `${artifact.path} must be a regular release-artifact blob.`
    );
    invariant(
      readGitBlob(streamRepository, entry, run).length > 0,
      `${artifact.path} must not be empty.`
    );
  }
}

function initializeOfficialStreamRepository(tempRoot, run = defaultRun) {
  const streamRepository = path.join(tempRoot, "stream.git");
  fs.mkdirSync(streamRepository, { recursive: true });
  run("git", ["-C", streamRepository, "init", "--bare"]);
  run("git", [
    "-C",
    streamRepository,
    "remote",
    "add",
    "origin",
    STREAM_REMOTE,
  ]);
  run("git", [
    "-C",
    streamRepository,
    "fetch",
    "--no-tags",
    "origin",
    "main:refs/remotes/origin/main",
  ]);
  return streamRepository;
}

function downloadBuffer(url, maximumBytes = MAX_SOLC_BYTES) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(
          new Error(`Compiler download returned HTTP ${response.statusCode}.`)
        );
        return;
      }
      const chunks = [];
      let total = 0;
      response.on("data", (chunk) => {
        total += chunk.length;
        if (total > maximumBytes) {
          request.destroy(new Error("Compiler download exceeded size limit."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(60_000, () => {
      request.destroy(new Error("Compiler download timed out."));
    });
    request.on("error", reject);
  });
}

async function installTrustedSolc(tempRoot, dependencies = {}) {
  const download = dependencies.download ?? downloadBuffer;
  let lastError;
  let buffer;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      buffer = await download(SOLC_URL, MAX_SOLC_BYTES);
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (!buffer) {
    throw lastError;
  }
  validateSolcDigest(buffer);
  const solcPath = path.join(tempRoot, "solc-0.8.19");
  fs.writeFileSync(solcPath, buffer, { flag: "wx", mode: 0o700 });
  fs.chmodSync(solcPath, 0o700);
  const run = dependencies.run ?? defaultRun;
  const version = String(
    run(solcPath, ["--version"], { encoding: "utf8", timeout: 30_000 })
  );
  invariant(
    version.includes(`Version: ${SOLC_LONG_VERSION}`),
    "Downloaded Solidity compiler version is invalid."
  );
  return solcPath;
}

function validateSolcDigest(buffer, expectedDigest = SOLC_SHA256) {
  invariant(
    sha256(buffer) === expectedDigest,
    "Downloaded Solidity compiler digest is invalid."
  );
}

function filesystemBlobMap(repositoryRoot, relativeRoot) {
  const absoluteRoot = path.join(repositoryRoot, ...relativeRoot.split("/"));
  const blobs = new Map();
  const visit = (absoluteDirectory) => {
    let entries;
    try {
      entries = fs
        .readdirSync(absoluteDirectory, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
      throw new Error(
        `Unable to read regenerated directory ${absoluteDirectory}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    for (const entry of entries) {
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = path
        .relative(repositoryRoot, absolutePath)
        .split(path.sep)
        .join("/");
      validateCandidatePath(relativePath);
      invariant(
        !entry.isSymbolicLink(),
        `${relativePath} must not be a regenerated symlink.`
      );
      if (entry.isDirectory()) {
        visit(absolutePath);
        continue;
      }
      invariant(entry.isFile(), `${relativePath} must be a regular file.`);
      const descriptor = fs.openSync(
        absolutePath,
        fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0)
      );
      try {
        const stat = fs.fstatSync(descriptor);
        invariant(stat.isFile(), `${relativePath} must be a regular file.`);
        invariant(
          (stat.mode & 0o111) === 0,
          `${relativePath} must not be executable.`
        );
        blobs.set(relativePath, fs.readFileSync(descriptor));
      } finally {
        fs.closeSync(descriptor);
      }
    }
  };
  visit(absoluteRoot);
  return blobs;
}

function compareCandidateToRegeneration(candidateBlobs, regeneratedBlobs) {
  const candidatePaths = [...candidateBlobs.keys()].sort();
  const regeneratedPaths = [...regeneratedBlobs.keys()].sort();
  invariant(
    stableJson(candidatePaths) === stableJson(regeneratedPaths),
    "Candidate and trusted regeneration file sets differ."
  );
  for (const candidatePath of candidatePaths) {
    invariant(
      candidateBlobs
        .get(candidatePath)
        .buffer.equals(regeneratedBlobs.get(candidatePath)),
      `${candidatePath} differs from trusted regeneration.`
    );
  }
}

function verifyNoGenerationResidue(repositoryRoot) {
  const root = path.join(repositoryRoot, ...REVIEW_ROOT.split("/"));
  const residue = [];
  if (!fs.existsSync(root)) {
    return;
  }
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (
        entry.name === ".solidity-reference-generation.lock" ||
        entry.name.startsWith(".stage-") ||
        entry.name.includes(".tmp-")
      ) {
        residue.push(absolutePath);
      }
      if (entry.isDirectory()) {
        visit(absolutePath);
      }
    }
  };
  visit(root);
  invariant(
    residue.length === 0,
    "Trusted regeneration left temporary residue."
  );
}

function createTrustedWorktree(
  repositoryRoot,
  baseSha,
  worktree,
  run = defaultRun
) {
  run("git", [
    "-C",
    repositoryRoot,
    "worktree",
    "add",
    "--detach",
    worktree,
    baseSha,
  ]);
  return worktree;
}

function validateTrustedWorktree(worktree, baseSha, run = defaultRun) {
  invariant(
    gitText(worktree, ["rev-parse", "HEAD^{commit}"], run) === baseSha,
    "Trusted regeneration worktree is not at the exact event base."
  );
  invariant(
    gitText(worktree, ["status", "--porcelain"], run) === "",
    "Trusted regeneration worktree is not clean."
  );
}

function removeTrustedWorktree(
  repositoryRoot,
  worktree,
  status = defaultStatus
) {
  const result = status(
    "git",
    ["-C", repositoryRoot, "worktree", "remove", "--force", worktree],
    {}
  );
  requireSuccessfulStatus(result, "Trusted-worktree cleanup");
  requireSuccessfulStatus(
    status(
      "git",
      ["-C", repositoryRoot, "worktree", "prune", "--expire", "now"],
      {}
    ),
    "Trusted-worktree metadata cleanup"
  );
}

async function verifySnapshotPr(context, dependencies = {}) {
  const run = dependencies.run ?? defaultRun;
  const status = dependencies.status ?? defaultStatus;
  validateIdentifiers(context);
  const candidateRef = `refs/codex-public-review/pr-${context.prNumber}-${context.headSha}`;
  const baseRef = `refs/codex-public-review/base-${context.prNumber}-${context.baseSha}`;
  let tempRoot;
  let worktree;
  let worktreeRegistered = false;
  let result;
  let primaryError;
  const cleanupErrors = [];
  try {
    const binding = fetchAndBindCandidate(context, { run });
    console.log(
      `Bound snapshot verifier to head ${context.headSha} and base ${context.baseSha}.`
    );
    if (!binding.touchesSnapshot) {
      fetchAndAssertRemoteRefs(context, candidateRef, baseRef, run);
      console.log(
        "No public-review snapshot inputs changed; trusted check passed."
      );
      result = {
        skipped: true,
        headSha: context.headSha,
        baseSha: context.baseSha,
      };
    }

    if (binding.touchesSnapshot) {
      const { configBuffer, publicationBuffer, reviewBlobs } =
        exactCandidateBlobMaps(context.repositoryRoot, context.headSha, run);
      const baseConfigPath = path.join(
        context.repositoryRoot,
        ...CONFIG_PATH.split("/")
      );
      const baseConfig = parseJson(
        fs.readFileSync(baseConfigPath),
        "trusted base config"
      );
      const candidateConfig = parseJson(configBuffer, "candidate config");
      const versions = baseIndexVersions(context.repositoryRoot);
      validateTrustedConfigPolicy(baseConfig, candidateConfig, versions);
      const basePublicationPath = path.join(
        context.repositoryRoot,
        ...PUBLICATION_CONFIG_PATH.split("/")
      );
      const basePublication = parseJson(
        fs.readFileSync(basePublicationPath),
        "trusted base publication config"
      );
      const candidatePublication = parseJson(
        publicationBuffer,
        "candidate publication config"
      );
      validateTrustedPublicationPolicy(
        basePublication,
        candidatePublication,
        candidateConfig,
        versions
      );

      tempRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), `public-review-trust-${context.prNumber}-`)
      );
      const streamRepository =
        dependencies.initializeStreamRepository?.(tempRoot) ??
        initializeOfficialStreamRepository(tempRoot, run);
      verifyOfficialStreamInputs(
        streamRepository,
        baseConfig,
        candidateConfig,
        {
          run,
          status,
        }
      );
      const solcPath =
        (await dependencies.installSolc?.(tempRoot)) ??
        (await installTrustedSolc(tempRoot, {
          run,
          download: dependencies.download,
        }));
      worktree = path.join(tempRoot, "regen");
      createTrustedWorktree(
        context.repositoryRoot,
        context.baseSha,
        worktree,
        run
      );
      worktreeRegistered = true;
      validateTrustedWorktree(worktree, context.baseSha, run);
      const candidateConfigPath = path.join(
        worktree,
        ...CONFIG_PATH.split("/")
      );
      fs.writeFileSync(candidateConfigPath, configBuffer);
      const generatorPath = path.join(
        worktree,
        "scripts",
        "public-reviews",
        "solidity-reference.cjs"
      );
      run(
        process.execPath,
        [
          generatorPath,
          "--config",
          CONFIG_PATH,
          "--source-repo",
          streamRepository,
          "--solc",
          solcPath,
        ],
        { cwd: worktree, timeout: 10 * 60_000 }
      );
      verifyNoGenerationResidue(worktree);
      const regeneratedBlobs = filesystemBlobMap(worktree, REVIEW_ROOT);
      compareCandidateToRegeneration(reviewBlobs, regeneratedBlobs);
      fetchAndAssertRemoteRefs(context, candidateRef, baseRef, run);
      console.log(
        `Trusted snapshot verified ${regeneratedBlobs.size} blobs for head ${context.headSha} against base ${context.baseSha}.`
      );
      result = {
        skipped: false,
        blobCount: regeneratedBlobs.size,
        headSha: context.headSha,
        baseSha: context.baseSha,
      };
    }
  } catch (error) {
    primaryError = error;
  } finally {
    if (worktreeRegistered) {
      try {
        removeTrustedWorktree(context.repositoryRoot, worktree, status);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (tempRoot) {
      try {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    for (const temporaryRef of [candidateRef, baseRef]) {
      try {
        deleteCandidateRef(context.repositoryRoot, temporaryRef, status);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  }
  if (primaryError && cleanupErrors.length > 0) {
    throw new AggregateError(
      [primaryError, ...cleanupErrors],
      "Snapshot verification and trusted cleanup both failed."
    );
  }
  if (primaryError) {
    throw primaryError;
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      cleanupErrors,
      "Snapshot verification cleanup failed."
    );
  }
  return result;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const context = {
    ...args,
    repositoryRoot: process.cwd(),
  };
  verifySnapshotPr(context).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIG_PATH,
  FRONTEND_REMOTE,
  GIT_REGULAR_MODE,
  PUBLICATION_CONFIG_PATH,
  PROTECTED_TRUST_ROOT_PATHS,
  REVIEW_ROOT,
  SOLC_LONG_VERSION,
  SOLC_SHA256,
  SOLC_URL,
  STREAM_REMOTE,
  STREAM_REPOSITORY,
  baseIndexVersions,
  compareCandidateToRegeneration,
  decodeUtf8,
  exactCandidateBlobMaps,
  fetchAndAssertRemoteRefs,
  fetchAndBindCandidate,
  filesystemBlobMap,
  immutableConfigProjection,
  installTrustedSolc,
  parseArgs,
  parseLsTree,
  parseNameStatus,
  readGitBlob,
  sha256,
  snapshotChangePolicy,
  validateIdentifiers,
  validateSolcDigest,
  validateTrustedConfigPolicy,
  validateTrustedPublicationPolicy,
  verifyOfficialStreamInputs,
  verifySnapshotPr,
};
