#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { parseArgs } = require("./cli-args.cjs");

const REQUIRED_FILES = Object.freeze([
  "SHA256SUMS",
  "artifact-portability.json",
  "manifest.json",
  "target/package.zip",
]);
const REQUIRED_DIRECTORIES = new Set([
  "target",
  "target/_next",
  "target/_next/static",
]);
const STATIC_PREFIX = "target/_next/static/";

function fail(message) {
  throw new Error(message);
}

function normalizeMember(rawMember) {
  if (typeof rawMember !== "string" || rawMember.length === 0) {
    fail("archive member must be a non-empty string");
  }
  if (/\0|[\u0001-\u001f\u007f]/u.test(rawMember)) {
    fail(
      `archive member contains control characters: ${JSON.stringify(rawMember)}`
    );
  }
  if (
    rawMember.includes("\\") ||
    rawMember.startsWith("/") ||
    /^[A-Za-z]:/u.test(rawMember)
  ) {
    fail(`archive member is not a relative POSIX path: ${rawMember}`);
  }
  const directory = rawMember.endsWith("/");
  const member = directory ? rawMember.slice(0, -1) : rawMember;
  const segments = member.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === ".."
    )
  ) {
    fail(`archive member contains an unsafe path segment: ${rawMember}`);
  }
  return { member, directory };
}

function memberIsAllowed(member, directory) {
  if (directory) {
    return REQUIRED_DIRECTORIES.has(member) || member.startsWith(STATIC_PREFIX);
  }
  return REQUIRED_FILES.includes(member) || member.startsWith(STATIC_PREFIX);
}

function validateArchiveMembers(memberList) {
  if (typeof memberList !== "string") {
    fail("archive member list must be a string");
  }
  const seen = new Set();
  for (const rawMember of memberList.split(/\r?\n/u).filter(Boolean)) {
    const { member, directory } = normalizeMember(rawMember);
    if (seen.has(member)) {
      fail(`archive member is duplicated: ${rawMember}`);
    }
    seen.add(member);
    if (!memberIsAllowed(member, directory)) {
      fail(
        `archive member is outside the production artifact contract: ${rawMember}`
      );
    }
  }
  for (const required of REQUIRED_FILES) {
    if (!seen.has(required)) {
      fail(`archive is missing required file: ${required}`);
    }
  }
  return true;
}

function validateExtractedEntryName(name) {
  if (/\0|[\u0001-\u001f\u007f]/u.test(name)) {
    fail(
      `extracted artifact contains a control character in a name: ${JSON.stringify(name)}`
    );
  }
}

function walk(root, relative = "") {
  const absolute = path.join(root, relative);
  // Paths remain beneath the validated artifact root and are never user-selected directly.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    validateExtractedEntryName(entry.name);
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    const childAbsolute = path.join(root, child);
    // Directory entries come from readdirSync beneath the validated artifact root.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const metadata = fs.lstatSync(childAbsolute);
    if (metadata.isSymbolicLink()) {
      fail(`extracted artifact contains a symbolic link: ${child}`);
    }
    if (metadata.isDirectory()) {
      if (!memberIsAllowed(child, true)) {
        fail(
          `extracted directory is outside the production artifact contract: ${child}`
        );
      }
      paths.push(...walk(root, child));
    } else if (metadata.isFile()) {
      if (!memberIsAllowed(child, false)) {
        fail(
          `extracted file is outside the production artifact contract: ${child}`
        );
      }
      paths.push(child);
    } else {
      fail(
        `extracted artifact contains an unsupported filesystem entry: ${child}`
      );
    }
  }
  return paths;
}

function validateExtractedArtifact(artifactRoot) {
  const root = path.resolve(artifactRoot);
  // artifactRoot is the verifier-owned extraction directory supplied by its CLI contract.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const metadata = fs.lstatSync(root);
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    fail("artifact root must be a real directory");
  }
  const files = new Set(walk(root));
  for (const required of REQUIRED_FILES) {
    if (!files.has(required)) {
      fail(`extracted artifact is missing required file: ${required}`);
    }
  }
  return true;
}

function requiredArg(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.length === 0) {
    fail(`--${name} is required`);
  }
  return value;
}

function main() {
  try {
    const [command, ...argv] = process.argv.slice(2);
    const args = parseArgs(argv);
    if (command === "validate-archive-members") {
      const archiveMembersPath = requiredArg(args, "archive-members");
      // The CLI path points to the verifier-owned archive listing in RUNNER_TEMP.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const archiveMembers = fs.readFileSync(archiveMembersPath, "utf8");
      validateArchiveMembers(archiveMembers);
      return;
    }
    if (command === "validate-extracted-artifact") {
      validateExtractedArtifact(requiredArg(args, "artifact-root"));
      return;
    }
    fail(`unknown command: ${command || "<missing>"}`);
  } catch (error) {
    console.error(
      `error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  REQUIRED_FILES,
  validateArchiveMembers,
  validateExtractedArtifact,
};
