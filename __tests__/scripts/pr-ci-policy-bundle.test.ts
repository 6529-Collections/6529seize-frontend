import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const {
  CONTRACT,
  FILE_PATHS,
  LEGACY_NODE_PIN_WORKFLOW_SHA256,
  PACKAGE_FIELD_KEYS,
  PACKAGE_SCRIPT_KEYS,
  RUNTIME_PINS,
  buildPolicyBundle,
} = require("../../scripts/pr-ci-policy-bundle.cjs") as {
  CONTRACT: string;
  FILE_PATHS: readonly string[];
  LEGACY_NODE_PIN_WORKFLOW_SHA256: Readonly<Record<string, string>>;
  PACKAGE_FIELD_KEYS: readonly string[];
  PACKAGE_SCRIPT_KEYS: readonly string[];
  RUNTIME_PINS: Readonly<Record<string, string>>;
  buildPolicyBundle: (options: {
    root: string;
    filePaths?: readonly string[];
    packageScriptKeys?: readonly string[];
    packageFieldKeys?: readonly string[];
    runtimePins?: Readonly<Record<string, string>>;
    nodePinWorkflows?: readonly string[];
    maxFileCount?: number;
    maxSourceBytes?: number;
    maxCanonicalBytes?: number;
    expectedGitRef?: string;
  }) => {
    contract: string;
    canonical: string;
    digest: string;
    line_count: number;
    byte_count: number;
  };
};

function withFixture(run: (root: string) => void) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pr-ci-policy-bundle-"));
  try {
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        packageManager: "pnpm@1.2.3",
        scripts: { build: "node build.cjs" },
        dependencies: { unrelated: "1.0.0" },
        devDependencies: { yaml: "2.9.0" },
      })
    );
    fs.writeFileSync(path.join(root, "a.cjs"), "module.exports = 1;\n");
    fs.writeFileSync(path.join(root, "z.mjs"), "export default 2;\n");
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function fixtureBundle(
  root: string,
  overrides: Partial<Parameters<typeof buildPolicyBundle>[0]> = {}
) {
  return buildPolicyBundle({
    root,
    filePaths: ["z.mjs", "a.cjs"],
    packageScriptKeys: ["build"],
    packageFieldKeys: ["packageManager"],
    runtimePins: {},
    nodePinWorkflows: [],
    ...overrides,
  });
}

