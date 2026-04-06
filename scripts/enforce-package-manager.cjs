#!/usr/bin/env node

const packageManager = require("../package.json").packageManager;
const userAgent = process.env["npm_config_user_agent"] ?? "";
const secureInstall = process.env["SEIZE_SECURE_INSTALL"] === "1";

if (!userAgent.includes("pnpm/")) {
  console.error("This repository uses pnpm via Corepack and does not allow npm or yarn installs.");
  console.error("Run the secure install path instead:");
  console.error("  1. Use a supported Node.js release that includes Corepack");
  console.error("  2. corepack enable pnpm");
  console.error(`  3. corepack prepare ${packageManager} --activate`);
  console.error("  4. npm install --global sfw");
  console.error("  5. 6529 install");
  process.exit(1);
}

if (!secureInstall) {
  console.error("Plain pnpm installs are blocked in this repository.");
  console.error("Use the secure install path so Socket Firewall wraps dependency downloads:");
  console.error("  6529 install");
  console.error("  6529 install:frozen");
  console.error("  6529 install:prod");
  process.exit(1);
}
