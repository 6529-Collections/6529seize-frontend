#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const CONTRACT = "pr-ci-policy-bundle-v1";
// Museum release controls remain within an explicit protected-file ceiling;
// byte ceilings below continue to bound the canonical bundle independently.
const MAX_FILE_COUNT = 128;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_CANONICAL_BYTES = 64 * 1024;
const LEGACY_NODE_PIN_WORKFLOW_SHA256 = Object.freeze({
  ".github/workflows/app-pr-ci.yml":
    "1fe5d8b652e3b54870cdf01412dbf2db6d49f89244ad0cdbfefc59e905b7c6b9",
});

const FILE_PATHS = Object.freeze([
  ".prettierignore",
  ".github/6529bot.yml",
  ".github/workflows/app-pr-ci.yml",
  ".github/workflows/artifact-portability-report.yml",
  ".github/workflows/build-upload-deploy-prod.yml",
  ".github/workflows/deploy-staging.yml",
  ".github/workflows/dependency-governance.yml",
  ".github/workflows/museum-publication-compatibility.yml",
  ".github/workflows/production-e2e.yml",
  ".github/workflows/production-e2e-dispatch.yml",
  ".github/workflows/production-build-artifact.yml",
  ".github/workflows/release-bus-deploy-production.yml",
  ".github/workflows/release-bus-deploy-staging.yml",
  ".github/workflows/release-bus-v2-advance-staging-ref.yml",
  ".github/workflows/release-bus-v2-compose.yml",
  ".github/workflows/release-bus-v2-preflight.yml",
  ".github/workflows/runner-benchmark.yml",
  ".github/workflows/runner-benchmark-candidate.yml",
  ".github/workflows/staging-e2e-dispatch.yml",
  ".github/workflows/staging-e2e.yml",
  "__tests__/scripts/app-pr-ci-effective-plan.test.ts",
  "__tests__/scripts/artifact-portability-and-readiness.test.ts",
  "__tests__/scripts/ci-wave-web-validation.test.ts",
  "__tests__/scripts/dependency-risk-gate.test.ts",
  "__tests__/scripts/dependency-governance-workflow.test.ts",
  "__tests__/scripts/deploy-staging-artifact.test.ts",
  "__tests__/scripts/deployment-bus.test.ts",
  "__tests__/scripts/e2e-packs.test.ts",
  "__tests__/scripts/lint-package-json.test.ts",
  "__tests__/scripts/manual-deploy-routing-guard.test.ts",
  "__tests__/scripts/museum-build-cardinality.test.ts",
  "__tests__/scripts/museum-release-tier.test.ts",
  "__tests__/scripts/museum-release-selection.test.ts",
  "__tests__/scripts/museum-publication-compatibility.test.ts",
  "__tests__/scripts/museum-surface-registry.test.ts",
  "__tests__/lib/museum/publication/fixture.ts",
  "__tests__/lib/museum/publication/corpusContracts.test.ts",
  "__tests__/scripts/runner-benchmark-workflow.test.ts",
  "__tests__/scripts/package-public-review-artifacts.test.ts",
  "__tests__/scripts/pr-ci-policy-bundle.test.ts",
  "__tests__/scripts/public-review-artifact-workflows.test.ts",
  "__tests__/scripts/production-build-artifact.test.ts",
  "__tests__/scripts/production-e2e-dispatch.test.ts",
  "__tests__/scripts/private-github-packages-routing.test.ts",
  "__tests__/scripts/release-bus-artifact-compatibility.test.ts",
  "__tests__/scripts/release-bus-baseline-adoption-decision.test.ts",
  "__tests__/scripts/release-bus-install-dependencies.test.ts",
  "__tests__/scripts/release-bus-performance-contract.test.ts",
  "__tests__/scripts/release-bus-v2-advance-staging-ref-workflow.test.ts",
  "__tests__/scripts/release-bus-v2-compose-workflow.test.ts",
  "__tests__/scripts/sync-agent-files.test.ts",
  "__tests__/scripts/sync-e2e-manifest.test.ts",
  "__tests__/scripts/sync-help-index.test.ts",
  "__tests__/scripts/testing-strategy.test.ts",
  "bin/6529",
  "config/env.schema.ts",
  "config/env.schema.validation.ts",
  "eslint.config.diff.mjs",
  "eslint.config.mjs",
  "eslint.config.single.mjs",
  "eslint.config.tight.mjs",
  "jest.config.js",
  "jest.setup.js",
  "knip.jsonc",
  "next-sitemap.build.cjs",
  "next.config.ts",
  "ops/deployment-bus/manifest.v1.schema.json",
  "ops/deployment-bus/release-bus-performance-contract.v1.json",
  "ops/contracts/artifact-portability-v1.schema.json",
  "ops/scripts/deploy-staging-artifact.sh",
  "ops/scripts/deployment-bus.cjs",
  "ops/scripts/artifact-portability.cjs",
  "ops/scripts/artifact-portability-contract.cjs",
  "ops/scripts/artifact-portability-report-source.cjs",
  "ops/scripts/elastic-beanstalk-readiness.cjs",
  "ops/scripts/release-bus-status.mjs",
  "ops/scripts/release-bus-status.test.ts",
  "ops/scripts/testing-strategy.cjs",
  "ops/scripts/verify-deployment-version.cjs",
  "ops/scripts/runner-benchmark.cjs",
  "ops/scripts/runner-benchmark-inputs.cjs",
  "ops/scripts/runner-benchmark-workflow-contract.cjs",
  "ops/docs/developer/runner-activation-playbook.md",
  "ops/testing-strategy/mutation-endpoint-registry.json",
  "ops/testing-strategy/mutation-endpoint-registry.v1.schema.json",
  "ops/testing-strategy/museum-surface-registry.v1.json",
  "ops/testing-strategy/museum-surface-registry.v1.schema.json",
  "ops/testing-strategy/museum-release-shadow-evidence.v1.json",
  "ops/testing-strategy/validation-manifest.v1.schema.json",
  "playwright.config.ts",
  "prettier.config.mjs",
  "scripts/assert-no-package-lock.cjs",
  "scripts/app-pr-ci-effective-plan.cjs",
  "scripts/build-env-schema.cjs",
  "scripts/dependency-risk-gate.cjs",
  "scripts/e2e-packs.cjs",
  "scripts/enforce-package-manager.cjs",
  "scripts/generate-openapi.cjs",
  "scripts/lint-package-json.cjs",
  "scripts/museum-build-cardinality.cjs",
  "scripts/museum-release-tier.cjs",
  "scripts/museum-release-selection.cjs",
  "scripts/museum-publication-compatibility.ts",
  "scripts/museum-surface-registry.cjs",
  "scripts/notify-ci-wave.mjs",
  "scripts/package-public-review-artifacts.cjs",
  "scripts/private-github-packages-policy.cjs",
  "scripts/pr-ci-policy-bundle.cjs",
  "scripts/release-bus-install-dependencies.cjs",
  "scripts/require-6529-command.cjs",
  "scripts/run-pnpm-with-private-github-bypass.cjs",
  "scripts/run-secure-pnpm.cjs",
  "scripts/sync-agent-files.cjs",
  "scripts/sync-e2e-manifest.cjs",
  "scripts/sync-help-index.cjs",
  "scripts/typecheck-changed.cjs",
  "scripts/typecheck-test-baseline.json",
  "scripts/typecheck-test-ratchet.cjs",
  "tests/packs.manifest.cjs",
  "tests/museum/about-readonly.spec.ts",
  "tests/museum/institutional-practice-readonly.spec.ts",
  "tests/museum/inside-system-readonly.spec.ts",
  "tests/museum/rights-readonly.spec.ts",
  "tsconfig.jest.json",
  "tsconfig.json",
  "tsconfig.playwright.json",
  "tsconfig.typecheck.json",
]);

