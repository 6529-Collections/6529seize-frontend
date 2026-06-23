type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type FetchPackageInfo = (
  name: string,
  version: string
) => Promise<{
  publishedAt: Date | null;
  scripts: Record<string, string>;
  error?: string | null;
}>;

type AnalyzeDependencyRisk = (options: {
  basePackageJson: PackageJson;
  headPackageJson: PackageJson;
  baseLockfileText: string;
  headLockfileText: string;
  now: string;
  minimumReleaseAgeMinutes: number;
  isDependabot: boolean;
  fetchPackageInfo?: FetchPackageInfo;
}) => Promise<{
  riskLevel: string;
  autoMergeEligible: boolean;
  labels: string[];
  eligibilityBlockers: string[];
}>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { analyzeDependencyRisk } =
  require("../../scripts/dependency-risk-gate.cjs") as {
    analyzeDependencyRisk: AnalyzeDependencyRisk;
  };

const NOW = "2026-06-11T00:00:00.000Z";
const OLD_ENOUGH = new Date("2026-05-01T00:00:00.000Z");
const TOO_NEW = new Date("2026-06-10T00:00:00.000Z");
const MINIMUM_RELEASE_AGE_MINUTES = 7 * 24 * 60;

function packageJson(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
): PackageJson {
  return { dependencies, devDependencies };
}

