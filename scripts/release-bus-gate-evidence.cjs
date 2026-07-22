#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");

const ALLOWED_SHARD_COUNTS = new Set([1, 2, 4]);
const PHASES = ["lint", "typecheck", "unit_tests", "build"];
const STATUSES = new Set([
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
]);
const MAX_FAILURES = 100;
const MAX_TEXT_LENGTH = 500;
const BASE_EVIDENCE_CONTRACT_VERSION = 2;
const EVIDENCE_IDENTITY_FIELDS = [
  "base_sha",
  "environment",
  "build_profile_digest",
  "gate_fingerprint",
  "workflow_sha",
  "workflow_digest",
  "node_version",
  "package_manager",
];
const EVIDENCE_RECORD_KINDS = new Set([
  "dependency_install",
  "manifest",
  "manifest_error",
  "phase",
  "jest_shard",
]);
const FRONTEND_GATE_WORKFLOW = ".github/workflows/release-bus-base-canary.yml";
const FRONTEND_PREFLIGHT_WORKFLOW =
  ".github/workflows/release-bus-preflight.yml";
const FRONTEND_BASE_IDENTITY_WORKFLOW =
  ".github/workflows/release-bus-base-evidence-identity.yml";
const FRONTEND_STAGING_DEPLOY_WORKFLOW =
  ".github/workflows/release-bus-deploy-staging.yml";
const FRONTEND_STAGING_E2E_WORKFLOW = ".github/workflows/staging-e2e.yml";
const FRONTEND_GATE_BASE_FILES = [
  "bin/6529",
  "jest.config.js",
  "jest.setup.js",
  "package.json",
  "pnpm-lock.yaml",
];
const FRONTEND_GATE_TOOLING_FILES = [
  "scripts/release-bus-authorize-operation.sh",
  "scripts/release-bus-build-profile.cjs",
  "scripts/release-bus-frontend-gate.sh",
  "scripts/release-bus-gate-evidence.cjs",
  "scripts/release-bus-install-dependencies.cjs",
  "scripts/release-bus-preflight-evidence.cjs",
  "scripts/release-bus-report-progress.mjs",
];

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--"))
      throw new Error(`Unexpected argument: ${value}`);
    const name = value.slice(2);
    const next = values[index + 1];
    if (next === undefined || next.startsWith("--")) {
      result[name] = "true";
      continue;
    }
    result[name] = next;
    index += 1;
  }
  return result;
}

function required(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}`);
  }
  return value;
}

function integer(value, name, minimum = 0) {
  if (!/^[0-9]+$/.test(value)) throw new Error(`Invalid --${name}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`Invalid --${name}`);
  }
  return parsed;
}

function digest(args, name) {
  const value = required(args, name);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`Invalid --${name}`);
  return value;
}

