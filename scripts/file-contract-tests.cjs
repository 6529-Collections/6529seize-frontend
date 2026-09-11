#!/usr/bin/env node
"use strict";

const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");

// Jest's import graph cannot see filesystem reads. Keep these dependencies
// explicit, including scanned directories and non-JavaScript inputs. Existing
// deployment/agent-file contract lanes continue to own their selected suites.
const CONTRACTS = [
  {
    test: "__tests__/contracts/hover-revealed-controls.test.ts",
    inputs: [/^(?:app|components)\/.*\.tsx$/u, /^tailwind\.config\./u],
  },
  {
    test: "__tests__/contracts/waves-multi-competition-phase-1.test.ts",
    inputs: [
      /^(?:app|components|contexts|helpers|hooks|lib|services|utils)\/.*\.[cm]?[jt]sx?$/u,
      /^openapi\.yaml$/u,
      /^generated\/models\//u,
      /^ops\/roadmap\/waves-multi-competition\/phase-0\/baseline\//u,
    ],
  },
  {
    test: "__tests__/scripts/museum-publication-compatibility.test.ts",
    inputs: [
      /^\.github\/workflows\/(?:staging-e2e|production-e2e|museum-publication-compatibility)\.yml$/u,
      /^scripts\/museum-publication-compatibility\.ts$/u,
    ],
  },
  {
    test: "__tests__/scripts/coverage-floor.test.ts",
    inputs: [
      /^\.github\/workflows\/coverage-floor\.yml$/u,
      /^scripts\/coverage-floor(?:-baseline)?\.(?:cjs|json)$/u,
    ],
  },
  {
    test: "__tests__/scripts/dependency-governance-workflow.test.ts",
    inputs: [/^\.github\/workflows\/dependency-governance\.yml$/u],
  },
  {
    test: "__tests__/scripts/runner-benchmark-workflow.test.ts",
    inputs: [/^\.github\/workflows\/runner-benchmark(?:-candidate)?\.yml$/u],
  },
];

const SELECTION_INPUTS = new Set([
  "scripts/file-contract-tests.cjs",
  "__tests__/scripts/file-contract-tests.test.ts",
  ".github/workflows/app-pr-ci.yml",
  "package.json",
  "pnpm-lock.yaml",
  "jest.config.js",
  "jest.setup.js",
  "tsconfig.jest.json",
]);

function selectFileContractTests(changedFiles) {
  const files = changedFiles.map((file) => file.replaceAll("\\", "/"));
  const selectAll = files.some((file) => SELECTION_INPUTS.has(file));
  const selected = CONTRACTS.filter(
    ({ test, inputs }) =>
      selectAll ||
      files.some(
        (file) => file === test || inputs.some((pattern) => pattern.test(file))
      )
  ).map(({ test }) => test);
  if (selectAll) selected.push("__tests__/scripts/file-contract-tests.test.ts");
  return selected;
}

function changedFilesSince(baseSha, cwd = process.cwd()) {
  if (!/^[a-f0-9]{40}$/u.test(baseSha)) {
    throw new Error("Expected an exact base commit SHA.");
  }
  // Include deleted paths and both sides of renames: removing or moving an
  // input can break a filesystem contract just as editing it can.
  return execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", `${baseSha}...HEAD`, "--"],
    { cwd, encoding: "utf8" }
  )
    .split("\0")
    .filter(Boolean);
}

function runFileContractTests(files, run = spawnSync) {
  const tests = selectFileContractTests(files);
  if (tests.length === 0) {
    console.log("No filesystem contract inputs changed.");
    return 0;
  }
  for (const test of tests) {
    if (!fs.existsSync(test)) {
      throw new Error(`Selected filesystem contract test is missing: ${test}`);
    }
  }
  console.log(`Filesystem contract tests:\n${tests.join("\n")}`);
  const result = run(
    "./bin/6529",
    [
      "run",
      "test:no-coverage",
      "--ci",
      "--runInBand",
      "--runTestsByPath",
      ...tests,
    ],
    { stdio: "inherit", env: { ...process.env, NODE_ENV: "test" } }
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (require.main === module) {
  try {
    const [flag, baseSha, ...extra] = process.argv.slice(2);
    if (flag !== "--changed-from" || !baseSha || extra.length > 0) {
      throw new Error(
        "Usage: file-contract-tests.cjs --changed-from <base SHA>"
      );
    }
    process.exitCode = runFileContractTests(changedFilesSince(baseSha));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  selectFileContractTests,
  changedFilesSince,
  runFileContractTests,
};
