/** @jest-environment node */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import YAML from "yaml";
import { publicEnvSchema } from "../../config/env.schema";

const runner = path.join(process.cwd(), "scripts/museum-ci-remaining.sh");
const devRunner = path.join(process.cwd(), "scripts/museum-ci-dev.sh");
const rightsSpec = "tests/museum/rights-readonly.spec.ts";
const aboutSpec = "tests/museum/about-readonly.spec.ts";
const projects = ["web-desktop-chromium", "web-mobile-chromium"];
const workflow = YAML.parse(
  fs.readFileSync(".github/workflows/app-pr-ci.yml", "utf8")
);
const workflowRun: string = workflow.jobs["app-checks"].steps.find(
  (step: { name: string }) =>
    step.name === "Run Network Museum Playwright packs"
).run;

// All external commands are stubs: no dev server, browser or network is started.
const shellStubs = `
setsid() {
  printf 'server:%s:%s:%s\n' "$PORT" "$NEXT_DEV_DIST_DIR" "\${PORT_SEARCH_LIMIT:-unset}" >> "$TEST_EVENTS"
  printf 'launch:%s\n' "$*" >> "$TEST_EVENTS"
}
kill() {
  if [ "$1" = -0 ]; then
    if [ "\${TEST_CLEANUP_SIGNAL:-}" != "" ] && [ "$2" = -- ]; then return 0; fi
    if [ "$2" = -- ]; then return 1; fi
    [ "\${TEST_SERVER_EXIT:-0}" != 1 ]; return
  fi
  printf 'cleanup:%s\n' "$*" >> "$TEST_EVENTS"
}
curl() { [ "\${TEST_SERVER_FAIL:-0}" != 1 ]; }
sleep() {
  if [ "\${TEST_CLEANUP_SIGNAL:-}" != "" ]; then
    builtin kill -"$TEST_CLEANUP_SIGNAL" "$$"
    TEST_CLEANUP_SIGNAL=""
    return 143
  fi
}
`;
const playwrightStub = `#!/usr/bin/env bash
if [ "$*" = "run build:env-schema" ]; then
  printf 'schema-build\n' >> "$TEST_EVENTS"
  exit "\${TEST_SCHEMA_EXIT:-0}"
fi
if [ "$1 $2" = "exec next" ]; then
  printf 'next:%s:port=%s:mcp=%s\n' "$*" "$PORT" "$__NEXT_EXPERIMENTAL_MCP_SERVER" >> "$TEST_EVENTS"
  exit "\${TEST_NEXT_EXIT:-0}"
fi
printf 'test:%s:%s:%s:%s\n' "$PLAYWRIGHT_BASE_URL" "$PLAYWRIGHT_OUTPUT_DIR" "$PLAYWRIGHT_HTML_REPORT_DIR" "$*" >> "$TEST_EVENTS"
if [ "\${TEST_CANCEL:-0}" = 1 ]; then
  builtin kill -TERM "$PPID"
  exit 0
fi
case "$*" in
  *rights-readonly*) exit "\${TEST_RIGHTS_EXIT:-0}" ;;
  *) exit "\${TEST_REMAINING_EXIT:-0}" ;;
esac
`;