function safeText(value, maximum = MAX_TEXT_LENGTH) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function stableSort(values) {
  return [...values].sort((left, right) => {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function frontendGateContract({
  baseSha,
  workflowSha,
  baseFileContents,
  workflowFileContents,
  gateMode,
  shardCount,
  buildProfileDigest,
  nodeVersion = "22",
}) {
  if (!/^[a-f0-9]{40}$/.test(baseSha)) throw new Error("Invalid base SHA");
  if (!/^[a-f0-9]{40}$/.test(workflowSha))
    throw new Error("Invalid workflow SHA");
  if (!new Set(["legacy", "shadow", "sharded"]).has(gateMode))
    throw new Error("Invalid gate mode");
  if (!ALLOWED_SHARD_COUNTS.has(shardCount))
    throw new Error("Unsupported shard count");
  if (!/^[1-9][0-9]{0,2}$/.test(nodeVersion))
    throw new Error("Invalid Node version");
  if (!/^[a-f0-9]{64}$/.test(buildProfileDigest))
    throw new Error("Invalid build-profile digest");
  const workflowFiles = [
    FRONTEND_GATE_WORKFLOW,
    FRONTEND_PREFLIGHT_WORKFLOW,
    FRONTEND_BASE_IDENTITY_WORKFLOW,
    FRONTEND_STAGING_DEPLOY_WORKFLOW,
    FRONTEND_STAGING_E2E_WORKFLOW,
    ...FRONTEND_GATE_TOOLING_FILES,
  ];
  for (const file of FRONTEND_GATE_BASE_FILES) {
    if (typeof baseFileContents[file] !== "string")
      throw new Error(`Missing base contract file ${file}`);
  }
  for (const file of workflowFiles) {
    if (typeof workflowFileContents[file] !== "string")
      throw new Error(`Missing workflow contract file ${file}`);
  }
  const packageJson = JSON.parse(baseFileContents["package.json"]);
  const packageManager = packageJson?.packageManager;
  if (
    typeof packageManager !== "string" ||
    !/^pnpm@[A-Za-z0-9.+-]{1,122}$/.test(packageManager)
  ) {
    throw new Error("Invalid package-manager contract");
  }
  const componentDigests = Object.fromEntries([
    ...FRONTEND_GATE_BASE_FILES.map((file) => [
      file,
      sha256(baseFileContents[file]),
    ]),
    ...workflowFiles.map((file) => [file, sha256(workflowFileContents[file])]),
  ]);
  const workflowDigest = componentDigests[FRONTEND_GATE_WORKFLOW];
  const behaviorDigest = sha256(
    JSON.stringify({
      schema_version: BASE_EVIDENCE_CONTRACT_VERSION,
      kind: "frontend_base_evidence_contract",
      repository: "frontend",
      environment: "orchestration",
      node_version: nodeVersion,
      package_manager: packageManager,
      gate_mode: gateMode,
      shard_count: shardCount,
      build_profile_digest: buildProfileDigest,
      component_digests: componentDigests,
    })
  );
  const fingerprint = sha256(
    JSON.stringify({
      schema_version: BASE_EVIDENCE_CONTRACT_VERSION,
      kind: "frontend_base_evidence_contract",
      repository: "frontend",
      environment: "orchestration",
      base_sha: baseSha,
      workflow_sha: workflowSha,
      workflow_digest: workflowDigest,
      node_version: nodeVersion,
      package_manager: packageManager,
      gate_mode: gateMode,
      shard_count: shardCount,
      build_profile_digest: buildProfileDigest,
      component_digests: componentDigests,
    })
  );
  return {
    schema_version: BASE_EVIDENCE_CONTRACT_VERSION,
    kind: "frontend_base_evidence_contract",
    repository: "frontend",
    environment: "orchestration",
    base_sha: baseSha,
    behavior_digest: behaviorDigest,
    gate_fingerprint: fingerprint,
    workflow_sha: workflowSha,
    workflow_digest: workflowDigest,
    node_version: nodeVersion,
    package_manager: packageManager,
    gate_mode: gateMode,
    shard_count: shardCount,
    build_profile_digest: buildProfileDigest,
    component_digests: componentDigests,
  };
}

function contractFromRepository(args) {
  const repoRoot = path.resolve(required(args, "repo-root"));
  const baseSha = required(args, "base-sha");
  const workflowSha = required(args, "workflow-sha");
  const head = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (head !== baseSha)
    throw new Error("Base checkout does not match base SHA");
  const baseFileContents = Object.fromEntries(
    FRONTEND_GATE_BASE_FILES.map((file) => [
      file,
      fs.readFileSync(path.join(repoRoot, file), "utf8"),
    ])
  );
  const workflowFileContents = Object.fromEntries(
    [
      FRONTEND_GATE_WORKFLOW,
      FRONTEND_PREFLIGHT_WORKFLOW,
      FRONTEND_BASE_IDENTITY_WORKFLOW,
      FRONTEND_STAGING_DEPLOY_WORKFLOW,
      FRONTEND_STAGING_E2E_WORKFLOW,
      ...FRONTEND_GATE_TOOLING_FILES,
    ].map((file) => [
      file,
      execFileSync("git", ["-C", repoRoot, "show", `${workflowSha}:${file}`], {
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
      }),
    ])
  );
  return frontendGateContract({
    baseSha,
    workflowSha,
    baseFileContents,
    workflowFileContents,
    gateMode: required(args, "mode"),
    shardCount: integer(required(args, "shard-count"), "shard-count", 1),
    buildProfileDigest: digest(args, "build-profile-digest"),
  });
}

function validateEvidenceIdentity(identity) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    throw new Error("Evidence identity is missing");
  }
  if (!/^[a-f0-9]{40}$/.test(String(identity.base_sha ?? ""))) {
    throw new Error("Evidence identity has an invalid base SHA");
  }
  if (identity.environment !== "orchestration") {
    throw new Error("Evidence identity has an invalid environment");
  }
  if (!/^[a-f0-9]{64}$/.test(String(identity.gate_fingerprint ?? ""))) {
    throw new Error("Evidence identity has an invalid gate fingerprint");
  }
  if (!/^[a-f0-9]{64}$/.test(String(identity.build_profile_digest ?? ""))) {
    throw new Error("Evidence identity has an invalid build-profile digest");
  }
  if (!/^[a-f0-9]{40}$/.test(String(identity.workflow_sha ?? ""))) {
    throw new Error("Evidence identity has an invalid workflow SHA");
  }
  if (!/^[a-f0-9]{64}$/.test(String(identity.workflow_digest ?? ""))) {
    throw new Error("Evidence identity has an invalid workflow digest");
  }
  if (identity.node_version !== "22") {
    throw new Error("Evidence identity has an invalid Node contract");
  }
  if (
    !/^pnpm@[A-Za-z0-9.+-]{1,122}$/.test(String(identity.package_manager ?? ""))
  ) {
    throw new Error(
      "Evidence identity has an invalid package-manager contract"
    );
  }
  return Object.fromEntries(
    EVIDENCE_IDENTITY_FIELDS.map((field) => [field, identity[field]])
  );
}

function evidenceIdentityFromArgs(args) {
  return validateEvidenceIdentity({
    base_sha: required(args, "base-sha"),
    environment: required(args, "environment"),
    build_profile_digest: digest(args, "build-profile-digest"),
    gate_fingerprint: required(args, "gate-fingerprint"),
    workflow_sha: required(args, "workflow-sha"),
    workflow_digest: required(args, "workflow-digest"),
    node_version: required(args, "node-version"),
    package_manager: required(args, "package-manager"),
  });
}

function sameEvidenceIdentity(record, identity) {
  return EVIDENCE_IDENTITY_FIELDS.every(
    (field) => record?.[field] === identity[field]
  );
}

function relativeTestPath(testPath, repoRoot) {
  const relative = path.relative(repoRoot, testPath).split(path.sep).join("/");
  if (!relative || relative === ".." || relative.startsWith("../")) {
    throw new Error("Jest returned a test path outside the repository");
  }
  return safeText(relative);
}

function manifestFromRaw(raw, repoRoot) {
  const prefix = `${path.resolve(repoRoot)}${path.sep}`;
  const files = raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(prefix))
    .map((line) => relativeTestPath(line, repoRoot));
  const unique = new Set(files);
  if (unique.size !== files.length) {
    throw new Error("Jest test-file inventory contains duplicates");
  }
  return stableSort(unique);
}

