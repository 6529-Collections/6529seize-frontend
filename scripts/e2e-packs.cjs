#!/usr/bin/env node
"use strict";

/**
 * Manifest-driven Playwright pack resolver and bounded parallel runner.
 *
 * Deployed-environment parallelism is allowed only for packs whose manifest
 * safety is `readonly`. Each child receives unique Playwright output/report
 * paths, its own timeout, deterministic failure attribution, and one
 * manifest-bound structured evidence record.
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env["E2E_MANIFEST_ROOT"]
  ? path.resolve(process.env["E2E_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");
const SUMMARY_TAIL_LINES = 25;
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;
const MAX_PARALLEL_PACKS = 4;
const TRANSIENT_ROOT = ".deployment-e2e-output";
const RUNNER_CAPABILITIES = Object.freeze({
  contract: "deployment-e2e-runner-capabilities.v1",
  features: Object.freeze({
    readonly_pack_parallelism: Object.freeze({
      version: 1,
      max_parallel: MAX_PARALLEL_PACKS,
    }),
    pack_exclusion: Object.freeze({
      version: 1,
    }),
    serial_failed_pack_retry: Object.freeze({
      version: 2,
      max_retries: 1,
      policy: "transient-infrastructure-only",
    }),
  }),
});

function parseArgs(argv) {
  const options = {
    env: null,
    trigger: null,
    pack: null,
    excludePacks: [],
    artifactRoot: null,
    parallel: 1,
    retryFailedPacks: 0,
    capabilities: false,
    list: false,
    forward: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (
      arg === "--env" ||
      arg === "--trigger" ||
      arg === "--pack" ||
      arg === "--exclude-pack" ||
      arg === "--artifact-root" ||
      arg === "--parallel" ||
      arg === "--retry-failed-packs"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value.`);
      }
      if (arg === "--parallel") {
        if (!/^[1-4]$/.test(value)) {
          throw new Error(
            `--parallel must be between 1 and ${MAX_PARALLEL_PACKS}.`
          );
        }
        options.parallel = Number(value);
      } else if (arg === "--retry-failed-packs") {
        if (!/^[01]$/.test(value)) {
          throw new Error("--retry-failed-packs must be 0 or 1.");
        }
        options.retryFailedPacks = Number(value);
      } else if (arg === "--exclude-pack") {
        options.excludePacks.push(value);
      } else {
        const key =
          arg === "--artifact-root" ? "artifactRoot" : arg.replace(/^--/, "");
        options[key] = value;
      }
      index += 1;
      continue;
    }
    if (arg === "--list") {
      options.list = true;
      continue;
    }
    if (arg === "--capabilities") {
      options.capabilities = true;
      continue;
    }
    if (arg === "--shard") {
      const value = argv[index + 1];
      if (!isValidShard(value)) {
        throw new Error("--shard requires a value like 1/2.");
      }
      options.forward.push(`--shard=${value}`);
      index += 1;
      continue;
    }
    if (arg.startsWith("--shard=")) {
      if (!isValidShard(arg.slice("--shard=".length))) {
        throw new Error("--shard requires a value like 1/2.");
      }
      options.forward.push(arg);
      continue;
    }
    if (arg === "--") {
      continue;
    }
    throw new Error(`unknown argument "${arg}".`);
  }

  return options;
}

function isValidShard(value) {
  const match =
    typeof value === "string" && /^([1-9][0-9]*)\/([1-9][0-9]*)$/.exec(value);
  return Boolean(match && Number(match[1]) <= Number(match[2]));
}

function resolvePacks(packs, { env, trigger, pack, excludePacks = [] }) {
  const requestedPack = pack === "all" ? null : pack;
  return packs.filter((candidate) => {
    if (env && !candidate.environments.includes(env)) {
      return false;
    }
    if (trigger && !candidate.triggers.includes(trigger)) {
      return false;
    }
    if (
      requestedPack &&
      candidate.scriptKey !== requestedPack &&
      candidate.alias !== requestedPack
    ) {
      return false;
    }
    if (
      excludePacks.includes(candidate.scriptKey) ||
      (candidate.alias && excludePacks.includes(candidate.alias))
    ) {
      return false;
    }
    return true;
  });
}

function assertParallelSafe(packs, parallel) {
  if (parallel <= 1) {
    return;
  }
  const unsafe = packs.filter((pack) => pack.safety !== "readonly");
  if (unsafe.length > 0) {
    throw new Error(
      "parallel execution is restricted to manifest-declared readonly packs: " +
        unsafe.map((pack) => pack.scriptKey).join(", ")
    );
  }
}

function appendSummary(lines) {
  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (!summaryPath) {
    return;
  }
  try {
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `e2e-packs: unable to update GITHUB_STEP_SUMMARY (${message}); ` +
        "continuing with console and artifact output."
    );
  }
}

function packSlug(scriptKey) {
  return scriptKey.replaceAll(/[^a-zA-Z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
}

function resolveInsideRoot(relativePath, label) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be a non-empty repo-relative path.`);
  }
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the repository.`);
  }
  return resolved;
}

function resolveArtifactRoot(relativePath) {
  if (!relativePath) {
    return null;
  }
  const normalized = relativePath.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(
      "--artifact-root must not contain empty, . or .. segments."
    );
  }
  const topLevelDirectory = segments[0];
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*-artifacts$/.test(topLevelDirectory)) {
    throw new Error(
      "--artifact-root must use a dedicated top-level *-artifacts directory."
    );
  }
  if (
    normalized === "test-results" ||
    normalized.startsWith("test-results/") ||
    normalized === "playwright-report" ||
    normalized.startsWith("playwright-report/")
  ) {
    throw new Error(
      "--artifact-root must not be inside Playwright's transient output paths."
    );
  }
  return resolveInsideRoot(relativePath, "--artifact-root");
}

function outputPathsForPack(pack, attempt = 1) {
  const suffix = attempt === 1 ? "" : `-attempt-${attempt}`;
  const root = resolveInsideRoot(
    `${TRANSIENT_ROOT}/${packSlug(pack.scriptKey)}${suffix}`,
    "pack output root"
  );
  return {
    root,
    testResults: path.join(root, "test-results", "playwright"),
    report: path.join(root, "playwright-report"),
  };
}

function prepareArtifactRoot(artifactRoot) {
  if (artifactRoot) {
    fs.rmSync(artifactRoot, { force: true, recursive: true });
    fs.mkdirSync(artifactRoot, { recursive: true });
  }
  const transientRoot = resolveInsideRoot(TRANSIENT_ROOT, "transient root");
  fs.rmSync(transientRoot, { force: true, recursive: true });
  fs.mkdirSync(transientRoot, { recursive: true });
}

function cleanupPackOutputs(pack, outputPaths = outputPathsForPack(pack)) {
  fs.rmSync(outputPaths.root, { force: true, recursive: true });
  fs.mkdirSync(outputPaths.root, { recursive: true });
}

function preserveArtifacts(
  artifactRoot,
  pack,
  output,
  outputPaths,
  attempt = 1
) {
  if (!artifactRoot) {
    return null;
  }
  const packRoot = path.join(
    artifactRoot,
    packSlug(pack.scriptKey),
    ...(attempt === 1 ? [] : [`attempt-${attempt}`])
  );
  fs.mkdirSync(packRoot, { recursive: true });
  fs.writeFileSync(path.join(packRoot, "output.log"), output);
  if (fs.existsSync(outputPaths.testResults)) {
    fs.cpSync(
      outputPaths.testResults,
      path.join(packRoot, "test-results", "playwright"),
      { recursive: true }
    );
  }
  if (fs.existsSync(outputPaths.report)) {
    fs.cpSync(outputPaths.report, path.join(packRoot, "playwright-report"), {
      recursive: true,
    });
  }
  return path.relative(ROOT, packRoot).replaceAll("\\", "/");
}

function buildSpawnOptions(pack, outputPaths = outputPathsForPack(pack)) {
  return {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      PLAYWRIGHT_OUTPUT_DIR: outputPaths.testResults,
      PLAYWRIGHT_HTML_REPORT_DIR: outputPaths.report,
    },
    killSignal: "SIGTERM",
    maxBuffer: MAX_BUFFER_BYTES,
    timeout: pack.timeoutMinutes * 60 * 1000,
  };
}

function runProcessGroup(command, args, options) {
  return new Promise((resolve) => {
    const child = (options.spawnProcess ?? spawn)(command, args, {
      cwd: options.cwd,
      detached: true,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let infrastructureError = null;
    let completed = false;
    let killTimer = null;
    let closeResult = null;

    const finish = () => {
      if (completed || !closeResult) {
        return;
      }
      completed = true;
      resolve(closeResult);
    };

    const killGroup = (signal) => {
      if (!child.pid) {
        return;
      }
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    };
    const terminate = (error) => {
      if (infrastructureError) {
        return;
      }
      infrastructureError = error;
      killGroup("SIGTERM");
      killTimer = setTimeout(() => {
        killGroup("SIGKILL");
        closeResult ??= {
          status: null,
          signal: "SIGKILL",
          stdout,
          stderr,
          error: infrastructureError,
        };
        finish();
      }, 1000);
      // Keep the grace timer referenced. A child can close its stdio and exit
      // while a detached Playwright grandchild ignores SIGTERM; Node must stay
      // alive long enough to deliver the bounded group-wide SIGKILL.
    };
    const append = (target, chunk) => {
      const next = target + chunk.toString("utf8");
      if (Buffer.byteLength(next) > options.maxBuffer) {
        terminate(
          Object.assign(new Error("pack output exceeded the bounded buffer"), {
            code: "ENOBUFS",
          })
        );
        let bounded = Buffer.from(next, "utf8")
          .subarray(0, options.maxBuffer)
          .toString("utf8");
        while (Buffer.byteLength(bounded) > options.maxBuffer) {
          bounded = bounded.slice(0, -1);
        }
        return bounded;
      }
      return next;
    };

    child.stdout.on("data", (chunk) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = append(stderr, chunk);
    });
    child.on("error", (error) => {
      infrastructureError = error;
    });

    const timeout = setTimeout(() => {
      terminate(
        Object.assign(
          new Error(`pack exceeded its ${options.timeout} ms timeout`),
          { code: "ETIMEDOUT" }
        )
      );
    }, options.timeout);
    timeout.unref?.();

    child.on("close", (status, signal) => {
      clearTimeout(timeout);
      closeResult = {
        status,
        signal,
        stdout,
        stderr,
        ...(infrastructureError ? { error: infrastructureError } : {}),
      };
      if (!infrastructureError) {
        if (killTimer) {
          clearTimeout(killTimer);
        }
        finish();
      } else if (!killTimer) {
        finish();
      }
    });
  });
}

function defaultSpawn(pack, forwardArgs, outputPaths) {
  const npmExecPath = process.env["npm_execpath"];
  if (!npmExecPath) {
    return Promise.resolve({
      status: null,
      signal: null,
      stdout: "",
      stderr: "",
      error: new Error(
        "npm_execpath is unavailable; run the pack runner through " +
          "`seize run e2e:packs` or `./bin/6529 run e2e:packs`."
      ),
    });
  }
  const runArgs =
    forwardArgs.length > 0
      ? ["run", pack.scriptKey, "--", ...forwardArgs]
      : ["run", pack.scriptKey];
  return runProcessGroup(
    process.execPath,
    [npmExecPath, ...runArgs],
    buildSpawnOptions(pack, outputPaths)
  );
}

function classifyResult(result) {
  if (result.error?.code === "ETIMEDOUT") {
    return {
      failed: true,
      infrastructure: true,
      retryable: false,
      label: `timed out: ${result.error.message}`,
    };
  }
  if (result.error) {
    return {
      failed: true,
      infrastructure: true,
      retryable: result.error.code !== "ENOBUFS",
      label: `failed to launch: ${result.error.message}`,
    };
  }
  if (result.signal) {
    return {
      failed: true,
      infrastructure: true,
      retryable: true,
      label: `terminated by signal ${result.signal}`,
    };
  }
  if (result.status !== 0) {
    return {
      failed: true,
      infrastructure: false,
      retryable: false,
      label: `tests exited ${result.status}`,
    };
  }
  return {
    failed: false,
    infrastructure: false,
    retryable: false,
    label: "passed",
  };
}

function outputTail(output) {
  return output
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .slice(-SUMMARY_TAIL_LINES)
    .join("\n");
}

function sourceShaFromEnvironment() {
  const sourceSha = process.env["DEPLOYMENT_E2E_SOURCE_SHA"] || null;
  if (sourceSha !== null && !/^[a-f0-9]{40}$/.test(sourceSha)) {
    throw new Error("Deployment E2E source SHA is malformed.");
  }
  return sourceSha;
}

async function runOnePack(
  pack,
  { artifactRoot, forward, spawn, cleanup, preserve, attempt = 1 }
) {
  const startedAt = new Date();
  const outputPaths = outputPathsForPack(pack, attempt);
  let cleanupError = null;
  try {
    await cleanup(pack, outputPaths);
  } catch (error) {
    cleanupError = error instanceof Error ? error : new Error(String(error));
  }

  let result;
  try {
    result = await spawn(pack, forward, outputPaths);
  } catch (error) {
    result = {
      status: null,
      signal: null,
      stdout: "",
      stderr: "",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  let classification = classifyResult(result);
  if (cleanupError) {
    classification = {
      failed: true,
      infrastructure: true,
      retryable: false,
      label: `cleanup failed: ${cleanupError.message}`,
    };
  }

  let artifactPath = null;
  try {
    artifactPath = await preserve(
      artifactRoot,
      pack,
      output,
      outputPaths,
      attempt
    );
  } catch (error) {
    const artifactError =
      error instanceof Error ? error : new Error(String(error));
    classification = {
      failed: true,
      infrastructure: true,
      retryable: false,
      label: `artifact preservation failed: ${artifactError.message}`,
    };
  }

  return {
    pack,
    output,
    artifactPath,
    classification,
    attempt,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
  };
}

async function runPacks(
  resolved,
  {
    artifactRoot = null,
    environment = null,
    trigger = null,
    parallel = 1,
    retryFailedPacks = 0,
    forward = [],
    spawn = defaultSpawn,
    cleanup = cleanupPackOutputs,
    preserve = preserveArtifacts,
    prepare = prepareArtifactRoot,
  } = {}
) {
  assertParallelSafe(resolved, parallel);
  if (
    !Number.isInteger(retryFailedPacks) ||
    retryFailedPacks < 0 ||
    retryFailedPacks > 1
  ) {
    throw new Error("retryFailedPacks must be 0 or 1.");
  }
  const sourceSha = sourceShaFromEnvironment();
  prepare(artifactRoot);
  const startedAt = new Date();
  const records = new Array(resolved.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < resolved.length) {
      const index = nextIndex;
      nextIndex += 1;
      records[index] = await runOnePack(resolved[index], {
        artifactRoot,
        forward,
        spawn,
        cleanup,
        preserve,
        attempt: 1,
      });
    }
  }

  const workerCount = Math.min(parallel, resolved.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  for (let index = 0; index < records.length; index += 1) {
    const attempts = [records[index]];
    for (
      let retry = 1;
      attempts.at(-1).classification.retryable && retry <= retryFailedPacks;
      retry += 1
    ) {
      const attempt = retry + 1;
      console.warn(
        `e2e-packs: serial retry ${retry}/${retryFailedPacks} for ${resolved[index].scriptKey}.`
      );
      attempts.push(
        await runOnePack(resolved[index], {
          artifactRoot,
          forward,
          spawn,
          cleanup,
          preserve,
          attempt,
        })
      );
    }
    const finalAttempt = attempts.at(-1);
    records[index] = {
      ...finalAttempt,
      durationMs: attempts.reduce(
        (sum, attempt) => sum + attempt.durationMs,
        0
      ),
      attempts,
    };
  }

  appendSummary(["## E2E packs", ""]);
  let failedCount = 0;
  let infrastructureFailureCount = 0;
  for (const record of records) {
    const { pack, output, classification } = record;
    console.log(`\n=== ${pack.scriptKey} ===`);
    for (const attempt of record.attempts) {
      if (record.attempts.length > 1) {
        console.log(
          `--- attempt ${attempt.attempt}/${record.attempts.length} ---`
        );
      }
      if (attempt.output) {
        process.stdout.write(
          attempt.output.endsWith("\n") ? attempt.output : `${attempt.output}\n`
        );
      }
    }
    if (!classification.failed) {
      appendSummary([
        `- :white_check_mark: \`${pack.scriptKey}\` (${record.durationMs} ms; ${record.attempts.length} attempt${record.attempts.length === 1 ? "" : "s"})`,
        ...record.attempts.flatMap((attempt) =>
          attempt.artifactPath
            ? [`  - Attempt ${attempt.attempt}: \`${attempt.artifactPath}/\``]
            : []
        ),
      ]);
      continue;
    }
    failedCount += 1;
    if (classification.infrastructure) {
      infrastructureFailureCount += 1;
    }
    const tail = outputTail(output);
    appendSummary([
      `- :x: \`${pack.scriptKey}\` (${classification.label}; ${record.durationMs} ms; ${record.attempts.length} attempt${record.attempts.length === 1 ? "" : "s"})`,
      ...record.attempts.flatMap((attempt) =>
        attempt.artifactPath
          ? [`  - Attempt ${attempt.attempt}: \`${attempt.artifactPath}/\``]
          : []
      ),
      ...(tail
        ? [
            "",
            `<details><summary>Last ${SUMMARY_TAIL_LINES} log lines</summary>`,
            "",
            "```",
            tail,
            "```",
            "",
            "</details>",
          ]
        : []),
    ]);
    console.error(`e2e-packs: ${pack.scriptKey} ${classification.label}.`);
  }

  const evidence = {
    schema_version: "deployment-e2e-packs.v1",
    environment,
    trigger,
    parallelism_requested: parallel,
    worker_count: workerCount,
    serial_retry_limit: retryFailedPacks,
    started_at: startedAt.toISOString(),
    completed_at: new Date().toISOString(),
    source_sha: sourceSha,
    pack_count: records.length,
    failed_count: failedCount,
    infrastructure_failure_count: infrastructureFailureCount,
    results: records.map((record) => ({
      script_key: record.pack.scriptKey,
      safety: record.pack.safety,
      status: record.classification.failed ? "failed" : "passed",
      failure_class: record.classification.failed
        ? record.classification.infrastructure
          ? "infrastructure"
          : "e2e"
        : null,
      detail: record.classification.label,
      duration_ms: record.durationMs,
      artifact_path: record.artifactPath,
      attempt_count: record.attempts.length,
      attempts: record.attempts.map((attempt) => ({
        attempt: attempt.attempt,
        status: attempt.classification.failed ? "failed" : "passed",
        failure_class: attempt.classification.failed
          ? attempt.classification.infrastructure
            ? "infrastructure"
            : "e2e"
          : null,
        detail: attempt.classification.label,
        duration_ms: attempt.durationMs,
        artifact_path: attempt.artifactPath,
      })),
    })),
  };
  if (artifactRoot) {
    fs.writeFileSync(
      path.join(artifactRoot, "evidence.json"),
      `${JSON.stringify(evidence, null, 2)}\n`
    );
  }
  return { failedCount, infrastructureFailureCount, evidence };
}

function printUsage() {
  console.error(
    "usage: e2e:packs -- --env <local|staging|production> " +
      "[--trigger <manual|pr-ci|post-deploy|cron>] " +
      "[--pack <scriptKey|alias|all>] [--exclude-pack <scriptKey|alias>] " +
      "[--artifact-root <path>] " +
      `[--parallel <1-${MAX_PARALLEL_PACKS}>] [--shard i/N] [--list] ` +
      "[--retry-failed-packs <0|1>] " +
      "[--capabilities]"
  );
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `e2e-packs: ${error instanceof Error ? error.message : String(error)}`
    );
    printUsage();
    process.exitCode = 2;
    return;
  }
  if (options.capabilities) {
    console.log(JSON.stringify(RUNNER_CAPABILITIES));
    return;
  }
  if (!options.env) {
    console.error("e2e-packs: --env is required.");
    printUsage();
    process.exitCode = 2;
    return;
  }

  try {
    const {
      loadManifest,
      validateManifest,
    } = require("./sync-e2e-manifest.cjs");
    const packs = loadManifest(path.join(ROOT, "tests", "packs.manifest.cjs"));
    const problems = validateManifest(packs, { root: ROOT });
    if (problems.length > 0) {
      throw new Error(problems.join("\n"));
    }

    const resolved = resolvePacks(packs, options);
    if (resolved.length === 0) {
      throw new Error(
        `no packs resolved for env=${options.env}` +
          `${options.trigger ? ` trigger=${options.trigger}` : ""}` +
          `${options.pack ? ` pack=${options.pack}` : ""}. ` +
          "An empty deployed-environment selection is a false green, so this " +
          "is a hard failure."
      );
    }
    assertParallelSafe(resolved, options.parallel);

    console.log(
      `e2e-packs: resolved ${resolved.length} pack(s) for env=${options.env}` +
        `${options.trigger ? ` trigger=${options.trigger}` : ""}; ` +
        `parallelism=${options.parallel}:`
    );
    for (const pack of resolved) {
      console.log(
        `  - ${pack.scriptKey}${pack.alias ? ` (alias: ${pack.alias})` : ""}`
      );
    }
    if (options.list) {
      return;
    }

    const artifactRoot = resolveArtifactRoot(options.artifactRoot);
    const result = await runPacks(resolved, {
      artifactRoot,
      environment: options.env,
      trigger: options.trigger,
      parallel: options.parallel,
      retryFailedPacks: options.retryFailedPacks,
      forward: options.forward,
    });
    if (result.failedCount > 0) {
      console.error(
        `e2e-packs: ${result.failedCount} pack(s) failed ` +
          `(${result.infrastructureFailureCount} infrastructure failure(s)).`
      );
      process.exitCode = 1;
      return;
    }
    console.log(`e2e-packs: all ${resolved.length} pack(s) passed.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split("\n")) {
      console.error(`e2e-packs: ${line}`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}

module.exports = {
  RUNNER_CAPABILITIES,
  assertParallelSafe,
  buildSpawnOptions,
  classifyResult,
  isValidShard,
  outputPathsForPack,
  parseArgs,
  resolveArtifactRoot,
  resolvePacks,
  runPacks,
  runProcessGroup,
};
