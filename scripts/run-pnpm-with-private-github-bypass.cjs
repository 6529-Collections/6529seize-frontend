#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  ALLOWED_REGISTRY_HOST,
  validateRepositoryPolicy,
} = require("./private-github-packages-policy.cjs");

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

  delete routedEnvironment.SSL_CERT_FILE;
  delete routedEnvironment.SSL_CERT_DIR;
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

function runPnpm({
  args = process.argv.slice(2),
  environment = process.env,
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
  console.error(
    `Secure pnpm routing: ${ALLOWED_REGISTRY_HOST} uses direct verified HTTPS; all other hosts use Socket Firewall.`
  );

  const result = spawn("pnpm", args, {
    cwd: repositoryRoot,
    env: routedEnvironment,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;
  if (status === 0) {
    validateRepositoryPolicy({
      repositoryRoot,
      args,
      environment: routedEnvironment,
      validateEnvironmentOverrides: true,
    });
  }

  return status;
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
  createRoutedEnvironment,
  isLoopbackProxy,
  parseNoProxy,
  runPnpm,
  validateSocketEnvironment,
};