function phaseRecord({ name, status, durationMs, exitCode, source, identity }) {
  if (!PHASES.includes(name)) throw new Error("Invalid phase name");
  if (!STATUSES.has(status)) throw new Error("Invalid phase status");
  return {
    schema_version: 1,
    kind: "phase",
    ...(identity ? validateEvidenceIdentity(identity) : {}),
    source,
    name,
    status,
    duration_ms: durationMs,
    exit_code: exitCode,
  };
}

function failingTests(result, repoRoot) {
  const failures = [];
  for (const suite of result.testResults ?? []) {
    const suitePath = relativeTestPath(suite.name, repoRoot);
    for (const assertion of suite.assertionResults ?? []) {
      if (assertion.status !== "failed") continue;
      failures.push({
        suite: suitePath,
        test: safeText(
          [...(assertion.ancestorTitles ?? []), assertion.title]
            .map((item) => safeText(item, 200))
            .filter(Boolean)
            .join(" > ")
        ),
      });
    }
  }
  return failures.slice(0, MAX_FAILURES);
}

function jestRecord({
  result,
  manifest,
  repoRoot,
  shardIndex,
  shardCount,
  durationMs,
  exitCode,
  source,
  identity,
  injectedFailure = false,
}) {
  if (!ALLOWED_SHARD_COUNTS.has(shardCount)) {
    throw new Error("Unsupported shard count");
  }
  if (shardIndex < 1 || shardIndex > shardCount) {
    throw new Error("Invalid shard index");
  }
  const executedFiles = stableSort(
    (result.testResults ?? []).map((suite) =>
      relativeTestPath(suite.name, repoRoot)
    )
  );
  const failingSuitePaths = stableSort(
    (result.testResults ?? [])
      .filter((suite) => suite.status === "failed")
      .map((suite) => relativeTestPath(suite.name, repoRoot))
  ).slice(0, MAX_FAILURES);
  return {
    schema_version: 1,
    kind: "jest_shard",
    ...(identity ? validateEvidenceIdentity(identity) : {}),
    source,
    shard_index: shardIndex,
    shard_count: shardCount,
    status: exitCode === 0 && result.success ? "SUCCEEDED" : "FAILED",
    injected_failure: injectedFailure,
    duration_ms: durationMs,
    exit_code: exitCode,
    planned_test_files: manifest.files,
    executed_test_files: executedFiles,
    counts: {
      test_files: executedFiles.length,
      test_suites: Number(result.numTotalTestSuites ?? 0),
      passed_test_suites: Number(result.numPassedTestSuites ?? 0),
      failed_test_suites: Number(result.numFailedTestSuites ?? 0),
      pending_test_suites: Number(result.numPendingTestSuites ?? 0),
      tests: Number(result.numTotalTests ?? 0),
      passed_tests: Number(result.numPassedTests ?? 0),
      failed_tests: Number(result.numFailedTests ?? 0),
      pending_tests: Number(result.numPendingTests ?? 0),
      todo_tests: Number(result.numTodoTests ?? 0),
    },
    failing_suites: failingSuitePaths,
    failing_tests: failingTests(result, repoRoot),
  };
}

