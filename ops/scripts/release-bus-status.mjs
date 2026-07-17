#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const DEFAULT_API_URL = "https://api.6529.io";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const REQUIRED_SCOPES = ["ALL", "STAGING", "PRODUCTION"];
const VALID_MODES = new Set(["OFF", "SHADOW", "STAGING", "PRODUCTION"]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);

class SafeStatusError extends Error {}

function runGh(args) {
  const result =
    /* NOSONAR -- Local operator controls PATH; no Release Bus input selects the executable. */ spawnSync(
      "gh",
      args,
      {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 10_000,
      }
    );

  if (result.error?.code === "ENOENT") {
    throw new SafeStatusError(
      "GitHub CLI (gh) is required. Install it and retry."
    );
  }
  return result;
}

function getGitHubToken() {
  const auth = runGh(["auth", "status"]);
  if (auth.status !== 0) {
    throw new SafeStatusError(
      "GitHub CLI is not authenticated. Run gh auth login and retry."
    );
  }

  const tokenResult = runGh(["auth", "token"]);
  const token = tokenResult.stdout?.trim();
  if (tokenResult.status !== 0 || !token) {
    throw new SafeStatusError(
      "Unable to obtain an authenticated GitHub token from gh."
    );
  }
  return token;
}

function getTimeoutMs() {
  const configured =
    process.env.RELEASE_BUS_STATUS_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS);
  const timeoutMs = Number(configured);
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new SafeStatusError(
      "RELEASE_BUS_STATUS_TIMEOUT_MS must be an integer from 1 to 60000."
    );
  }
  return timeoutMs;
}

function getStatusUrl() {
  const override = process.env.RELEASE_BUS_API_URL?.trim();
  const configured = override || DEFAULT_API_URL;
  let baseUrl;
  try {
    baseUrl = new URL(configured);
  } catch {
    throw new SafeStatusError("RELEASE_BUS_API_URL must be a valid HTTP URL.");
  }
  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
    throw new SafeStatusError("RELEASE_BUS_API_URL must be a valid HTTP URL.");
  }
  if (override && !LOOPBACK_HOSTS.has(baseUrl.hostname)) {
    throw new SafeStatusError(
      "RELEASE_BUS_API_URL override may target only a loopback test server."
    );
  }
  return new URL("/deploy/release-bus/controls", baseUrl);
}

function normalizePaused(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  throw new SafeStatusError(
    "Release Bus status API returned invalid status data."
  );
}

function sanitizeStatus(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !VALID_MODES.has(payload.mode) ||
    !Array.isArray(payload.controls)
  ) {
    throw new SafeStatusError(
      "Release Bus status API returned invalid status data."
    );
  }

  const controls = {};
  for (const scope of REQUIRED_SCOPES) {
    const matches = payload.controls.filter(
      (control) =>
        control !== null &&
        typeof control === "object" &&
        !Array.isArray(control) &&
        control.scope === scope
    );
    if (matches.length !== 1) {
      throw new SafeStatusError(
        "Release Bus status API returned incomplete control information."
      );
    }
    controls[scope] = normalizePaused(matches[0].paused) ? "PAUSED" : "RUNNING";
  }

  return { mode: payload.mode, controls };
}

async function requestStatus(token, statusUrl, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref();

  let response;
  try {
    response = await fetch(statusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      redirect: "error",
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new SafeStatusError("Release Bus status API request timed out.");
    }
    throw new SafeStatusError("Release Bus status API is unavailable.");
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    throw new SafeStatusError(
      `Release Bus status authentication failed (HTTP ${response.status}).`
    );
  }
  if (!response.ok) {
    throw new SafeStatusError(
      `Release Bus status API returned HTTP ${response.status}.`
    );
  }

  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    throw new SafeStatusError(
      "Release Bus status API returned malformed JSON."
    );
  }
  return sanitizeStatus(payload);
}

try {
  const timeoutMs = getTimeoutMs();
  const statusUrl = getStatusUrl();
  const token = getGitHubToken();
  const status = await requestStatus(token, statusUrl, timeoutMs);
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
} catch (error) {
  const message =
    error instanceof SafeStatusError
      ? error.message
      : "Unable to determine Release Bus status.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
