import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "lint-package-json.cjs");

const BASE_PACKAGE_JSON = {
  name: "fixture",
  dependencies: { left: "1.0.0" },
  devDependencies: { right: "2.0.0" },
  scripts: {
    test: "node scripts/require-6529-command.cjs && cross-env NODE_ENV=test jest --coverageReporters=none --silent --verbose=false",
  },
};

const runLint = (packageJson?: object) => {
  const env = { ...process.env };
  delete env["LINT_PACKAGE_JSON_PATH"];
  if (!packageJson) {
    return spawnSync(process.execPath, [SCRIPT_PATH], { encoding: "utf8", env });
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-package-json-"));
  const packageJsonPath = path.join(dir, "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
  try {
    return spawnSync(process.execPath, [SCRIPT_PATH], {
      encoding: "utf8",
      env: { ...env, LINT_PACKAGE_JSON_PATH: packageJsonPath },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const withTestScript = (test: string) => ({
  ...BASE_PACKAGE_JSON,
  scripts: { test },
});

describe("lint-package-json dependency pinning", () => {
  it("passes pinned versions", () => {
    expect(runLint(BASE_PACKAGE_JSON).status).toBe(0);
  });

  it("fails caret and tilde ranges", () => {
    const result = runLint({
      ...BASE_PACKAGE_JSON,
      dependencies: { left: "^1.0.0" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dependencies.left -> ^1.0.0");
  });
});

describe("lint-package-json trailing jest array options", () => {
  it("fails a jest script ending with an array-type option", () => {
    const result = runLint(
      withTestScript(
        "cross-env NODE_ENV=test jest --silent --verbose=false --coverageReporters=none"
      )
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "scripts.test ends with --coverageReporters=none"
    );
  });

  it("fails dashed aliases and bare array flags", () => {
    expect(runLint(withTestScript("jest --coverage-reporters=none")).status).toBe(
      1
    );
    expect(runLint(withTestScript("jest --reporters")).status).toBe(1);
  });

  it("passes when the array option is not the final token", () => {
    expect(
      runLint(
        withTestScript("jest --coverageReporters=none --silent --verbose=false")
      ).status
    ).toBe(0);
  });

  it("passes non-array trailing flags and positional endings", () => {
    expect(runLint(withTestScript("jest --silent --coverage=false")).status).toBe(
      0
    );
    expect(runLint(withTestScript("jest __tests__/scripts")).status).toBe(0);
  });

  it("ignores scripts whose final command is not jest", () => {
    expect(
      runLint(
        withTestScript(
          "jest --json --coverageReporters=none ; pnpm run test-extract-failed-names"
        )
      ).status
    ).toBe(0);
  });

  it("accepts the repository package.json", () => {
    const result = runLint();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});
