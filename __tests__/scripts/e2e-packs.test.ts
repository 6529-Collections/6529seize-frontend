import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "e2e-packs.cjs");

const { parseArgs, resolvePacks, runPacks } = require(SCRIPT);

const PACKS = [
  {
    scriptKey: "test:e2e:staging:smoke",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
  },
  {
    scriptKey: "test:e2e:staging:social-readonly",
    environments: ["staging"],
    triggers: ["post-deploy", "manual"],
  },
  {
    scriptKey: "test:e2e:production:social-readonly",
    environments: ["production"],
    triggers: ["cron", "manual"],
  },
];

describe("e2e-packs parseArgs", () => {
  it("parses env, trigger, pack, list and shard forwarding", () => {
    expect(
      parseArgs(["--env", "staging", "--trigger", "post-deploy", "--list"])
    ).toEqual({
      env: "staging",
      trigger: "post-deploy",
      pack: null,
      list: true,
      forward: [],
    });
    expect(parseArgs(["--env", "staging", "--shard", "1/2"]).forward).toEqual([
      "--shard=1/2",
    ]);
    expect(parseArgs(["--env", "staging", "--shard=2/2"]).forward).toEqual([
      "--shard=2/2",
    ]);
  });

  it("tolerates a bare -- left over from package-manager forwarding", () => {
    expect(parseArgs(["--", "--env", "staging"]).env).toBe("staging");
    expect(parseArgs(["--env", "staging", "--"]).env).toBe("staging");
  });

  it("throws on unknown or valueless arguments", () => {
    expect(() => parseArgs(["--bogus"])).toThrow('unknown argument "--bogus"');
    expect(() => parseArgs(["--env"])).toThrow("--env requires a value");
  });
});

describe("e2e-packs resolvePacks", () => {
  it("filters by environment and trigger, preserving manifest order", () => {
    const staging = resolvePacks(PACKS, {
      env: "staging",
      trigger: "post-deploy",
      pack: null,
    });
    expect(
      staging.map((pack: { scriptKey: string }) => pack.scriptKey)
    ).toEqual(["test:e2e:staging:smoke", "test:e2e:staging:social-readonly"]);
    const cron = resolvePacks(PACKS, {
      env: "production",
      trigger: "cron",
      pack: null,
    });
    expect(cron).toHaveLength(1);
    expect(
      resolvePacks(PACKS, {
        env: "production",
        trigger: "post-deploy",
        pack: null,
      })
    ).toHaveLength(0);
  });

  it("selects a single pack by scriptKey", () => {
    const one = resolvePacks(PACKS, {
      env: "staging",
      trigger: null,
      pack: "test:e2e:staging:smoke",
    });
    expect(one).toHaveLength(1);
  });
});

describe("e2e-packs runPacks", () => {
  it("runs every pack, aggregates failures and writes the summary", () => {
    const summaryPath = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "e2e-packs-")),
      "summary.md"
    );
    process.env["GITHUB_STEP_SUMMARY"] = summaryPath;
    fs.writeFileSync(summaryPath, "");
    const calls: string[] = [];
    const fakeSpawn = (scriptKey: string) => {
      calls.push(scriptKey);
      if (scriptKey.includes("social")) {
        return {
          status: 1,
          stdout: "line1\nboom: social failed\n",
          stderr: "",
        };
      }
      return { status: 0, stdout: "ok\n", stderr: "" };
    };
    const failed = runPacks(
      resolvePacks(PACKS, {
        env: "staging",
        trigger: "post-deploy",
        pack: null,
      }),
      { spawn: fakeSpawn }
    );
    delete process.env["GITHUB_STEP_SUMMARY"];

    expect(failed).toBe(1);
    expect(calls).toEqual([
      "test:e2e:staging:smoke",
      "test:e2e:staging:social-readonly",
    ]);
    const summary = fs.readFileSync(summaryPath, "utf8");
    expect(summary).toContain(":white_check_mark: `test:e2e:staging:smoke`");
    expect(summary).toContain(":x: `test:e2e:staging:social-readonly`");
    expect(summary).toContain("boom: social failed");
  });
});

describe("e2e-packs CLI", () => {
  it("hard-fails when the resolution is empty instead of passing silently", () => {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "--env", "production", "--trigger", "post-deploy", "--list"],
      {
        encoding: "utf8",
        env: { ...process.env, E2E_MANIFEST_ROOT: REPO_ROOT },
      }
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no packs resolved");
    expect(result.stderr).toContain("false-green");
  });

  it("lists the twelve staging post-deploy packs from the real manifest", () => {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, "--env", "staging", "--trigger", "post-deploy", "--list"],
      {
        encoding: "utf8",
        env: { ...process.env, E2E_MANIFEST_ROOT: REPO_ROOT },
      }
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("resolved 12 pack(s)");
    expect(result.stdout.indexOf("test:e2e:staging:smoke")).toBeLessThan(
      result.stdout.indexOf("test:e2e:staging:network-open-data-readonly")
    );
  });
});
