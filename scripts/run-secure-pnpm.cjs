#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-secure-pnpm.cjs <pnpm-args...>");
  process.exit(1);
}

const result = spawnSync("sfw", ["pnpm", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    SEIZE_SECURE_INSTALL: "1",
  },
});

if (result.error) {
  if (result.error.code === "ENOENT") {
    console.error("Socket Firewall (`sfw`) is not installed or not on PATH.");
    console.error("Install it, then rerun the secure install command.");
    console.error("Preferred options:");
    console.error("  - install the `sfw` binary from the Socket Firewall Free releases page");
    console.error("  - or run `npm install --global sfw` as a bootstrap step");
    process.exit(1);
  }

  throw result.error;
}

process.exit(result.status ?? 1);
