#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  AUTH_ENVIRONMENT_VARIABLE,
  ALLOWED_REGISTRY_HOST,
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
const TOKEN_FREE_REBUILD_PACKAGES = [
  "@nestjs/core",
  "@openapitools/openapi-generator-cli",
  "@parcel/watcher",
  "@reown/appkit",
  "@sentry/cli",
  "bufferutil",
  "esbuild",
  "keccak",
  "sharp",
  "unrs-resolver",
  "utf-8-validate",
];
const TOKEN_FREE_REBUILD_ARGUMENTS = [
  "rebuild",
  ...TOKEN_FREE_REBUILD_PACKAGES,
];
const TOKEN_FREE_ROOT_REBUILD_ARGUMENTS = ["rebuild", "--pending"];

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

function pnpmSpawnArguments(args, platform) {
  if (platform !== "win32") {
    return {
      command: "pnpm",
      commandArguments: args,
      shell: false,
    };
  }

  return {
    command: quoteWindowsShellArgument("pnpm"),
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

function runPnpm({
  args = process.argv.slice(2),
  environment = process.env,
  platform = process.platform,
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
  console.error(
    `Secure pnpm routing: ${ALLOWED_REGISTRY_HOST} uses direct verified HTTPS; all other hosts use Socket Firewall.`
  );

  const authenticatedInvocation = pnpmSpawnArguments(args, platform);
  const result = spawn(
    authenticatedInvocation.command,
    authenticatedInvocation.commandArguments,
    {
      cwd: repositoryRoot,
      env: authenticatedEnvironment,
      stdio: "inherit",
      shell: authenticatedInvocation.shell,
    }
  );

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status !== 0) {
    return status;
  }

  validateRepositoryFiles(repositoryRoot);

  const tokenFreeEnvironment = { ...authenticatedEnvironment };
  removeEnvironmentVariableCaseInsensitive(
    tokenFreeEnvironment,
    AUTH_ENVIRONMENT_VARIABLE
  );
  delete tokenFreeEnvironment[IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE];
  console.error(
    "Secure pnpm routing: approved dependency lifecycle scripts rebuild without package credentials."
  );
  const rebuildInvocation = pnpmSpawnArguments(
    TOKEN_FREE_REBUILD_ARGUMENTS,
    platform
  );
  const rebuildResult = spawn(
    rebuildInvocation.command,
    rebuildInvocation.commandArguments,
    {
      cwd: repositoryRoot,
      env: tokenFreeEnvironment,
      stdio: "inherit",
      shell: rebuildInvocation.shell,
    }
  );
  if (rebuildResult.error) {
    throw rebuildResult.error;
  }

  const rebuildStatus = rebuildResult.status ?? 1;
  if (rebuildStatus !== 0) {
    return rebuildStatus;
  }

  const rootRebuildInvocation = pnpmSpawnArguments(
    TOKEN_FREE_ROOT_REBUILD_ARGUMENTS,
    platform
  );
  const rootRebuildResult = spawn(
    rootRebuildInvocation.command,
    rootRebuildInvocation.commandArguments,
    {
      cwd: repositoryRoot,
      env: tokenFreeEnvironment,
      stdio: "inherit",
      shell: rootRebuildInvocation.shell,
    }
  );
  if (rootRebuildResult.error) {
    throw rootRebuildResult.error;
  }

  const rootRebuildStatus = rootRebuildResult.status ?? 1;
  if (rootRebuildStatus === 0) {
    validateRepositoryFiles(repositoryRoot);
  }
  return rootRebuildStatus;
}

function main() {
  try {
    process.exitCode = runPnpm({});
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  LOOPBACK_NO_PROXY_ENTRIES,
  ROUTED_NO_PROXY,
  ROUTED_NO_PROXY_ENTRIES,
  IGNORE_PNPMFILE_ENVIRONMENT_VARIABLE,
  IGNORE_SCRIPTS_ENVIRONMENT_VARIABLE,
  USER_CONFIG_ENVIRONMENT_VARIABLE,
  GLOBAL_CONFIG_ENVIRONMENT_VARIABLE,
  NPM_GLOBAL_CONFIG_ENVIRONMENT_VARIABLE,
  TOKEN_FREE_REBUILD_ARGUMENTS,
  TOKEN_FREE_REBUILD_PACKAGES,
  TOKEN_FREE_ROOT_REBUILD_ARGUMENTS,
  createRoutedEnvironment,
  isLoopbackProxy,
  parseNoProxy,
  pnpmSpawnArguments,
  runPnpm,
  validateSocketEnvironment,
};
