#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  AUTH_ENVIRONMENT_VARIABLE,
  ALLOWED_REGISTRY_HOST,
  SECURE_PNPM_BINARY_ARGUMENT,
  SECURE_REPOSITORY_ROOT_ARGUMENT,
  validateRepositoryFiles,
  validateRepositoryPolicy,
} = require("./private-github-packages-policy.cjs");
const { quoteWindowsShellArgument } = require("./run-secure-pnpm.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..");
const LOOPBACK_NO_PROXY_ENTRIES = ["localhost", "127.0.0.1", "::1"];
const ROUTED_NO_PROXY_ENTRIES = [
  ...LOOPBACK_NO_PROXY_ENTRIES,
  ALLOWED_REGISTRY_HOST,
];
const ROUTED_NO_PROXY = ROUTED_NO_PROXY_ENTRIES.join(",");
const REMOVED_ROUTED_CONFIG_NAMES = new Set([
  "cafile",
  "globalconfig",
  "npmglobalconfig",
]);
const IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE = "npm_config_ignore_pnpmfile";
const IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE = "npm_config_ignore_scripts";
const USER_CONFIG_ENVIRONMENT_VARIABLE = "npm_config_userconfig";
const GLOBAL_CONFIG_ENVIRONMENT_VARIABLE = "npm_config_globalconfig";
const NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE = "npm_config_npm_globalconfig";
const AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS = ["install", "--frozen-lockfile"];
const TOKEN_FREE_LOCKFILE_ARGUMENTS = ["install", "--lockfile-only"];
const TOKEN_FREE_REBUILD_ARGUMENTS = ["rebuild", "--pending"];
const LOCKFILE_ONLY_COMMANDS = new Set(["add", "install", "update"]);

function parseNoProxy(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isLoopbackProxy(proxyValue) {
  if (typeof proxyValue !== "string" || proxyValue === "") {
    return false;
  }

  let proxyUrl;
  try {
    proxyUrl = new URL(proxyValue);
  } catch {
    return false;
  }

  const isLoopbackHost =
    proxyUrl.hostname === "127.0.0.1" || proxyUrl.hostname === "[::1]";
  return (
    proxyUrl.protocol === "http:" &&
    isLoopbackHost &&
    proxyUrl.port !== "" &&
    proxyUrl.username === "" &&
    proxyUrl.password === "" &&
    proxyUrl.pathname === "/"
  );
}

function validateExistingNoProxy(value, label) {
  for (const entry of parseNoProxy(value)) {
    if (!LOOPBACK_NO_PROXY_ENTRIES.includes(entry)) {
      throw new Error(
        `Private GitHub Packages routing requires Socket's loopback-only ${label}`
      );
    }
  }
}

function validateSocketEnvironment(environment) {
  const proxyValues = [
    environment.HTTPS_PROXY,
    environment.HTTP_PROXY,
    environment.https_proxy,
    environment.http_proxy,
  ];

  if (proxyValues.some((value) => value !== proxyValues[0])) {
    throw new Error("Socket Firewall proxy variables must use one endpoint");
  }
  if (!isLoopbackProxy(proxyValues[0])) {
    throw new Error("Socket Firewall must provide a loopback HTTP proxy");
  }

  const socketCaPath = environment.NODE_EXTRA_CA_CERTS;
  if (
    typeof socketCaPath !== "string" ||
    !path.isAbsolute(socketCaPath) ||
    !fs.existsSync(socketCaPath)
  ) {
    throw new Error(
      "Socket Firewall must provide its CA as an extra Node root"
    );
  }

  validateExistingNoProxy(environment.NO_PROXY, "NO_PROXY");
  validateExistingNoProxy(environment.no_proxy, "no_proxy");
}

function createRoutedEnvironment(environment) {
  validateSocketEnvironment(environment);

  const routedEnvironment = {
    ...environment,
    NO_PROXY: ROUTED_NO_PROXY,
    no_proxy: ROUTED_NO_PROXY,
  };

  removeEnvironmentVariableCaseInsensitive(routedEnvironment, "SSL_CERT_FILE");
  removeEnvironmentVariableCaseInsensitive(routedEnvironment, "SSL_CERT_DIR");
  for (const key of Object.keys(routedEnvironment)) {
    const normalizedKey = key.toLowerCase();
    if (!normalizedKey.startsWith("npm_config_")) {
      continue;
    }

    const normalizedConfigName = normalizedKey
      .replace(/^npm_config_/, "")
      .replace(/[^a-z0-9]/g, "");
    if (REMOVED_ROUTED_CONFIG_NAMES.has(normalizedConfigName)) {
      delete routedEnvironment[key];
    }
  }

  return routedEnvironment;
}

function pnpmSpawnArguments(args, platform, pnpmBinary = "pnpm") {
  if (platform !== "win32") {
    return {
      command: pnpmBinary,
      commandArguments: args,
      shell: false,
    };
  }

  return {
    command: quoteWindowsShellArgument(pnpmBinary),
    commandArguments: args.map(quoteWindowsShellArgument),
    shell: true,
  };
}

function removeEnvironmentVariableCaseInsensitive(environment, variableName) {
  for (const key of Object.keys(environment)) {
    if (key.toLowerCase() === variableName.toLowerCase()) {
      delete environment[key];
    }
  }
}

function canonicalizeEnvironmentVariable(environment, variableName) {
  const matchingKey = Object.keys(environment).find(
    (key) => key.toLowerCase() === variableName.toLowerCase()
  );
  const value =
    matchingKey === undefined ? undefined : environment[matchingKey];
  removeEnvironmentVariableCaseInsensitive(environment, variableName);
  if (value !== undefined) {
    environment[variableName] = value;
  }
}

function argumentsEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((argument, index) => argument === right[index])
  );
}

