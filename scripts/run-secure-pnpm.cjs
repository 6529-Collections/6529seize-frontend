#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-secure-pnpm.cjs <pnpm-args...>");
  process.exit(1);
}

function resolveSfwCommand() {
  const configuredBinary = process.env["SFW_BIN"];
  if (!configuredBinary) {
    return "sfw";
  }

  if (!path.isAbsolute(configuredBinary)) {
    console.error("SFW_BIN must be an absolute path when set.");
    process.exit(1);
  }

  if (!fs.existsSync(configuredBinary)) {
    console.error(`SFW_BIN does not exist: ${configuredBinary}`);
    process.exit(1);
  }

  return configuredBinary;
}

const sfwCommand = resolveSfwCommand();

const result = spawnSync(sfwCommand, ["pnpm", ...args], {
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
