#!/usr/bin/env node
const { spawn } = require("child_process");
const net = require("net");

const DEFAULT_START_PORT = Number(process.env.PORT || 3001);
const MAX_OFFSET = Number(process.env.PORT_SEARCH_LIMIT || 20);

const extraArgs = process.argv.slice(2);

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
    // eslint-disable-next-line no-await-in-loop
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
    const env = { ...process.env, PORT: String(port) };
    console.log(`Starting Next.js dev server on port ${port}...`);

    const child = spawn(
      "next",
      ["dev", "--turbopack", "-p", String(port), ...extraArgs],
      {
        stdio: "inherit",
        env,
      }
    );

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
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
