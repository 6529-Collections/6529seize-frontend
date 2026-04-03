#!/usr/bin/env node

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const packageJsonPath = resolve(__dirname, "..", "package.json");
let packageJson;

try {
  packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to read or parse package.json at ${packageJsonPath}: ${message}`);
  process.exit(1);
}
const dependencyFields = ["dependencies", "devDependencies"];
const invalidEntries = [];

for (const field of dependencyFields) {
  const entries = Object.entries(packageJson[field] ?? {});
  for (const [name, version] of entries) {
    if (typeof version !== "string") {
      continue;
    }

    if (version.startsWith("^") || version.startsWith("~")) {
      invalidEntries.push(`${field}.${name} -> ${version}`);
    }
  }
}

if (invalidEntries.length > 0) {
  console.error("package.json must pin dependency versions exactly.");
  for (const entry of invalidEntries) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}