const PACKAGE_SCRIPT_KEYS = Object.freeze([
  "agent-files:sync",
  "base-build",
  "build",
  "build:ci",
  "build:env-schema",
  "deadcode:knip",
  "dependency:risk-gate",
  "dev",
  "e2e-manifest:check",
  "e2e:packs",
  "generate",
  "guard:no-package-lock",
  "help-index:sync",
  "install:secure:frozen",
  "lint:changed",
  "lint:package-json",
  "lint:quiet",
  "museum:build-cardinality",
  "museum:release-tier",
  "museum:surface-registry",
  "runner:benchmark:contract",
  "postbuild",
  "prebuild",
  "test:e2e:critical-shell",
  "test:e2e:production:admin-guards-readonly",
  "test:e2e:production:collections-readonly",
  "test:e2e:production:delegation-readonly",
  "test:e2e:production:home-readonly",
  "test:e2e:production:museum-about",
  "test:e2e:production:museum-institutional-practice",
  "test:e2e:production:media-readonly",
  "test:e2e:production:network-open-data-readonly",
  "test:e2e:production:profile-deep-links-readonly",
  "test:e2e:production:public-content-readonly",
  "test:e2e:production:public-groups-tools-readonly",
  "test:e2e:production:readonly",
  "test:e2e:production:search-waves-readonly",
  "test:e2e:production:social-readonly",
  "test:e2e:smoke",
  "test:e2e:staging",
  "test:e2e:staging:admin-guards-readonly",
  "test:e2e:staging:collections-readonly",
  "test:e2e:staging:delegation-readonly",
  "test:e2e:staging:input-detection-readonly",
  "test:e2e:staging:media-readonly",
  "test:e2e:staging:museum-about",
  "test:e2e:staging:museum-institutional-practice",
  "test:e2e:staging:network-open-data-readonly",
  "test:e2e:staging:profile-deep-links-readonly",
  "test:e2e:staging:public-content-readonly",
  "test:e2e:staging:public-groups-tools-readonly",
  "test:e2e:staging:search-waves-readonly",
  "test:e2e:staging:smoke",
  "test:e2e:staging:social-readonly",
  "test:no-coverage",
  "testing-strategy",
  "typecheck:changed",
  "typecheck:jest",
  "typecheck:playwright",
  "typecheck:tests",
]);

