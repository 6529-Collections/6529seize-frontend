#!/usr/bin/env node

const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const packageLockPath = resolve(process.cwd(), "package-lock.json");

if (existsSync(packageLockPath)) {
  console.error("package-lock.json must not exist in this repository.");
  console.error("Use pnpm with the committed pnpm-lock.yaml instead.");
  process.exit(1);
}
