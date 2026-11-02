#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("node:fs");
const net = require("net");
const { resolve } = require("node:path");

const DEFAULT_START_PORT = Number(process.env.PORT || 3001);
const MAX_OFFSET = Number(process.env.PORT_SEARCH_LIMIT || 20);
const repoRoot = resolve(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next", { paths: [repoRoot] });

const extraArgs = process.argv.slice(2);

// `next dev` ignores a server worker that exits on a signal (for example the
// kernel OOM killer or a Turbopack abort): it logs nothing and keeps running
// with the port closed. Playwright sets DEV_SERVER_PORT_WATCHDOG=1 so that
// case is logged with the cgroup memory counters and the command exits 1.
const WATCHDOG_ENABLED = process.env.DEV_SERVER_PORT_WATCHDOG === "1";
const WATCHDOG_INTERVAL_MS = 5000;
const WATCHDOG_REFUSALS = 3;
const WATCHDOG_EXIT_GRACE_MS = 5000;
const CGROUP_MEMORY_FILES = ["memory.events", "memory.peak"];
const LOG_PREFIX = "[dev-with-fallback]";

function probePort(port) {
  return new Promise((settle) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    const finish = (state) => {
      socket.destroy();
      settle(state);
    };
    socket.setTimeout(WATCHDOG_INTERVAL_MS);
    socket.once("connect", () => finish("open"));
    socket.once("timeout", () => finish("unknown"));
    socket.once("error", (err) =>
      finish(err.code === "ECONNREFUSED" ? "refused" : "unknown")
    );
  });
}

function readCgroupMemory() {
  const lines = [];
  for (const file of CGROUP_MEMORY_FILES) {
    try {
      const value = fs.readFileSync(`/sys/fs/cgroup/${file}`, "utf8");
      lines.push(`${file}: ${value.trim().replaceAll("\n", ", ")}`);
    } catch {
      // Only Linux cgroup v2 hosts expose these files.
    }
  }
  return lines;
}

function watchServerPort(child, port, onLost) {
  let seenOpen = false;
  let refusals = 0;
  let probing = false;
  const timer = setInterval(async () => {
    if (probing) return;
    probing = true;
    const state = await probePort(port);
    probing = false;
    if (state === "open") {
      seenOpen = true;
      refusals = 0;
      return;
    }
    if (!seenOpen || state !== "refused") return;
    refusals += 1;
    if (refusals < WATCHDOG_REFUSALS) return;
    clearInterval(timer);
    onLost();
  }, WATCHDOG_INTERVAL_MS);
  timer.unref?.();
  child.on("exit", () => clearInterval(timer));
}

function reportLostServer(port) {
  console.error(
    `${LOG_PREFIX} The Next.js dev server stopped accepting connections on port ${port} while \`next dev\` was still running. ` +
      "Its server worker most likely exited on a signal, such as the OOM killer or a Turbopack abort, which `next dev` does not log. " +
      "Stopping the dev server; later requests will be refused."
  );
  for (const line of readCgroupMemory()) {
    console.error(`${LOG_PREFIX} cgroup ${line}`);
  }
}

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort() {
  for (let offset = 0; offset <= MAX_OFFSET; offset += 1) {
    const port = DEFAULT_START_PORT + offset;
     
    const isFree = await checkPort(port);
    if (isFree) {
      return port;
    }
    if (offset === 0) {
      console.log(
        `Port ${port} busy, searching for the next available port...`
      );
    }
  }
  throw new Error(
    `Unable to find a free port starting from ${DEFAULT_START_PORT} (searched +${MAX_OFFSET}).`
  );
}

async function run() {
  try {
    const port = await findAvailablePort();
    const env = {
      ...process.env,
      __NEXT_EXPERIMENTAL_MCP_SERVER: "true",
      PORT: String(port),
    };
    const useTurbo = process.env.USE_TURBO !== "false";
    console.log(`Starting Next.js dev server on port ${port}${useTurbo ? "" : " (Turbopack disabled)"}...`);

    const devArgs = useTurbo
      ? [nextBin, "dev", "-p", String(port), ...extraArgs]
      : [nextBin, "dev", "--webpack", "-p", String(port), ...extraArgs];

    const child = spawn(
      process.execPath,
      devArgs,
      {
        stdio: "inherit",
        cwd: repoRoot,
        env,
      }
    );

    let serverLost = false;
    child.on("exit", (code) => {
      process.exit(serverLost ? 1 : (code ?? 1));
    });
    if (WATCHDOG_ENABLED) {
      watchServerPort(child, port, () => {
        serverLost = true;
        reportLostServer(port);
        child.kill("SIGTERM");
        setTimeout(() => process.exit(1), WATCHDOG_EXIT_GRACE_MS);
      });
    }
    child.on("error", (err) => {
      console.error("Failed to start Next.js dev server:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

run();
