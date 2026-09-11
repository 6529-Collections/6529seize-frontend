import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

type EnvironmentSnapshot = {
  health: string;
  status: string;
  version_label: string;
};

type ReadinessObservation = {
  consecutive_healthy_exact_samples: number;
  elapsed_ms: number;
  error: string | null;
  health: string | null;
  health_ready: boolean;
  healthy_exact_version: boolean;
  observed_at: string;
  sequence: number;
  status: string | null;
  version_label: string | null;
  version_match: boolean;
  within_deadline: boolean;
};

type ReadinessResult = {
  evidence: {
    attempts: number;
    elapsed_ms: number;
    failure: { code: string; message: string } | null;
    observations: [ReadinessObservation, ...ReadinessObservation[]];
    result: {
      consecutive_samples: number;
      health: string | null;
      status: string | null;
      version_label: string | null;
    } | null;
  };
  ok: boolean;
};

type EnvironmentSampler = (context: {
  deadlineMs: number;
  sequence: number;
  timeoutMs: number;
}) => Promise<
  EnvironmentSnapshot | { health: string; status: string; versionLabel: string }
>;

type ReadinessModule = {
  describeEnvironmentWithAws: (options: {
    environmentName: string;
    execFileImpl: (
      command: string,
      args: string[],
      options: Record<string, unknown>
    ) => Promise<{ stdout: string }>;
    timeoutMs: number;
  }) => Promise<EnvironmentSnapshot>;
  waitForElasticBeanstalkReadiness: (options: {
    callTimeoutSeconds?: number;
    describeEnvironment?: EnvironmentSampler;
    environmentName: string;
    expectedVersion: string;
    monotonicNow?: () => number;
    now?: () => string;
    sleep?: (milliseconds: number) => Promise<void>;
    timeoutSeconds?: number;
  }) => Promise<ReadinessResult>;
};

