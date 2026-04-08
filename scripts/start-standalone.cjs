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
