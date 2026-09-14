#!/usr/bin/env node
"use strict";

const { execFileSync, spawnSync } = require("node:child_process");

const MAX_ARGUMENT_BYTES = 12000;
const LINT_PATTERNS = ["*.js", "*.jsx", "*.cjs", "*.mjs", "*.ts", "*.tsx"];
const FORMAT_PATTERNS = ["*.js", "*.jsx", "*.ts", "*.tsx", "*.json", "*.css"];
const MODES = {
  "lint:changed": { revision: "merge-base", config: "diff", diffEnv: true },
  "lint:changed:fix": {
    revision: "merge-base",
    config: "diff",
    diffEnv: true,
    fix: true,
  },
  "lint:changed:tight": { revision: "main...HEAD", config: "tight" },
  "lint:uncommitted:tight": { revision: "HEAD", config: "tight" },
  "lint:diff": { revision: "HEAD", config: "diff" },
  "format:changed": { revision: "merge-base", format: true },
  "format:uncommitted": { revision: "HEAD", format: true },
};

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function selectFiles(mode, env) {
  let revision = mode.revision;
  if (revision === "merge-base") {
    revision = git(["merge-base", "origin/main", "HEAD"]).trim();
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(revision)) {
      throw new Error("Unable to resolve merge-base with origin/main.");
    }
    if (mode.diffEnv) env.ESLINT_PLUGIN_DIFF_COMMIT = revision;
  }
  const patterns = [
    ...(mode.format ? FORMAT_PATTERNS : LINT_PATTERNS),
    ":(exclude)generated/**",
  ];
  const tracked = git([
    "diff",
    "--name-only",
    "-z",
    "--diff-filter=ACMR",
    revision,
    "--",
    ...patterns,
  ]);
  const untracked = git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    ...patterns,
  ]);
  return [...new Set(`${tracked}${untracked}`.split("\0").filter(Boolean))];
}

function toolArguments(mode) {
  if (mode.format) {
    return [
      "node_modules/prettier/bin/prettier.cjs",
      "--write",
      "--ignore-unknown",
      "--",
    ];
  }
  return [
    "node_modules/eslint/bin/eslint.js",
    ...(mode.fix ? ["--fix"] : []),
    "--config",
    `eslint.config.${mode.config}.mjs`,
    "--no-warn-ignored",
    "--max-warnings=0",
    "--",
  ];
}

function argumentBytes(value) {
  // Reserve quoting and separator space as well as the UTF-8 path bytes.
  // Native Node spawning avoids cmd.exe's smaller command-line boundary.
  return Buffer.byteLength(value, "utf8") + 3;
}

function chunks(files, prefix) {
  const overhead = [process.execPath, ...prefix].reduce(
    (total, arg) => total + argumentBytes(arg),
    0
  );
  const batches = [];
  let batch = [];
  let size = overhead;
  for (const file of files) {
    const cost = argumentBytes(file);
    if (overhead + cost > MAX_ARGUMENT_BYTES) {
      throw new Error(`File path exceeds the command argument budget: ${file}`);
    }
    if (size + cost > MAX_ARGUMENT_BYTES) {
      batches.push(batch);
      batch = [];
      size = overhead;
    }
    batch.push(file);
    size += cost;
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}

function main() {
  const [name, ...extra] = process.argv.slice(2);
  if (!Object.hasOwn(MODES, name) || extra.length > 0) {
    throw new Error(
      `Usage: changed-file-gates.cjs <${Object.keys(MODES).join(" | ")}>`
    );
  }
  const mode = MODES[name];
  const env = { ...process.env };
  const files = selectFiles(mode, env);
  const prefix = toolArguments(mode);
  let failed = false;
  for (const batch of chunks(files, prefix)) {
    const result = spawnSync(process.execPath, [...prefix, ...batch], {
      stdio: "inherit",
      env,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) failed = true;
  }
  // Preserve the former xargs failure status and report all failing chunks.
  return failed ? 123 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
