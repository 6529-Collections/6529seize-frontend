#!/usr/bin/env node

const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const serverEntry = resolve(repoRoot, ".next", "standalone", "server.js");

if (!existsSync(serverEntry)) {
  console.error(
    "Missing .next/standalone/server.js. Run `6529 run build` before starting the standalone server."
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [serverEntry], {
  cwd: repoRoot,
  env: {
    ...process.env,
    PORT: process.env.PORT || "3001",
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
  },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