const PACKAGE_FIELD_KEYS = Object.freeze([
  "packageManager",
  "dependencies.cross-env",
  "dependencies.next",
  "dependencies.next-sitemap",
  "dependencies.tsx",
  "devDependencies.@jest/globals",
  "devDependencies.@playwright/test",
  "devDependencies.@types/jest",
  "devDependencies.babel-jest",
  "devDependencies.eslint",
  "devDependencies.eslint-config-next",
  "devDependencies.eslint-config-prettier",
  "devDependencies.eslint-plugin-diff",
  "devDependencies.eslint-plugin-import",
  "devDependencies.eslint-plugin-promise",
  "devDependencies.eslint-plugin-react-compiler",
  "devDependencies.eslint-plugin-react-hooks",
  "devDependencies.eslint-plugin-react-you-might-not-need-an-effect",
  "devDependencies.eslint-plugin-security",
  "devDependencies.eslint-plugin-sonarjs",
  "devDependencies.eslint-plugin-tailwindcss",
  "devDependencies.eslint-plugin-unused-imports",
  "devDependencies.jest",
  "devDependencies.jest-environment-jsdom",
  "devDependencies.knip",
  "devDependencies.playwright",
  "devDependencies.prettier",
  "devDependencies.ts-jest",
  "devDependencies.typescript",
  "devDependencies.typescript-eslint",
  "devDependencies.yaml",
]);