function isAuthenticatedFrozenInstall(args) {
  return (
    argumentsEqual(args, AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS) ||
    argumentsEqual(args, [...AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS, "--prod"])
  );
}

function tokenFreeResolutionArguments(args) {
  return LOCKFILE_ONLY_COMMANDS.has(args[0])
    ? [...args, "--lockfile-only"]
    : args;
}

function spawnPnpm({
  args,
  environment,
  platform,
  pnpmBinary,
  repositoryRoot,
  spawn,
}) {
  const invocation = pnpmSpawnArguments(args, platform, pnpmBinary);
  const result = spawn(invocation.command, invocation.commandArguments, {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
    shell: invocation.shell,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function runPnpm({
  args = process.argv.slice(2),
  environment = process.env,
  platform = process.platform,
  pnpmBinary = "pnpm",
  repositoryRoot = REPOSITORY_ROOT,
  spawn = spawnSync,
}) {
  validateRepositoryPolicy({
    repositoryRoot,
    args,
    environment,
    validateEnvironmentOverrides: true,
  });

  const routedEnvironment = createRoutedEnvironment(environment);
  canonicalizeEnvironmentVariable(routedEnvironment, AUTH_ENVIRONMENT_VARIABLE);
  const trustedNpmrcPath = path.join(repositoryRoot, ".npmrc");
  const authenticatedEnvironment = {
    ...routedEnvironment,
    [USER_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
    [GLOBAL_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
    [NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE]: trustedNpmrcPath,
    [IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE]: "true",
    [IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE]: "true",
  };
  const tokenFreeResolutionEnvironment = { ...authenticatedEnvironment };
  removeEnvironmentVariableCaseInsensitive(
    tokenFreeResolutionEnvironment,
    AUTH_ENVIRONMENT_VARIABLE
  );

  let authenticatedArguments = args;
  if (!isAuthenticatedFrozenInstall(args)) {
    const resolutionArguments = tokenFreeResolutionArguments(args);
    console.error(
      "Secure pnpm routing: dependency changes resolve without package credentials."
    );
    const resolutionStatus = spawnPnpm({
      args: resolutionArguments,
      environment: tokenFreeResolutionEnvironment,
      platform,
      pnpmBinary,
      repositoryRoot,
      spawn,
    });
    if (resolutionStatus !== 0) {
      return resolutionStatus;
    }
    validateRepositoryFiles(repositoryRoot);

    if (!argumentsEqual(resolutionArguments, TOKEN_FREE_LOCKFILE_ARGUMENTS)) {
      const lockfileStatus = spawnPnpm({
        args: TOKEN_FREE_LOCKFILE_ARGUMENTS,
        environment: tokenFreeResolutionEnvironment,
        platform,
        pnpmBinary,
        repositoryRoot,
        spawn,
      });
      if (lockfileStatus !== 0) {
        return lockfileStatus;
      }
      validateRepositoryFiles(repositoryRoot);
    }

    authenticatedArguments = AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS;
  }

  console.error(
    `Secure pnpm routing: ${ALLOWED_REGISTRY_HOST} uses direct verified HTTPS; all other hosts use Socket Firewall.`
  );
  const status = spawnPnpm({
    args: authenticatedArguments,
    environment: authenticatedEnvironment,
    platform,
    pnpmBinary,
    repositoryRoot,
    spawn,
  });
  if (status !== 0) {
    return status;
  }

  validateRepositoryFiles(repositoryRoot);

  const tokenFreeEnvironment = { ...tokenFreeResolutionEnvironment };
  delete tokenFreeEnvironment[IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE];
  console.error(
    "Secure pnpm routing: approved dependency lifecycle scripts rebuild without package credentials."
  );
  const rebuildStatus = spawnPnpm({
    args: TOKEN_FREE_REBUILD_ARGUMENTS,
    environment: tokenFreeEnvironment,
    platform,
    pnpmBinary,
    repositoryRoot,
    spawn,
  });
  if (rebuildStatus !== 0) {
    return rebuildStatus;
  }

  validateRepositoryFiles(repositoryRoot);
  return rebuildStatus;
}

function main() {
  try {
    const invocationArguments = process.argv.slice(2);
    if (
      invocationArguments[0] !== SECURE_REPOSITORY_ROOT_ARGUMENT ||
      invocationArguments[2] !== SECURE_PNPM_BINARY_ARGUMENT ||
      invocationArguments[4] !== "--"
    ) {
      throw new Error(
        "Private GitHub Packages routing must be invoked by the trusted secure package helper."
      );
    }
    const repositoryRoot = invocationArguments[1];
    const pnpmBinary = invocationArguments[3];
    if (!path.isAbsolute(repositoryRoot) || !path.isAbsolute(pnpmBinary)) {
      throw new Error(
        "Secure package repository root and pnpm binary must be absolute."
      );
    }
    const trustedPnpmBinary = fs.realpathSync(pnpmBinary);
    fs.accessSync(trustedPnpmBinary, fs.constants.X_OK);

    process.exitCode = runPnpm({
      args: invocationArguments.slice(5),
      pnpmBinary: trustedPnpmBinary,
      repositoryRoot: fs.realpathSync(repositoryRoot),
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  AUTHENTICATED_FROZEN_INSTALL_ARGUMENTS,
  LOOPBACK_NO_PROXY_ENTRIES,
  ROUTED_NO_PROXY,
  ROUTED_NO_PROXY_ENTRIES,
  IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE,
  IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE,
  USER_CONFIG_ENVIRONMENT_VARIABLE,
  GLOBAL_CONFIG_ENVIRONMENT_VARIABLE,
  NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE,
  TOKEN_FREE_LOCKFILE_ARGUMENTS,
  TOKEN_FREE_REBUILD_ARGUMENTS,
  createRoutedEnvironment,
  isAuthenticatedFrozenInstall,
  isLoopbackProxy,
  parseNoProxy,
  pnpmSpawnArguments,
  runPnpm,
  validateSocketEnvironment,
};
