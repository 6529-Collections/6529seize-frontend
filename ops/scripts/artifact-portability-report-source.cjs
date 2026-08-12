"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PROVENANCE_SCHEMA_VERSION = "artifact-portability-source-provenance.v1";
const STAGING_WORKFLOW = ".github/workflows/deploy-staging.yml";
const PRODUCTION_BUILD_WORKFLOW =
  ".github/workflows/production-build-artifact.yml";

const TRUSTED_REPORT_PRODUCERS = Object.freeze({
  staging: Object.freeze({
    [STAGING_WORKFLOW]: Object.freeze({
      events: Object.freeze(["push", "workflow_dispatch"]),
      branches: Object.freeze(["1a-staging"]),
      artifactPattern:
        /^(?:staging-frontend|manual-staging-frontend)-[1-9]\d{0,19}$/,
      artifactContracts: Object.freeze({
        "environment-bound-v3": "environment-bound-v1",
        "staging-deployment-v1": "staging-deployment-v1",
        "manual-staging-v1": "manual-staging-v1",
      }),
    }),
  }),
  production: Object.freeze({
    [PRODUCTION_BUILD_WORKFLOW]: Object.freeze({
      events: Object.freeze(["workflow_dispatch"]),
      branches: Object.freeze(["main"]),
      artifactPattern: /^production-frontend-[a-f0-9]{40}-[1-9]\d{0,19}$/,
      artifactContracts: Object.freeze({
        "environment-bound-v3": "environment-bound-v1",
        "production-deployment-v1": "production-deployment-v1",
        "production-prebuild-v1": "production-prebuild-v1",
        "production-prebuild-v2": "production-prebuild-v2",
      }),
    }),
  }),
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameFileIdentity(left, right) {
  const sameDevice =
    left.dev === right.dev || left.dev === 0n || right.dev === 0n;
  return sameDevice && left.ino === right.ino;
}

function sameFileSnapshot(left, right) {
  return (
    sameFileIdentity(left, right) &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function readStableRegularFile(filePath, label, encoding = null) {
  let descriptor;
  try {
    const noFollow = fs.constants.O_NOFOLLOW ?? 0;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The report workflow supplies an exact artifact path; O_NOFOLLOW is used where the platform exposes it.
    descriptor = fs.openSync(filePath, fs.constants.O_RDONLY | noFollow);
  } catch {
    throw new Error(`${label} is missing or unsafe: ${filePath}`);
  }
  try {
    const openedBefore = fs.fstatSync(descriptor, { bigint: true });
    // This post-open path check binds the directory entry to the opened file.
    // A later path replacement cannot change the descriptor bytes we read.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The opened descriptor is cross-checked against this exact path.
    const pathStats = fs.lstatSync(filePath, { bigint: true });
    invariant(
      openedBefore.isFile() &&
        pathStats.isFile() &&
        !pathStats.isSymbolicLink(),
      `${label} must be a regular file`
    );
    invariant(
      sameFileIdentity(openedBefore, pathStats),
      `${label} changed while opening`
    );
    let bytes;
    if (encoding) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- This is an already-opened, identity-checked file descriptor, not a path.
      bytes = fs.readFileSync(descriptor, encoding);
    } else {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- This is an already-opened, identity-checked file descriptor, not a path.
      bytes = fs.readFileSync(descriptor);
    }
    const openedAfter = fs.fstatSync(descriptor, { bigint: true });
    invariant(
      sameFileSnapshot(openedBefore, openedAfter),
      `${label} changed while reading`
    );
    return bytes;
  } finally {
    fs.closeSync(descriptor);
  }
}

function sha256File(filePath, label) {
  const bytes = readStableRegularFile(filePath, label);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function assertArtifactDirectory(directoryPath, label) {
  let stats;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The report workflow supplies an exact downloaded artifact path.
    stats = fs.lstatSync(directoryPath);
  } catch {
    throw new Error(`${label} is missing: ${directoryPath}`);
  }
  invariant(
    stats.isDirectory() && !stats.isSymbolicLink(),
    `${label} must be a real directory`
  );
}

function normalizeChecksumPath(value) {
  const candidate = value.replaceAll("\\", "/");
  const withoutLeadingDot = candidate.startsWith("./")
    ? candidate.slice(2)
    : candidate;
  const normalized = path.posix.normalize(withoutLeadingDot);
  invariant(
    withoutLeadingDot.length > 0 &&
      normalized === withoutLeadingDot &&
      normalized !== "." &&
      !normalized.startsWith("../") &&
      normalized !== ".." &&
      !normalized.startsWith("/") &&
      !normalized.includes("\\"),
    `checksum manifest contains an unsafe path: ${value}`
  );
  return normalized;
}

function walkArtifactFiles(root, relativeDirectory = "") {
  const directory = path.join(root, relativeDirectory);
  let children;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The report workflow supplies an exact downloaded artifact path.
    children = fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, "en"));
  } catch (error) {
    throw new Error(`Cannot read downloaded artifact: ${error.message}`);
  }
  const files = [];
  for (const child of children) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${child.name}`
      : child.name;
    const absolutePath = path.join(root, relativePath);
    invariant(
      !child.isSymbolicLink(),
      `downloaded artifact contains an unsupported symbolic link: ${relativePath}`
    );
    if (child.isDirectory()) {
      files.push(...walkArtifactFiles(root, relativePath));
    } else {
      invariant(
        child.isFile(),
        `downloaded artifact contains an unsupported entry: ${relativePath}`
      );
      files.push({
        path: relativePath.replaceAll(path.sep, "/"),
        sha256: sha256File(absolutePath, "downloaded artifact file"),
      });
    }
  }
  return files;
}

function verifyChecksumMembership(root) {
  const checksumPath = path.join(root, "SHA256SUMS");
  const checksumBytes = readStableRegularFile(
    checksumPath,
    "SHA256SUMS",
    "utf8"
  );
  const checksumDigest = crypto
    .createHash("sha256")
    .update(checksumBytes)
    .digest("hex");
  const lines = checksumBytes.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  invariant(lines.length > 0, "SHA256SUMS must contain at least one entry");
  const claimed = new Map();
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}(.+)$/.exec(line);
    invariant(match, `SHA256SUMS contains an invalid entry: ${line}`);
    const relativePath = normalizeChecksumPath(match[2]);
    invariant(
      !claimed.has(relativePath),
      `SHA256SUMS contains a duplicate path: ${relativePath}`
    );
    claimed.set(relativePath, match[1]);
  }
  const actual = new Map(
    walkArtifactFiles(root)
      .filter((entry) => entry.path !== "SHA256SUMS")
      .map((entry) => [entry.path, entry.sha256])
  );
  invariant(
    actual.size === claimed.size,
    "SHA256SUMS membership does not match the downloaded artifact files"
  );
  for (const [relativePath, digest] of actual) {
    invariant(
      claimed.has(relativePath),
      `SHA256SUMS omits artifact file: ${relativePath}`
    );
    invariant(
      claimed.get(relativePath) === digest,
      `SHA256SUMS digest does not match artifact file: ${relativePath}`
    );
  }
  for (const relativePath of claimed.keys()) {
    invariant(
      actual.has(relativePath),
      `SHA256SUMS references a file absent from the artifact: ${relativePath}`
    );
  }
  const entries = [...actual.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([relativePath, digest]) => ({ path: relativePath, sha256: digest }));
  return {
    sha256sums_sha256: checksumDigest,
    file_count: entries.length,
    membership_sha256: crypto
      .createHash("sha256")
      .update(JSON.stringify(entries))
      .digest("hex"),
  };
}

function readJsonFile(filePath, label) {
  const bytes = readStableRegularFile(filePath, label, "utf8");
  try {
    return {
      value: JSON.parse(bytes),
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function trustedProducer(role, workflowPath) {
  invariant(
    role === "staging" || role === "production",
    "report source role must be staging or production"
  );
  const producers = TRUSTED_REPORT_PRODUCERS[role];
  invariant(
    Object.hasOwn(producers, workflowPath),
    "report source workflow is not trusted for this environment"
  );
  return producers[workflowPath];
}

function verifyArtifactMetadata(options) {
  const metadata = options.artifactMetadata;
  invariant(
    isPlainObject(metadata),
    "report source artifact metadata is required"
  );
  const artifacts = Array.isArray(metadata.artifacts) ? metadata.artifacts : [];
  const matches = artifacts.filter(
    (artifact) =>
      isPlainObject(artifact) && artifact.name === options.artifactName
  );
  invariant(
    matches.length === 1,
    "report source GitHub artifact metadata must contain exactly one named artifact"
  );
  const artifact = matches[0];
  invariant(
    artifact.expired === false,
    "report source GitHub artifact expiry state is missing or expired"
  );
  invariant(
    /^[1-9]\d*$/.test(String(artifact.id || "")),
    "report source GitHub artifact ID is invalid"
  );
  invariant(
    isPlainObject(artifact.workflow_run) &&
      String(artifact.workflow_run.id) === String(options.expectedRunId),
    "report source GitHub artifact run does not match"
  );
  invariant(
    typeof artifact.digest === "string" &&
      /^sha256:[a-f0-9]{64}$/.test(artifact.digest),
    "report source GitHub artifact digest is missing or invalid"
  );
  if (options.expectedArtifactDigest !== undefined) {
    invariant(
      options.expectedArtifactDigest === artifact.digest,
      "report source GitHub artifact digest does not match the expected digest"
    );
  }
  return {
    id: String(artifact.id),
    name: artifact.name,
    digest: artifact.digest,
    workflow_run_id: String(artifact.workflow_run.id),
  };
}

function verifyReportRun(options, context) {
  const producer = trustedProducer(options.role, options.expectedWorkflowPath);
  invariant(
    typeof options.repository === "string" &&
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(options.repository),
    "report source repository is invalid"
  );
  invariant(
    /^[1-9]\d{0,19}$/.test(String(options.expectedRunId || "")),
    "report source run ID is invalid"
  );
  invariant(
    context.GIT_SHA_PATTERN.test(options.expectedRunHeadSha || "") &&
      context.GIT_SHA_PATTERN.test(options.expectedSourceSha || ""),
    "report source expected SHA is invalid"
  );
  invariant(
    typeof options.artifactName === "string" &&
      producer.artifactPattern.test(options.artifactName),
    "report source artifact name is invalid for the trusted workflow"
  );
  if (options.expectedWorkflowPath === STAGING_WORKFLOW) {
    invariant(
      options.artifactName === `staging-frontend-${options.expectedRunId}` ||
        options.artifactName ===
          `manual-staging-frontend-${options.expectedRunId}`,
      "staging artifact name does not bind the source run"
    );
  }
  if (options.expectedWorkflowPath === PRODUCTION_BUILD_WORKFLOW) {
    invariant(
      options.artifactName ===
        `production-frontend-${options.expectedSourceSha}-${options.expectedRunId}`,
      "production artifact name does not bind the source SHA and run"
    );
  }
  const run = options.run;
  invariant(isPlainObject(run), "report source run response must be an object");
  invariant(
    String(run.id) === String(options.expectedRunId),
    "report source run ID does not match"
  );
  invariant(
    run.path === options.expectedWorkflowPath,
    "report source workflow path does not match"
  );
  invariant(run.conclusion === "success", "report source run did not succeed");
  invariant(
    run.head_sha === options.expectedRunHeadSha,
    "report source run head SHA does not match"
  );
  invariant(
    producer.events.includes(run.event),
    "report source workflow event is not trusted"
  );
  invariant(
    producer.branches.includes(run.head_branch),
    "report source workflow branch is not trusted"
  );
  invariant(
    run.repository?.full_name === options.repository,
    "report source repository does not match"
  );
  invariant(
    run.head_repository?.full_name === options.repository,
    "report source head repository does not match"
  );
  return {
    schema_version: PROVENANCE_SCHEMA_VERSION,
    mode: "report_only",
    role: options.role,
    repository: options.repository,
    run: {
      id: String(run.id),
      workflow_path: run.path,
      event: run.event,
      head_branch: run.head_branch,
      conclusion: run.conclusion,
      head_sha: run.head_sha,
    },
    expected_artifact: {
      name: options.artifactName,
      source_sha: options.expectedSourceSha,
      environment: options.role,
    },
    authorization: {
      comparison_input_accepted: false,
      portable: false,
      reuse_authorized: false,
      promotion_authorized: false,
    },
  };
}

function verifyReportSource(options, context) {
  const runEvidence = verifyReportRun(options, context);
  const root = path.resolve(options.artifactRoot);
  assertArtifactDirectory(root, "report source artifact root");
  const artifactMetadata = verifyArtifactMetadata(options);
  const checksumMembership = verifyChecksumMembership(root);
  const inventoryPath = path.join(root, "artifact-portability.json");
  const manifestPath = path.join(root, "manifest.json");
  const inventoryFile = readJsonFile(
    inventoryPath,
    "report source portability inventory"
  );
  const manifestFile = readJsonFile(
    manifestPath,
    "report source artifact manifest"
  );
  const inventory = context.validateInventory(inventoryFile.value);
  const manifest = manifestFile.value;
  invariant(
    inventory.environment === options.role &&
      inventory.source.git_sha === options.expectedSourceSha,
    "report source inventory provenance does not match"
  );
  invariant(
    inventory.artifact.manifest_sha256 === manifestFile.sha256,
    "report source manifest digest does not match inventory"
  );
  invariant(
    manifest.repository === "frontend" &&
      manifest.source_sha === options.expectedSourceSha &&
      manifest.environment === options.role,
    "report source manifest provenance does not match"
  );
  invariant(
    manifest.package_sha256 === inventory.digests.package_sha256,
    "report source package digest does not match inventory"
  );
  const packageCandidates = ["package.zip", "target/package.zip"].filter(
    (relativePath) => {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Closed package candidates are resolved inside the verified artifact root.
        return fs.lstatSync(path.join(root, relativePath)).isFile();
      } catch {
        return false;
      }
    }
  );
  invariant(
    packageCandidates.length === 1,
    "report source artifact must contain exactly one recognized package file"
  );
  const packageRelativePath = packageCandidates[0];
  const packageDigest = sha256File(
    path.join(root, packageRelativePath),
    "report source package"
  );
  invariant(
    packageDigest === manifest.package_sha256 &&
      packageDigest === inventory.digests.package_sha256,
    "report source package bytes do not match the declared digest"
  );
  const manifestContractVersion =
    manifest.artifact_contract_version ||
    manifest.artifact_contract ||
    "unknown";
  invariant(
    inventory.artifact.contract === (manifest.artifact_contract || null) &&
      inventory.artifact.contract_version === manifestContractVersion,
    "report source artifact contract does not match manifest"
  );
  const producer = trustedProducer(options.role, options.expectedWorkflowPath);
  invariant(
    Object.hasOwn(
      producer.artifactContracts,
      inventory.artifact.contract_version
    ),
    "report source artifact contract version is not valid for the trusted workflow"
  );
  invariant(
    inventory.artifact.contract ===
      producer.artifactContracts[inventory.artifact.contract_version],
    "report source artifact contract does not match the trusted producer binding"
  );
  return {
    ...runEvidence,
    artifact: {
      name: options.artifactName,
      source_sha: inventory.source.git_sha,
      environment: inventory.environment,
      contract_version: inventory.artifact.contract_version,
      manifest_sha256: inventory.artifact.manifest_sha256,
      inventory_sha256: inventoryFile.sha256,
      package_sha256: inventory.digests.package_sha256,
      package_path: packageRelativePath,
      runtime_config_sha256: inventory.digests.runtime_config_sha256,
      extracted_tree_sha256: inventory.package_scan.tree_sha256,
      github_artifact_id: artifactMetadata.id,
      github_artifact_digest: artifactMetadata.digest,
      checksum_manifest_sha256: checksumMembership.sha256sums_sha256,
      checksum_membership_sha256: checksumMembership.membership_sha256,
      checksum_file_count: checksumMembership.file_count,
    },
    authorization: {
      comparison_input_accepted: true,
      portable: false,
      reuse_authorized: false,
      promotion_authorized: false,
    },
  };
}

function createReportSourceVerifier({ GIT_SHA_PATTERN, validateInventory }) {
  const context = { GIT_SHA_PATTERN, validateInventory };
  return {
    verifyReportRun: (options) => verifyReportRun(options, context),
    verifyReportSource: (options) => verifyReportSource(options, context),
  };
}
module.exports = {
  PROVENANCE_SCHEMA_VERSION,
  TRUSTED_REPORT_PRODUCERS,
  createReportSourceVerifier,
};