const RUNTIME_PINS = Object.freeze({ node: "22.17.1" });
const NODE_PIN_WORKFLOWS = Object.freeze([
  ".github/workflows/app-pr-ci.yml",
  ".github/workflows/deploy-staging.yml",
  ".github/workflows/museum-publication-compatibility.yml",
  ".github/workflows/production-e2e.yml",
  ".github/workflows/production-build-artifact.yml",
  ".github/workflows/release-bus-v2-preflight.yml",
  ".github/workflows/runner-benchmark.yml",
  ".github/workflows/runner-benchmark-candidate.yml",
  ".github/workflows/staging-e2e.yml",
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function gitBlobSha(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return crypto.createHash("sha1").update(header).update(bytes).digest("hex");
}

function bytewiseCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function assertCanonicalToken(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    /[\t\r\n\0]/u.test(value)
  ) {
    throw new Error(
      `pr-ci-policy-bundle: ${label} must be a non-empty tab/LF/NUL-free string`
    );
  }
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    assertCanonicalToken(value, label);
    if (seen.has(value)) {
      throw new Error(`pr-ci-policy-bundle: duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function readRegularFileNoFollow(absolutePath, label) {
  const noFollow = fs.constants.O_NOFOLLOW;
  if (!Number.isInteger(noFollow)) {
    throw new Error(
      "pr-ci-policy-bundle: this platform cannot reject symbolic-link inputs"
    );
  }

  let descriptor;
  try {
    descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | noFollow);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`pr-ci-policy-bundle: ${label} is missing`);
    }
    if (error && error.code === "ELOOP") {
      throw new Error(`pr-ci-policy-bundle: ${label} is not a regular file`);
    }
    throw error;
  }

  try {
    if (!fs.fstatSync(descriptor).isFile()) {
      throw new Error(`pr-ci-policy-bundle: ${label} is not a regular file`);
    }
    return fs.readFileSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function readPackageField(packageJson, dottedKey) {
  let value = packageJson;
  for (const segment of dottedKey.split(".")) {
    if (
      !value ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, segment)
    ) {
      throw new Error(
        `pr-ci-policy-bundle: package field is missing: ${dottedKey}`
      );
    }
    value = value[segment];
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `pr-ci-policy-bundle: package field must be a non-empty string: ${dottedKey}`
    );
  }
  return value;
}

function assertNodeRuntimePins(root, workflows, expectedNodeVersion) {
  for (const relativePath of workflows) {
    const source = readRegularFileNoFollow(
      path.join(root, relativePath),
      `protected path ${relativePath}`
    ).toString("utf8");
    const versions = Array.from(
      source.matchAll(/node-version:\s*["']?([^"'#\s]+)["']?/gu),
      (match) => match[1]
    );
    const exactLegacyDigest =
      LEGACY_NODE_PIN_WORKFLOW_SHA256[relativePath] ?? null;
    const isFrozenLegacyWorkflow =
      exactLegacyDigest !== null && sha256(source) === exactLegacyDigest;
    if (
      versions.length === 0 ||
      (versions.some((version) => version !== expectedNodeVersion) &&
        !isFrozenLegacyWorkflow)
    ) {
      throw new Error(
        `pr-ci-policy-bundle: ${relativePath} must pin every Node setup to ${expectedNodeVersion}`
      );
    }
  }
}

function assertPinnedWorkflowActions(root, workflows) {
  for (const relativePath of workflows) {
    const source = readRegularFileNoFollow(
      path.join(root, relativePath),
      `protected path ${relativePath}`
    ).toString("utf8");
    let workflow;
    try {
      workflow = YAML.parse(source, { maxAliasCount: 0 });
    } catch (error) {
      throw new Error(
        `pr-ci-policy-bundle: malformed workflow YAML at ${relativePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
      throw new Error(
        `pr-ci-policy-bundle: malformed workflow YAML at ${relativePath}: expected an object`
      );
    }

    const visit = (value) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(value, "uses")) {
        const action = value.uses;
        if (typeof action !== "string" || action.length === 0) {
          throw new Error(
            `pr-ci-policy-bundle: malformed uses at ${relativePath}`
          );
        }
        if (
          !action.startsWith("./") &&
          !/^[^@\s]+@[a-f0-9]{40}$/u.test(action)
        ) {
          throw new Error(
            `pr-ci-policy-bundle: external action is not pinned to a 40-hex SHA at ${relativePath}`
          );
        }
      }
      for (const child of Object.values(value)) {
        visit(child);
      }
    };

    visit(workflow);
  }
}

