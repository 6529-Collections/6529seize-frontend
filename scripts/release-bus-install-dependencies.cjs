#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_CAPTURE_BYTES = 128 * 1024;
const REQUIRED_BINARIES = ["cross-env", "eslint", "jest", "next", "tsc"];

const INFRASTRUCTURE_PATTERNS = [
  /Socket Firewall encountered an unexpected error/i,
  /\bfetch failed\b/i,
  /\bEAI_AGAIN\b/i,
  /\bECONNRESET\b/i,
  /\bECONNREFUSED\b/i,
  /\bENETUNREACH\b/i,
  /\bETIMEDOUT\b/i,
  /\bERR_SOCKET_TIMEOUT\b/i,
  /\bERR_PNPM_(?:FETCH|META_FETCH)[A-Z0-9_]*\b/i,
  /SFW_BIN does not exist/i,
  /Socket Firewall \(`sfw`\) is not installed/i,
  /\b(?:HTTP|status(?: code)?)\s*5\d\d\b/i,
];

const SOURCE_PATTERNS = [
  /\bERR_PNPM_OUTDATED_LOCKFILE\b/i,
  /\bERR_PNPM_LOCKFILE_CONFIG_MISMATCH\b/i,
  /\bERR_PNPM_PEER_DEP_ISSUES\b/i,
  /frozen-lockfile[^\n]*out.of.date/i,
];

function boundedInteger(value, fallback, minimum, maximum) {
  if (!/^[0-9]+$/.test(String(value ?? ""))) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

function appendCapture(current, chunk) {
  const next = `${current}${chunk}`;
  return next.length <= MAX_CAPTURE_BYTES
    ? next
    : next.slice(next.length - MAX_CAPTURE_BYTES);
}

function runInstall(command, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";
    let timedOut = false;
    let settled = false;
    const capture = (target, chunk) => {
      target.write(chunk);
      output = appendCapture(output, chunk.toString("utf8"));
    };
    child.stdout.on("data", (chunk) => capture(process.stdout, chunk));
    child.stderr.on("data", (chunk) => capture(process.stderr, chunk));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5_000).unref();
    }, timeoutMs);
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        status: 1,
        signal: null,
        timedOut,
        output: appendCapture(output, error.message),
        durationMs: Date.now() - startedAt,
      });
    });
    child.on("close", (status, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        status: status ?? 1,
        signal,
        timedOut,
        output,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function dependencyPath(repoRoot, dependency) {
  return path.join(repoRoot, "node_modules", ...dependency.split("/"));
}

function verifyInstall(repoRoot) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")
  );
  const dependencies = Object.keys({
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  });
  const missingDependencies = dependencies.filter(
    (dependency) =>
      !fs.existsSync(
        path.join(dependencyPath(repoRoot, dependency), "package.json")
      )
  );
  const missingBinaries = REQUIRED_BINARIES.filter(
    (binary) =>
      !fs.existsSync(path.join(repoRoot, "node_modules", ".bin", binary))
  );
  const metadataPresent = fs.existsSync(
    path.join(repoRoot, "node_modules", ".modules.yaml")
  );
  return {
    complete:
      metadataPresent &&
      missingDependencies.length === 0 &&
      missingBinaries.length === 0,
    metadata_present: metadataPresent,
    missing_dependencies: missingDependencies.slice(0, 50),
    missing_binaries: missingBinaries,
  };
}

function classifyFailure(result, verification) {
  if (result.timedOut) {
    return {
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "DEPENDENCY_INSTALL_TIMEOUT",
    };
  }
  if (result.status === 0 && !verification.complete) {
    return {
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "DEPENDENCY_INSTALL_INCOMPLETE",
    };
  }
  if (SOURCE_PATTERNS.some((pattern) => pattern.test(result.output))) {
    return {
      failure_class: "SOURCE",
      failure_code: "DEPENDENCY_CONTRACT_INVALID",
    };
  }
  if (INFRASTRUCTURE_PATTERNS.some((pattern) => pattern.test(result.output))) {
    return {
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "DEPENDENCY_TRANSPORT_FAILURE",
    };
  }
  return {
    failure_class: "UNKNOWN",
    failure_code: "DEPENDENCY_INSTALL_FAILED",
  };
}

