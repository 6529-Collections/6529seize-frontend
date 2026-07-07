#!/usr/bin/env node
"use strict";

/**
 * Manifest-driven E2E pack runner. Workflows call this instead of hardcoding
 * pack lists, so the deployed checkout always carries its own pack list:
 *
 *   ./bin/6529 run e2e:packs -- --env staging --trigger post-deploy
 *   ./bin/6529 run e2e:packs -- --env production --trigger cron
 *   ./bin/6529 run e2e:packs -- --env staging --pack test:e2e:staging:smoke
 *   ./bin/6529 run e2e:packs -- --env staging --list
 *
 * Behavior contracts (load-bearing for the deploy signal):
 * - An empty resolution is a hard failure, never a green no-op.
 * - The resolved pack list is printed before anything runs.
 * - Each pack gets a step-summary row (pass/fail + last 25 log lines on
 *   failure), matching the UX of the previous inline workflow loop.
 * - All resolved packs run even after a failure; the exit code aggregates.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env["E2E_MANIFEST_ROOT"]
  ? path.resolve(process.env["E2E_MANIFEST_ROOT"])
  : path.resolve(__dirname, "..");

const SUMMARY_TAIL_LINES = 25;

function parseArgs(argv) {
  const options = {
    env: null,
    trigger: null,
    pack: null,
    list: false,
    forward: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--env" || arg === "--trigger" || arg === "--pack") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      options[arg.slice(2)] = value;
      index += 1;
    } else if (arg === "--list" || arg === "--dry-run") {
      options.list = true;
    } else if (arg === "--shard") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--shard requires a value like 1/2");
      }
      options.forward.push(`--shard=${value}`);
      index += 1;
    } else if (arg.startsWith("--shard=")) {
      options.forward.push(arg);
    } else if (arg === "--") {
      // Package-manager arg forwarding can leave a bare "--" in argv;
      // tolerating it keeps the staging gate from hard-failing on a
      // wrapper-forwarding quirk.
      continue;
    } else {
      throw new Error(`unknown argument "${arg}"`);
    }
  }
  return options;
}

function resolvePacks(packs, { env, trigger, pack }) {
  return packs.filter((candidate) => {
    if (env && !candidate.environments.includes(env)) {
      return false;
    }
    if (trigger && !candidate.triggers.includes(trigger)) {
      return false;
    }
    if (pack && candidate.scriptKey !== pack) {
      return false;
    }
    return true;
  });
}

function appendSummary(lines) {
  const summaryPath = process.env["GITHUB_STEP_SUMMARY"];
  if (!summaryPath) {
    return;
  }
  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function defaultSpawn(scriptKey, forwardArgs) {
  const execPath = process.env["npm_execpath"];
  const runArgs =
    forwardArgs.length > 0
      ? ["run", scriptKey, "--", ...forwardArgs]
      : ["run", scriptKey];
  if (execPath) {
    // Child env inherits SEIZE_6529_COMMAND=1 from the wrapper that launched
    // this runner, so the require-6529-command guard inside each pack script
    // passes.
    return spawnSync(process.execPath, [execPath, ...runArgs], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  }
  // Fallback for direct `node scripts/e2e-packs.cjs` invocations. The wrapper
  // path must be absolute: spawnSync resolves the command against the parent
  // process CWD/PATH, not the `cwd` option, so a relative "./bin/6529" only
  // works by accident.
  return spawnSync(path.join(ROOT, "bin", "6529"), runArgs, {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function runPacks(resolved, { spawn = defaultSpawn, forward = [] } = {}) {
  appendSummary(["## E2E packs", ""]);
  let failedCount = 0;
  for (const pack of resolved) {
    console.log(`\n=== ${pack.scriptKey} ===`);
    const result = spawn(pack.scriptKey, forward);
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    if (output) {
      console.log(output);
    }
    const failed = result.status !== 0 || result.error;
    if (failed) {
      failedCount += 1;
      const tail = output.split(/\r?\n/).slice(-SUMMARY_TAIL_LINES).join("\n");
      // "failed to spawn" (ENOENT, missing script) and "ran and failed" are
      // different triage paths; label the summary row so an environment
      // misconfiguration is not mistaken for real test failures.
      const label = result.error
        ? `- :x: \`${pack.scriptKey}\` (failed to spawn: ${result.error.message})`
        : `- :x: \`${pack.scriptKey}\``;
      appendSummary([
        label,
        "",
        `<details><summary>Last ${SUMMARY_TAIL_LINES} log lines for \`${pack.scriptKey}\`</summary>`,
        "",
        "```",
        tail,
        "```",
        "",
        "</details>",
      ]);
      if (result.error) {
        console.error(
          `e2e-packs: ${pack.scriptKey} failed to spawn: ${result.error.message}`
        );
      }
    } else {
      appendSummary([`- :white_check_mark: \`${pack.scriptKey}\``]);
    }
  }
  return failedCount;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`e2e-packs: ${error.message}`);
    console.error(
      "usage: e2e:packs -- --env <local|staging|production> [--trigger <post-deploy|cron|pr-ci|manual>] [--pack <scriptKey>] [--shard i/N] [--list]"
    );
    process.exit(2);
  }

  if (!options.env) {
    console.error("e2e-packs: --env is required.");
    process.exit(2);
  }

  const { loadManifest, validateManifest } = require("./sync-e2e-manifest.cjs");
  const packs = loadManifest(path.join(ROOT, "tests", "packs.manifest.ts"));
  const problems = validateManifest(packs);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`e2e-packs: ${problem}`);
    }
    process.exit(1);
  }

  const resolved = resolvePacks(packs, options);
  if (resolved.length === 0) {
    console.error(
      `e2e-packs: no packs resolved for env=${options.env}` +
        `${options.trigger ? ` trigger=${options.trigger}` : ""}` +
        `${options.pack ? ` pack=${options.pack}` : ""}. ` +
        "An empty pack list would be a silent false-green, so this is a hard " +
        "failure. Check tests/packs.manifest.ts environments/triggers."
    );
    process.exit(1);
  }

  console.log(
    `e2e-packs: resolved ${resolved.length} pack(s) for env=${options.env}` +
      `${options.trigger ? ` trigger=${options.trigger}` : ""}:`
  );
  for (const pack of resolved) {
    console.log(`  - ${pack.scriptKey}`);
  }

  if (options.list) {
    return;
  }

  const failedCount = runPacks(resolved, { forward: options.forward });
  if (failedCount > 0) {
    console.error(`e2e-packs: ${failedCount} pack(s) failed.`);
    process.exit(1);
  }
  console.log(`e2e-packs: all ${resolved.length} pack(s) passed.`);
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, resolvePacks, runPacks };