function gitBlobAtRef(root, gitRef, relativePath) {
  return execFileSync("git", ["rev-parse", `${gitRef}:${relativePath}`], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Canonical pr-ci-policy-bundle-v1 line format:
 *
 *   file<TAB>repo-relative-path<TAB>Git blob SHA-1(file bytes)<LF>
 *   package-field<TAB>dotted-key<TAB>JSON-string-value<LF>
 *   package-script<TAB>script-key<TAB>JSON-string-value<LF>
 *   runtime-pin<TAB>pin-key<TAB>JSON-string-value<LF>
 *
 * Lines are sorted with raw UTF-8 byte ordering (Buffer.compare), never
 * localeCompare. Every line ends in LF, including the last line. Paths and
 * keys reject TAB, CR, LF, and NUL so the representation is unambiguous.
 * File identities match `git hash-object --no-filters <path>`, allowing the
 * verifier to use an immutable recursive Git tree without fetching every
 * protected blob. The bundle digest is SHA-256 over the exact canonical bytes.
 */
function buildPolicyBundle({
  root,
  filePaths = FILE_PATHS,
  packageScriptKeys = PACKAGE_SCRIPT_KEYS,
  packageFieldKeys = PACKAGE_FIELD_KEYS,
  runtimePins = RUNTIME_PINS,
  nodePinWorkflows = NODE_PIN_WORKFLOWS,
  maxFileCount = MAX_FILE_COUNT,
  maxSourceBytes = MAX_SOURCE_BYTES,
  maxCanonicalBytes = MAX_CANONICAL_BYTES,
  expectedGitRef = "",
}) {
  if (!path.isAbsolute(root)) {
    throw new Error("pr-ci-policy-bundle: root must be absolute");
  }
  assertUnique(filePaths, "file path");
  assertUnique(packageScriptKeys, "package script key");
  assertUnique(packageFieldKeys, "package field key");
  assertUnique(Object.keys(runtimePins), "runtime pin key");
  if (filePaths.length > maxFileCount) {
    throw new Error(
      `pr-ci-policy-bundle: file count ${filePaths.length} exceeds ${maxFileCount}`
    );
  }

  let sourceBytes = 0;
  const lines = [];
  for (const relativePath of filePaths) {
    if (
      path.isAbsolute(relativePath) ||
      relativePath.split("/").some((segment) => segment === "..")
    ) {
      throw new Error(
        `pr-ci-policy-bundle: unsafe repository path: ${relativePath}`
      );
    }
    const absolutePath = path.join(root, relativePath);
    const bytes = readRegularFileNoFollow(
      absolutePath,
      `protected path ${relativePath}`
    );
    const blobSha = gitBlobSha(bytes);
    if (
      expectedGitRef &&
      gitBlobAtRef(root, expectedGitRef, relativePath) !== blobSha
    ) {
      throw new Error(
        `pr-ci-policy-bundle: protected path differs from ${expectedGitRef}: ${relativePath}`
      );
    }
    sourceBytes += bytes.length;
    if (sourceBytes > maxSourceBytes) {
      throw new Error(
        `pr-ci-policy-bundle: protected source bytes exceed ${maxSourceBytes}`
      );
    }
    lines.push(`file\t${relativePath}\t${blobSha}\n`);
  }

  const packageJsonBytes = readRegularFileNoFollow(
    path.join(root, "package.json"),
    "package.json"
  );
  if (
    expectedGitRef &&
    gitBlobAtRef(root, expectedGitRef, "package.json") !==
      gitBlobSha(packageJsonBytes)
  ) {
    throw new Error(
      `pr-ci-policy-bundle: package.json differs from ${expectedGitRef}`
    );
  }
  const packageJson = JSON.parse(packageJsonBytes.toString("utf8"));
  for (const key of packageScriptKeys) {
    const value = packageJson.scripts?.[key];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`pr-ci-policy-bundle: package script is missing: ${key}`);
    }
    lines.push(`package-script\t${key}\t${JSON.stringify(value)}\n`);
  }
  for (const key of packageFieldKeys) {
    lines.push(
      `package-field\t${key}\t${JSON.stringify(
        readPackageField(packageJson, key)
      )}\n`
    );
  }
  for (const [key, value] of Object.entries(runtimePins)) {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `pr-ci-policy-bundle: runtime pin must be a non-empty string: ${key}`
      );
    }
    lines.push(`runtime-pin\t${key}\t${JSON.stringify(value)}\n`);
  }

  if (runtimePins.node) {
    assertNodeRuntimePins(root, nodePinWorkflows, runtimePins.node);
  }
  assertPinnedWorkflowActions(
    root,
    filePaths.filter((relativePath) =>
      relativePath.startsWith(".github/workflows/")
    )
  );

  lines.sort(bytewiseCompare);
  const canonical = lines.join("");
  const canonicalBytes = Buffer.byteLength(canonical, "utf8");
  if (canonicalBytes > maxCanonicalBytes) {
    throw new Error(
      `pr-ci-policy-bundle: canonical bytes ${canonicalBytes} exceed ${maxCanonicalBytes}`
    );
  }
  return {
    contract: CONTRACT,
    canonical,
    digest: sha256(Buffer.from(canonical, "utf8")),
    line_count: lines.length,
    byte_count: canonicalBytes,
    source_byte_count: sourceBytes,
  };
}

