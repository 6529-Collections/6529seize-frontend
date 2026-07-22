import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  classifyFailure,
  installWithRetries,
  verifyInstall,
}: {
  classifyFailure: (
    result: Record<string, unknown>,
    verification: Record<string, unknown>
  ) => Record<string, string>;
  installWithRetries: (options: Record<string, unknown>) => Promise<any>;
  verifyInstall: (repoRoot: string) => Record<string, any>;
} = require("../../scripts/release-bus-install-dependencies.cjs");

const identityEnvironment = (runnerTemp: string) => ({
  ...process.env,
  GITHUB_JOB: "jest",
  RELEASE_BUS_BASE_SHA: "a".repeat(40),
  RELEASE_BUS_EVIDENCE_ENVIRONMENT: "orchestration",
  RELEASE_BUS_GATE_FINGERPRINT: "b".repeat(64),
  RELEASE_BUS_WORKFLOW_SHA: "c".repeat(40),
  RELEASE_BUS_WORKFLOW_DIGEST: "d".repeat(64),
  RELEASE_BUS_NODE_VERSION: "22",
  RELEASE_BUS_PACKAGE_MANAGER: "pnpm@10.14.0",
  RUNNER_TEMP: runnerTemp,
});

describe("Release Bus verified dependency installation", () => {
  let repoRoot: string;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "release-bus-install-"));
    fs.mkdirSync(path.join(repoRoot, "bin"));
    fs.writeFileSync(path.join(repoRoot, "bin", "6529"), "#!/bin/sh\n");
    fs.writeFileSync(
      path.join(repoRoot, "package.json"),
      JSON.stringify({
        dependencies: { alpha: "1.0.0" },
        devDependencies: { beta: "1.0.0" },
      })
    );
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it("treats a successful command with an incomplete tree as infrastructure", () => {
    expect(
      classifyFailure(
        { status: 0, output: "", timedOut: false },
        { complete: false }
      )
    ).toEqual({
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "DEPENDENCY_INSTALL_INCOMPLETE",
    });
  });

  it("cleans a partial install and retries the same frozen install", async () => {
    let invocation = 0;
    const evidence = await installWithRetries({
      repoRoot,
      environment: identityEnvironment(repoRoot),
      maxAttempts: 2,
      backoffMs: 0,
      runInstall: jest.fn(async () => {
        invocation += 1;
        fs.mkdirSync(path.join(repoRoot, "node_modules"), { recursive: true });
        return {
          status: 0,
          signal: null,
          timedOut: false,
          output: "Socket Firewall encountered an unexpected error",
          durationMs: 1,
        };
      }),
      verifyInstall: jest.fn(() => ({
        complete: invocation === 2,
        metadata_present: invocation === 2,
        missing_dependencies: invocation === 2 ? [] : ["alpha"],
        missing_binaries: [],
      })),
    });

    expect(evidence).toMatchObject({
      status: "SUCCEEDED",
      failure_class: null,
      recovered: true,
    });
    expect(evidence.attempts).toHaveLength(2);
    expect(
      JSON.parse(
        fs.readFileSync(
          path.join(
            repoRoot,
            "release-bus-evidence",
            "dependency-install.json"
          ),
          "utf8"
        )
      )
    ).toMatchObject({ status: "SUCCEEDED", recovered: true });
  });

  it("does not retry a deterministic frozen-lockfile failure", async () => {
    const runInstall = jest.fn(async () => ({
      status: 1,
      signal: null,
      timedOut: false,
      output: "ERR_PNPM_OUTDATED_LOCKFILE",
      durationMs: 1,
    }));

    await expect(
      installWithRetries({
        repoRoot,
        environment: identityEnvironment(repoRoot),
        maxAttempts: 3,
        backoffMs: 0,
        runInstall,
      })
    ).rejects.toThrow("DEPENDENCY_CONTRACT_INVALID");
    expect(runInstall).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(
        fs.readFileSync(
          path.join(
            repoRoot,
            "release-bus-evidence",
            "dependency-install.json"
          ),
          "utf8"
        )
      )
    ).toMatchObject({
      status: "FAILED",
      failure_class: "SOURCE",
      failure_code: "DEPENDENCY_CONTRACT_INVALID",
    });
  });

  it("records a Socket Firewall setup failure before running package code", async () => {
    const runInstall = jest.fn();
    await expect(
      installWithRetries({
        repoRoot,
        environment: {
          ...identityEnvironment(repoRoot),
          RELEASE_BUS_SOCKET_FIREWALL_OUTCOME: "failure",
        },
        runInstall,
      })
    ).rejects.toThrow("SOCKET_FIREWALL_SETUP_FAILED");
    expect(runInstall).not.toHaveBeenCalled();
    expect(
      JSON.parse(
        fs.readFileSync(
          path.join(
            repoRoot,
            "release-bus-evidence",
            "dependency-install.json"
          ),
          "utf8"
        )
      )
    ).toMatchObject({
      status: "FAILED",
      failure_class: "INFRASTRUCTURE_TRANSIENT",
      failure_code: "SOCKET_FIREWALL_SETUP_FAILED",
    });
  });

  it("verifies direct packages, required binaries, and pnpm metadata", () => {
    for (const dependency of ["alpha", "beta"]) {
      fs.mkdirSync(path.join(repoRoot, "node_modules", dependency), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(repoRoot, "node_modules", dependency, "package.json"),
        "{}"
      );
    }
    fs.mkdirSync(path.join(repoRoot, "node_modules", ".bin"), {
      recursive: true,
    });
    for (const binary of ["cross-env", "eslint", "jest", "next", "tsc"]) {
      fs.writeFileSync(path.join(repoRoot, "node_modules", ".bin", binary), "");
    }
    fs.writeFileSync(path.join(repoRoot, "node_modules", ".modules.yaml"), "");

    expect(verifyInstall(repoRoot)).toEqual({
      complete: true,
      metadata_present: true,
      missing_dependencies: [],
      missing_binaries: [],
    });
  });
});
