#!/usr/bin/env node

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const bootstrapScssPath = resolve(repoRoot, "styles/seize-bootstrap.scss");
const nextConfigPath = resolve(repoRoot, "config/nextConfig.ts");

function readRequiredFile(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read ${filePath}: ${message}`);
    process.exit(1);
  }
}

const bootstrapScss = readRequiredFile(bootstrapScssPath);
const nextConfig = readRequiredFile(nextConfigPath);
const failures = [];

if (!/@use\s+["']bootstrap\/scss\/bootstrap["']/.test(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must import Bootstrap with @use "bootstrap/scss/bootstrap".`
  );
}

if (/node_modules\/bootstrap\/scss\/bootstrap/.test(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must not import Bootstrap through a node_modules path.`
  );
}

if (!/const\s+SASS_LOAD_PATHS\s*=\s*\[[\s\S]*node_modules/.test(nextConfig)) {
  failures.push(
    `${nextConfigPath} must keep SASS_LOAD_PATHS pointed at node_modules.`
  );
}

const sassOptionsUsesLoadPaths =
  /sassOptions\s*:\s*{[^}]*loadPaths\s*:\s*SASS_LOAD_PATHS[^}]*}/s.test(
    nextConfig
  );
const sassOptionsUsesQuietDeps =
  /sassOptions\s*:\s*{[^}]*quietDeps\s*:\s*true[^}]*}/s.test(nextConfig);

if (!sassOptionsUsesLoadPaths || !sassOptionsUsesQuietDeps) {
  failures.push(
    `${nextConfigPath} must keep sassOptions.loadPaths and quietDeps enabled.`
  );
}

if (failures.length > 0) {
  console.error("Bootstrap Sass import guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Bootstrap Sass import guard passed.");
