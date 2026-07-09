#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("./cli-args.cjs");

const SCHEMA_VERSION = "deployment-version-evidence.v1";
const VERSION_ENDPOINT_PATH = "/api/version";
const STAGING_HOSTNAME = "staging.6529.io";
const STAGING_ACCESS_COOKIE_NAME = "x-6529-auth";

function parsePositiveInteger(value, fallback, optionName) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

function normalizeBaseUrl(rawBaseUrl) {
  if (!rawBaseUrl) {
    throw new Error("--base-url is required");
  }

  const parsed = new URL(rawBaseUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("--base-url must use http or https");
  }
  if (parsed.username || parsed.password) {
    throw new Error("--base-url must not include credentials");
  }

  return `${parsed.protocol}//${parsed.host}`;
}

function resolveVersionEndpoint(baseUrl) {
  return new URL(VERSION_ENDPOINT_PATH, baseUrl).toString();
}

function getHeader(headers, name) {
  if (!headers) {
    return "";
  }
  if (typeof headers.get === "function") {
    return headers.get(name) || "";
  }
  return headers[name] || headers[name.toLowerCase()] || "";
}

function getStagingAccessCode(env) {
  return env.PLAYWRIGHT_STAGING_ACCESS_CODE || env.STAGING_AUTH || "";
}

function assertSafeCookieValue(value) {
  if (/[\r\n;]/.test(value)) {
    throw new Error(
      "staging access code is not safe for an HTTP cookie header"
    );
  }
}

function buildRequestHeaders(endpointUrl, env) {
  const headers = {
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "User-Agent": "6529-deployment-version-check/1",
  };
  const endpoint = new URL(endpointUrl);
  const stagingAccessCode = getStagingAccessCode(env);

  if (endpoint.hostname === STAGING_HOSTNAME && stagingAccessCode) {
    assertSafeCookieValue(stagingAccessCode);
    headers.Cookie = `${STAGING_ACCESS_COOKIE_NAME}=${stagingAccessCode}`;
  }

  return headers;
}

function sanitizeError(error) {
  if (!error) {
    return "unknown error";
  }
  if (error.name === "AbortError") {
    return "request timed out";
  }
  return String(error.message || error).replace(/[\r\n]+/g, " ");
}

async function fetchVersion({ fetchImpl, endpointUrl, headers, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpointUrl, {
      method: "GET",
      headers,
      redirect: "manual",
      signal: controller.signal,
    });
    const cacheControl = getHeader(response.headers, "cache-control");
    let body;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return {
      status: response.status,
      cacheControl,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildEvidence({
  baseUrl,
  expectedVersion,
  consecutiveMatches,
  requiredMatches,
  attempt,
  maxAttempts,
  startedAt,
  checkedAt,
  durationMs,
  result,
  error,
}) {
  const actualVersion =
    typeof result?.body?.version === "string" ? result.body.version : null;
  const cacheControl = result?.cacheControl || "";
  const noStore = cacheControl.toLowerCase().includes("no-store");
  const status = result?.status ?? null;
  const matched =
    status === 200 && noStore === true && actualVersion === expectedVersion;

  return {
    schema_version: SCHEMA_VERSION,
    base_url: baseUrl,
    endpoint_path: VERSION_ENDPOINT_PATH,
    expected_version: expectedVersion,
    actual_version: actualVersion,
    matched,
    consecutive_matches: consecutiveMatches,
    required_matches: requiredMatches,
    status,
    cache_control: cacheControl,
    no_store: noStore,
    attempt,
    max_attempts: maxAttempts,
    started_at: startedAt,
    checked_at: checkedAt,
    duration_ms: durationMs,
    error: error ? sanitizeError(error) : null,
  };
}

async function verifyDeploymentVersion(options) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new TypeError("global fetch is not available");
  }

  const expectedVersion = options.expectedVersion;
  if (!expectedVersion || typeof expectedVersion !== "string") {
    throw new Error("--expected-version is required");
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpointUrl = resolveVersionEndpoint(baseUrl);
  const attempts = parsePositiveInteger(options.attempts, 8, "--attempts");
  const requiredMatches = parsePositiveInteger(
    options.requiredMatches,
    1,
    "--required-matches"
  );
  const delayMs = parsePositiveInteger(options.delayMs, 15000, "--delay-ms");
  const timeoutMs = parsePositiveInteger(
    options.timeoutMs,
    10000,
    "--timeout-ms"
  );
  const sleep =
    options.sleep ||
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = options.now || (() => new Date().toISOString());
  const monotonicNow = options.monotonicNow || (() => Date.now());
  const headers = buildRequestHeaders(endpointUrl, env);
  const startedAt = now();
  const startedMs = monotonicNow();
  let evidence = null;
  let consecutiveMatches = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await fetchVersion({
        fetchImpl,
        endpointUrl,
        headers,
        timeoutMs,
      });
      evidence = buildEvidence({
        baseUrl,
        expectedVersion,
        consecutiveMatches,
        requiredMatches,
        attempt,
        maxAttempts: attempts,
        startedAt,
        checkedAt: now(),
        durationMs: monotonicNow() - startedMs,
        result,
      });
    } catch (error) {
      evidence = buildEvidence({
        baseUrl,
        expectedVersion,
        consecutiveMatches,
        requiredMatches,
        attempt,
        maxAttempts: attempts,
        startedAt,
        checkedAt: now(),
        durationMs: monotonicNow() - startedMs,
        error,
      });
    }

    consecutiveMatches = evidence.matched ? consecutiveMatches + 1 : 0;
    evidence.consecutive_matches = consecutiveMatches;

    if (consecutiveMatches >= requiredMatches) {
      return { ok: true, evidence };
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  return { ok: false, evidence };
}

function writeEvidenceFile(output, evidence) {
  if (!output) {
    return;
  }

  const target = path.resolve(output);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.writeFileSync(target, `${JSON.stringify(evidence, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await verifyDeploymentVersion({
    baseUrl: args["base-url"],
    expectedVersion: args["expected-version"],
    attempts: args.attempts,
    requiredMatches: args["required-matches"],
    delayMs: args["delay-ms"],
    timeoutMs: args["timeout-ms"],
  });

  writeEvidenceFile(args.output, result.evidence);

  if (result.ok) {
    process.stdout.write(
      `Deployment version verified at ${result.evidence.base_url}${result.evidence.endpoint_path}: ${result.evidence.actual_version}`
    );
    process.stdout.write("\n");
    return;
  }

  console.error(
    `Deployment version check failed at ${result.evidence.base_url}${result.evidence.endpoint_path}: expected ${result.evidence.expected_version}, got ${result.evidence.actual_version || "no version"}`
  );
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Deployment version check failed: ${sanitizeError(error)}`);
    process.exitCode = 1;
  });
}

module.exports = {
  SCHEMA_VERSION,
  STAGING_ACCESS_COOKIE_NAME,
  VERSION_ENDPOINT_PATH,
  buildRequestHeaders,
  normalizeBaseUrl,
  resolveVersionEndpoint,
  verifyDeploymentVersion,
  writeEvidenceFile,
};
