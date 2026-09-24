"use strict";

let navigationRetries = 0;

function recordNavigationRetry() {
  navigationRetries += 1;
}

function getNavigationRetries() {
  return navigationRetries;
}

function resetNavigationRetries() {
  navigationRetries = 0;
}

function classifyFailure(error) {
  const message = error.message || "";
  if (
    error.code === "DEVICE_OFFLINE" ||
    /net::ERR_INTERNET_DISCONNECTED\b/.test(message)
  ) {
    return "device-connectivity";
  }
  if (
    /remote debugger did not return any connected web applications/i.test(
      message
    )
  ) {
    return "safari-session-startup";
  }
  // A timeout or generic WebDriver error alone cannot establish that the
  // infrastructure is at fault. Preserve it for investigation as test failure.
  return "test-failure";
}

function summarizeResult({ total, passes, pending, failures, retries }) {
  const notRun = Math.max(
    0,
    total -
      passes -
      pending -
      failures.filter((failure) => !failure.hook).length
  );
  let outcome = "passed";
  if (failures.length > 0) {
    outcome = failures.every((failure) => failure.kind !== "test-failure")
      ? "infrastructure-failure"
      : "test-failure";
  } else if (total === 0 || pending > 0 || notRun > 0) {
    outcome = "tests-not-run";
  } else if (retries > 0) {
    outcome = "passed-after-retry";
  }
  return {
    schemaVersion: 1,
    outcome,
    total,
    passes,
    pending,
    notRun,
    retries,
    failures,
  };
}

module.exports = {
  classifyFailure,
  summarizeResult,
  recordNavigationRetry,
  getNavigationRetries,
  resetNavigationRetries,
};
