"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { reporters } = require("mocha");
const {
  classifyFailure,
  summarizeResult,
  getNavigationRetries,
} = require("./result.cjs");

// Retain the readable Mocha output and add a small machine-readable artifact.
// Hook failures are included: a failed before() means no app tests ran.
module.exports = class DeviceFarmReporter extends reporters.Spec {
  constructor(runner, options) {
    super(runner, options);
    const failures = [];
    let retries = 0;
    runner.on("retry", () => {
      retries += 1;
    });
    runner.on("fail", (test, error) => {
      failures.push({
        title: test.fullTitle(),
        hook: test.type === "hook",
        kind: classifyFailure(error),
        message: error.message,
        diagnostics: error.deviceFarmDiagnostics || null,
      });
    });
    runner.once("end", () => {
      const result = summarizeResult({
        total: runner.total,
        passes: runner.stats.passes,
        pending: runner.stats.pending,
        failures,
        retries: retries + getNavigationRetries(),
      });
      fs.writeFileSync(
        path.join(
          process.env.DEVICEFARM_LOG_DIR || ".",
          "devicefarm-result.json"
        ),
        `${JSON.stringify(result, null, 2)}\n`
      );
      console.log(
        `Device Farm diagnosis: ${result.outcome}; ${result.passes}/${result.total} passed; ${result.notRun} not run; ${result.retries} retries`
      );
    });
  }
};
