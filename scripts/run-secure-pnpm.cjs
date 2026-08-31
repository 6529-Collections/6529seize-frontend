#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  validateRepositoryPolicy,
} = require("./private-github-packages-policy.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..");
const ROUTING_HELPER_PATH = path.join(
  __dirname,
  "run-pnpm-with-private-github-bypass.cjs"
);

function resolveSfwCommand(environment = process.env) {
  const configuredBinary = environment["SFW_BIN"];
  if (!configuredBinary) {
    return "sfw";
  }

  if (!path.isAbsolute(configuredBinary)) {
    throw new Error("SFW_BIN must be an absolute path when set.");
  }

  if (!fs.existsSync(configuredBinary)) {
    throw new Error(`SFW_BIN does not exist: ${configuredBinary}`);
  }

  return configuredBinary;
}

function runSecurePnpm({
  args = process.argv.slice(2),
  environment = process.env,
  repositoryRoot = REPOSITORY_ROOT,
  spawn = spawnSync,
}) {
  if (args.length === 0) {
    throw new Error("Usage: node scripts/run-secure-pnpm.cjs <pnpm-args...>");
  }

  validateRepositoryPolicy({
    repositoryRoot,
    args,
    environment,
    validateEnvironmentOverrides: true,
  });

  const sfwCommand = resolveSfwCommand(environment);
  const result = spawn(
    sfwCommand,
    [process.execPath, ROUTING_HELPER_PATH, ...args],
    {
      cwd: repositoryRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...environment,
        SEIZE_SECURE_INSTALL: "1",
      },
    }
  );

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(
        "Socket Firewall (`sfw`) is not installed or not on PATH. Install Socket Firewall Free, then rerun the 6529 command."
      );
    }
    throw result.error;
  }

  return result.status ?? 1;
}

function main() {
  try {
    process.exitCode = runSecurePnpm({});
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  REPOSITORY_ROOT,
  ROUTING_HELPER_PATH,
  resolveSfwCommand,
  runSecurePnpm,
};