function evidenceIdentity(environment = process.env) {
  return {
    base_sha: environment.RELEASE_BUS_BASE_SHA,
    environment: environment.RELEASE_BUS_EVIDENCE_ENVIRONMENT,
    gate_fingerprint: environment.RELEASE_BUS_GATE_FINGERPRINT,
    workflow_sha: environment.RELEASE_BUS_WORKFLOW_SHA,
    workflow_digest: environment.RELEASE_BUS_WORKFLOW_DIGEST,
    node_version: environment.RELEASE_BUS_NODE_VERSION,
    package_manager: environment.RELEASE_BUS_PACKAGE_MANAGER,
  };
}

function writeEvidence(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function installWithRetries(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const environment = options.environment ?? process.env;
  const maxAttempts = boundedInteger(
    options.maxAttempts ?? environment.RELEASE_BUS_INSTALL_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS,
    1,
    5
  );
  const timeoutMs = boundedInteger(
    options.timeoutMs ?? environment.RELEASE_BUS_INSTALL_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
    10_000,
    15 * 60 * 1000
  );
  const baseBackoffMs = boundedInteger(
    options.backoffMs ?? environment.RELEASE_BUS_INSTALL_BACKOFF_MS,
    5_000,
    0,
    60_000
  );
  const evidenceFile =
    options.evidenceFile ??
    environment.RELEASE_BUS_INSTALL_EVIDENCE ??
    path.join(
      environment.RUNNER_TEMP ?? repoRoot,
      "release-bus-evidence",
      "dependency-install.json"
    );
  const command = options.command ?? path.join(repoRoot, "bin", "6529");
  const args = options.args ?? ["install:frozen"];
  const attempts = [];

  if (
    environment.RELEASE_BUS_SOCKET_FIREWALL_OUTCOME &&
    environment.RELEASE_BUS_SOCKET_FIREWALL_OUTCOME !== "success"
  ) {
    const evidence = {
      schema_version: 1,
      kind: "dependency_install",
      source: environment.GITHUB_JOB === "legacy" ? "legacy" : "parallel",
      ...evidenceIdentity(environment),
      status: "FAILED",
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "SOCKET_FIREWALL_SETUP_FAILED",
      recovered: false,
      attempts: [],
    };
    writeEvidence(evidenceFile, evidence);
    const error = new Error(
      "Release Bus dependency installation failed (SOCKET_FIREWALL_SETUP_FAILED)"
    );
    error.evidence = evidence;
    throw error;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await (options.runInstall ?? runInstall)(command, args, {
      cwd: repoRoot,
      env: environment,
      timeoutMs,
    });
    const verification =
      result.status === 0
        ? (options.verifyInstall ?? verifyInstall)(repoRoot)
        : {
            complete: false,
            metadata_present: false,
            missing_dependencies: [],
            missing_binaries: [],
          };
    if (result.status === 0 && verification.complete) {
      attempts.push({
        attempt,
        status: "SUCCEEDED",
        duration_ms: result.durationMs,
      });
      const evidence = {
        schema_version: 1,
        kind: "dependency_install",
        source: environment.GITHUB_JOB === "legacy" ? "legacy" : "parallel",
        ...evidenceIdentity(environment),
        status: "SUCCEEDED",
        failure_class: null,
        failure_code: null,
        recovered: attempt > 1,
        attempts,
      };
      writeEvidence(evidenceFile, evidence);
      return evidence;
    }

    const classification = classifyFailure(result, verification);
    attempts.push({
      attempt,
      status: "FAILED",
      duration_ms: result.durationMs,
      timed_out: result.timedOut,
      exit_code: result.status,
      ...classification,
      verification,
    });
    const retryable =
      classification.failure_class === "INFRASTRUCTURE_TRANSIENT" &&
      attempt < maxAttempts;
    if (!retryable) {
      const evidence = {
        schema_version: 1,
        kind: "dependency_install",
        source: environment.GITHUB_JOB === "legacy" ? "legacy" : "parallel",
        ...evidenceIdentity(environment),
        status: "FAILED",
        ...classification,
        recovered: false,
        attempts,
      };
      writeEvidence(evidenceFile, evidence);
      const error = new Error(
        `Release Bus dependency installation failed (${classification.failure_code})`
      );
      error.evidence = evidence;
      throw error;
    }

    process.stderr.write(
      `Transient dependency-install failure (${classification.failure_code}); retrying exact frozen install (${attempt + 1}/${maxAttempts}).\n`
    );
    fs.rmSync(path.join(repoRoot, "node_modules"), {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
    await wait(baseBackoffMs * attempt);
  }
  throw new Error("Release Bus dependency installation exhausted unexpectedly");
}

async function main() {
  try {
    await installWithRetries();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  classifyFailure,
  installWithRetries,
  verifyInstall,
};

if (require.main === module) void main();
