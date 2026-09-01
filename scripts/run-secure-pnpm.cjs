#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
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
  const commandArguments = [
    process.execPath,
    ROUTING_HELPER_PATH,
    SECURE_REPOSITORY_ROOT_ARGUMENT,
    repositoryRoot,
    SECURE_PNPM_BINARY_ARGUMENT,
    trustedPnpmBinary,
    "--",
    ...args,
  ];
  const result = spawn(
    command,
    useWindowsShell
      ? commandArguments.map(quoteWindowsShellArgument)
      : commandArguments,
    {
      cwd: repositoryRoot,
      stdio: "inherit",
      shell: useWindowsShell,
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
  ROUTING_HELPER_PATH,
  parseSecureInvocationArguments,
  quoteWindowsShellArgument,
  resolveSfwCommand,
  runSecurePnpm,
};
