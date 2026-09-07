#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
  validateRepositoryFiles,
  validateRepositoryPolicy,
} = require("./public-package-policy.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..");

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

function quoteWindowsShellArgument(value) {
  if (/[\r\n"%!^]/.test(value)) {
    throw new Error(
      "Windows package command paths and arguments cannot contain shell expansion characters."
    );
  }

  const escapedTrailingBackslashes = value.replace(
    /\\+$/,
    (backslashes) => `${backslashes}${backslashes}`
  );
  return `"${escapedTrailingBackslashes}"`;
}

function removeEnvironmentVariableCaseInsensitive(environment, variableName) {
  for (const key of Object.keys(environment)) {
    if (key.toLowerCase() === variableName.toLowerCase()) {
      delete environment[key];
    }
  }
}

function packageEnvironment(environment, repositoryRoot, pnpmConfigHome) {
  const childEnvironment = {
    ...environment,
    SEIZE_SECURE_INSTALL: "1",
  };

  // This repository resolves public packages only. Do not pass unrelated
  // package credentials to pnpm or dependency lifecycle scripts.
  removeEnvironmentVariableCaseInsensitive(childEnvironment, "NODE_AUTH_TOKEN");
  removeEnvironmentVariableCaseInsensitive(childEnvironment, "NPM_TOKEN");
  removeEnvironmentVariableCaseInsensitive(childEnvironment, "XDG_CONFIG_HOME");
  const configuredStoreDir = Object.entries(childEnvironment).find(
    ([key]) => key.toLowerCase() === "npm_config_store_dir"
  )?.[1];
  removeEnvironmentVariableCaseInsensitive(childEnvironment, "npm_config_store_dir");

  const projectNpmrc = path.join(repositoryRoot, ".npmrc");
  childEnvironment.npm_config_registry = "https://registry.npmjs.org/";
  childEnvironment.npm_config_userconfig = projectNpmrc;
  childEnvironment.npm_config_globalconfig = projectNpmrc;
  childEnvironment.XDG_CONFIG_HOME = pnpmConfigHome;
  if (configuredStoreDir !== undefined) {
    childEnvironment.npm_config_store_dir = configuredStoreDir;
  }

  return childEnvironment;
}

function runSecurePnpm({
  args = process.argv.slice(2),
  environment = process.env,
  pnpmBinary,
  repositoryRoot = REPOSITORY_ROOT,
  spawn = spawnSync,
  platform = process.platform,
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
  if (typeof pnpmBinary !== "string" || !path.isAbsolute(pnpmBinary)) {
    throw new Error(
      `${SECURE_PNPM_BINARY_ARGUMENT} requires an absolute pnpm path`
    );
  }
  const trustedPnpmBinary = fs.realpathSync(pnpmBinary);
  fs.accessSync(trustedPnpmBinary, fs.constants.X_OK);

  const sfwCommand = resolveSfwCommand(environment);
  const useWindowsShell = platform === "win32";
  const command = useWindowsShell
    ? quoteWindowsShellArgument(sfwCommand)
    : sfwCommand;
  const commandArguments = [trustedPnpmBinary, ...args];
  const pnpmConfigHome = fs.mkdtempSync(
    path.join(os.tmpdir(), "6529-pnpm-config-")
  );
  let result;
  try {
    const childEnvironment = packageEnvironment(
      environment,
      repositoryRoot,
      pnpmConfigHome
    );
    result = spawn(
      command,
      useWindowsShell
        ? commandArguments.map(quoteWindowsShellArgument)
        : commandArguments,
      {
        cwd: repositoryRoot,
        stdio: "inherit",
        shell: useWindowsShell,
        env: childEnvironment,
      }
    );
  } finally {
    fs.rmSync(pnpmConfigHome, { recursive: true, force: true });
  }

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new Error(
        "Socket Firewall (`sfw`) is not installed or not on PATH. Install Socket Firewall Free, then rerun the 6529 command."
      );
    }
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status === 0) {
    // Package commands can change package.json, the workspace file, or the
    // lockfile. Confirm the resulting repository still obeys the same policy.
    validateRepositoryFiles(repositoryRoot);
  }
  return status;
}

function parseSecureInvocationArguments(args) {
  let argumentIndex = 0;
  let repositoryRoot = REPOSITORY_ROOT;

  if (args[argumentIndex] === SECURE_REPOSITORY_ROOT_ARGUMENT) {
    if (!path.isAbsolute(args[argumentIndex + 1])) {
      throw new Error(
        `${SECURE_REPOSITORY_ROOT_ARGUMENT} requires an absolute path`
      );
    }
    repositoryRoot = fs.realpathSync(args[argumentIndex + 1]);
    argumentIndex += 2;
  }

  if (args[argumentIndex] !== SECURE_PNPM_BINARY_ARGUMENT) {
    throw new Error(`${SECURE_PNPM_BINARY_ARGUMENT} is required before --`);
  }
  const pnpmBinary = args[argumentIndex + 1];
  if (!path.isAbsolute(pnpmBinary) || args[argumentIndex + 2] !== "--") {
    throw new Error(
      `${SECURE_PNPM_BINARY_ARGUMENT} requires an absolute path followed by --`
    );
  }

  return {
    args: args.slice(argumentIndex + 3),
    pnpmBinary: fs.realpathSync(pnpmBinary),
    repositoryRoot,
  };
}

function main() {
  try {
    const invocation = parseSecureInvocationArguments(process.argv.slice(2));
    process.exitCode = runSecurePnpm(invocation);
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
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
  packageEnvironment,
  parseSecureInvocationArguments,
  quoteWindowsShellArgument,
  removeEnvironmentVariableCaseInsensitive,
  resolveSfwCommand,
  runSecurePnpm,
};
