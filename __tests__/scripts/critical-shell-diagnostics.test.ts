/** @jest-environment node */
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { constants } from "node:os";
import path from "node:path";
import vm from "node:vm";
import YAML from "yaml";

function harness(script: string, diagnostics = "1") {
  // Every external process and resource read is a stub: no server is started.
  const child = Object.assign(new EventEmitter(), { kill: jest.fn() });
  const exit = jest.fn();
  const testProcess = Object.assign(new EventEmitter(), {
    env: { PLAYWRIGHT_SERVER_DIAGNOSTICS: diagnostics },
    argv: ["node", script],
    execPath: process.execPath,
    exit,
  });
  const spawn = jest.fn(() => child);
  const spawnSync = jest.fn(() => ({
    status: 0,
    stdout: " PID PPID RSS COMMAND\n 10 1 4096 node\n",
  }));
  const appendFileSync = jest.fn();
  const readFileSync = jest.fn((file: string) => {
    if (file.endsWith("memory.events")) return "oom 2\noom_kill 1\n";
    throw new Error("resource unavailable");
  });
  const stderr = jest.fn();
  const setInterval = jest.fn();
  const clearInterval = jest.fn();
  const dependencies: Record<string, unknown> = {
    "node:child_process": { spawn, spawnSync },
    child_process: { spawn },
    "node:fs": { readFileSync, appendFileSync, mkdirSync: jest.fn() },
    "node:os": { constants },
    "node:path": path,
    net: {
      createServer: () => {
        const server = Object.assign(new EventEmitter(), {
          listen: () => server.emit("listening"),
          close: (callback: () => void) => callback(),
        });
        return server;
      },
    },
  };
  const scriptModule = { exports: {} };
  const requireStub = Object.assign(
    (name: string) => {
      if (!(name in dependencies)) throw new Error(`Unexpected module ${name}`);
      return dependencies[name];
    },
    { main: scriptModule, resolve: () => "/stub/next" }
  );
  vm.runInNewContext(fs.readFileSync(script, "utf8"), {
    require: requireStub,
    module: scriptModule,
    __dirname: path.dirname(script),
    process: testProcess,
    console: { log: jest.fn(), error: stderr },
    setInterval,
    clearInterval,
  });
  return {
    child,
    exit,
    spawn,
    spawnSync,
    appendFileSync,
    readFileSync,
    stderr,
    setInterval,
    clearInterval,
    testProcess,
  };
}

const runner = "scripts/critical-shell-diagnostics.cjs";

describe("critical-shell CI diagnostics", () => {
  it.each([0, 1, 7])(
    "preserves test exit code %i and stops sampling",
    (code) => {
      const h = harness(runner);
      h.child.emit("exit", code, null);
      expect(h.exit).toHaveBeenCalledWith(code);
      expect(h.clearInterval).toHaveBeenCalledTimes(1);
      const snapshots = h.appendFileSync.mock.calls.map(([, line]) =>
        JSON.parse(line)
      );
      expect(snapshots.map((snapshot) => snapshot.phase)).toEqual([
        "before",
        "after",
      ]);
    }
  );

  it("records OOM counters and samples while tests are running", () => {
    const h = harness(runner);
    const sample: () => void = h.setInterval.mock.calls[0]![0];
    sample();
    const snapshot = JSON.parse(h.appendFileSync.mock.calls[1]![1]);
    expect(snapshot.phase).toBe("running");
    expect(snapshot.resources["/sys/fs/cgroup/memory.events"]).toBe(
      "oom 2\noom_kill 1"
    );
    expect(snapshot.resources["/sys/fs/cgroup/memory.current"]).toBeNull();
    expect(snapshot.processes).toContain("4096 node");
    expect(h.spawnSync).toHaveBeenCalledWith(
      "ps",
      ["-eo", "pid,ppid,rss,comm"],
      expect.any(Object)
    );
  });

  it("runs the existing pack through the repository wrapper with diagnostics enabled", () => {
    const h = harness(runner);
    expect(h.spawn).toHaveBeenCalledWith(
      "./bin/6529",
      ["run", "test:e2e:critical-shell"],
      {
        stdio: "inherit",
        env: { PLAYWRIGHT_SERVER_DIAGNOSTICS: "1" },
      }
    );
  });

  it("treats SIGKILL as failure rather than success", () => {
    const h = harness(runner);
    h.child.emit("exit", null, "SIGKILL");
    expect(h.exit).toHaveBeenCalledWith(137);
    expect(h.stderr).toHaveBeenCalledWith(
      expect.stringContaining("signal=SIGKILL")
    );
  });

  it("forwards cancellation to the test process", () => {
    const h = harness(runner);
    h.testProcess.emit("SIGTERM");
    expect(h.child.kill).toHaveBeenCalledWith("SIGTERM");
    h.child.emit("exit", null, "SIGTERM");
    expect(h.exit).toHaveBeenCalledWith(143);
  });

  it("reports startup errors and exits unsuccessfully", () => {
    const h = harness(runner);
    h.child.emit(
      "error",
      Object.assign(new Error("spawn failed"), { code: "ENOENT" })
    );
    expect(h.exit).toHaveBeenCalledWith(1);
    expect(h.clearInterval).toHaveBeenCalledTimes(1);
  });

  it("does not replace a test result when resource logging fails", () => {
    const h = harness(runner);
    h.appendFileSync.mockImplementation(() => {
      throw new Error("disk full");
    });
    h.child.emit("exit", 7, null);
    expect(h.exit).toHaveBeenCalledWith(7);
  });

  it("registers the observer in the existing critical-shell lane and preserves pipeline failures", () => {
    const workflow = YAML.parse(
      fs.readFileSync(".github/workflows/app-pr-ci.yml", "utf8")
    );
    const step = workflow.jobs["core-playwright-checks"].steps.find(
      (item: { name: string }) =>
        item.name === "Run critical route-shell Playwright pack"
    );
    expect(step.if).toBe("matrix.lane == 'playwright-critical-shell'");
    expect(step.run).toContain("set -o pipefail");
    expect(step.run).toContain(
      "./bin/6529 exec node scripts/critical-shell-diagnostics.cjs"
    );
    expect(step.run).toContain(
      "tee test-results/critical-shell-diagnostics/server.log"
    );
  });
});

describe("development server exit diagnostics", () => {
  it.each([0, 1, null])(
    "preserves failures and reports the Next.js exit for code %s",
    async (code) => {
      const h = harness("scripts/dev-with-fallback.cjs");
      await new Promise<void>((resolve) => setImmediate(resolve));
      h.child.emit("exit", code, code === null ? "SIGKILL" : null);
      expect(h.exit).toHaveBeenCalledWith(code ?? 1);
      expect(h.stderr).toHaveBeenCalledWith(
        expect.stringContaining(`code=${code}`)
      );
      if (code === null)
        expect(h.stderr).toHaveBeenCalledWith(
          expect.stringContaining("signal=SIGKILL")
        );
    }
  );

  it("keeps extra exit logging opt-in", async () => {
    const h = harness("scripts/dev-with-fallback.cjs", "0");
    await new Promise<void>((resolve) => setImmediate(resolve));
    h.child.emit("exit", 0, null);
    expect(h.stderr).not.toHaveBeenCalled();
    expect(h.exit).toHaveBeenCalledWith(0);
  });
});
