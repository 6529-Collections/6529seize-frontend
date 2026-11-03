#!/usr/bin/env node

const { cpSync, existsSync, mkdirSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const standaloneRoot = resolve(repoRoot, ".next", "standalone");
const serverEntry = resolve(repoRoot, ".next", "standalone", "server.js");
const staticSource = resolve(repoRoot, ".next", "static");
const staticDest = resolve(standaloneRoot, ".next", "static");
const publicSource = resolve(repoRoot, "public");
const publicDest = resolve(standaloneRoot, "public");

if (!existsSync(serverEntry)) {
  console.error(
    "Missing .next/standalone/server.js. Run `6529 run build` before starting the standalone server."
  );
  process.exit(1);
}

if (!existsSync(staticSource)) {
  console.error(
    "Missing .next/static. Run `6529 run build` before starting the standalone server."
  );
  process.exit(1);
}

mkdirSync(resolve(standaloneRoot, ".next"), { recursive: true });
cpSync(staticSource, staticDest, { recursive: true, force: true });

if (existsSync(publicSource)) {
  cpSync(publicSource, publicDest, { recursive: true, force: true });
}

const runtimeEnv = { ...process.env };

const result = spawnSync(process.execPath, [serverEntry], {
  cwd: repoRoot,
  env: {
    ...runtimeEnv,
    PORT: runtimeEnv["PORT"] || "3001",
    HOSTNAME: runtimeEnv["HOSTNAME"] || "0.0.0.0",
    // Keep in sync with Procfile and the staging PM2 environment.
    UV_THREADPOOL_SIZE: runtimeEnv["UV_THREADPOOL_SIZE"] || "16",
  },
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
