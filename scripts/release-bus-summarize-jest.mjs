#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const MAX_SUITES = 50;
const MAX_TESTS = 100;
const MAX_TEXT = 500;

function safeText(value) {
  if (typeof value !== "string") return null;
  const sanitized = Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? " " : character;
    })
    .join("")
    .trim();
  return sanitized ? sanitized.slice(0, MAX_TEXT) : null;
}

function safeSuitePath(value, rootDirectory) {
  const text = safeText(value);
  if (!text) return null;
  const relative = path.relative(rootDirectory, text).replaceAll(path.sep, "/");
  if (!relative.startsWith("../") && relative !== ".." && relative !== "") {
    return safeText(relative);
  }
  return safeText(path.basename(text));
}

function safeCount(value) {
  return Number.isInteger(value) && value >= 0
    ? Math.min(value, 10_000_000)
    : 0;
}

export function summarizeJestPayload(payload, rootDirectory = process.cwd()) {
  const results = Array.isArray(payload?.testResults)
    ? payload.testResults
    : [];
  const failingSuites = [];
  const failingTests = [];

  for (const result of results) {
    const suite = safeSuitePath(result?.name, rootDirectory) ?? "unknown-suite";
    const assertions = Array.isArray(result?.assertionResults)
      ? result.assertionResults
      : [];
    const failedAssertions = assertions.filter(
      (assertion) => assertion?.status === "failed"
    );
    if (
      safeCount(result?.numFailingTests) > 0 ||
      failedAssertions.length > 0 ||
      result?.status === "failed"
    ) {
      failingSuites.push(suite);
    }
    for (const assertion of failedAssertions) {
      const test =
        safeText(assertion?.fullName) ??
        safeText(assertion?.title) ??
        "Unnamed failing test";
      failingTests.push({ suite, test });
    }
  }

  return {
    version: 1,
    num_failed_test_suites: safeCount(
      payload?.numFailedTestSuites ?? failingSuites.length
    ),
    num_failed_tests: safeCount(payload?.numFailedTests ?? failingTests.length),
    failing_suites: [...new Set(failingSuites)].slice(0, MAX_SUITES),
    failing_tests: failingTests.slice(0, MAX_TESTS),
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
) {
  const input = argument("--input");
  const output = argument("--output");
  if (!input || !output) {
    process.stderr.write(
      "Usage: release-bus-summarize-jest.mjs --input <jest.json> --output <summary.json>\n"
    );
    process.exit(2);
  }
  const payload = JSON.parse(fs.readFileSync(input, "utf8"));
  const summary = summarizeJestPayload(payload);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`, {
    mode: 0o600,
  });
}