function recursiveJsonFiles(root) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith(".json"))
        result.push(absolute);
    }
  };
  visit(root);
  return stableSort(result);
}

function loadEvidence(root) {
  const records = [];
  for (const file of recursiveJsonFiles(root)) {
    try {
      const value = readJson(file);
      if (
        value &&
        typeof value === "object" &&
        typeof value.kind === "string"
      ) {
        records.push(value);
      }
    } catch {
      records.push({ kind: "malformed", file: safeText(path.basename(file)) });
    }
  }
  return records;
}

function sumCounts(shards) {
  const fields = [
    "test_files",
    "test_suites",
    "passed_test_suites",
    "failed_test_suites",
    "pending_test_suites",
    "tests",
    "passed_tests",
    "failed_tests",
    "pending_tests",
    "todo_tests",
  ];
  return Object.fromEntries(
    fields.map((field) => [
      field,
      shards.reduce(
        (total, shard) => total + Number(shard.counts?.[field] ?? 0),
        0
      ),
    ])
  );
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return stableSort(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([value]) => value)
  );
}

function sameValues(left, right) {
  return JSON.stringify(stableSort(left)) === JSON.stringify(stableSort(right));
}

function sameCounts(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function uniqueByName(records, kind, source) {
  return records.filter(
    (record) => record.kind === kind && record.source === source
  );
}

function buildGateSummary({
  records,
  source,
  shardCount,
  jobResults,
  identity,
}) {
  const globalManifests = uniqueByName(records, "manifest", source).filter(
    (record) => record.scope === "all"
  );
  const shardManifests = uniqueByName(records, "manifest", source).filter(
    (record) => record.scope === "shard"
  );
  const shards = uniqueByName(records, "jest_shard", source);
  const phases = PHASES.map((name) => {
    const matches = uniqueByName(records, "phase", source).filter(
      (record) => record.name === name
    );
    if (name === "unit_tests") {
      const duration = shards.length
        ? Math.max(...shards.map((shard) => Number(shard.duration_ms ?? 0)))
        : 0;
      return {
        name,
        status:
          shards.length === shardCount &&
          shards.every((shard) => shard.status === "SUCCEEDED")
            ? "SUCCEEDED"
            : "FAILED",
        duration_ms: duration,
      };
    }
    if (matches.length !== 1) return { name, status: "FAILED", duration_ms: 0 };
    return {
      name,
      status: matches[0].status,
      duration_ms: Number(matches[0].duration_ms ?? 0),
    };
  });
  const expected = globalManifests.length === 1 ? globalManifests[0].files : [];
  const planned = shardManifests.flatMap((manifest) => manifest.files ?? []);
  const executed = shards.flatMap((shard) => shard.executed_test_files ?? []);
  const plannedSet = new Set(planned);
  const executedSet = new Set(executed);
  const expectedSet = new Set(expected);
  const missingFiles = stableSort(
    expected.filter((file) => !executedSet.has(file))
  );
  const unexpectedFiles = stableSort(
    executed.filter((file) => !expectedSet.has(file))
  );
  const duplicateFiles = duplicateValues(executed);
  const plannedMissing = stableSort(
    expected.filter((file) => !plannedSet.has(file))
  );
  const plannedUnexpected = stableSort(
    planned.filter((file) => !expectedSet.has(file))
  );
  const plannedDuplicates = duplicateValues(planned);
  const shardCoordinates = stableSort(
    shards.map((shard) => `${shard.shard_index}/${shard.shard_count}`)
  );
  const expectedCoordinates = Array.from(
    { length: shardCount },
    (_, index) => `${index + 1}/${shardCount}`
  );
  const errors = [];
  const sourceEvidence = records.filter(
    (record) =>
      record.source === source && EVIDENCE_RECORD_KINDS.has(record.kind)
  );
  const failedDependencyInstall = sourceEvidence.find(
    (record) =>
      record.kind === "dependency_install" && record.status === "FAILED"
  );
  if (
    identity &&
    (sourceEvidence.length === 0 ||
      sourceEvidence.some((record) => !sameEvidenceIdentity(record, identity)))
  ) {
    errors.push("evidence identity is missing or mismatched");
  }
  if (globalManifests.length !== 1)
    errors.push("expected exactly one global Jest manifest");
  if (shardManifests.length !== shardCount)
    errors.push("missing shard plan manifest");
  if (shards.length !== shardCount) errors.push("missing shard result");
  if (
    JSON.stringify(shardCoordinates) !== JSON.stringify(expectedCoordinates)
  ) {
    errors.push("invalid shard coordinates");
  }
  if (missingFiles.length > 0)
    errors.push("expected Jest files were not executed");
  if (unexpectedFiles.length > 0)
    errors.push("unexpected Jest files were executed");
  if (duplicateFiles.length > 0)
    errors.push("Jest files executed more than once");
  if (plannedMissing.length > 0 || plannedDuplicates.length > 0) {
    errors.push("Jest shard plans are incomplete or overlapping");
  }
  if (plannedUnexpected.length > 0) {
    errors.push("Jest shard plans contain unexpected files");
  }
  for (const shard of shards) {
    const matchingManifests = shardManifests.filter(
      (manifest) =>
        manifest.shard_index === shard.shard_index &&
        manifest.shard_count === shard.shard_count
    );
    if (
      matchingManifests.length !== 1 ||
      !sameValues(
        matchingManifests[0]?.files ?? [],
        shard.executed_test_files ?? []
      )
    ) {
      errors.push(
        `Jest shard ${safeText(shard.shard_index, 10)}/${safeText(shard.shard_count, 10)} did not execute its exact plan`
      );
    }
  }
  if (records.some((record) => record.kind === "malformed"))
    errors.push("malformed evidence");
  if (sourceEvidence.some((record) => record.kind === "manifest_error"))
    errors.push("Jest manifest capture failed");
  for (const [job, result] of Object.entries(jobResults)) {
    if (result !== "success") {
      errors.push(`${safeText(job, 80)} job did not succeed`);
    }
  }
  if (phases.some((phase) => phase.status !== "SUCCEEDED")) {
    errors.push("one or more required phases failed");
  }
  const counts = sumCounts(shards);
  if (
    counts.pending_test_suites > 0 ||
    counts.pending_tests > 0 ||
    counts.todo_tests > 0
  ) {
    errors.push("Jest reported skipped or todo tests");
  }
  const shardDurations = shards
    .map((shard) => Number(shard.duration_ms ?? 0))
    .filter((duration) => duration >= 0);
  const maximumShardDuration = shardDurations.length
    ? Math.max(...shardDurations)
    : 0;
  const minimumShardDuration = shardDurations.length
    ? Math.min(...shardDurations)
    : 0;
  const status = errors.length === 0 ? "SUCCEEDED" : "FAILED";
  const failureClass =
    status === "SUCCEEDED"
      ? null
      : failedDependencyInstall?.failure_class === "INFRASTRUCTURE_TRANSIENT"
        ? "INFRASTRUCTURE_TRANSIENT"
        : failedDependencyInstall?.failure_class === "SOURCE"
          ? "SOURCE"
          : failedDependencyInstall
            ? "UNKNOWN"
            : "SOURCE";
  const shardSummaries = Array.from({ length: shardCount }, (_, offset) => {
    const index = offset + 1;
    const shard = shards.find(
      (candidate) =>
        candidate.shard_index === index && candidate.shard_count === shardCount
    );
    return shard
      ? {
          index: shard.shard_index,
          count: shard.shard_count,
          status: shard.status,
          injected_failure: shard.injected_failure === true,
          duration_ms: shard.duration_ms,
          counts: shard.counts,
        }
      : {
          index,
          count: shardCount,
          status: "FAILED",
          injected_failure: false,
          duration_ms: 0,
          counts: sumCounts([]),
        };
  });
  return {
    status,
    failure_class: failureClass,
    failure_phase: failedDependencyInstall ? "dependency_install" : "gate",
    retryable: failureClass === "INFRASTRUCTURE_TRANSIENT",
    phases,
    counts,
    shards: shardSummaries,
    shard_imbalance_ms: maximumShardDuration - minimumShardDuration,
    missing_files: missingFiles.slice(0, MAX_FAILURES),
    duplicate_files: duplicateFiles.slice(0, MAX_FAILURES),
    unexpected_files: unexpectedFiles.slice(0, MAX_FAILURES),
    failing_suites: stableSort(
      shards.flatMap((shard) => shard.failing_suites ?? [])
    ).slice(0, MAX_FAILURES),
    failing_tests: shards
      .flatMap((shard) => shard.failing_tests ?? [])
      .slice(0, MAX_FAILURES),
    errors: errors.map((error) => safeText(error, 200)).slice(0, 50),
  };
}

function jobLinks(jobsFile) {
  if (!jobsFile || !fs.existsSync(jobsFile)) return [];
  try {
    const jobs = readJson(jobsFile).jobs ?? [];
    return jobs
      .filter(
        (job) =>
          typeof job.name === "string" &&
          /^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/\d+\/job\/\d+$/.test(
            job.html_url ?? ""
          )
      )
      .map((job) => ({ name: safeText(job.name, 120), url: job.html_url }))
      .slice(0, 100);
  } catch {
    return [];
  }
}

function finalSummary({ args, records, jobResults }) {
  const mode = required(args, "mode");
  if (!new Set(["legacy", "shadow", "sharded"]).has(mode)) {
    throw new Error("Invalid gate mode");
  }
  const shardCount = integer(required(args, "shard-count"), "shard-count", 1);
  if (!ALLOWED_SHARD_COUNTS.has(shardCount))
    throw new Error("Unsupported shard count");
  const identity = evidenceIdentityFromArgs(args);
  const legacy =
    mode === "sharded"
      ? null
      : buildGateSummary({
          records,
          source: "legacy",
          shardCount: 1,
          jobResults: {
            legacy: jobResults.legacy,
            source_mutation: jobResults.source_mutation,
          },
          identity,
        });
  const sharded =
    mode === "legacy"
      ? null
      : buildGateSummary({
          records,
          source: "parallel",
          shardCount,
          jobResults: {
            lint: jobResults.lint,
            typecheck: jobResults.typecheck,
            build: jobResults.build,
            inventory: jobResults.inventory,
            jest: jobResults.jest,
            source_mutation: jobResults.source_mutation,
            ...(jobResults.packaging_build === undefined
              ? {}
              : { packaging_build: jobResults.packaging_build }),
          },
          identity,
        });
  const authoritative = mode === "sharded" ? sharded : legacy;
  const equivalent =
    mode === "shadow"
      ? legacy.status === sharded.status &&
        sameCounts(legacy.counts, sharded.counts)
      : null;
  const skippedTestSuites = authoritative?.counts?.pending_test_suites;
  if (!Number.isSafeInteger(skippedTestSuites) || skippedTestSuites < 0) {
    throw new Error(
      "Authoritative gate evidence has an invalid skipped-suite count"
    );
  }
  const runUrl = required(args, "run-url");
  if (
    !/^https:\/\/github\.com\/6529-Collections\/6529seize-frontend\/actions\/runs\/\d+$/.test(
      runUrl
    )
  ) {
    throw new Error("Invalid run URL");
  }
  return {
    schema_version: 1,
    kind: "base_canary_summary",
    status: authoritative?.status ?? "FAILED",
    failure_class:
      authoritative?.status === "SUCCEEDED"
        ? null
        : (authoritative?.failure_class ?? "UNKNOWN"),
    failure_phase:
      authoritative?.status === "SUCCEEDED"
        ? null
        : (authoritative?.failure_phase ?? "gate"),
    retryable: authoritative?.retryable === true,
    gate_mode: mode,
    fresh_or_reused: "fresh",
    ...identity,
    behavior_digest: digest(args, "behavior-digest"),
    shard_count: mode === "sharded" ? shardCount : 1,
    phases: authoritative?.phases ?? [],
    phase_durations_ms: Object.fromEntries(
      (authoritative?.phases ?? []).map((phase) => [
        phase.name,
        phase.duration_ms,
      ])
    ),
    totals: authoritative?.counts ?? sumCounts([]),
    skipped_test_suites: skippedTestSuites,
    shards: authoritative?.shards ?? [],
    shard_imbalance_ms: authoritative?.shard_imbalance_ms ?? 0,
    missing_files: authoritative?.missing_files ?? [],
    duplicate_files: authoritative?.duplicate_files ?? [],
    unexpected_files: authoritative?.unexpected_files ?? [],
    failing_suites: authoritative?.failing_suites ?? [],
    failing_tests: authoritative?.failing_tests ?? [],
    errors: authoritative?.errors ?? ["authoritative evidence missing"],
    equivalence:
      mode === "shadow"
        ? {
            equivalent,
            serial_status: legacy.status,
            sharded_status: sharded.status,
            all_counts_equal: sameCounts(legacy.counts, sharded.counts),
            serial_totals: legacy.counts,
            sharded_totals: sharded.counts,
            sharded_phase_durations_ms: Object.fromEntries(
              sharded.phases.map((phase) => [phase.name, phase.duration_ms])
            ),
            sharded_shards: sharded.shards,
            sharded_shard_imbalance_ms: sharded.shard_imbalance_ms,
          }
        : null,
    run_url: runUrl,
    job_links: jobLinks(args["jobs-file"]),
    summary_artifact_name: safeText(required(args, "artifact-name"), 200),
  };
}

function run(command, args) {
  if (command === "fingerprint") {
    writeJson(required(args, "output"), contractFromRepository(args));
    return;
  }
  if (command === "matrix") {
    const count = integer(required(args, "shard-count"), "shard-count", 1);
    if (!ALLOWED_SHARD_COUNTS.has(count))
      throw new Error("Unsupported shard count");
    process.stdout.write(
      `${JSON.stringify({
        include: Array.from({ length: count }, (_, index) => ({
          index: index + 1,
          total: count,
        })),
      })}\n`
    );
    return;
  }
  if (command === "manifest") {
    const repoRoot = path.resolve(required(args, "repo-root"));
    const files = manifestFromRaw(
      fs.readFileSync(required(args, "raw"), "utf8"),
      repoRoot
    );
    const scope = required(args, "scope");
    const source = required(args, "source");
    const value = {
      schema_version: 1,
      kind: "manifest",
      ...evidenceIdentityFromArgs(args),
      source,
      scope,
      shard_index:
        scope === "shard"
          ? integer(required(args, "shard-index"), "shard-index", 1)
          : null,
      shard_count:
        scope === "shard"
          ? integer(required(args, "shard-count"), "shard-count", 1)
          : null,
      files,
    };
    if (files.length === 0)
      throw new Error("Jest test-file inventory is empty");
    writeJson(required(args, "output"), value);
    return;
  }
  if (command === "manifest-error") {
    const scope = required(args, "scope");
    if (!new Set(["all", "shard"]).has(scope))
      throw new Error("Invalid manifest-error scope");
    writeJson(required(args, "output"), {
      schema_version: 1,
      kind: "manifest_error",
      ...evidenceIdentityFromArgs(args),
      source: required(args, "source"),
      scope,
      shard_index:
        scope === "shard"
          ? integer(required(args, "shard-index"), "shard-index", 1)
          : null,
      shard_count:
        scope === "shard"
          ? integer(required(args, "shard-count"), "shard-count", 1)
          : null,
      exit_code: integer(required(args, "exit-code"), "exit-code", 1),
      error: "Jest manifest command failed",
    });
    return;
  }
  if (command === "phase") {
    writeJson(
      required(args, "output"),
      phaseRecord({
        name: required(args, "name"),
        status: required(args, "status"),
        durationMs: integer(required(args, "duration-ms"), "duration-ms"),
        exitCode: integer(required(args, "exit-code"), "exit-code"),
        source: required(args, "source"),
        identity: evidenceIdentityFromArgs(args),
      })
    );
    return;
  }
  if (command === "jest") {
    const repoRoot = path.resolve(required(args, "repo-root"));
    const resultsFile = required(args, "results");
    const injectedFailure = integer(
      required(args, "injected-failure"),
      "injected-failure"
    );
    if (injectedFailure > 1) throw new Error("Invalid --injected-failure");
    writeJson(
      required(args, "output"),
      jestRecord({
        result: fs.existsSync(resultsFile)
          ? readJson(resultsFile)
          : { success: false, testResults: [] },
        manifest: readJson(required(args, "manifest")),
        repoRoot,
        shardIndex: integer(required(args, "shard-index"), "shard-index", 1),
        shardCount: integer(required(args, "shard-count"), "shard-count", 1),
        durationMs: integer(required(args, "duration-ms"), "duration-ms"),
        exitCode: integer(required(args, "exit-code"), "exit-code"),
        source: required(args, "source"),
        identity: evidenceIdentityFromArgs(args),
        injectedFailure: injectedFailure === 1,
      })
    );
    return;
  }
  if (command === "aggregate") {
    const records = loadEvidence(required(args, "evidence-root"));
    const jobResults = readJson(required(args, "job-results"));
    const summary = finalSummary({ args, records, jobResults });
    writeJson(required(args, "output"), summary);
    if (summary.status !== "SUCCEEDED") process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

module.exports = {
  buildGateSummary,
  finalSummary,
  frontendGateContract,
  jestRecord,
  manifestFromRaw,
  phaseRecord,
  safeText,
};

if (require.main === module) {
  try {
    const [command, ...values] = process.argv.slice(2);
    if (!command) throw new Error("A command is required");
    run(command, parseArgs(values));
  } catch (error) {
    process.stderr.write(
      `${safeText(error instanceof Error ? error.message : error, 300)}\n`
    );
    process.exitCode = 2;
  }
}
