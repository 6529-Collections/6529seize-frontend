import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const { selectFileContractTests, changedFilesSince, runFileContractTests } =
  require("../../scripts/file-contract-tests.cjs") as {
    selectFileContractTests: (files: string[]) => string[];
    changedFilesSince: (base: string, cwd?: string) => string[];
    runFileContractTests: (files: string[], run: jest.Mock) => number;
  };

const HOVER = "__tests__/contracts/hover-revealed-controls.test.ts";
const WAVES = "__tests__/contracts/waves-multi-competition-phase-1.test.ts";
const COVERAGE = "__tests__/scripts/coverage-floor.test.ts";

describe("filesystem contract selection", () => {
  it.each([
    "components/waves/drops/WaveDropActions.tsx",
    "app/example/page.tsx",
    "components\\example\\Control.tsx",
    "tailwind.config.ts",
    HOVER,
  ])("selects the hover audit for %s without relying on imports", (file) => {
    expect(selectFileContractTests([file])).toContain(HOVER);
  });

  it.each([
    "openapi.yaml",
    "helpers/waves/example.ts",
    "generated/models/ApiWave.ts",
    "ops/roadmap/waves-multi-competition/phase-0/baseline/representative-fixtures.json",
  ])("selects the wave compatibility scan for %s", (file) => {
    expect(selectFileContractTests([file])).toContain(WAVES);
  });

  it.each([
    ["staging-e2e", "museum-publication-compatibility"],
    ["production-e2e", "museum-publication-compatibility"],
    ["museum-publication-compatibility", "museum-publication-compatibility"],
    ["coverage-floor", "coverage-floor"],
    ["dependency-governance", "dependency-governance-workflow"],
    ["runner-benchmark", "runner-benchmark-workflow"],
    ["runner-benchmark-candidate", "runner-benchmark-workflow"],
  ])("selects the disk-reading suite for %s.yml", (workflow, test) => {
    expect(
      selectFileContractTests([`.github/workflows/${workflow}.yml`])
    ).toEqual([`__tests__/scripts/${test}.test.ts`]);
  });

  it("selects baseline changes and deduplicates overlapping inputs", () => {
    expect(
      selectFileContractTests([
        "scripts/coverage-floor-baseline.json",
        ".github/workflows/coverage-floor.yml",
        COVERAGE,
        COVERAGE,
      ])
    ).toEqual([COVERAGE]);
  });

  it.each([
    "README.md",
    "public/photo.png",
    "app/example/readme.md",
    "components-old/Button.tsx",
  ])("does not expand unrelated changes into the full suite: %s", (file) => {
    expect(selectFileContractTests([file])).toEqual([]);
  });

  it.each([
    "scripts/file-contract-tests.cjs",
    ".github/workflows/app-pr-ci.yml",
    "jest.config.js",
    "pnpm-lock.yaml",
  ])(
    "validates every registered contract when selection or the toolchain changes: %s",
    (file) => {
      const selected = selectFileContractTests([file]);
      expect(selected).toContain(HOVER);
      expect(selected).toContain(WAVES);
      expect(selected).toContain(COVERAGE);
      expect(selected).toContain(
        "__tests__/scripts/file-contract-tests.test.ts"
      );
      for (const test of selected) expect(fs.existsSync(test)).toBe(true);
    }
  );

  it("runs explicit paths through the wrapper and preserves Jest failures", () => {
    const run = jest.fn().mockReturnValue({ status: 1 });
    expect(runFileContractTests(["tailwind.config.ts"], run)).toBe(1);
    expect(run).toHaveBeenCalledWith(
      "./bin/6529",
      [
        "run",
        "test:no-coverage",
        "--ci",
        "--runInBand",
        "--runTestsByPath",
        HOVER,
      ],
      expect.objectContaining({
        stdio: "inherit",
        env: expect.objectContaining({ NODE_ENV: "test" }),
      })
    );
  });

  it("skips execution for unrelated files and fails on terminated runners", () => {
    const run = jest.fn().mockReturnValue({ status: null, signal: "SIGTERM" });
    expect(runFileContractTests(["README.md"], run)).toBe(0);
    expect(run).not.toHaveBeenCalled();
    expect(runFileContractTests([HOVER], run)).toBe(1);
  });

  it("propagates runner startup errors", () => {
    const run = jest.fn().mockReturnValue({ error: new Error("spawn failed") });
    expect(() => runFileContractTests([HOVER], run)).toThrow("spawn failed");
  });

  it("rejects a deleted selected suite before Jest can silently omit it", () => {
    const exists = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const run = jest.fn();
    try {
      expect(() => runFileContractTests([HOVER], run)).toThrow(
        `Selected filesystem contract test is missing: ${HOVER}`
      );
      expect(run).not.toHaveBeenCalled();
    } finally {
      exists.mockRestore();
    }
  });

  it("runs in the required quality lane independently of related-Jest selection", () => {
    const workflow = YAML.parse(
      fs.readFileSync(".github/workflows/app-pr-ci.yml", "utf8")
    );
    const steps = workflow.jobs["app-checks"].steps as Array<{
      name: string;
      if?: string;
      run?: string;
    }>;
    const step = steps.find(
      ({ name }) => name === "Verify filesystem contracts"
    );
    expect(step?.if).toBe("matrix.lane == 'quality'");
    expect(step?.run).toBe(
      './bin/6529 exec node scripts/file-contract-tests.cjs --changed-from "$BASE_SHA"'
    );
    expect(workflow.jobs["app-checks"].env.BASE_SHA).toBe(
      "${{ needs.plan.outputs.base_sha }}"
    );
    const checkout = steps.find(({ name }) => name === "Checkout code") as
      | { with?: Record<string, unknown> }
      | undefined;
    expect(checkout?.with?.["fetch-depth"]).toBe(0);
    expect(step).not.toHaveProperty("continue-on-error");
    if (!step) throw new Error("Missing filesystem contract step");
    expect(steps.indexOf(step)).toBeLessThan(
      steps.findIndex(
        ({ name }) => name === "Create exact PR merge-tree CI evidence"
      )
    );
  });
});

