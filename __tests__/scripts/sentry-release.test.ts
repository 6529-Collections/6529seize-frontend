/** @jest-environment node */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { resolveSentryCliPath } = require("../../ops/scripts/resolve-sentry-cli.cjs") as {
  resolveSentryCliPath: () => string;
};

const SCRIPT = path.join(process.cwd(), "ops", "scripts", "sentry-release.sh");
const RELEASE = "0123456789abcdef0123456789abcdef01234567";

type Run = {
  readonly status: number | null;
  readonly output: string;
  readonly calls: string[];
};

describe("ops/scripts/sentry-release.sh", () => {
  let directory: string;
  let fakeCli: string;
  let callLog: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "sentry-release-"));
    callLog = path.join(directory, "calls.log");
    fakeCli = path.join(directory, "sentry-cli");
    // Records its arguments; fails the subcommand named in FAKE_FAIL.
    fs.writeFileSync(
      fakeCli,
      [
        "#!/usr/bin/env bash",
        'echo "$*" >> "$FAKE_LOG"',
        'if [ "$2" = "${FAKE_FAIL:-}" ]; then exit 1; fi',
        "exit 0",
        "",
      ].join("\n")
    );
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  function run(
    options: {
      readonly cli?: string;
      readonly release?: string;
      readonly token?: string | null;
      readonly fail?: string;
    } = {}
  ): Run {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      SENTRY_AUTH_TOKEN: undefined,
      FAKE_LOG: callLog,
      FAKE_FAIL: options.fail ?? "",
      SENTRY_ORG: "seize-ff",
      SENTRY_PROJECT: "6529-frontend",
    };
    if (options.token !== null) {
      env["SENTRY_AUTH_TOKEN"] = options.token ?? "test-token-value";
    }
    const result = spawnSync(
      "bash",
      [SCRIPT, options.cli ?? fakeCli, options.release ?? RELEASE],
      { encoding: "utf8", env }
    );
    const calls = fs.existsSync(callLog)
      ? fs.readFileSync(callLog, "utf8").trim().split("\n").filter(Boolean)
      : [];
    return {
      status: result.status,
      output: `${result.stdout}${result.stderr}`,
      calls,
    };
  }

  it("creates the release, associates commits like the build plugin did, and finalizes it", () => {
    const { status, output, calls } = run();

    expect(status).toBe(0);
    expect(calls).toEqual([
      `releases new ${RELEASE}`,
      `releases set-commits ${RELEASE} --auto --ignore-missing`,
      `releases finalize ${RELEASE}`,
    ]);
    expect(output).toContain(`Recorded Sentry release ${RELEASE}.`);
    expect(output).not.toContain("test-token-value");
  });

  it("still finalizes when commit association fails", () => {
    const { status, output, calls } = run({ fail: "set-commits" });

    expect(status).toBe(0);
    expect(calls).toHaveLength(3);
    expect(output).toContain("::warning::");
    expect(output).toContain("could not associate commits");
  });

  it.each([
    ["the release cannot be created", { fail: "new" }, 1],
    ["finalizing fails", { fail: "finalize" }, 3],
  ])("warns and exits 0 when %s", (_label, options, expectedCalls) => {
    const { status, output, calls } = run(options);

    expect(status).toBe(0);
    expect(calls).toHaveLength(expectedCalls);
    expect(output).toContain("::warning::");
  });

  it.each([
    ["the token is missing", { token: null }],
    ["the release is not a commit SHA", { release: "main" }],
    ["the binary is missing", { cli: "/nonexistent/sentry-cli" }],
  ])("skips with a warning when %s", (_label, options) => {
    const { status, output, calls } = run(options);

    expect(status).toBe(0);
    expect(calls).toEqual([]);
    expect(output).toContain("::warning::");
  });
});

describe("ops/scripts/resolve-sentry-cli.cjs", () => {
  it("finds the sentry-cli binary installed with @sentry/nextjs", () => {
    const cliPath = resolveSentryCliPath();

    expect(fs.existsSync(cliPath)).toBe(true);
    expect(path.basename(cliPath)).toMatch(/^sentry-cli(\.exe)?$/);
  });
});