describe("Museum isolated remaining runner", () => {
  let directory: string;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "museum-ci-test-"));
    fs.mkdirSync(path.join(directory, "bin"));
    fs.writeFileSync(path.join(directory, "stubs.sh"), shellStubs);
    fs.writeFileSync(path.join(directory, "bin/6529"), playwrightStub, {
      mode: 0o755,
    });
  });
  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  function run(
    specs: string[],
    env: Record<string, string> = {},
    scriptFile = runner
  ) {
    const eventsPath = path.join(directory, "events.txt");
    const subprocessEnv = { ...process.env };
    delete subprocessEnv["PORT_SEARCH_LIMIT"];
    const result = spawnSync("bash", ["--", scriptFile, ...specs], {
      cwd: directory,
      encoding: "utf8",
      timeout: 10_000,
      env: {
        ...subprocessEnv,
        MUSEUM_PROJECT: projects[0],
        BASH_ENV: path.join(directory, "stubs.sh"),
        TEST_EVENTS: eventsPath,
        ...env,
      },
    });
    expect(result.error).toBeUndefined();
    const events = fs.existsSync(eventsPath)
      ? fs.readFileSync(eventsPath, "utf8").trim().split("\n")
      : [];
    return { ...result, events };
  }

  function runGateCleanup(tail: string, env: Record<string, string> = {}) {
    const cleanup = workflowRun
      .split("cleanup_museum_server() {")[1]
      ?.split("museum_server_ready=false")[0];
    expect(cleanup).toBeDefined();
    // Spaces and shell metacharacters in the filename remain literal argv data.
    const gateScript = path.join(directory, "gate cleanup '$;.sh");
    fs.writeFileSync(
      gateScript,
      `set -euo pipefail\nmuseum_server_pid=4321\ncleanup_museum_server() {${cleanup}\n${tail}`
    );
    return run([], env, gateScript);
  }

  it.each(projects)(
    "isolates rights and retains every selected test on %s",
    (project) => {
      const result = run([aboutSpec, rightsSpec], { MUSEUM_PROJECT: project });
      expect(result.status).toBe(0);
      expect(
        result.events.filter((line) => line.startsWith("server:"))
      ).toEqual([
        `server:3102:.next-playwright-${project}-rights:unset`,
        `server:3103:.next-playwright-${project}-remaining:unset`,
      ]);
      const tests = result.events.filter((line) => line.startsWith("test:"));
      expect(tests).toHaveLength(2);
      expect(
        result.events.filter((line) => line.startsWith("launch:"))
      ).toEqual([
        "launch:bash scripts/museum-ci-dev.sh",
        "launch:bash scripts/museum-ci-dev.sh",
      ]);
      expect(tests[0]).toContain(`playwright test ${rightsSpec}`);
      expect(tests[0]).not.toContain(aboutSpec);
      expect(tests[0]).toContain("--trace=retain-on-failure");
      expect(tests[0]).toContain(
        "http://localhost:3102:test-results/playwright/museum-rights:playwright-report/museum-rights"
      );
      expect(tests[1]).toContain(`playwright test ${aboutSpec}`);
      expect(tests[1]).not.toContain(rightsSpec);
      expect(tests[1]).toContain(
        "http://localhost:3103:test-results/playwright/museum-remaining:playwright-report/museum-remaining"
      );
      for (const test of tests) {
        expect(test).toContain(
          `--project=${project} --workers=1 --retries=0 --max-failures=1`
        );
      }
      expect(
        result.events.filter((line) => line.startsWith("cleanup:-TERM"))
      ).toHaveLength(2);
      expect(
        result.events.findIndex((line) => line.startsWith("cleanup:"))
      ).toBeLessThan(
        result.events.findIndex((line) => line.startsWith("server:3103:"))
      );
    }
  );

  it.each(projects)(
    "uses schema-valid server port settings on %s",
    (project) => {
      const result = run([rightsSpec, aboutSpec], { MUSEUM_PROJECT: project });
      expect(result.status).toBe(0);
      const servers = result.events.filter((line) =>
        line.startsWith("server:")
      );
      expect(servers).toHaveLength(2);
      const portSchema = publicEnvSchema.pick({
        PORT: true,
        PORT_SEARCH_LIMIT: true,
      });
      for (const server of servers) {
        const [, port, , searchLimit] = server.split(":");
        expect(
          portSchema.safeParse({
            PORT: port,
            PORT_SEARCH_LIMIT:
              searchLimit === "unset" ? undefined : searchLimit,
          }).success
        ).toBe(true);
      }
      // Fixed ports must not rely on a schema-invalid search-limit override.
      expect(workflowRun).not.toContain("PORT_SEARCH_LIMIT=");
      expect(fs.readFileSync(devRunner, "utf8")).not.toContain(
        "PORT_SEARCH_LIMIT="
      );
      expect(fs.readFileSync(runner, "utf8")).not.toContain(
        "PORT_SEARCH_LIMIT="
      );
    }
  );

  it.each(["3101", "3102", "3103"])(
    "launches Next on the exact requested port %s",
    (port) => {
      const result = run([], { PORT: port }, devRunner);
      expect(result.status).toBe(0);
      expect(result.events).toEqual([
        "schema-build",
        `next:exec next dev --port ${port}:port=${port}:mcp=true`,
      ]);
      expect(publicEnvSchema.shape.PORT.safeParse(port).success).toBe(true);
      expect(workflowRun).toContain("setsid bash scripts/museum-ci-dev.sh");
    }
  );

  it("preserves the explicit Webpack option", () => {
    const result = run([], { PORT: "3101", USE_TURBO: "false" }, devRunner);
    expect(result.status).toBe(0);
    expect(result.events[1]).toContain("next dev --port 3101 --webpack");
  });

  it("stops before Next when schema compilation fails", () => {
    const result = run([], { PORT: "3101", TEST_SCHEMA_EXIT: "8" }, devRunner);
    expect(result.status).toBe(8);
    expect(result.events).toEqual(["schema-build"]);
  });

  it("propagates a failed Next startup without trying another port", () => {
    const result = run([], { PORT: "3101", TEST_NEXT_EXIT: "1" }, devRunner);
    expect(result.status).toBe(1);
    expect(result.events).toEqual([
      "schema-build",
      "next:exec next dev --port 3101:port=3101:mcp=true",
    ]);
  });

  it.each(["", "0", "3104", "3101x"])(
    "rejects unexpected CI port %j",
    (port) => {
      const result = run([], { PORT: port }, devRunner);
      expect(result.status).toBe(1);
      expect(result.events).toEqual([]);
    }
  );

  it.each([[rightsSpec], [aboutSpec]])(
    "does not run an unselected phase for %s",
    (spec) => {
      const result = run([spec]);
      expect(result.status).toBe(0);
      expect(
        result.events.filter((line) => line.startsWith("test:"))
      ).toHaveLength(1);
      expect(
        result.events.filter((line) => line.startsWith("server:"))
      ).toHaveLength(1);
    }
  );

  it("propagates rights failure and never starts remaining coverage", () => {
    const result = run([aboutSpec, rightsSpec], { TEST_RIGHTS_EXIT: "7" });
    expect(result.status).toBe(7);
    expect(result.events.join("\n")).not.toContain("server:3103");
    expect(result.events.join("\n")).toContain("cleanup:-TERM -- -");
  });

  it("propagates remaining failure", () => {
    expect(run([aboutSpec], { TEST_REMAINING_EXIT: "9" }).status).toBe(9);
  });

  it("cleans up its server and stops on cancellation", () => {
    const result = run([rightsSpec, aboutSpec], { TEST_CANCEL: "1" });
    expect(result.status).toBe(143);
    expect(result.events.join("\n")).toContain("cleanup:-TERM -- -");
    expect(result.events.join("\n")).not.toContain("server:3103");
  });

  it("cleans up when server readiness fails without running tests", () => {
    const result = run([rightsSpec], { TEST_SERVER_FAIL: "1" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("did not become ready");
    expect(result.events.join("\n")).toContain("cleanup:-TERM -- -");
    expect(result.events.filter((line) => line.startsWith("test:"))).toEqual(
      []
    );
  });

  it("distinguishes early server exit from readiness timeout", () => {
    const result = run([rightsSpec], { TEST_SERVER_EXIT: "1" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("server exited before readiness");
    expect(result.events.filter((line) => line.startsWith("test:"))).toEqual(
      []
    );
  });

  it.each([
    ["TERM", 143],
    ["INT", 130],
  ])("finishes group cleanup before honoring %s", (signal, status) => {
    const result = run([rightsSpec, aboutSpec], {
      TEST_CLEANUP_SIGNAL: String(signal),
    });
    expect(result.status).toBe(status);
    expect(result.events.join("\n")).toContain("cleanup:-KILL -- -");
    expect(result.events.join("\n")).not.toContain("server:3103");
  });

  it("finishes EXIT-trap cleanup when another TERM arrives", () => {
    const result = run([rightsSpec, aboutSpec], {
      TEST_CANCEL: "1",
      TEST_CLEANUP_SIGNAL: "TERM",
    });
    expect(result.status).toBe(143);
    expect(result.events.join("\n")).toContain("cleanup:-KILL -- -");
    expect(result.events.join("\n")).not.toContain("server:3103");
  });

  it.each([
    ["TERM", 143],
    ["INT", 130],
  ])("finishes gate cleanup before honoring %s", (signal, status) => {
    const result = runGateCleanup(
      "cleanup_museum_server\necho unexpected-continuation",
      { TEST_CLEANUP_SIGNAL: String(signal) }
    );
    expect(result.status).toBe(status);
    expect(result.events).toEqual([
      "cleanup:-TERM -- -4321",
      "cleanup:-KILL -- -4321",
    ]);
    expect(result.stdout).not.toContain("unexpected-continuation");
  });

  it("continues after normal gate cleanup without repeating cleanup on EXIT", () => {
    const result = runGateCleanup(
      "cleanup_museum_server\necho gate-cleanup-complete"
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("gate-cleanup-complete");
    expect(result.events).toEqual([
      "cleanup:-TERM -- -4321",
      "cleanup:-KILL -- -4321",
    ]);
  });

  it.each([0, 7])(
    "preserves gate exit status %i without cancellation",
    (status) => {
      const result = runGateCleanup(`exit ${status}`);
      expect(result.status).toBe(status);
      expect(result.events).toEqual([
        "cleanup:-TERM -- -4321",
        "cleanup:-KILL -- -4321",
      ]);
    }
  );

  it.each([
    ["TERM", 143],
    ["INT", 130],
  ])(
    "honors %s during gate EXIT cleanup without recursive cleanup",
    (signal, status) => {
      const result = runGateCleanup("exit 7", {
        TEST_CLEANUP_SIGNAL: String(signal),
      });
      expect(result.status).toBe(status);
      expect(result.events).toEqual([
        "cleanup:-TERM -- -4321",
        "cleanup:-KILL -- -4321",
      ]);
    }
  );

  it.each([[], ["unexpected.spec.ts"], [rightsSpec, rightsSpec]])(
    "rejects invalid selection %j before starting a server",
    (...specs) => {
      const result = run(specs);
      expect(result.status).toBe(1);
      expect(result.events).toEqual([]);
    }
  );

  it("rejects unexpected projects", () => {
    expect(
      run([rightsSpec], { MUSEUM_PROJECT: "web-desktop-firefox" }).status
    ).toBe(1);
  });

  it("retains the aggregate deadline, gate ordering and cancellation cleanup", () => {
    expect(workflowRun).toContain("timeout --signal=TERM --kill-after=30s 10m");
    expect(workflowRun).toContain(
      [
        "timeout --signal=TERM --kill-after=30s 20m \\",
        '  bash scripts/museum-ci-remaining.sh "${selected_specs[@]}"',
      ].join("\n")
    );
    expect(workflowRun).toContain(
      "cleanup_museum_server\nmuseum_remaining_log="
    );
    expect(workflowRun).toContain("trap 'exit 143' TERM");
    const source = fs.readFileSync(runner, "utf8");
    expect(source).toContain('kill -TERM -- "-$museum_server_pid"');
    expect(source).toContain('kill -KILL -- "-$museum_server_pid"');
    expect(source).toContain("trap cleanup_museum_server EXIT");
    expect(source).toContain("trap 'exit 143' TERM");
  });
});

describe("Museum execution inventory", () => {
  const code = workflowRun.split("node <<'NODE'\n")[1]?.split("\nNODE")[0];
  const gateFile = "museum/network-ia-readonly.spec.ts";
  const rightsFile = rightsSpec.replace("tests/", "");
  const aboutFile = aboutSpec.replace("tests/", "");

  function inventory(project: string, selected: string[], omitRights = false) {
    function report(files: string[]) {
      return JSON.stringify({
        suites: [
          {
            specs: files.map((file) => ({
              file,
              id: file,
              title: file,
              tests: [{ expectedStatus: "passed", projectName: project }],
            })),
          },
        ],
      });
    }
    const input: Record<string, string> = {
      "museum-release-selection.json": JSON.stringify({
        selected_packs: selected.map((file) =>
          file === rightsFile
            ? "test:e2e:museum-rights"
            : "test:e2e:museum-about"
        ),
        selection_digest: "selection-identity",
      }),
      "museum-tests-full.json": report([gateFile, ...selected]),
      "museum-tests-gate.json": report([gateFile]),
      "museum-tests-remaining.json": report(
        omitRights ? [aboutFile] : selected
      ),
    };
    let output = "";
    vm.runInNewContext(code ?? "", {
      require: () => ({
        readFileSync: (file: string) => input[path.basename(file)],
        writeFileSync: (_file: string, value: string) => {
          output = value;
        },
      }),
      process: {
        env: {
          MUSEUM_PROJECT: project,
          MUSEUM_PUBLICATION_TEST_COMMIT: "a".repeat(40),
          MUSEUM_PUBLICATION_EXPECTED_COMMIT: "b".repeat(40),
        },
      },
    });
    return JSON.parse(output);
  }

  it.each(projects)(
    "accounts for all three disjoint phases on %s",
    (project) => {
      const result = inventory(project, [rightsFile, aboutFile]);
      expect(result.contract).toBe("museum-playwright-isolated-project-v4");
      expect(result.full_test_count).toBe(3);
      expect(result.rights).toMatchObject({
        test_count: 1,
        isolated_server: true,
        trace: "retain-on-failure",
      });
      expect(result.remaining.test_count).toBe(1);
      expect(
        [result.gate, result.rights, result.remaining].flatMap(
          (phase) => phase.test_keys
        )
      ).toEqual(
        [gateFile, rightsFile, aboutFile].map((file) => `${project}:${file}`)
      );
    }
  );

  it("supports rights-only and no-rights selections", () => {
    expect(inventory(projects[0]!, [rightsFile]).remaining.test_count).toBe(0);
    expect(inventory(projects[0]!, [aboutFile]).rights.test_count).toBe(0);
  });

  it("fails closed when a selected test disappears", () => {
    expect(() =>
      inventory(projects[0]!, [rightsFile, aboutFile], true)
    ).toThrow("coverage is incomplete");
  });
});
