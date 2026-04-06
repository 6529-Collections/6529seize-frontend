#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next", { paths: [repoRoot] });
const port = String(process.env["PORT"] || "3001");

const result = spawnSync(process.execPath, [nextBin, "start", "-p", port], {
  cwd: repoRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