describe("pr-ci-policy-bundle-v1", () => {
  it("uses deterministic raw UTF-8 byte order and a final LF", () => {
    withFixture((root) => {
      const first = fixtureBundle(root);
      const second = fixtureBundle(root, {
        filePaths: ["a.cjs", "z.mjs"],
      });

      expect(first.contract).toBe(CONTRACT);
      expect(first.digest).toBe(second.digest);
      expect(first.canonical).toBe(second.canonical);
      expect(first.canonical.endsWith("\n")).toBe(true);
      expect(first.canonical.split("\n").filter(Boolean)).toEqual(
        [...first.canonical.split("\n").filter(Boolean)].sort((left, right) =>
          Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
        )
      );
      expect(first.line_count).toBe(4);
      expect(Buffer.byteLength(first.canonical, "utf8")).toBe(first.byte_count);
    });
  });

  it("changes digest on a one-byte protected-file drift", () => {
    withFixture((root) => {
      const before = fixtureBundle(root).digest;
      fs.appendFileSync(path.join(root, "a.cjs"), " ");
      expect(fixtureBundle(root).digest).not.toBe(before);
    });
  });

  it("uses the same file identity as git hash-object --no-filters", () => {
    withFixture((root) => {
      const bundle = fixtureBundle(root);
      const expected = execFileSync(
        "git",
        ["hash-object", "--no-filters", path.join(root, "a.cjs")],
        { encoding: "utf8" }
      ).trim();
      expect(bundle.canonical).toContain(`file\ta.cjs\t${expected}\n`);
      expect(expected).toMatch(/^[a-f0-9]{40}$/);
    });
  });

  it("binds evidence generation to an exact clean Git ref", () => {
    withFixture((root) => {
      execFileSync("git", ["init", "--initial-branch=main"], { cwd: root });
      execFileSync("git", ["config", "user.name", "Policy Bundle Test"], {
        cwd: root,
      });
      execFileSync(
        "git",
        ["config", "user.email", "policy-bundle@example.invalid"],
        { cwd: root }
      );
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-m", "fixture"], { cwd: root });
      const head = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      expect(fixtureBundle(root, { expectedGitRef: head }).digest).toMatch(
        /^[a-f0-9]{64}$/
      );

      fs.appendFileSync(path.join(root, "a.cjs"), " ");
      expect(() => fixtureBundle(root, { expectedGitRef: head })).toThrow(
        `protected path differs from ${head}: a.cjs`
      );
    });
  });

  it("fails closed on missing paths, duplicate paths, and oversized bundles", () => {
    withFixture((root) => {
      expect(() => fixtureBundle(root, { filePaths: ["missing.cjs"] })).toThrow(
        "protected path missing.cjs is missing"
      );
      expect(() =>
        fixtureBundle(root, { filePaths: ["a.cjs", "a.cjs"] })
      ).toThrow("duplicate file path: a.cjs");
      expect(() => fixtureBundle(root, { maxCanonicalBytes: 1 })).toThrow(
        "canonical bytes"
      );
    });
  });

  it("rejects a protected path that is replaced by a symbolic link", () => {
    withFixture((root) => {
      fs.symlinkSync(path.join(root, "z.mjs"), path.join(root, "linked.cjs"));
      expect(() => fixtureBundle(root, { filePaths: ["linked.cjs"] })).toThrow(
        "protected path linked.cjs is not a regular file"
      );
    });
  });

  it("allows unrelated dependency drift but binds protected script semantics", () => {
    withFixture((root) => {
      const before = fixtureBundle(root).digest;
      const parserBefore = fixtureBundle(root, {
        packageFieldKeys: ["devDependencies.yaml"],
      }).digest;
      const packagePath = path.join(root, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      packageJson.dependencies.unrelated = "2.0.0";
      fs.writeFileSync(packagePath, JSON.stringify(packageJson));
      expect(fixtureBundle(root).digest).toBe(before);
      expect(
        fixtureBundle(root, {
          packageFieldKeys: ["devDependencies.yaml"],
        }).digest
      ).toBe(parserBefore);

      packageJson.devDependencies.yaml = "2.8.0";
      packageJson.scripts.build = "node weakened-build.cjs";
      fs.writeFileSync(packagePath, JSON.stringify(packageJson));
      expect(fixtureBundle(root).digest).not.toBe(before);
      expect(
        fixtureBundle(root, {
          packageFieldKeys: ["devDependencies.yaml"],
        }).digest
      ).not.toBe(parserBefore);
    });
  });

  it("rejects mutable external action refs", () => {
    withFixture((root) => {
      fs.mkdirSync(path.join(root, ".github", "workflows"), {
        recursive: true,
      });
      const workflowPath = ".github/workflows/check.yml";
      fs.writeFileSync(
        path.join(root, workflowPath),
        "jobs:\n  check:\n    steps:\n      - uses: actions/checkout@v4\n"
      );
      expect(() => fixtureBundle(root, { filePaths: [workflowPath] })).toThrow(
        "external action is not pinned to a 40-hex SHA"
      );

      fs.writeFileSync(
        path.join(root, workflowPath),
        `jobs:\n  check:\n    steps:\n      - uses: actions/checkout@${"a".repeat(
          40
        )}\n      - uses: ./.github/actions/local\n`
      );
      expect(() =>
        fixtureBundle(root, { filePaths: [workflowPath] })
      ).not.toThrow();

      fs.writeFileSync(
        path.join(root, workflowPath),
        "jobs:\n  check:\n    steps:\n      - { uses: actions/checkout@v4 }\n"
      );
      expect(() => fixtureBundle(root, { filePaths: [workflowPath] })).toThrow(
        "external action is not pinned to a 40-hex SHA"
      );

      fs.writeFileSync(
        path.join(root, workflowPath),
        `jobs:\n  check:\n    steps:\n      - { uses: actions/checkout@${"b".repeat(
          40
        )} }\n`
      );
      expect(() =>
        fixtureBundle(root, { filePaths: [workflowPath] })
      ).not.toThrow();

      fs.writeFileSync(
        path.join(root, workflowPath),
        `- { uses: actions/checkout@${"c".repeat(40)} }\n`
      );
      expect(() => fixtureBundle(root, { filePaths: [workflowPath] })).toThrow(
        "expected an object"
      );
    });
  });

  it("covers the complete quality/release policy and the CJS pack manifest", () => {
    expect(new Set(FILE_PATHS).size).toBe(FILE_PATHS.length);
    expect(new Set(PACKAGE_SCRIPT_KEYS).size).toBe(PACKAGE_SCRIPT_KEYS.length);
    expect(new Set(PACKAGE_FIELD_KEYS).size).toBe(PACKAGE_FIELD_KEYS.length);
    expect(FILE_PATHS).toEqual(
      expect.arrayContaining([
        ".github/workflows/app-pr-ci.yml",
        ".github/workflows/build-upload-deploy-prod.yml",
        ".github/workflows/deploy-staging.yml",
        ".github/workflows/dependency-governance.yml",
        ".github/workflows/museum-publication-compatibility.yml",
        ".github/workflows/production-artifact-verifier.yml",
        ".github/workflows/staging-e2e.yml",
        ".github/workflows/production-e2e.yml",
        ".github/workflows/production-build-artifact.yml",
        ".github/workflows/runner-benchmark.yml",
        ".github/workflows/runner-benchmark-candidate.yml",
        "__tests__/scripts/app-pr-ci-effective-plan.test.ts",
        "__tests__/scripts/deploy-staging-artifact.test.ts",
        "__tests__/scripts/dependency-governance-workflow.test.ts",
        "__tests__/scripts/deployment-e2e-workflows.test.ts",
        "__tests__/scripts/production-build-artifact.test.ts",
        "__tests__/scripts/production-artifact-verifier.test.ts",
        "__tests__/scripts/frontend-deployment-workflows.test.ts",
        "__tests__/scripts/museum-release-tier.test.ts",
        "__tests__/scripts/museum-release-selection.test.ts",
        "__tests__/scripts/museum-publication-compatibility.test.ts",
        "__tests__/scripts/runner-benchmark-workflow.test.ts",
        "bin/6529",
        "eslint.config.diff.mjs",
        "eslint.config.mjs",
        "eslint.config.single.mjs",
        "eslint.config.tight.mjs",
        "ops/scripts/testing-strategy.cjs",
        "ops/scripts/deploy-staging-artifact.sh",
        "ops/scripts/verify-production-artifact.cjs",
        "ops/scripts/verify-deployment-version.cjs",
        "ops/scripts/runner-benchmark.cjs",
        "ops/scripts/runner-benchmark-inputs.cjs",
        "ops/scripts/runner-benchmark-workflow-contract.cjs",
        "ops/docs/developer/runner-activation-playbook.md",
        "scripts/app-pr-ci-effective-plan.cjs",
        "scripts/e2e-packs.cjs",
        "scripts/museum-release-tier.cjs",
        "scripts/museum-release-selection.cjs",
        "scripts/museum-publication-compatibility.ts",
        "scripts/notify-ci-wave.mjs",
        "scripts/package-public-review-artifacts.cjs",
        "scripts/pr-ci-policy-bundle.cjs",
        "tests/packs.manifest.cjs",
        "playwright.config.ts",
        "next.config.ts",
        "next-sitemap.build.cjs",
        "prettier.config.mjs",
        ".prettierignore",
        "__tests__/lib/museum/publication/corpusContracts.test.ts",
        "__tests__/lib/museum/publication/fixture.ts",
        "__tests__/scripts/museum-surface-registry.test.ts",
        "ops/testing-strategy/museum-surface-registry.v1.json",
        "ops/testing-strategy/museum-surface-registry.v1.schema.json",
        "scripts/museum-surface-registry.cjs",
        "tests/museum/about-readonly.spec.ts",
        "tests/museum/institutional-practice-readonly.spec.ts",
        "tests/museum/inside-system-readonly.spec.ts",
        "tests/museum/rights-readonly.spec.ts",
        "ops/testing-strategy/museum-release-shadow-evidence.v1.json",
      ])
    );
    expect(PACKAGE_SCRIPT_KEYS).toEqual(
      expect.arrayContaining([
        "build",
        "build:ci",
        "lint:changed",
        "museum:release-tier",
        "museum:surface-registry",
        "runner:benchmark:contract",
        "typecheck:changed",
        "typecheck:tests",
        "e2e:packs",
        "test:e2e:production:home-readonly",
        "test:e2e:production:museum-about",
        "test:e2e:production:museum-institutional-practice",
        "test:e2e:staging:museum-about",
        "test:e2e:staging:museum-institutional-practice",
      ])
    );
    expect(PACKAGE_FIELD_KEYS).toEqual(
      expect.arrayContaining([
        "packageManager",
        "dependencies.next",
        "devDependencies.eslint",
        "devDependencies.jest",
        "devDependencies.@playwright/test",
        "dependencies.tsx",
        "devDependencies.typescript",
        "devDependencies.yaml",
      ])
    );
    expect(RUNTIME_PINS).toEqual({ node: "22.17.1" });
    const appPrCi = fs.readFileSync(
      path.join(process.cwd(), ".github/workflows/app-pr-ci.yml"),
      "utf8"
    );
    if (!appPrCi.includes('node-version: "22.17.1"')) {
      expect(
        LEGACY_NODE_PIN_WORKFLOW_SHA256[".github/workflows/app-pr-ci.yml"]
      ).toBe(
        // This exact legacy producer is allowed only during the bounded
        // consumer bridge; any one-byte drift must fail closed.
        crypto.createHash("sha256").update(appPrCi).digest("hex")
      );
    }

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    );
    for (const extension of ['"*.cjs"', '"*.mjs"']) {
      expect(packageJson.scripts["lint:changed"]).toContain(extension);
    }
    expect(packageJson.scripts["lint:changed"]).toContain(
      "eslint.config.diff.mjs"
    );
    expect(buildPolicyBundle({ root: process.cwd() }).digest).toMatch(
      /^[a-f0-9]{64}$/
    );
  });
});