function lockfile(
  entries: Array<string | [string, { requiresBuild?: boolean }]>
) {
  const packageEntries = entries
    .map((entry) => {
      const [key, options] = Array.isArray(entry) ? entry : [entry, {}];
      return [
        `  ${key}:`,
        "    resolution: {integrity: sha512-test}",
        options.requiresBuild ? "    requiresBuild: true" : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    "lockfileVersion: '9.0'",
    "",
    "packages:",
    packageEntries,
    "",
    "snapshots:",
    "",
  ].join("\n");
}

function fetchInfo(
  publishedAt = OLD_ENOUGH,
  scripts: Record<string, string> = {}
): FetchPackageInfo {
  return jest.fn(async () => ({
    publishedAt,
    scripts,
    error: null,
  }));
}

async function analyze(overrides: {
  basePackageJson: PackageJson;
  headPackageJson: PackageJson;
  baseLockfileText: string;
  headLockfileText: string;
  fetchPackageInfo?: FetchPackageInfo;
}) {
  return analyzeDependencyRisk({
    now: NOW,
    minimumReleaseAgeMinutes: MINIMUM_RELEASE_AGE_MINUTES,
    isDependabot: true,
    fetchPackageInfo: overrides.fetchPackageInfo ?? fetchInfo(),
    ...overrides,
  });
}

describe("dependency-risk-gate", () => {
  it("marks a clean dev-only patch update as an auto-merge candidate", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "3.8.2" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@3.8.2"]),
    });

    expect(result.riskLevel).toBe("low");
    expect(result.autoMergeEligible).toBe(true);
    expect(result.labels).toEqual(
      expect.arrayContaining([
        "risk:low",
        "deps:dev-only",
        "deps:patch",
        "auto-merge:candidate",
      ])
    );
  });

  it("blocks dependency downgrades", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.2" }),
      headPackageJson: packageJson({}, { prettier: "3.8.1" }),
      baseLockfileText: lockfile(["prettier@3.8.2"]),
      headLockfileText: lockfile(["prettier@3.8.1"]),
    });

    expect(result.riskLevel).toBe("high");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["risk:high", "deps:mixed", "auto-merge:blocked"])
    );
    expect(result.eligibilityBlockers.join("\n")).toContain(
      "Dependency downgrade detected: prettier 3.8.2 -> 3.8.1."
    );
  });

  it("blocks runtime patch updates", async () => {
    const result = await analyze({
      basePackageJson: packageJson({ clsx: "2.1.1" }, {}),
      headPackageJson: packageJson({ clsx: "2.1.2" }, {}),
      baseLockfileText: lockfile(["clsx@2.1.1"]),
      headLockfileText: lockfile(["clsx@2.1.2"]),
    });

    expect(result.riskLevel).toBe("medium");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining([
        "risk:medium",
        "deps:runtime",
        "auto-merge:blocked",
      ])
    );
  });

  it("classifies major updates as high risk", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "4.0.0" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@4.0.0"]),
    });

    expect(result.riskLevel).toBe("high");
    expect(result.labels).toEqual(
      expect.arrayContaining(["risk:high", "deps:major", "auto-merge:blocked"])
    );
  });

  it("classifies high-risk package updates as high risk", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { eslint: "9.39.4" }),
      headPackageJson: packageJson({}, { eslint: "9.39.5" }),
      baseLockfileText: lockfile(["eslint@9.39.4"]),
      headLockfileText: lockfile(["eslint@9.39.5"]),
    });

    expect(result.riskLevel).toBe("high");
    expect(result.labels).toEqual(
      expect.arrayContaining(["risk:high", "deps:patch", "auto-merge:blocked"])
    );
  });

  it("blocks new direct dependencies", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, {}),
      headPackageJson: packageJson({}, { "new-tool": "1.0.0" }),
      baseLockfileText: lockfile([]),
      headLockfileText: lockfile(["new-tool@1.0.0"]),
    });

    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["deps:new-package", "auto-merge:blocked"])
    );
  });

  it("blocks lockfile transitive additions", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "3.8.2" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@3.8.2", "ansi-regex@6.2.2"]),
    });

    expect(result.riskLevel).toBe("medium");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["deps:new-package", "auto-merge:blocked"])
    );
  });

  it("blocks install script exposure", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "3.8.2" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@3.8.2"]),
      fetchPackageInfo: fetchInfo(OLD_ENOUGH, {
        postinstall: "node install.js",
      }),
    });

    expect(result.riskLevel).toBe("high");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["deps:install-script", "auto-merge:blocked"])
    );
  });

  it("blocks package versions younger than the minimum release age", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "3.8.2" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@3.8.2"]),
      fetchPackageInfo: fetchInfo(TOO_NEW),
    });

    expect(result.riskLevel).toBe("medium");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["risk:medium", "auto-merge:blocked"])
    );
    expect(result.eligibilityBlockers.join("\n")).toContain(
      "younger than 10080 minutes"
    );
  });

  it("blocks when package info fetch rejects", async () => {
    const result = await analyze({
      basePackageJson: packageJson({}, { prettier: "3.8.1" }),
      headPackageJson: packageJson({}, { prettier: "3.8.2" }),
      baseLockfileText: lockfile(["prettier@3.8.1"]),
      headLockfileText: lockfile(["prettier@3.8.2"]),
      fetchPackageInfo: jest.fn(async () => {
        throw new Error("registry unavailable");
      }),
    });

    expect(result.riskLevel).toBe("high");
    expect(result.autoMergeEligible).toBe(false);
    expect(result.labels).toEqual(
      expect.arrayContaining(["risk:high", "auto-merge:blocked"])
    );
    expect(result.eligibilityBlockers.join("\n")).toContain(
      "Package publish age could not be confirmed: prettier."
    );
  });

  it("blocks when registry JSON cannot be parsed", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => {
        throw new Error("malformed registry response");
      },
    })) as jest.MockedFunction<typeof fetch>;
    globalThis.fetch = fetchMock;

    try {
      const result = await analyzeDependencyRisk({
        now: NOW,
        minimumReleaseAgeMinutes: MINIMUM_RELEASE_AGE_MINUTES,
        isDependabot: true,
        basePackageJson: packageJson({}, { prettier: "3.8.1" }),
        headPackageJson: packageJson({}, { prettier: "3.8.2" }),
        baseLockfileText: lockfile(["prettier@3.8.1"]),
        headLockfileText: lockfile(["prettier@3.8.2"]),
      });

      expect(result.riskLevel).toBe("high");
      expect(result.autoMergeEligible).toBe(false);
      expect(result.labels).toEqual(
        expect.arrayContaining(["risk:high", "auto-merge:blocked"])
      );
      expect(result.eligibilityBlockers.join("\n")).toContain(
        "Package publish age could not be confirmed: prettier."
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