function parseCli(argv) {
  let output = "";
  let expectedGitRef = "";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") {
      output = argv[index + 1] ?? "";
      index += 1;
    } else if (argument === "--expected-git-ref") {
      expectedGitRef = argv[index + 1] ?? "";
      index += 1;
    } else {
      throw new Error(`pr-ci-policy-bundle: unknown argument: ${argument}`);
    }
  }
  if (!output) {
    throw new Error(
      "pr-ci-policy-bundle: usage: pr-ci-policy-bundle.cjs --output <path> --expected-git-ref <40-hex SHA>"
    );
  }
  if (!/^[a-f0-9]{40}$/u.test(expectedGitRef)) {
    throw new Error(
      "pr-ci-policy-bundle: --expected-git-ref must be a 40-hex SHA"
    );
  }
  return { expectedGitRef, output };
}

function main() {
  const { expectedGitRef, output } = parseCli(process.argv.slice(2));
  const root = path.resolve(__dirname, "..");
  const bundle = buildPolicyBundle({ expectedGitRef, root });
  const outputPath = path.resolve(process.cwd(), output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, bundle.canonical, {
    encoding: "utf8",
    flag: "wx",
  });
  process.stdout.write(
    `${JSON.stringify({
      contract: bundle.contract,
      digest: bundle.digest,
      line_count: bundle.line_count,
      byte_count: bundle.byte_count,
      source_byte_count: bundle.source_byte_count,
    })}\n`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "pr-ci-policy-bundle: failed"
    );
    process.exitCode = 1;
  }
}

module.exports = {
  CONTRACT,
  FILE_PATHS,
  LEGACY_NODE_PIN_WORKFLOW_SHA256,
  MAX_CANONICAL_BYTES,
  MAX_FILE_COUNT,
  MAX_SOURCE_BYTES,
  NODE_PIN_WORKFLOWS,
  PACKAGE_FIELD_KEYS,
  PACKAGE_SCRIPT_KEYS,
  RUNTIME_PINS,
  assertPinnedWorkflowActions,
  buildPolicyBundle,
  bytewiseCompare,
  gitBlobSha,
  sha256,
};