type MutablePortabilityInventory = {
  artifact?: Record<string, unknown>;
  baked_inputs: Array<Record<string, unknown>>;
  digests: Record<string, unknown>;
  package_scan: {
    inputs: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  runtime_config: Record<string, unknown>;
  unexpected?: boolean;
  unclassified_runtime_keys: string[];
  [key: string]: unknown;
};

type PortabilityInventory = MutablePortabilityInventory & {
  artifact: {
    contract: string;
    contract_version: string;
    [key: string]: unknown;
  };
  baked_inputs: Array<{
    classification: string;
    name: string;
    present: boolean;
    [key: string]: unknown;
  }>;
  digests: {
    content_sha256: string;
    package_sha256: string;
    runtime_config_sha256: string;
    source_sha: string;
    toolchain_sha256: string;
    [key: string]: unknown;
  };
  package_scan: {
    file_count: number;
    input_count: number;
    inputs: Array<Record<string, unknown>>;
    scan_complete: boolean;
    scan_mode: string;
    total_bytes: number;
    [key: string]: unknown;
  };
  portability: {
    blockers: string[];
    portable: boolean;
    promotion_authorized: boolean;
    reuse_authorized: boolean;
    status: string;
  };
  schema_version: string;
};

type PortabilityModule = {
  buildInventory: (options: Record<string, unknown>) => PortabilityInventory;
  compareInventories: (
    staging: PortabilityInventory,
    production: PortabilityInventory
  ) => {
    comparison: {
      baked_input_differences: Array<Record<string, unknown>>;
      digests: Record<string, boolean>;
    };
  };
  validateInventory: (inventory: unknown) => void;
  verifyReportRun: (options: Record<string, unknown>) => unknown;
  verifyReportSource: (options: Record<string, unknown>) => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const readiness =
  require("../../ops/scripts/elastic-beanstalk-readiness.cjs") as ReadinessModule;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const portability =
  require("../../ops/scripts/artifact-portability.cjs") as PortabilityModule;
const SOURCE_SHA = "a".repeat(40);
const EXPECTED_VERSION = "b".repeat(40);
const CONTENT_ROOTS = [
  "public",
  "content/public-reviews",
  "config/public-reviews",
  "public/review-data",
];
const FIXTURE_RUNTIME = {
  API_ENDPOINT: "https://api.staging.6529.io",
  WS_ENDPOINT: "wss://ws.staging.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.staging.6529.io",
  BASE_ENDPOINT: "https://staging.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
  NEXTGEN_CHAIN_ID: 11155111,
  VERSION: SOURCE_SHA,
};

function makeClock() {
  let elapsed = 0;
  return {
    now: () => new Date(Date.UTC(2026, 7, 5, 22, 0, 0, elapsed)).toISOString(),
    monotonicNow: () => elapsed,
    sleep: async (milliseconds: number) => {
      elapsed += milliseconds;
    },
    advance: (milliseconds: number) => {
      elapsed += milliseconds;
    },
    sleeps: [] as number[],
  };
}

function snapshot(
  health: string,
  status: string,
  versionLabel: string
): { health: string; status: string; versionLabel: string } {
  return { health, status, versionLabel };
}

async function runReadiness(
  sequence: Array<
    { health: string; status: string; versionLabel: string } | Error
  >,
  timeoutSeconds = 100
) {
  const clock = makeClock();
  const observations: Array<
    { health: string; status: string; versionLabel: string } | Error
  > = [...sequence];
  let index = 0;
  const result = await readiness.waitForElasticBeanstalkReadiness({
    environmentName: "seizeapp-env-node22",
    expectedVersion: EXPECTED_VERSION,
    timeoutSeconds,
    describeEnvironment: async () => {
      const value = observations[Math.min(index++, observations.length - 1)];
      if (!value) {
        throw new Error("Expected at least one readiness observation fixture");
      }
      if (value instanceof Error) {
        throw value;
      }
      return value;
    },
    sleep: async (milliseconds: number) => {
      clock.sleeps.push(milliseconds);
      await clock.sleep(milliseconds);
    },
    now: clock.now,
    monotonicNow: clock.monotonicNow,
  });
  return { result, clock };
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(value: Buffer | string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function makeArtifactFixture(
  environment: "staging" | "production",
  runtimeOverrides: Record<string, unknown> = {}
) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "artifact-portability-"));
  for (const relativeRoot of CONTENT_ROOTS) {
    fs.mkdirSync(path.join(root, relativeRoot), { recursive: true });
  }
  fs.writeFileSync(path.join(root, "public", "index.html"), "museum\n");
  fs.writeFileSync(
    path.join(root, "content/public-reviews", "source.md"),
    "source\n"
  );
  fs.writeFileSync(
    path.join(root, "config/public-reviews", "publication.json"),
    "{}\n"
  );
  fs.writeFileSync(path.join(root, "public/review-data", "index.json"), "{}\n");
  fs.writeFileSync(
    path.join(root, "package.json"),
    '{"packageManager":"pnpm@10.12.1"}\n'
  );
  fs.writeFileSync(
    path.join(root, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n"
  );

  const runtimePath = path.join(root, "PUBLIC_RUNTIME.json");
  const runtime = {
    ...FIXTURE_RUNTIME,
    ...(environment === "production"
      ? {
          API_ENDPOINT: "https://api.6529.io",
          WS_ENDPOINT: "wss://ws.6529.io",
          ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
          BASE_ENDPOINT: "https://6529.io",
          NEXTGEN_CHAIN_ID: 1,
        }
      : {}),
    ...runtimeOverrides,
  };
  writeJson(runtimePath, runtime);
  const assetsPath = path.join(root, "ASSETS_FROM_S3");
  fs.writeFileSync(
    assetsPath,
    environment === "production" ? "true\n" : "false\n"
  );
  const packagePath = path.join(root, "package.zip");
  fs.writeFileSync(packagePath, `${environment}-package-bytes\n`);
  const extractedRoot = path.join(root, "bundle");
  fs.mkdirSync(path.join(extractedRoot, ".next", "server"), {
    recursive: true,
  });
  writeJson(path.join(extractedRoot, ".next", "PUBLIC_RUNTIME.json"), runtime);
  fs.writeFileSync(
    path.join(extractedRoot, ".next", "server", "runtime.js"),
    `globalThis.__RUNTIME__=${JSON.stringify(runtime)};\n`
  );
  fs.writeFileSync(
    path.join(extractedRoot, ".next", "ASSETS_FROM_S3"),
    environment === "production" ? "true\n" : "false\n"
  );
  const packageDigest = sha256(fs.readFileSync(packagePath));
  const manifestPath = path.join(root, "manifest.json");
  writeJson(manifestPath, {
    schema_version: 3,
    artifact_contract: "environment-bound-v1",
    artifact_contract_version: "environment-bound-v3",
    repository: "frontend",
    source_sha: SOURCE_SHA,
    environment,
    package_sha256: packageDigest,
  });

  const buildWithContentRoots = (contentRoots: string[]) =>
    portability.buildInventory({
      manifest: manifestPath,
      package: packagePath,
      extractedRoot,
      runtimeConfig: runtimePath,
      assetsFlag: assetsPath,
      sourceRoot: root,
      contentRoots,
      environment,
      nodeVersion: "v22.17.1",
      pnpmVersion: "10.12.1",
    });
  const build = () => buildWithContentRoots(CONTENT_ROOTS);

  const reportRoot = path.join(root, "report-artifact");
  const refreshReportArtifact = (
    inventory: ReturnType<typeof build>,
    manifestOverrides: Record<string, unknown> = {}
  ) => {
    const reportManifestPath = path.join(reportRoot, "manifest.json");
    fs.mkdirSync(path.join(reportRoot, "target"), { recursive: true });
    writeJson(reportManifestPath, {
      ...JSON.parse(fs.readFileSync(manifestPath, "utf8")),
      ...manifestOverrides,
    });
    const reportInventory = JSON.parse(JSON.stringify(inventory));
    reportInventory.artifact.manifest_sha256 = sha256(
      fs.readFileSync(reportManifestPath)
    );
    writeJson(
      path.join(reportRoot, "artifact-portability.json"),
      reportInventory
    );
    fs.copyFileSync(
      packagePath,
      path.join(reportRoot, "target", "package.zip")
    );
    const checksumPaths = [
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
    ];
    fs.writeFileSync(
      path.join(reportRoot, "SHA256SUMS"),
      `${checksumPaths
        .map(
          (relativePath) =>
            `${sha256(
              fs.readFileSync(path.join(reportRoot, relativePath))
            )}  ${relativePath}`
        )
        .join("\n")}\n`
    );
  };

  return {
    root,
    manifestPath,
    packagePath,
    extractedRoot,
    runtimePath,
    assetsPath,
    reportRoot,
    build,
    buildWithContentRoots,
    refreshReportArtifact,
  };
}

describe("adaptive Elastic Beanstalk readiness", () => {
  it("bounds the AWS subprocess with the supplied per-call timeout", async () => {
    let observedOptions: Record<string, unknown> | undefined;
    const result = await readiness.describeEnvironmentWithAws({
      environmentName: "seizeapp-env-node22",
      timeoutMs: 2500,
      execFileImpl: async (
        _command: string,
        _args: string[],
        options: Record<string, unknown>
      ) => {
        observedOptions = options;
        return {
          stdout: JSON.stringify({
            Environments: [
              {
                Health: "Green",
                Status: "Ready",
                VersionLabel: EXPECTED_VERSION,
              },
            ],
          }),
        };
      },
    });

    expect(result.version_label).toBe(EXPECTED_VERSION);
    expect(observedOptions).toMatchObject({
      timeout: 2500,
      killSignal: "SIGTERM",
      windowsHide: true,
    });
  });

  it("accepts the normalized AWS adapter shape in the readiness loop", async () => {
    const clock = makeClock();
    const execFileImpl = async () => ({
      stdout: JSON.stringify({
        Environments: [
          {
            Health: "Green",
            Status: "Ready",
            VersionLabel: EXPECTED_VERSION,
          },
        ],
      }),
    });
    const result = await readiness.waitForElasticBeanstalkReadiness({
      environmentName: "seizeapp-env-node22",
      expectedVersion: EXPECTED_VERSION,
      timeoutSeconds: 30,
      describeEnvironment: ({ timeoutMs }) =>
        readiness.describeEnvironmentWithAws({
          environmentName: "seizeapp-env-node22",
          timeoutMs,
          execFileImpl,
        }),
      sleep: clock.sleep,
      now: clock.now,
      monotonicNow: clock.monotonicNow,
    });

    expect(result.ok).toBe(true);
    expect(result.evidence.attempts).toBe(2);
    expect(result.evidence.result).toMatchObject({
      health: "Green",
      status: "Ready",
      version_label: EXPECTED_VERSION,
      consecutive_samples: 2,
    });
  });

  it("takes an immediate sample and requires two consecutive exact healthy samples", async () => {
    const { result, clock } = await runReadiness([
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.ok).toBe(true);
    expect(result.evidence.attempts).toBe(2);
    expect(result.evidence.observations[0].elapsed_ms).toBe(0);
    expect(clock.sleeps).toEqual([5000]);
    expect(result.evidence.result).toMatchObject({
      health: "Green",
      status: "Ready",
      version_label: EXPECTED_VERSION,
      consecutive_samples: 2,
    });
  });

  it("uses bounded backoff while health becomes ready", async () => {
    const { result, clock } = await runReadiness([
      snapshot("Red", "Updating", "c".repeat(40)),
      snapshot("Green", "Updating", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.ok).toBe(true);
    expect(clock.sleeps).toEqual([5000, 10000, 20000]);
    expect(
      result.evidence.observations.map(
        (item) => item.consecutive_healthy_exact_samples
      )
    ).toEqual([0, 0, 1, 2]);
  });

  it("caps each observation call to the smaller call or overall deadline", async () => {
    const clock = makeClock();
    const callTimeouts: number[] = [];
    const result = await readiness.waitForElasticBeanstalkReadiness({
      environmentName: "seizeapp-env-node22",
      expectedVersion: EXPECTED_VERSION,
      timeoutSeconds: 100,
      callTimeoutSeconds: 30,
      describeEnvironment: async ({ timeoutMs }: { timeoutMs: number }) => {
        callTimeouts.push(timeoutMs);
        return snapshot("Green", "Ready", EXPECTED_VERSION);
      },
      sleep: clock.sleep,
      now: clock.now,
      monotonicNow: clock.monotonicNow,
    });

    expect(result.ok).toBe(true);
    expect(callTimeouts).toEqual([30000, 30000]);
  });

  it("rejects a healthy sample that returns after the overall deadline", async () => {
    const clock = makeClock();
    const callTimeouts: number[] = [];
    const result = await readiness.waitForElasticBeanstalkReadiness({
      environmentName: "seizeapp-env-node22",
      expectedVersion: EXPECTED_VERSION,
      timeoutSeconds: 10,
      describeEnvironment: async ({ timeoutMs }: { timeoutMs: number }) => {
        callTimeouts.push(timeoutMs);
        clock.advance(10001);
        return snapshot("Green", "Ready", EXPECTED_VERSION);
      },
      sleep: clock.sleep,
      now: clock.now,
      monotonicNow: clock.monotonicNow,
    });

    expect(result.ok).toBe(false);
    expect(callTimeouts).toEqual([10000]);
    expect(result.evidence.observations[0]).toMatchObject({
      health_ready: true,
      version_match: true,
      within_deadline: false,
      healthy_exact_version: false,
      consecutive_healthy_exact_samples: 0,
    });
  });

  it("does not accept Green/Ready when the VersionLabel is stale", async () => {
    const { result } = await runReadiness([
      snapshot("Green", "Ready", "d".repeat(40)),
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.ok).toBe(true);
    expect(result.evidence.observations[0]).toMatchObject({
      health_ready: true,
      version_match: false,
      healthy_exact_version: false,
      consecutive_healthy_exact_samples: 0,
    });
  });

  it("fails with a timeout when health never reaches the exact ready state", async () => {
    const { result, clock } = await runReadiness(
      [snapshot("Yellow", "Launching", "e".repeat(40))],
      16
    );

    expect(result.ok).toBe(false);
    expect(result.evidence.failure).toMatchObject({ code: "timeout" });
    expect(clock.sleeps).toEqual([5000, 10000, 1000]);
    expect(result.evidence.elapsed_ms).toBe(16000);
  });

  it("records a transient AWS/API failure and retries it", async () => {
    const { result } = await runReadiness([
      new Error("DescribeEnvironments temporarily failed"),
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.ok).toBe(true);
    expect(result.evidence.observations[0].error).toContain(
      "temporarily failed"
    );
    expect(
      result.evidence.observations[0].consecutive_healthy_exact_samples
    ).toBe(0);
  });

  it("classifies an all-API-failure window separately from a health timeout", async () => {
    const { result } = await runReadiness([new Error("AWS unavailable")], 6);

    expect(result.ok).toBe(false);
    expect(result.evidence.failure?.code).toBe("api_failure");
    expect(result.evidence.observations.every((item) => item.error)).toBe(true);
  });

  it("resets consecutive proof after one unhealthy or stale sample", async () => {
    const { result } = await runReadiness([
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", "f".repeat(40)),
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.ok).toBe(true);
    expect(
      result.evidence.observations.map(
        (item) => item.consecutive_healthy_exact_samples
      )
    ).toEqual([1, 0, 1, 2]);
  });

  it("emits durable evidence with the required observation shape", async () => {
    const { result } = await runReadiness([
      snapshot("Green", "Ready", EXPECTED_VERSION),
      snapshot("Green", "Ready", EXPECTED_VERSION),
    ]);

    expect(result.evidence).toMatchObject({
      schema_version: "elastic-beanstalk-readiness.v1",
      contract: "elastic-beanstalk-adaptive-readiness.v1",
      environment_name: "seizeapp-env-node22",
      expected_version: EXPECTED_VERSION,
      required_consecutive_samples: 2,
      backoff_seconds: [5, 10, 20, 30],
      timeout_seconds: 100,
      per_call_timeout_seconds: 30,
      status: "passed",
      failure: null,
    });
    expect(result.evidence.observations[0]).toEqual(
      expect.objectContaining({
        sequence: 1,
        observed_at: expect.any(String),
        elapsed_ms: expect.any(Number),
        health: "Green",
        status: "Ready",
        version_label: EXPECTED_VERSION,
        health_ready: true,
        version_match: true,
        within_deadline: true,
        healthy_exact_version: true,
        error: null,
      })
    );
  });
});

describe("artifact-portability.v1", () => {
  let fixtures: Array<ReturnType<typeof makeArtifactFixture>> = [];

  afterEach(() => {
    for (const fixture of fixtures) {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
    fixtures = [];
  });

  it("separates source, content, toolchain, package, and runtime-config digests", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const inventory = fixture.build();

    expect(inventory.schema_version).toBe("artifact-portability.v1");
    expect(inventory.digests).toEqual(
      expect.objectContaining({
        source_sha: SOURCE_SHA,
        content_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        toolchain_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        package_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        runtime_config_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    );
    expect(inventory.digests.package_sha256).not.toBe(
      inventory.digests.runtime_config_sha256
    );
    expect(inventory.package_scan).toMatchObject({
      scan_mode: "all_regular_files_exact_utf8_and_json_literals",
      scan_complete: true,
      file_count: 3,
      input_count: inventory.baked_inputs.length,
    });
    expect(inventory.baked_inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "SENTRY_DSN",
          classification: "explicit_environment_bound",
          present: false,
        }),
      ])
    );
    expect(inventory.package_scan.inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "API_ENDPOINT",
          present: true,
          matched: true,
        }),
      ])
    );
  });

  it("marks current environment-bound-v3 artifacts NOT_PORTABLE and disables authorization", () => {
    const fixture = makeArtifactFixture("production");
    fixtures.push(fixture);
    const inventory = fixture.build();

    expect(inventory.artifact.contract_version).toBe("environment-bound-v3");
    expect(inventory.portability).toMatchObject({
      status: "NOT_PORTABLE",
      portable: false,
      reuse_authorized: false,
      promotion_authorized: false,
    });
    expect(inventory.portability.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("environment-bound-v3"),
        expect.stringContaining("API_ENDPOINT"),
        expect.stringContaining("BASE_ENDPOINT"),
      ])
    );
  });

  it("compares staging and production inventories without authorizing reuse", () => {
    const staging = makeArtifactFixture("staging");
    const production = makeArtifactFixture("production");
    fixtures.push(staging, production);
    const comparison = portability.compareInventories(
      staging.build(),
      production.build()
    );

    expect(comparison).toMatchObject({
      schema_version: "artifact-portability-comparison.v1",
      contract: "artifact-portability-comparison-v1",
      mode: "report_only",
      decision: {
        status: "BLOCKED",
        portable: false,
        reuse_authorized: false,
        promotion_authorized: false,
      },
    });
    expect(comparison.comparison.digests).toMatchObject({
      source_sha: true,
      content_sha256: true,
      toolchain_sha256: true,
      package_sha256: false,
      runtime_config_sha256: false,
    });
    expect(comparison.comparison.baked_input_differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "API_ENDPOINT" }),
        expect.objectContaining({ name: "PUBLIC_REVIEW_PROFILE" }),
      ])
    );
  });

  it("records unknown baked runtime keys for fail-closed review", () => {
    const fixture = makeArtifactFixture("staging", {
      FUTURE_ENDPOINT: "https://unknown.invalid",
    });
    fixtures.push(fixture);
    const inventory = fixture.build();

    expect(inventory.unclassified_runtime_keys).toContain("FUTURE_ENDPOINT");
    expect(inventory.baked_inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "FUTURE_ENDPOINT",
          classification: "unclassified_runtime_fail_closed",
          present: true,
        }),
      ])
    );
    expect(inventory.package_scan.inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "FUTURE_ENDPOINT",
          matched: true,
        }),
      ])
    );
    expect(inventory.portability.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining("FUTURE_ENDPOINT")])
    );
  });

  it("rejects symlink content roots and realpath escapes before walking", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const externalRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "artifact-portability-external-")
    );
    const symlinkType = process.platform === "win32" ? "junction" : "dir";
    const symlinkRoot = path.join(fixture.root, "public-link");
    const symlinkParent = path.join(fixture.root, "external-parent");
    fs.mkdirSync(path.join(externalRoot, "nested"), { recursive: true });
    try {
      fs.symlinkSync(externalRoot, symlinkRoot, symlinkType);
      expect(() =>
        fixture.buildWithContentRoots([...CONTENT_ROOTS, "public-link"])
      ).toThrow("must be a real directory");

      fs.symlinkSync(externalRoot, symlinkParent, symlinkType);
      expect(() =>
        fixture.buildWithContentRoots([
          ...CONTENT_ROOTS,
          "external-parent/nested",
        ])
      ).toThrow("escapes source root through a symlink");
    } finally {
      fs.rmSync(externalRoot, { recursive: true, force: true });
    }
  });

  it("accepts contained extracted-package symlinks and scans their alias paths", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const targetDirectory = path.join(
      fixture.extractedRoot,
      ".next",
      "node_modules",
      ".store",
      "package"
    );
    const linkDirectory = path.join(
      fixture.extractedRoot,
      ".next",
      "node_modules",
      "package"
    );
    fs.mkdirSync(targetDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(targetDirectory, "runtime.js"),
      `globalThis.__API__=${JSON.stringify(FIXTURE_RUNTIME.API_ENDPOINT)};\n`
    );
    const canonicalInventory = fixture.build();
    fs.symlinkSync(
      path.relative(path.dirname(linkDirectory), targetDirectory),
      linkDirectory,
      "dir"
    );

    const inventory = fixture.build();

    expect(inventory.package_scan.scan_complete).toBe(true);
    expect(inventory.package_scan.file_count).toBe(
      canonicalInventory.package_scan.file_count
    );
    expect(inventory.package_scan.total_bytes).toBe(
      canonicalInventory.package_scan.total_bytes
    );
    expect(inventory.package_scan.inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "API_ENDPOINT",
          matched: true,
          sample_paths: expect.arrayContaining([
            ".next/node_modules/.store/package/runtime.js",
            ".next/node_modules/package/runtime.js",
          ]),
        }),
      ])
    );
  });

  it("rejects contained directory symlink cycles", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const cycleRoot = path.join(fixture.extractedRoot, ".next", "cycle");
    fs.mkdirSync(cycleRoot, { recursive: true });
    fs.symlinkSync("..", path.join(cycleRoot, "parent"), "dir");

    expect(() => fixture.build()).toThrow(
      "Extracted package symbolic-link cycle reaches"
    );
  });

  it("rejects extracted-package symlinks that escape the package root", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const externalRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "artifact-portability-package-external-")
    );
    const linkPath = path.join(fixture.extractedRoot, "escaped-package-link");
    fs.writeFileSync(path.join(externalRoot, "runtime.js"), "external\n");
    try {
      fs.symlinkSync(
        path.relative(path.dirname(linkPath), externalRoot),
        linkPath,
        "dir"
      );
      expect(() => fixture.build()).toThrow(
        "Extracted package symbolic link lexically escapes its root"
      );
    } finally {
      fs.rmSync(externalRoot, { recursive: true, force: true });
    }
  });

  it("rejects a lexical escape even when a later link resolves back inside", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const canonicalTarget = path.join(fixture.extractedRoot, ".next", "server");
    const externalRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "artifact-portability-package-return-")
    );
    const returnLink = path.join(externalRoot, "return-inside");
    const packageLink = path.join(fixture.extractedRoot, "outside-and-back");
    try {
      fs.symlinkSync(canonicalTarget, returnLink, "dir");
      fs.symlinkSync(
        path.relative(path.dirname(packageLink), returnLink),
        packageLink,
        "dir"
      );
      expect(() => fixture.build()).toThrow(
        "Extracted package symbolic link lexically escapes its root"
      );
    } finally {
      fs.rmSync(externalRoot, { recursive: true, force: true });
    }
  });

  it("rejects a forged portable inventory", () => {
    const fixture = makeArtifactFixture("production");
    fixtures.push(fixture);
    const forged = JSON.parse(JSON.stringify(fixture.build()));
    forged.portability = {
      ...forged.portability,
      status: "PORTABLE",
      portable: true,
      reuse_authorized: true,
      promotion_authorized: true,
    };

    expect(() => portability.validateInventory(forged)).toThrow(
      "inventory must fail closed as NOT_PORTABLE"
    );
  });

  it("rejects missing, extra, inconsistent, and incomplete schema fields", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    const valid = fixture.build();
    const mutations: Array<(inventory: MutablePortabilityInventory) => void> = [
      (inventory) => {
        inventory.unexpected = true;
      },
      (inventory) => {
        delete inventory.artifact;
      },
      (inventory) => {
        inventory.digests["unexpected"] = "0".repeat(64);
      },
      (inventory) => {
        inventory.runtime_config["sha256"] = "0".repeat(64);
      },
      (inventory) => {
        const firstInput = inventory.baked_inputs[0];
        if (!firstInput) {
          throw new Error("Expected a baked input fixture");
        }
        firstInput["unexpected"] = true;
      },
      (inventory) => {
        inventory.package_scan.inputs.pop();
      },
      (inventory) => {
        inventory.unclassified_runtime_keys.push("NOT_CLASSIFIED");
      },
    ];

    for (const mutate of mutations) {
      const malformed = JSON.parse(JSON.stringify(valid));
      mutate(malformed);
      expect(() => portability.validateInventory(malformed)).toThrow();
    }
  });

  it("binds report inputs to a trusted successful workflow run and artifact provenance", () => {
    const fixture = makeArtifactFixture("staging");
    fixtures.push(fixture);
    fixture.refreshReportArtifact(fixture.build());
    const runHeadSha = "c".repeat(40);
    const artifactName = "staging-frontend-12345";
    const artifactMetadata = {
      artifacts: [
        {
          id: 98765,
          name: artifactName,
          expired: false,
          digest: `sha256:${"e".repeat(64)}`,
          workflow_run: { id: 12345 },
        },
      ],
    };
    const run = {
      id: 12345,
      path: ".github/workflows/deploy-staging.yml",
      event: "push",
      conclusion: "success",
      head_branch: "1a-staging",
      head_sha: runHeadSha,
      head_repository: {
        full_name: "6529-Collections/6529seize-frontend",
      },
      repository: { full_name: "6529-Collections/6529seize-frontend" },
    };
    const options = {
      role: "staging",
      repository: "6529-Collections/6529seize-frontend",
      expectedRunId: "12345",
      expectedRunHeadSha: runHeadSha,
      expectedSourceSha: SOURCE_SHA,
      expectedWorkflowPath: ".github/workflows/deploy-staging.yml",
      artifactName,
      run,
      artifactRoot: fixture.reportRoot,
      artifactMetadata,
    };

    expect(portability.verifyReportSource(options)).toMatchObject({
      schema_version: "artifact-portability-source-provenance.v1",
      role: "staging",
      run: {
        id: "12345",
        conclusion: "success",
        head_sha: runHeadSha,
      },
      artifact: {
        source_sha: SOURCE_SHA,
        environment: "staging",
        contract_version: "environment-bound-v3",
        github_artifact_id: "98765",
        github_artifact_digest: `sha256:${"e".repeat(64)}`,
        checksum_file_count: 3,
      },
      authorization: {
        comparison_input_accepted: true,
        portable: false,
        reuse_authorized: false,
        promotion_authorized: false,
      },
    });
    expect(
      portability.verifyReportRun({
        ...options,
        artifactName: "manual-staging-frontend-12345",
      })
    ).toMatchObject({ role: "staging", run: { id: "12345" } });

    const reportPackagePath = path.join(
      fixture.reportRoot,
      "target",
      "package.zip"
    );
    fs.writeFileSync(reportPackagePath, "tampered-package-bytes\n");
    const tamperedChecksumPaths = [
      "artifact-portability.json",
      "manifest.json",
      "target/package.zip",
    ];
    fs.writeFileSync(
      path.join(fixture.reportRoot, "SHA256SUMS"),
      `${tamperedChecksumPaths
        .map(
          (relativePath) =>
            `${sha256(
              fs.readFileSync(path.join(fixture.reportRoot, relativePath))
            )}  ${relativePath}`
        )
        .join("\n")}\n`
    );
    expect(() => portability.verifyReportSource(options)).toThrow(
      "package bytes do not match the declared digest"
    );
    fixture.refreshReportArtifact(fixture.build());

    const mismatchedDigest = fixture.build();
    mismatchedDigest.digests.package_sha256 = "3".repeat(64);
    fixture.refreshReportArtifact(mismatchedDigest);
    expect(() => portability.verifyReportSource(options)).toThrow(
      "package digest does not match inventory"
    );

    const mismatchedContract = fixture.build();
    mismatchedContract.artifact.contract = "different-contract";
    fixture.refreshReportArtifact(mismatchedContract, {
      artifact_contract: "different-contract",
    });
    expect(() => portability.verifyReportSource(options)).toThrow(
      "trusted producer binding"
    );

    fixture.refreshReportArtifact(fixture.build());

    const forgedChecksum = fs.readFileSync(
      path.join(fixture.reportRoot, "SHA256SUMS"),
      "utf8"
    );
    fs.writeFileSync(
      path.join(fixture.reportRoot, "SHA256SUMS"),
      forgedChecksum.replace(
        /^([a-f0-9]{64})  target\/package\.zip$/m,
        `${"0".repeat(64)}  target/package.zip`
      )
    );
    expect(() => portability.verifyReportSource(options)).toThrow(
      "SHA256SUMS digest does not match artifact file"
    );
    fixture.refreshReportArtifact(fixture.build());

    expect(() =>
      portability.verifyReportSource({
        ...options,
        artifactMetadata: {
          artifacts: [
            {
              id: 98765,
              name: artifactName,
              expired: false,
              workflow_run: { id: 12345 },
            },
          ],
        },
      })
    ).toThrow("artifact digest is missing or invalid");
    expect(() =>
      portability.verifyReportSource({
        ...options,
        artifactMetadata: {
          artifacts: [
            {
              id: 98765,
              name: artifactName,
              digest: `sha256:${"e".repeat(64)}`,
              workflow_run: { id: 12345 },
            },
          ],
        },
      })
    ).toThrow("expiry state is missing or expired");
    expect(() =>
      portability.verifyReportSource({
        ...options,
        artifactMetadata: {
          artifacts: [
            {
              id: 98765,
              name: artifactName,
              digest: `sha256:${"e".repeat(64)}`,
              expired: false,
            },
          ],
        },
      })
    ).toThrow("artifact run does not match");

    expect(() =>
      portability.verifyReportRun({
        ...options,
        run: { ...run, conclusion: "failure" },
      })
    ).toThrow("did not succeed");
    expect(() =>
      portability.verifyReportRun({
        ...options,
        run: { ...run, head_sha: "d".repeat(40) },
      })
    ).toThrow("head SHA does not match");
    expect(() =>
      portability.verifyReportRun({
        ...options,
        run: { ...run, head_branch: "feature/untrusted" },
      })
    ).toThrow("branch is not trusted");
    expect(() =>
      portability.verifyReportRun({
        ...options,
        run: {
          ...run,
          head_repository: { full_name: "untrusted/fork" },
        },
      })
    ).toThrow("head repository does not match");
    expect(() =>
      portability.verifyReportRun({
        ...options,
        expectedWorkflowPath: ".github/workflows/production-build-artifact.yml",
      })
    ).toThrow("workflow is not trusted");

    const productionWorkflowPath =
      ".github/workflows/production-build-artifact.yml";
    const productionArtifactName = `production-frontend-${SOURCE_SHA}-12345`;
    const productionRun = {
      ...run,
      path: productionWorkflowPath,
      event: "workflow_dispatch",
      head_branch: "main",
    };
    expect(
      portability.verifyReportRun({
        ...options,
        role: "production",
        expectedWorkflowPath: productionWorkflowPath,
        artifactName: productionArtifactName,
        run: productionRun,
      })
    ).toMatchObject({
      schema_version: "artifact-portability-source-provenance.v1",
      role: "production",
      run: { id: "12345", head_sha: runHeadSha },
    });
    expect(() =>
      portability.verifyReportRun({
        ...options,
        role: "production",
        expectedWorkflowPath: productionWorkflowPath,
        artifactName: `production-frontend-${SOURCE_SHA}-invalid/operation`,
        run: productionRun,
      })
    ).toThrow("artifact name is invalid");

    if (process.platform !== "win32") {
      fixture.refreshReportArtifact(fixture.build());
      const manifestPath = path.join(fixture.reportRoot, "manifest.json");
      const displacedPath = path.join(fixture.reportRoot, "manifest.displaced");
      const originalOpenSync = fs.openSync;
      let displaced = false;
      const openSpy = jest
        .spyOn(fs, "openSync")
        .mockImplementation((filePath, flags, mode) => {
          const descriptor =
            mode === undefined
              ? originalOpenSync(filePath, flags)
              : originalOpenSync(filePath, flags, mode);
          if (
            !displaced &&
            path.resolve(String(filePath)) === path.resolve(manifestPath)
          ) {
            displaced = true;
            fs.renameSync(manifestPath, displacedPath);
            fs.copyFileSync(displacedPath, manifestPath);
          }
          return descriptor;
        });
      try {
        expect(() => portability.verifyReportSource(options)).toThrow(
          "changed while opening"
        );
        expect(displaced).toBe(true);
      } finally {
        openSpy.mockRestore();
        if (displaced) {
          fs.rmSync(manifestPath, { force: true });
          fs.renameSync(displacedPath, manifestPath);
        }
      }
    }
  });

  it("protects the poller, inventory contract, migration note, and report workflow", () => {
    const root = process.cwd();
    const reportWorkflow = fs.readFileSync(
      path.join(root, ".github/workflows/artifact-portability-report.yml"),
      "utf8"
    );
    const productionDeploy = fs.readFileSync(
      path.join(root, ".github/workflows/build-upload-deploy-prod.yml"),
      "utf8"
    );
    const stagingDeploy = fs.readFileSync(
      path.join(root, ".github/workflows/deploy-staging.yml"),
      "utf8"
    );
    const schema = JSON.parse(
      fs.readFileSync(
        path.join(root, "ops/contracts/artifact-portability-v1.schema.json"),
        "utf8"
      )
    ) as { properties: Record<string, unknown> };
    const parsedWorkflow = YAML.parse(reportWorkflow) as {
      jobs: Record<string, { steps: Array<Record<string, unknown>> }>;
    };
    const expectPortabilityGuard = (
      workflow: string,
      environment: "staging" | "production",
      inventoryPath: string
    ) => {
      expect(workflow).toContain(`.environment == "${environment}" and`);
      expect(workflow).toContain(".source.git_sha == $source_sha and");
      expect(workflow).toContain(
        ".digests.package_sha256 == $package_sha256 and"
      );
      expect(workflow).toContain('.portability.status == "NOT_PORTABLE" and');
      expect(workflow).toContain(".portability.portable == false and");
      expect(workflow).toContain(".portability.reuse_authorized == false and");
      expect(workflow).toContain(".portability.promotion_authorized == false");
      expect(workflow).toContain(inventoryPath);
    };

    expect(schema.properties).toEqual(
      expect.objectContaining({
        digests: expect.any(Object),
        runtime_config: expect.any(Object),
        portability: expect.any(Object),
      })
    );
    expect(reportWorkflow).toContain(
      "Compare staging and production baked inputs"
    );
    expect(reportWorkflow).toContain(
      "Fetch and verify exact source workflow runs"
    );
    expect(reportWorkflow).toContain(
      "actions/runs/${STAGING_RUN_ID}/artifacts"
    );
    expect(reportWorkflow).toContain("--artifact-metadata-json");
    expect(reportWorkflow).not.toContain("sha256sum -c SHA256SUMS");
    expect(reportWorkflow).toContain(
      "artifact-portability.cjs verify-report-source"
    );
    expect(reportWorkflow).toContain(
      "ops/scripts/artifact-portability-report-source.cjs"
    );
    expect(reportWorkflow).toContain("staging_expected_run_head_sha");
    expect(reportWorkflow).toContain("production_expected_source_sha");
    expect(reportWorkflow).not.toContain("configure-aws-credentials");
    expect(reportWorkflow).not.toContain("update-environment");
    expect(productionDeploy).toContain("elastic-beanstalk-readiness.cjs");
    expectPortabilityGuard(
      productionDeploy,
      "production",
      "production-artifact/artifact-portability.json"
    );
    expectPortabilityGuard(
      stagingDeploy,
      "staging",
      "staging-artifact/artifact-portability.json"
    );
    expect(productionDeploy).not.toContain("sleep 120");
    expect(productionDeploy).not.toContain("sleep 60");
    expect(productionDeploy).toMatch(
      /elastic-beanstalk-readiness\.json[\s\S]*if-no-files-found: error/
    );
    const compareJob = parsedWorkflow.jobs["compare"];
    if (!compareJob) {
      throw new Error("Expected the artifact portability compare job");
    }
    expect(compareJob.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Download exact staging artifact" }),
        expect.objectContaining({ name: "Download exact production artifact" }),
      ])
    );
  });
});
