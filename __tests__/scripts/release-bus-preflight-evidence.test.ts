const {
  preflightContract,
}: {
  preflightContract: (input: Record<string, unknown>) => Record<string, any>;
} = require("../../scripts/release-bus-preflight-evidence.cjs");

describe("Release Bus preflight evidence", () => {
  const baseFileContents = {
    "bin/6529": "runner",
    "jest.config.js": "config",
    "jest.setup.js": "setup",
    "package.json": JSON.stringify({ packageManager: "pnpm@10.14.0" }),
    "pnpm-lock.yaml": "lockfile",
  };
  const workflowFileContents = {
    ".github/workflows/release-bus-preflight.yml": "workflow",
    "scripts/release-bus-authorize-operation.sh": "authorize",
    "scripts/release-bus-frontend-gate.sh": "gate",
    "scripts/release-bus-gate-evidence.cjs": "gate evidence",
    "scripts/release-bus-install-dependencies.cjs": "installer",
    "scripts/release-bus-preflight-evidence.cjs": "preflight evidence",
    "scripts/release-bus-report-progress.mjs": "reporter",
  };
  const input = {
    sourceSha: "a".repeat(40),
    workflowSha: "b".repeat(40),
    baseFileContents,
    workflowFileContents,
    shardCount: 2,
  };

  it("keys behavioral continuity on every executable contract byte", () => {
    const baseline = preflightContract(input);
    expect(preflightContract(input)).toEqual(baseline);
    expect(baseline).toMatchObject({
      kind: "frontend_preflight_contract",
      node_version: "22",
      package_manager: "pnpm@10.14.0",
      shard_count: 2,
      max_workers: 2,
    });

    for (const file of Object.keys(baseFileContents)) {
      const changedContents =
        file === "package.json"
          ? JSON.stringify({ packageManager: "pnpm@10.15.0" })
          : `${baseFileContents[file as keyof typeof baseFileContents]} changed`;
      const changed = preflightContract({
        ...input,
        baseFileContents: {
          ...baseFileContents,
          [file]: changedContents,
        },
      });
      expect(changed.behavior_digest).not.toBe(baseline.behavior_digest);
      expect(changed.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
    }
    for (const file of Object.keys(workflowFileContents)) {
      const changed = preflightContract({
        ...input,
        workflowFileContents: {
          ...workflowFileContents,
          [file]: `${workflowFileContents[file as keyof typeof workflowFileContents]} changed`,
        },
      });
      expect(changed.behavior_digest).not.toBe(baseline.behavior_digest);
      expect(changed.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
    }
  });

  it("separates behavioral identity from commit ancestry and exact source identity", () => {
    const baseline = preflightContract(input);
    const moved = preflightContract({
      ...input,
      sourceSha: "c".repeat(40),
      workflowSha: "d".repeat(40),
    });
    expect(moved.behavior_digest).toBe(baseline.behavior_digest);
    expect(moved.gate_fingerprint).not.toBe(baseline.gate_fingerprint);

    const resharded = preflightContract({ ...input, shardCount: 4 });
    expect(resharded.behavior_digest).not.toBe(baseline.behavior_digest);
    expect(resharded.gate_fingerprint).not.toBe(baseline.gate_fingerprint);
  });

  it("fail-closes unsupported shard and worker contracts", () => {
    expect(() => preflightContract({ ...input, shardCount: 3 })).toThrow(
      "Unsupported shard count"
    );
    expect(() => preflightContract({ ...input, maxWorkers: 3 })).toThrow(
      "Invalid Jest worker contract"
    );
    expect(() =>
      preflightContract({
        ...input,
        baseFileContents: { ...baseFileContents, "package.json": "{" },
      })
    ).toThrow("Invalid package-manager contract");
  });
});