describe("changed filesystem contract inputs", () => {
  it("includes deleted inputs and both sides of renames in the PR diff", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "file-contract-inputs-"));
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
    try {
      git("init", "--quiet");
      git("config", "user.name", "Contract Test");
      git("config", "user.email", "contract@example.invalid");
      git("config", "commit.gpgsign", "false");
      fs.mkdirSync(path.join(cwd, "components"));
      fs.mkdirSync(path.join(cwd, "app"));
      fs.writeFileSync(
        path.join(cwd, "components/Old.tsx"),
        "export default null;"
      );
      fs.writeFileSync(
        path.join(cwd, "tailwind.config.ts"),
        "export default {};"
      );
      git("add", ".");
      git("-c", "core.hooksPath=/dev/null", "commit", "--quiet", "-m", "Base");
      const base = git("rev-parse", "HEAD");
      fs.renameSync(
        path.join(cwd, "components/Old.tsx"),
        path.join(cwd, "app/New.tsx")
      );
      fs.unlinkSync(path.join(cwd, "tailwind.config.ts"));
      git("add", "-A");
      git(
        "-c",
        "core.hooksPath=/dev/null",
        "commit",
        "--quiet",
        "-m",
        "Move and delete"
      );
      expect(changedFilesSince(base, cwd).sort()).toEqual([
        "app/New.tsx",
        "components/Old.tsx",
        "tailwind.config.ts",
      ]);
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it.each(["main", "--help", "", "a".repeat(39)])(
    "rejects an inexact base %s",
    (base) => {
      expect(() => changedFilesSince(base)).toThrow(
        "Expected an exact base commit SHA"
      );
    }
  );
});
