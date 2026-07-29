#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const DEFAULT_API_URL = "https://api.6529.io";
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 60_000;
const REQUIRED_SCOPES = ["ALL", "STAGING", "PRODUCTION"];
const REQUIRED_LANES = ["STAGING", "PRODUCTION"];
const VALID_MODES = new Set(["OFF", "STAGING", "PRODUCTION"]);
const VALID_LANE_STATUSES = new Set(["ON", "OFF"]);
const VALID_STAGING_STATES = new Set([
  "UNINITIALIZED",
  "LIVE",
  "CLEAN_MAIN",
  "ROLLBACK_FAILED",
]);
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "[::1]", "localhost"]);

class SafeStatusError extends Error {}

function runGh(args) {
  const result = spawnSync(
    "gh", // NOSONAR -- Local operator controls PATH; no Release Bus input selects the executable.
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
  return new URL("/deploy/release-bus-v2/controls", baseUrl);
}

function normalizePaused(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  throw new SafeStatusError(
    "Release Bus status API returned invalid status data."
  );
}

function normalizeReason(value) {
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new SafeStatusError(
    "Release Bus status API returned invalid status data."
  );
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function modeAllowsLane(mode, lane) {
  return mode === "PRODUCTION" || (mode === "STAGING" && lane === "STAGING");
}

function requireRows(rows, requiredKeys, keyName, message) {
  if (
    rows.length !== requiredKeys.length ||
    rows.some((row) => !isRecord(row) || !requiredKeys.includes(row[keyName]))
  ) {
    throw new SafeStatusError(message);
  }
  const result = {};
  for (const requiredKey of requiredKeys) {
    const matches = rows.filter((row) => row[keyName] === requiredKey);
    if (matches.length !== 1) throw new SafeStatusError(message);
    result[requiredKey] = matches[0];
  }
  return result;
}

function sanitizeControls(rows) {
  const rawControls = requireRows(
    rows,
    REQUIRED_SCOPES,
    "scope",
    "Release Bus status API returned incomplete control information."
  );
  return Object.fromEntries(
    REQUIRED_SCOPES.map((scope) => {
      const control = rawControls[scope];
      if (!Object.hasOwn(control, "reason")) {
        throw new SafeStatusError(
          "Release Bus status API returned invalid status data."
        );
      }
      return [
        scope,
        {
          paused: normalizePaused(control.paused),
          reason: normalizeReason(control.reason),
        },
      ];
    })
  );
}

function expectedLaneState(mode, controls, lane) {
  const globalPaused = controls.ALL.paused;
  const lanePaused = controls[lane].paused;
  const allowed = modeAllowsLane(mode, lane);
  let reason = controls[lane].reason;
  if (!allowed) {
    reason = "Internal Release Bus hard stop is active";
  } else if (globalPaused) {
    reason = controls.ALL.reason ?? "Internal Release Bus hard stop is active";
  }
  return {
    status: allowed && !globalPaused && !lanePaused ? "ON" : "OFF",
    changeable: allowed && !globalPaused,
    reason,
  };
}

function sanitizeLanes(rows, mode, controls) {
  const rawLanes = requireRows(
    rows,
    REQUIRED_LANES,
    "lane",
    "Release Bus status API returned incomplete lane information."
  );
  const lanes = {};
  for (const lane of REQUIRED_LANES) {
    const item = rawLanes[lane];
    if (
      !VALID_LANE_STATUSES.has(item.status) ||
      typeof item.changeable !== "boolean" ||
      !Object.hasOwn(item, "reason")
    ) {
      throw new SafeStatusError(
        "Release Bus status API returned invalid lane information."
      );
    }
    const actual = {
      status: item.status,
      changeable: item.changeable,
      reason: normalizeReason(item.reason),
    };
    const expected = expectedLaneState(mode, controls, lane);
    if (
      actual.status !== expected.status ||
      actual.changeable !== expected.changeable ||
      actual.reason !== expected.reason
    ) {
      throw new SafeStatusError(
        "Release Bus status API returned inconsistent lane information."
      );
    }
    lanes[lane] = actual;
  }
  return lanes;
}

function normalizeOptionalString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  throw new SafeStatusError(
    "Release Bus status API returned invalid staging identity."
  );
}

function normalizeOptionalSha(value) {
  if (value === null) return null;
  if (typeof value === "string" && /^[a-f0-9]{40}$/.test(value)) return value;
  throw new SafeStatusError(
    "Release Bus status API returned invalid staging identity."
  );
}

function sanitizeStagingState(staging) {
  if (
    !isRecord(staging) ||
    !VALID_STAGING_STATES.has(staging.status) ||
    typeof staging.row_version !== "number" ||
    !Number.isInteger(staging.row_version) ||
    staging.row_version < 1 ||
    typeof staging.clean_main !== "boolean"
  ) {
    throw new SafeStatusError(
      "Release Bus status API returned invalid staging state."
    );
  }
  return {
    status: staging.status,
    current_manifest_id: normalizeOptionalString(staging.current_manifest_id),
    last_validated_manifest_id: normalizeOptionalString(
      staging.last_validated_manifest_id
    ),
    frontend_sha: normalizeOptionalSha(staging.frontend_sha),
    backend_sha: normalizeOptionalSha(staging.backend_sha),
    frontend_staging_ref_sha: normalizeOptionalSha(
      staging.frontend_staging_ref_sha
    ),
    backend_staging_ref_sha: normalizeOptionalSha(
      staging.backend_staging_ref_sha
    ),
    clean_main: staging.clean_main,
    last_transition_train_id: normalizeOptionalString(
      staging.last_transition_train_id
    ),
    row_version: staging.row_version,
  };
}

function sanitizeStatus(payload) {
  if (
    !isRecord(payload) ||
    !VALID_MODES.has(payload.mode) ||
    !Array.isArray(payload.controls) ||
    !Array.isArray(payload.lanes)
  ) {
    throw new SafeStatusError(
      "Release Bus status API returned invalid status data."
    );
  }
  const controls = sanitizeControls(payload.controls);
  return {
    lanes: sanitizeLanes(payload.lanes, payload.mode, controls),
    staging: sanitizeStagingState(payload.staging_state),
  };
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
