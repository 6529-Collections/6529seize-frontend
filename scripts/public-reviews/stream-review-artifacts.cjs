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
const VERSIONS_ROOT = path.join(REVIEW_ROOT, "versions");
const LOCK_PATH = path.join(REVIEW_ROOT, ".stream-artifacts.lock");

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readVersions() {
  const index = JSON.parse(
    fs.readFileSync(path.join(REVIEW_ROOT, "index.json"), "utf8")
  );
  invariant(
    index.reviewId === REVIEW_ID &&
      Array.isArray(index.versions) &&
      index.versions.length > 0,
    "Stream reference index is invalid."
  );
  return index.versions.map((entry) => {
    invariant(
      typeof entry.version === "string" &&
        /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$/.test(entry.version),
      "Stream reference index contains an invalid version."
    );
    return entry.version;
  });
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

function hideKnowledgePacks(versions) {
  const hiddenRoot = fs.mkdtempSync(
    path.join(REVIEW_ROOT, `.knowledge-hidden-${process.pid}-`)
  );
  const hidden = [];
  try {
    for (const version of versions) {
      const knowledgeRoot = path.join(VERSIONS_ROOT, version, "knowledge");
      if (!fs.existsSync(knowledgeRoot)) {
        continue;
      }
      const hiddenPath = path.join(hiddenRoot, version);
      fs.renameSync(knowledgeRoot, hiddenPath);
      hidden.push({ knowledgeRoot, hiddenPath });
    }
    return { hiddenRoot, hidden };
  } catch (error) {
    for (const entry of hidden.reverse()) {
      if (fs.existsSync(entry.hiddenPath)) {
        fs.renameSync(entry.hiddenPath, entry.knowledgeRoot);
      }
    }
    fs.rmSync(hiddenRoot, { recursive: true, force: true });
    throw error;
  }
}

function restoreKnowledgePacks({ hiddenRoot, hidden }) {
  for (const entry of hidden) {
    invariant(
      !fs.existsSync(entry.knowledgeRoot),
      `Knowledge destination appeared while hidden: ${entry.knowledgeRoot}`
    );
    fs.renameSync(entry.hiddenPath, entry.knowledgeRoot);
  }
  fs.rmSync(hiddenRoot, { recursive: true, force: true });
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
  invariant(
    argv.every((argument) => argument === "--check"),
    `Unknown argument: ${argv.find((argument) => argument !== "--check")}`
  );
  const releaseLock = acquireLock();
  try {
    const hidden = hideKnowledgePacks(readVersions());
    try {
      runNode(path.join(__dirname, "solidity-reference.cjs"), [
        ...(checkOnly ? ["--check"] : []),
      ]);
    } finally {
      restoreKnowledgePacks(hidden);
    }
    runNode(path.join(__dirname, "stream-knowledge.cjs"), [
      ...(checkOnly ? ["--check"] : []),
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

module.exports = {
  hideKnowledgePacks,
  restoreKnowledgePacks,
};
