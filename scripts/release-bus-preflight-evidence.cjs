#!/usr/bin/env node

const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const { finalSummary, safeText } = require("./release-bus-gate-evidence.cjs");

const ALLOWED_SHARD_COUNTS = new Set([1, 2, 4]);
const PREFLIGHT_WORKFLOW = ".github/workflows/release-bus-preflight.yml";
const PREFLIGHT_BASE_FILES = [
  "bin/6529",
  "jest.config.js",
  "jest.setup.js",
  "package.json",
  "pnpm-lock.yaml",
];
const PREFLIGHT_TOOLING_FILES = [
  "scripts/release-bus-authorize-operation.sh",
  "scripts/release-bus-frontend-gate.sh",
  "scripts/release-bus-gate-evidence.cjs",
  "scripts/release-bus-install-dependencies.cjs",
  "scripts/release-bus-preflight-evidence.cjs",
  "scripts/release-bus-report-progress.mjs",
];

function parseArgs(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error("Arguments must be --key value pairs");
    }
    args[key.slice(2)] = value;
  }
  return args;
}

function required(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}`);
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function validateSha(value, label) {
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error(`Invalid ${label} SHA`);
}

function preflightContract({
  sourceSha,
  workflowSha,
  baseFileContents,
  workflowFileContents,
  shardCount,
  nodeVersion = "22",
  maxWorkers = 2,
}) {
  validateSha(sourceSha, "source");
  validateSha(workflowSha, "workflow");
  if (!Number.isInteger(shardCount) || !ALLOWED_SHARD_COUNTS.has(shardCount)) {
    throw new Error("Unsupported shard count");
  }
  if (nodeVersion !== "22") throw new Error("Invalid Node version");
  if (maxWorkers !== 2) throw new Error("Invalid Jest worker contract");
  for (const file of PREFLIGHT_BASE_FILES) {
    if (typeof baseFileContents[file] !== "string") {
      throw new Error(`Missing preflight base file ${file}`);
    }
  }
  const workflowFiles = [PREFLIGHT_WORKFLOW, ...PREFLIGHT_TOOLING_FILES];
  for (const file of workflowFiles) {
    if (typeof workflowFileContents[file] !== "string") {
      throw new Error(`Missing preflight workflow file ${file}`);
    }
  }
  let packageManager;
  try {
    packageManager = JSON.parse(
      baseFileContents["package.json"]
    )?.packageManager;
  } catch {
    throw new Error("Invalid package-manager contract");
  }
  if (
    typeof packageManager !== "string" ||
    !/^pnpm@[A-Za-z0-9.+-]{1,122}$/.test(packageManager)
  ) {
    throw new Error("Invalid package-manager contract");
  }
  const componentDigests = Object.fromEntries([
    ...PREFLIGHT_BASE_FILES.map((file) => [
      file,
      sha256(baseFileContents[file]),
    ]),
    ...workflowFiles.map((file) => [file, sha256(workflowFileContents[file])]),
  ]);
  const workflowDigest = componentDigests[PREFLIGHT_WORKFLOW];
  const behaviorDigest = sha256(
    JSON.stringify({
      schema_version: 1,
      kind: "frontend_preflight_contract",
      repository: "frontend",
      environment: "orchestration",
      node_version: nodeVersion,
      package_manager: packageManager,
      shard_count: shardCount,
      max_workers: maxWorkers,
      component_digests: componentDigests,
    })
  );
  const gateFingerprint = sha256(
    JSON.stringify({
      schema_version: 1,
      source_sha: sourceSha,
      workflow_sha: workflowSha,
      behavior_digest: behaviorDigest,
    })
  );
  return {
    schema_version: 1,
    kind: "frontend_preflight_contract",
    repository: "frontend",
    environment: "orchestration",
    source_sha: sourceSha,
    behavior_digest: behaviorDigest,
    gate_fingerprint: gateFingerprint,
    workflow_sha: workflowSha,
    workflow_digest: workflowDigest,
    node_version: nodeVersion,
    package_manager: packageManager,
    shard_count: shardCount,
    max_workers: maxWorkers,
    component_digests: componentDigests,
  };
}

function contractFromRepository(args) {
  const repoRoot = path.resolve(required(args, "repo-root"));
  const sourceSha = required(args, "source-sha");
  const workflowSha = required(args, "workflow-sha");
  const shardCount = Number(required(args, "shard-count"));
  const head = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  if (head !== sourceSha) throw new Error("Source checkout does not match SHA");
  const baseFileContents = Object.fromEntries(
    PREFLIGHT_BASE_FILES.map((file) => [
      file,
      fs.readFileSync(path.join(repoRoot, file), "utf8"),
    ])
  );
  const workflowFileContents = Object.fromEntries(
    [PREFLIGHT_WORKFLOW, ...PREFLIGHT_TOOLING_FILES].map((file) => [
      file,
      execFileSync("git", ["-C", repoRoot, "show", `${workflowSha}:${file}`], {
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
      }),
    ])
  );
  return preflightContract({
    sourceSha,
    workflowSha,
    baseFileContents,
    workflowFileContents,
    shardCount,
  });
}

function recursiveJsonFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(absolute);
      }
    }
  };
  visit(root);
  return files.sort();
}

function loadEvidence(root) {
  return recursiveJsonFiles(root).map((file) => {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return { kind: "malformed", file: safeText(path.basename(file)) };
    }
  });
}

function aggregate(args) {
  const targetLane = required(args, "target-lane");
  if (!new Set(["STAGING", "PRODUCTION"]).has(targetLane)) {
    throw new Error("Invalid target lane");
  }
  const records = loadEvidence(required(args, "evidence-root"));
  const jobResults = JSON.parse(
    fs.readFileSync(required(args, "job-results"), "utf8")
  );
  const summary = finalSummary({
    args: {
      ...args,
      mode: "sharded",
      "base-sha": required(args, "source-sha"),
    },
    records,
    jobResults,
  });
  return {
    ...summary,
    kind: "frontend_preflight_summary",
    target_lane: targetLane,
    build_environments:
      targetLane === "PRODUCTION" ? ["production", "staging"] : ["staging"],
  };
}

function run(command, args) {
  if (command === "fingerprint") {
    writeJson(required(args, "output"), contractFromRepository(args));
    return;
  }
  if (command === "aggregate") {
    const summary = aggregate(args);
    writeJson(required(args, "output"), summary);
    if (summary.status !== "SUCCEEDED") process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

module.exports = { preflightContract };

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
