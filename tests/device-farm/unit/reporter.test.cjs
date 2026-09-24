"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

function runFixture(source) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "devicefarm-reporter-")
  );
  try {
    const fixture = path.join(directory, "fixture.cjs");
    fs.writeFileSync(fixture, source);
    const run = spawnSync(
      process.execPath,
      [
        require.resolve("mocha/bin/mocha.js"),
        fixture,
        "--reporter",
        path.resolve(__dirname, "../lib/reporter.cjs"),
        "--retries",
        "0",
        "--fail-zero",
        "--forbid-pending",
      ],
      {
        encoding: "utf8",
        timeout: 10000,
        env: { ...process.env, DEVICEFARM_LOG_DIR: directory },
      }
    );
    assert.ifError(run.error);
    return {
      status: run.status,
      result: JSON.parse(
        fs.readFileSync(path.join(directory, "devicefarm-result.json"), "utf8")
      ),
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("real Mocha writes evidence for a fully executed suite", () => {
  const { status, result } = runFixture(
    'describe("web", () => { it("renders", () => {}); });'
  );
  assert.equal(status, 0);
  assert.equal(result.outcome, "passed");
  assert.equal(result.passes, 1);
  assert.equal(result.notRun, 0);
});

test("real Mocha records a failed setup hook and unexecuted assertions", () => {
  const { status, result } = runFixture(`
    describe("web", () => {
      before(() => { throw new Error("The remote debugger did not return any connected web applications after 30000ms"); });
      it("renders", () => {});
      it("long presses", () => {});
    });
  `);
  assert.equal(status, 1);
  assert.equal(result.outcome, "infrastructure-failure");
  assert.equal(result.notRun, 2);
  assert.equal(result.failures[0].kind, "safari-session-startup");
});

test("real Mocha does not retry an app assertion or mislabel it as infrastructure", () => {
  const { status, result } = runFixture(`
    let attempts = 0;
    it("app assertion", () => { if (++attempts === 1) throw new Error("missing navigation"); });
  `);
  assert.equal(status, 1);
  assert.equal(result.outcome, "test-failure");
  assert.equal(result.retries, 0);
  assert.equal(result.failures.length, 1);
});

test("empty and pending suites cannot silently pass", () => {
  for (const source of [
    'describe("empty", () => {});',
    'it.skip("not executed", () => {});',
  ]) {
    const { status, result } = runFixture(source);
    assert.equal(status, 1);
    assert.notEqual(result.outcome, "passed");
  }
});

test("existing navigation recovery remains visible in the result", () => {
  const resultPath = JSON.stringify(
    path.resolve(__dirname, "../lib/result.cjs")
  );
  const { result } = runFixture(`
    it("navigation", () => { require(${resultPath}).recordNavigationRetry(); });
  `);
  assert.equal(result.outcome, "passed-after-retry");
  assert.equal(result.retries, 1);
});
