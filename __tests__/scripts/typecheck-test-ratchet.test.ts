const {
  SCHEMA_VERSION,
  compareDiagnosticCounts,
  createBaseline,
  diagnosticDirectory,
  isJestDiagnosticPath,
  parseOptions,
  toolchainMismatches,
  validateBaseline,
} = require("../../scripts/typecheck-test-ratchet.cjs") as {
  SCHEMA_VERSION: string;
  compareDiagnosticCounts: (
    current: Record<string, number>,
    baseline: Record<string, number>
  ) => {
    increases: Array<{ file: string; baseline: number; current: number }>;
    decreases: Array<{ file: string; baseline: number; current: number }>;
  };
  createBaseline: (
    toolchain: Record<string, string>,
    files: Record<string, number>
  ) => {
    schema_version: string;
    config: string;
    toolchain: Record<string, string>;
    files: Record<string, number>;
  };
  diagnosticDirectory: (filePath: string) => string;
  isJestDiagnosticPath: (filePath: string) => boolean;
  parseOptions: (args: string[]) => {
    initialize: boolean;
    inventory: boolean;
    update: boolean;
  };
  toolchainMismatches: (
    current: Record<string, string>,
    baseline: Record<string, string>
  ) => Array<{ key: string; baseline?: string; current?: string }>;
  validateBaseline: (baseline: unknown) => unknown;
};

describe("test typecheck ratchet", () => {
  it.each([
    "__tests__/components/Card.test.tsx",
    "__mocks__/@/services/api/common-api.ts",
    "ops/scripts/release-bus-status.test.ts",
  ])("recognizes Jest TypeScript path %s", (filePath) => {
    expect(isJestDiagnosticPath(filePath)).toBe(true);
  });

  it.each([
    "tests/pages/about.spec.ts",
    "components/Card.tsx",
    "__tests__/types.d.ts",
    "__mocks__/styleMock.js",
  ])("excludes non-Jest diagnostic path %s", (filePath) => {
    expect(isJestDiagnosticPath(filePath)).toBe(false);
  });

  it("groups diagnostics into stable review slices", () => {
    expect(
      diagnosticDirectory(
        "__tests__/components/waves/drop/SingleWaveDrop.test.tsx"
      )
    ).toBe("__tests__/components/waves");
    expect(diagnosticDirectory("ops/scripts/release-bus-status.test.ts")).toBe(
      "ops/scripts"
    );
  });

  it("reports per-file increases and decreases without netting them", () => {
    const result = compareDiagnosticCounts(
      {
        "__tests__/improved.test.ts": 1,
        "__tests__/regressed.test.ts": 3,
      },
      {
        "__tests__/improved.test.ts": 2,
        "__tests__/regressed.test.ts": 2,
      }
    );

    expect(result.increases).toEqual([
      {
        file: "__tests__/regressed.test.ts",
        baseline: 2,
        current: 3,
      },
    ]);
    expect(result.decreases).toEqual([
      {
        file: "__tests__/improved.test.ts",
        baseline: 2,
        current: 1,
      },
    ]);
  });

  it("creates a stable sorted baseline", () => {
    const baseline = createBaseline(
      { typescript_version: "5.9.3" },
      {
        "z.test.ts": 2,
        "a.test.ts": 1,
      }
    );

    expect(baseline).toEqual({
      schema_version: SCHEMA_VERSION,
      config: "tsconfig.jest.json",
      toolchain: { typescript_version: "5.9.3" },
      files: {
        "a.test.ts": 1,
        "z.test.ts": 2,
      },
    });
    expect(validateBaseline(baseline)).toBe(baseline);
  });

  it("detects dependency or configuration fingerprint drift", () => {
    expect(
      toolchainMismatches(
        {
          typescript_version: "5.9.3",
          pnpm_lock_sha256: "new",
        },
        {
          typescript_version: "5.9.3",
          pnpm_lock_sha256: "old",
        }
      )
    ).toEqual([
      {
        key: "pnpm_lock_sha256",
        baseline: "old",
        current: "new",
      },
    ]);
  });

  it("requires explicit initialization only for an update", () => {
    expect(parseOptions(["--update", "--initialize"])).toEqual({
      initialize: true,
      inventory: false,
      update: true,
    });
    expect(parseOptions(["--inventory"])).toEqual({
      initialize: false,
      inventory: true,
      update: false,
    });
    expect(() => parseOptions(["--initialize"])).toThrow(
      "--initialize requires --update."
    );
  });
});
