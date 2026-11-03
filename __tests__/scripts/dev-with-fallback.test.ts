/** @jest-environment node */
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

type Probe = "open" | "refused" | "timeout";

// Runs the script with stubbed modules and timers; no development server,
// port probe or cgroup read touches the real system.
function startScript({
  env = {},
  probes = [],
}: {
  readonly env?: Record<string, string>;
  readonly probes?: Probe[];
} = {}) {
  const child = Object.assign(new EventEmitter(), { kill: jest.fn() });
  const exit = jest.fn();
  const error = jest.fn();
  const graceTimers: Array<() => void> = [];
  let tick: (() => Promise<void>) | undefined;
  const setIntervalStub = jest.fn((callback: () => Promise<void>) => {
    tick = callback;
    return { unref: jest.fn() };
  });
  const connect = jest.fn(() => {
    const socket = Object.assign(new EventEmitter(), {
      destroy: jest.fn(),
      setTimeout: jest.fn(),
    });
    const probe = probes.shift() ?? "refused";
    setImmediate(() => {
      if (probe === "open") socket.emit("connect");
      else if (probe === "timeout") socket.emit("timeout");
      else
        socket.emit(
          "error",
          Object.assign(new Error("refused"), { code: "ECONNREFUSED" })
        );
    });
    return socket;
  });
  const dependencies: Record<string, unknown> = {
    child_process: { spawn: jest.fn(() => child) },
    "node:fs": {
      readFileSync: (file: string) => {
        if (file === "/sys/fs/cgroup/memory.events")
          return "oom 1\noom_kill 1\n";
        throw new Error("missing");
      },
    },
    "node:path": path,
    net: {
      connect,
      createServer: () => {
        const server = Object.assign(new EventEmitter(), {
          listen: () => server.emit("listening"),
          close: (callback: () => void) => callback(),
        });
        return server;
      },
    },
  };
  const requireStub = Object.assign(
    (name: string) => {
      if (!(name in dependencies)) throw new Error(`Unexpected module ${name}`);
      return dependencies[name];
    },
    { resolve: () => "/stub/next" }
  );
  vm.runInNewContext(fs.readFileSync("scripts/dev-with-fallback.cjs", "utf8"), {
    require: requireStub,
    __dirname: path.resolve("scripts"),
    process: {
      env,
      argv: ["node", "scripts/dev-with-fallback.cjs"],
      execPath: process.execPath,
      exit,
    },
    console: { log: jest.fn(), error },
    setInterval: setIntervalStub,
    clearInterval: () => {
      tick = undefined;
    },
    setTimeout: (callback: () => void) => {
      graceTimers.push(callback);
    },
  });
  const runProbes = async (count: number) => {
    for (let index = 0; index < count; index += 1) await tick?.();
  };
  return { child, error, exit, graceTimers, runProbes, setIntervalStub };
}

const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

describe("development server exit status", () => {
  it.each([0, 7, null])(
    "preserves exit code %s and fails on a signal",
    async (code) => {
      const { child, exit, setIntervalStub } = startScript();
      await settle();
      child.emit("exit", code, code === null ? "SIGKILL" : null);
      expect(exit).toHaveBeenCalledWith(code ?? 1);
      expect(exit).toHaveBeenCalledTimes(1);
      expect(setIntervalStub).not.toHaveBeenCalled();
    }
  );
});

describe("development server port watchdog", () => {
  const env = { DEV_SERVER_PORT_WATCHDOG: "1" };
  const lostPort: Probe[] = ["open", "refused", "refused", "refused"];

  it("reports and stops a server whose port closes after it was ready", async () => {
    const { child, error, exit, graceTimers, runProbes } = startScript({
      env,
      probes: [...lostPort],
    });
    await settle();
    await runProbes(3);
    expect(child.kill).not.toHaveBeenCalled();

    await runProbes(1);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        "stopped accepting connections on port 3001 while `next dev` was still running"
      )
    );
    expect(error).toHaveBeenCalledWith(
      "[dev-with-fallback] cgroup memory.events: oom 1, oom_kill 1"
    );
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");

    // `next dev` exits 0 on SIGTERM; the lost server still fails the command.
    child.emit("exit", 0, null);
    expect(exit).toHaveBeenCalledWith(1);
    expect(graceTimers).toHaveLength(1);
  });

  it("exits after the grace period if `next dev` does not stop", async () => {
    const { exit, graceTimers, runProbes } = startScript({
      env,
      probes: [...lostPort],
    });
    await settle();
    await runProbes(4);
    expect(exit).not.toHaveBeenCalled();
    graceTimers[0]?.();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it.each<[string, Probe[]]>([
    [
      "before the server first accepts a connection",
      ["refused", "refused", "refused", "refused"],
    ],
    [
      "when the port recovers",
      ["open", "refused", "refused", "open", "refused", "refused"],
    ],
    [
      "when probes time out instead of being refused",
      ["open", "timeout", "timeout", "timeout", "refused", "refused"],
    ],
  ])("does not stop the server %s", async (_case, probes) => {
    const count = probes.length;
    const { child, error, runProbes } = startScript({ env, probes });
    await settle();
    await runProbes(count);
    expect(child.kill).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
