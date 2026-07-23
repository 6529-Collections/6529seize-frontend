#!/usr/bin/env node
"use strict";

/**
 * Manifest-driven Playwright pack resolver and sequential runner.
 *
 * Examples:
 *   seize run e2e:packs -- --env staging --trigger post-deploy
 *   seize run e2e:packs -- --env staging --pack smoke
 *   seize run e2e:packs -- --env production --trigger cron --list
 *
 * An empty resolution, invalid manifest, timed-out pack, launch failure, test
 * failure, cleanup failure, or artifact-preservation failure is always red.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env["E2E_MANIFEST_ROOT"]
  ? path.resolve(process.env["E2E_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");
const SUMMARY_TAIL_LINES = 25;
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;
const PLAYWRIGHT_OUTPUTS = ["test-results", "playwright-report"];

function parseArgs(argv) {
  const options = {
    env: null,
    trigger: null,
    pack: null,
    artifactRoot: null,
    list: false,
    forward: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (
      arg === "--env" ||
      arg === "--trigger" ||
      arg === "--pack" ||
      arg === "--artifact-root"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value.`);
      }
      const key =
        arg === "--artifact-root" ? "artifactRoot" : arg.replace(/^--/, "");
      options[key] = value;
      index += 1;
      continue;
    }
    if (arg === "--list") {
      options.list = true;
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

function resolvePacks(packs, { env, trigger, pack }) {
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
    return true;
  });
}

function appendSummary(lines) {
  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
  }
}

function buildSpawnOptions(pack) {
  return {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
    killSignal: "SIGTERM",
    maxBuffer: MAX_BUFFER_BYTES,
    timeout: pack.timeoutMinutes * 60 * 1000,
  };
}

function defaultSpawn(pack, forwardArgs) {
  const npmExecPath = process.env["npm_execpath"];
  if (!npmExecPath) {
    return {
      status: null,
      signal: null,
      stdout: "",
      stderr: "",
      error: new Error(
        "npm_execpath is unavailable; run the pack runner through " +
          "`seize run e2e:packs` or `./bin/6529 run e2e:packs`."
      ),
    };
  }
  const runArgs =
    forwardArgs.length > 0
      ? ["run", pack.scriptKey, "--", ...forwardArgs]
      : ["run", pack.scriptKey];
  return spawnSync(
    process.execPath,
    [npmExecPath, ...runArgs],
    buildSpawnOptions(pack)
  );
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

function removeTransientOutputs() {
  for (const relativePath of PLAYWRIGHT_OUTPUTS) {
    const outputPath = resolveInsideRoot(relativePath, "Playwright output");
    fs.rmSync(outputPath, { force: true, recursive: true });
  }
}

function prepareArtifactRoot(artifactRoot) {
  if (!artifactRoot) {
    return;
  }
  fs.rmSync(artifactRoot, { force: true, recursive: true });
  fs.mkdirSync(artifactRoot, { recursive: true });
}

function packSlug(scriptKey) {
  return scriptKey.replaceAll(/[^a-zA-Z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
}

function preserveArtifacts(artifactRoot, pack, output) {
  if (!artifactRoot) {
    return null;
  }
  const packRoot = path.join(artifactRoot, packSlug(pack.scriptKey));
  fs.mkdirSync(packRoot, { recursive: true });
  fs.writeFileSync(path.join(packRoot, "output.log"), output);
  for (const relativePath of PLAYWRIGHT_OUTPUTS) {
    const source = resolveInsideRoot(relativePath, "Playwright output");
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(packRoot, relativePath), {
        recursive: true,
      });
    }
  }
  return path.relative(ROOT, packRoot).replaceAll("\\", "/");
}

function classifyResult(result) {
  if (result.error?.code === "ETIMEDOUT") {
    return {
      failed: true,
      infrastructure: true,
      label: `timed out: ${result.error.message}`,
    };
  }
  if (result.error) {
    return {
      failed: true,
      infrastructure: true,
      label: `failed to launch: ${result.error.message}`,
    };
  }
  if (result.signal) {
    return {
      failed: true,
      infrastructure: true,
      label: `terminated by signal ${result.signal}`,
    };
  }
  if (result.status !== 0) {
    return {
      failed: true,
      infrastructure: false,
      label: `tests exited ${result.status}`,
    };
  }
  return { failed: false, infrastructure: false, label: "passed" };
}

function outputTail(output) {
  return output
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .slice(-SUMMARY_TAIL_LINES)
    .join("\n");
}

function runPacks(
  resolved,
  {
    artifactRoot = null,
    forward = [],
    spawn = defaultSpawn,
    cleanup = removeTransientOutputs,
    preserve = preserveArtifacts,
    prepare = prepareArtifactRoot,
  } = {}
) {
  prepare(artifactRoot);
  appendSummary(["## E2E packs", ""]);
  let failedCount = 0;
  let infrastructureFailureCount = 0;

  for (const pack of resolved) {
    console.log(`\n=== ${pack.scriptKey} ===`);
    let cleanupError = null;
    try {
      cleanup();
    } catch (error) {
      cleanupError = error instanceof Error ? error : new Error(String(error));
    }

    let result;
    try {
      result = spawn(pack, forward);
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
    if (output) {
      process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
    }
    let classification = classifyResult(result);
    if (cleanupError) {
      classification = {
        failed: true,
        infrastructure: true,
        label: `cleanup failed: ${cleanupError.message}`,
      };
    }

    let artifactPath = null;
    try {
      artifactPath = preserve(artifactRoot, pack, output);
    } catch (error) {
      const artifactError =
        error instanceof Error ? error : new Error(String(error));
      classification = {
        failed: true,
        infrastructure: true,
        label: `artifact preservation failed: ${artifactError.message}`,
      };
    }

    if (!classification.failed) {
      appendSummary([
        `- :white_check_mark: \`${pack.scriptKey}\``,
        ...(artifactPath ? [`  - Artifacts: \`${artifactPath}/\``] : []),
      ]);
      continue;
    }

    failedCount += 1;
    if (classification.infrastructure) {
      infrastructureFailureCount += 1;
    }
    const tail = outputTail(output);
    appendSummary([
      `- :x: \`${pack.scriptKey}\` (${classification.label})`,
      ...(artifactPath ? [`  - Artifacts: \`${artifactPath}/\``] : []),
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

  return { failedCount, infrastructureFailureCount };
}

function printUsage() {
  console.error(
    "usage: e2e:packs -- --env <local|staging|production> " +
      "[--trigger <manual|pr-ci|post-deploy|cron>] " +
      "[--pack <scriptKey|alias|all>] [--artifact-root <path>] " +
      "[--shard i/N] [--list]"
  );
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `e2e-packs: ${error instanceof Error ? error.message : String(error)}`
    );
    printUsage();
    process.exit(2);
  }
  if (!options.env) {
    console.error("e2e-packs: --env is required.");
    printUsage();
    process.exit(2);
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

    console.log(
      `e2e-packs: resolved ${resolved.length} pack(s) for env=${options.env}` +
        `${options.trigger ? ` trigger=${options.trigger}` : ""}:`
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
    const result = runPacks(resolved, {
      artifactRoot,
      forward: options.forward,
    });
    if (result.failedCount > 0) {
      console.error(
        `e2e-packs: ${result.failedCount} pack(s) failed ` +
          `(${result.infrastructureFailureCount} infrastructure failure(s)).`
      );
      process.exit(1);
    }
    console.log(`e2e-packs: all ${resolved.length} pack(s) passed.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const line of message.split("\n")) {
      console.error(`e2e-packs: ${line}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSpawnOptions,
  classifyResult,
  isValidShard,
  parseArgs,
  resolveArtifactRoot,
  resolvePacks,
  runPacks,
};
