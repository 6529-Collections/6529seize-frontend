#!/usr/bin/env node

import { spawn } from "node:child_process";

const DEFAULT_PORT = "3001";

const args = process.argv.slice(2);
let selectedPort = process.env.PORT;
const passthroughArgs = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === "-p" || arg === "--port") {
    const value = args[i + 1];
    if (value && !value.startsWith("-")) {
      selectedPort = value;
      i += 1;
      continue;
    }
  }

  if (arg.startsWith("-p=") || arg.startsWith("--port=")) {
    const [, value] = arg.split("=");
    if (value) {
      selectedPort = value;
      continue;
    }
  }

  passthroughArgs.push(arg);
}

const portToUse = selectedPort || DEFAULT_PORT;
const nextArgs = ["dev", "--turbopack", "-p", portToUse, ...passthroughArgs];

const child = spawn("next", nextArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
