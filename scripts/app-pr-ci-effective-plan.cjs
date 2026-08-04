#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_GOVERNANCE_FILES = new Set([
  ".npmrc",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);
const TEST_TYPECHECK_CONFIG_FILES = new Set([
  "jest.config.js",
  "tsconfig.jest.json",
  "tsconfig.playwright.json",
]);
const SOURCE_EXTENSION = /\.(?:cjs|js|jsx|mjs|ts|tsx)$/u;
const RELEASE_BUS_CONTRACT_PATTERNS = [
  /^\.github\/workflows\//u,
  /^ops\/deployment-bus\//u,
  /^ops\/scripts\/(?:deployment-bus|deploy-staging-artifact|release-bus-status|verify-deployment-version)\./u,
  /^scripts\/(?:app-pr-ci-effective-plan|e2e-packs|pr-ci-policy-bundle|release-bus-|sync-e2e-manifest)/u,
  /^tests\/packs\.manifest\.cjs$/u,
  /^__tests__\/scripts\/(?:app-pr-ci-effective-plan|deployment-bus|e2e-packs|manual-deploy-routing-guard|pr-ci-policy-bundle|release-bus-|sync-e2e-manifest)/u,
  /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml)$/u,
];

function check(required, reason) {
  return { required, reason };
}

function isTestFile(file) {
  return (
    file.startsWith("tests/") ||
    file.startsWith("__tests__/") ||
    file.includes(".test.") ||
    file.includes(".spec.")
  );
}

function applyEffectiveAppPrCiPlan(plan, { cwd = process.cwd() } = {}) {
  if (!Array.isArray(plan?.changed_files) || typeof plan?.checks !== "object") {
    throw new Error("App PR CI plan is malformed.");
  }

  const files = plan.changed_files.map((file) =>
    String(file).replaceAll("\\", "/")
  );
  const packageGovernance = files.some((file) =>
    PACKAGE_GOVERNANCE_FILES.has(file)
  );
  const deletedRuntimeSource = files.some(
    (file) =>
      SOURCE_EXTENSION.test(file) &&
      !isTestFile(file) &&
      !fs.existsSync(path.join(cwd, file))
  );
  const deadcode =
    packageGovernance || files.includes("knip.jsonc") || deletedRuntimeSource;
  const testTypecheck =
    packageGovernance ||
    files.some(
      (file) => isTestFile(file) || TEST_TYPECHECK_CONFIG_FILES.has(file)
    );
  const releaseBusContract = files.some((file) =>
    RELEASE_BUS_CONTRACT_PATTERNS.some((pattern) => pattern.test(file))
  );

  const checks = {
    ...plan.checks,
    deadcode: check(
      deadcode,
      deadcode
        ? "Dependency policy, Knip configuration, or deleted runtime source needs dead-code analysis."
        : "No dependency policy, Knip configuration, or deleted runtime source changed."
    ),
    release_bus_contract: check(
      releaseBusContract,
      releaseBusContract
        ? "Release, deployment, workflow, or E2E policy files changed and need the Release Bus contract suite."
        : "No Release Bus or deployment policy files changed."
    ),
    test_typecheck: check(
      testTypecheck,
      testTypecheck
        ? "Changed test code, test configuration, or dependency policy needs test-helper typechecking."
        : "No test code, test configuration, or dependency policy changed."
    ),
  };
  return { ...plan, checks };
}

function parsePlanPath(argv) {
  if (argv.length !== 2 || argv[0] !== "--plan" || !argv[1]) {
    throw new Error("Usage: app-pr-ci-effective-plan.cjs --plan <path>");
  }
  return path.resolve(argv[1]);
}

if (require.main === module) {
  try {
    const planPath = parsePlanPath(process.argv.slice(2));
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    fs.writeFileSync(
      planPath,
      `${JSON.stringify(applyEffectiveAppPrCiPlan(plan), null, 2)}\n`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
