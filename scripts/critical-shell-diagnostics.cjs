#!/usr/bin/env node
// Observe the existing test command; never replace its checks or exit status.
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { constants } = require("node:os");
const path = require("node:path");

const directory = path.join("test-results", "critical-shell-diagnostics");
const resourceFiles = [
  "/proc/meminfo",
  "/sys/fs/cgroup/memory.current",
  "/sys/fs/cgroup/memory.peak",
  "/sys/fs/cgroup/memory.max",
  "/sys/fs/cgroup/memory.events",
  "/sys/fs/cgroup/memory.events.local",
  "/sys/fs/cgroup/memory/memory.usage_in_bytes",
  "/sys/fs/cgroup/memory/memory.max_usage_in_bytes",
  "/sys/fs/cgroup/memory/memory.limit_in_bytes",
  "/sys/fs/cgroup/memory/memory.failcnt",
  "/sys/fs/cgroup/memory/memory.oom_control",
];

function readResource(file) {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    return null;
  }
}

function captureResources(phase) {
  // Command names only: arguments and environment may contain credentials.
  const processes = spawnSync("ps", ["-eo", "pid,ppid,rss,comm"], {
    encoding: "utf8",
    timeout: 2000,
    maxBuffer: 256 * 1024,
  });
  const snapshot = {
    time: new Date().toISOString(),
    phase,
    resources: Object.fromEntries(
      resourceFiles.map((file) => [file, readResource(file)])
    ),
    processes: processes.status === 0 ? processes.stdout.trim() : null,
  };
  try {
    fs.appendFileSync(
      path.join(directory, "resources.jsonl"),
      `${JSON.stringify(snapshot)}\n`
    );
  } catch (error) {
    console.error(
      "[critical-shell diagnostics] Unable to save resources:",
      error.code
    );
  }
}

function exitCode(code, signal) {
  if (code !== null) return code;
  return 128 + (constants.signals[signal] ?? 1);
}

function run() {
  fs.mkdirSync(directory, { recursive: true });
  captureResources("before");
  const child = spawn("./bin/6529", ["run", "test:e2e:critical-shell"], {
    stdio: "inherit",
    env: { ...process.env, PLAYWRIGHT_SERVER_DIAGNOSTICS: "1" },
  });
  const timer = setInterval(() => captureResources("running"), 10000);
  const forwardSignal = (signal) => {
    captureResources(signal);
    child.kill(signal);
  };
  process.once("SIGTERM", () => forwardSignal("SIGTERM"));
  process.once("SIGINT", () => forwardSignal("SIGINT"));
  const finish = (code, signal) => {
    clearInterval(timer);
    captureResources("after");
    console.error(
      `[critical-shell diagnostics] Test process exited: code=${code} signal=${signal}`
    );
    process.exit(exitCode(code, signal));
  };
  child.once("error", (error) => {
    console.error(
      "[critical-shell diagnostics] Test process could not start:",
      error.code
    );
    finish(1, null);
  });
  child.once("exit", finish);
}

if (require.main === module) run();
