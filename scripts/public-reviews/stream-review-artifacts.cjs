#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const REVIEW_ID = "6529-stream";
const REVIEW_ROOT = path.join(
  REPOSITORY_ROOT,
  "public",
  "review-data",
  REVIEW_ID
);
const LOCK_PATH = path.join(REVIEW_ROOT, ".stream-artifacts.lock");

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function acquireLock() {
  fs.mkdirSync(REVIEW_ROOT, { recursive: true });
  const handle = fs.openSync(LOCK_PATH, "wx", 0o600);
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    fs.closeSync(handle);
    fs.unlinkSync(LOCK_PATH);
  };
}

function runNode(script, args) {
  execFileSync(process.execPath, [script, ...args], {
    cwd: REPOSITORY_ROOT,
    stdio: "inherit",
    windowsHide: true,
  });
}

function main(argv = process.argv.slice(2)) {
  const checkOnly = argv.includes("--check");
  const knowledgeOnly = argv.includes("--knowledge-only");
  const refreshRetained = argv.includes("--refresh-retained");
  invariant(
    argv.every((argument) =>
      ["--check", "--knowledge-only", "--refresh-retained"].includes(argument)
    ),
    `Unknown argument: ${argv.find(
      (argument) =>
        !["--check", "--knowledge-only", "--refresh-retained"].includes(
          argument
        )
    )}`
  );
  invariant(
    !(checkOnly && refreshRetained),
    "--check cannot be combined with --refresh-retained."
  );
  const releaseLock = acquireLock();
  try {
    if (!knowledgeOnly) {
      runNode(path.join(__dirname, "solidity-reference.cjs"), [
        ...(checkOnly ? ["--check"] : []),
      ]);
    }
    runNode(path.join(__dirname, "stream-knowledge-packs.cjs"), [
      ...(checkOnly ? ["--check"] : []),
      ...(refreshRetained ? ["--refresh-retained"] : []),
    ]);
  } finally {
    releaseLock();
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
