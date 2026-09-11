#!/usr/bin/env node

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const packageJsonPath =
  process.env["LINT_PACKAGE_JSON_PATH"] ||
  resolve(__dirname, "..", "package.json");
let packageJson;

try {
  packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `Failed to read or parse package.json at ${packageJsonPath}: ${message}`
  );
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

// Array-type options of the pinned jest-cli (30.4.2). yargs lets an array
// option keep absorbing the positionals that follow it — even when written as
// `--flag=value` — so a script whose FINAL token is one of these swallows any
// test-path pattern the caller appends (`6529 run test "MyComponent"`), runs
// the full suite instead, then crashes resolving the pattern as a module.
const jestArrayOptions = new Set([
  "coveragePathIgnorePatterns",
  "coverageReporters",
  "ignoreProjects",
  "moduleDirectories",
  "moduleFileExtensions",
  "modulePathIgnorePatterns",
  "modulePaths",
  "projects",
  "reporters",
  "roots",
  "selectProjects",
  "setupFiles",
  "setupFilesAfterEnv",
  "snapshotSerializers",
  "testMatch",
  "testPathIgnorePatterns",
  "testPathPatterns",
  "testRegex",
  "transformIgnorePatterns",
  "unmockedModulePathPatterns",
  "watchPathIgnorePatterns",
]);

const camelize = (flagName) =>
  flagName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

// pnpm appends caller arguments to the END of the script line, so only the
// last shell command can receive them, and only jest invocations are at risk.
const trailingJestArrayOption = (script) => {
  const segments = script.split(/&&|\|\||;/);
  const tokens = segments[segments.length - 1]
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const invokesJest = tokens.some(
    (token) => token === "jest" || /[\\/]jest(\.[cm]?js)?$/.test(token)
  );
  if (!invokesJest) {
    return null;
  }
  const lastToken = tokens[tokens.length - 1];
  const flagMatch = /^--([^=]+)/.exec(lastToken);
  if (!flagMatch) {
    return null;
  }
  return jestArrayOptions.has(camelize(flagMatch[1])) ? lastToken : null;
};

const invalidScripts = [];

for (const [name, script] of Object.entries(packageJson.scripts ?? {})) {
  if (typeof script !== "string") {
    continue;
  }

  const offendingToken = trailingJestArrayOption(script);
  if (offendingToken) {
    invalidScripts.push(`scripts.${name} ends with ${offendingToken}`);
  }
}

let failed = false;

if (invalidEntries.length > 0) {
  failed = true;
  console.error("package.json must pin dependency versions exactly.");
  for (const entry of invalidEntries) {
    console.error(`- ${entry}`);
  }
}

if (invalidScripts.length > 0) {
  failed = true;
  console.error(
    "package.json scripts must not end a jest invocation with an array-type jest option; reorder the flags so appended positionals stay test-path patterns."
  );
  for (const entry of invalidScripts) {
    console.error(`- ${entry}`);
  }
}

if (failed) {
  process.exit(1);
}
