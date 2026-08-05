#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  compareReviewVersions,
  compareStrings,
  invariant,
  stableJson,
} = require("./solidity-reference-lib.cjs");
const {
  buildKnowledgePack,
  knowledgeSourceRoot,
  loadDevelopmentStatusForVersion,
  validateKnowledgePack,
} = require("./stream-knowledge.cjs");

// stream-knowledge.cjs is the byte-hashed corpus generator. Keep publication
// lifecycle orchestration here so schema changes cannot rewrite its identity.
const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_REVIEW_ID = "6529-stream";
const PUBLICATION_SCHEMA = "public-review.publication.v3";
const UNPUBLISHED_LIFECYCLE_STATE = "DRAFT";
const SAFE_REVIEW_ID = /^[a-z0-9][a-z0-9-]*$/;

class KnowledgePackDriftError extends Error {}

function readJson(filePath, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read ${label} at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  invariant(
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed),
    `${label} must be a JSON object.`
  );
  return parsed;
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const files = [];
  const visit = (current) => {
    for (const entry of fs
      .readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, "en"))) {
      const entryPath = path.join(current, entry.name);
      invariant(
        !entry.isSymbolicLink(),
        `Knowledge packs may not contain symbolic links: ${entryPath}`
      );
      if (entry.isDirectory()) {
        visit(entryPath);
      } else {
        invariant(entry.isFile(), `Unsupported knowledge entry: ${entryPath}`);
        files.push(entryPath);
      }
    }
  };
  visit(directory);
  return files.sort(compareStrings);
}

function resolveContainedPath(root, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      !relativePath.includes("\\"),
    "Knowledge file must be a safe relative path."
  );
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  invariant(
    resolved.startsWith(`${resolvedRoot}${path.sep}`),
    "Knowledge file escapes its root."
  );
  return resolved;
}

function expectedFileMap(pack, knowledgeRoot) {
  return new Map(
    [...pack.files.entries()].map(([relativePath, buffer]) => [
      path.join(knowledgeRoot, ...relativePath.split("/")),
      buffer,
    ])
  );
}

function assertFileMapEquals(expected, knowledgeRoot, label) {
  const actualPaths = listFiles(knowledgeRoot);
  const expectedPaths = [...expected.keys()].sort(compareStrings);
  if (stableJson(actualPaths) !== stableJson(expectedPaths)) {
    throw new KnowledgePackDriftError(`${label} file set drifted.`);
  }
  for (const [filePath, buffer] of expected) {
    if (!fs.readFileSync(filePath).equals(buffer)) {
      throw new KnowledgePackDriftError(
        `${label} file drifted: ${normalizeRelativePath(
          path.relative(knowledgeRoot, filePath)
        )}`
      );
    }
  }
}

function writePackAtomically(pack, knowledgeRoot, { replace = false } = {}) {
  invariant(
    replace || !fs.existsSync(knowledgeRoot),
    "Knowledge destination already exists."
  );
  const versionRoot = path.dirname(knowledgeRoot);
  fs.mkdirSync(versionRoot, { recursive: true });
  const stageRoot = fs.mkdtempSync(
    path.join(versionRoot, `.knowledge-stage-${process.pid}-`)
  );
  const backupRoot = path.join(
    versionRoot,
    `.knowledge-backup-${process.pid}-${Date.now()}`
  );
  let renamed = false;
  let backedUp = false;
  try {
    for (const [relativePath, buffer] of pack.files) {
      const filePath = resolveContainedPath(stageRoot, relativePath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer, { flag: "wx" });
    }
    if (replace && fs.existsSync(knowledgeRoot)) {
      fs.renameSync(knowledgeRoot, backupRoot);
      backedUp = true;
    }
    fs.renameSync(stageRoot, knowledgeRoot);
    renamed = true;
    if (backedUp) {
      fs.rmSync(backupRoot, { recursive: true, force: true });
      backedUp = false;
    }
  } catch (error) {
    if (backedUp && !fs.existsSync(knowledgeRoot)) {
      fs.renameSync(backupRoot, knowledgeRoot);
      backedUp = false;
    }
    throw error;
  } finally {
    if (!renamed && fs.existsSync(stageRoot)) {
      fs.rmSync(stageRoot, { recursive: true, force: true });
    }
    if (backedUp && fs.existsSync(backupRoot)) {
      fs.rmSync(backupRoot, { recursive: true, force: true });
    }
  }
}

function knowledgeContext(repoRoot, reviewId) {
  const publicationConfig = readJson(
    path.join(
      repoRoot,
      "config",
      "public-reviews",
      `${reviewId}.publication.json`
    ),
    `${reviewId} publication`
  );
  const referenceIndex = readJson(
    path.join(repoRoot, "public", "review-data", reviewId, "index.json"),
    `${reviewId} reference index`
  );
  return { publicationConfig, referenceIndex };
}

function publicationIdentityDrifted(knowledgeRoot, publication) {
  const manifestPath = path.join(knowledgeRoot, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return false;
  }
  const manifest = readJson(manifestPath, "knowledge manifest");
  return (
    manifest.publication?.lifecycleState !== publication.lifecycleState ||
    manifest.publication?.deploymentStatus !== publication.deploymentStatus ||
    manifest.publication?.auditStatus !== publication.auditStatus
  );
}

function generateKnowledgePacks({
  repoRoot = REPOSITORY_ROOT,
  reviewId = DEFAULT_REVIEW_ID,
  checkOnly = false,
  refreshRetained = false,
  writeOutput = process.stdout.write.bind(process.stdout),
} = {}) {
  invariant(
    typeof reviewId === "string" && SAFE_REVIEW_ID.test(reviewId),
    "--review-id requires a safe review id value."
  );
  invariant(
    !(checkOnly && refreshRetained),
    "--check cannot be combined with --refresh-retained."
  );
  const { publicationConfig, referenceIndex } = knowledgeContext(
    repoRoot,
    reviewId
  );
  invariant(
    Array.isArray(publicationConfig.versions) &&
      Array.isArray(referenceIndex.versions) &&
      publicationConfig.schemaVersion === PUBLICATION_SCHEMA &&
      publicationConfig.reviewId === reviewId &&
      publicationConfig.versions.length === referenceIndex.versions.length,
    `${reviewId} publication and reference indexes drifted.`
  );
  const orderedVersions = referenceIndex.versions.map((entry) => entry.version);
  invariant(
    stableJson(orderedVersions) ===
      stableJson([...orderedVersions].sort(compareReviewVersions)),
    `${reviewId} reference versions are not ordered.`
  );
  const publicVersions = new Set(
    publicationConfig.versions
      .filter(
        (publication) =>
          publication.lifecycleState !== UNPUBLISHED_LIFECYCLE_STATE
      )
      .map((publication) => publication.version)
  );
  const publicActiveVersion = publicVersions.has(referenceIndex.activeVersion)
    ? referenceIndex.activeVersion
    : [...orderedVersions]
        .reverse()
        .find((version) => publicVersions.has(version));
  const developmentStatus = publicActiveVersion
    ? loadDevelopmentStatusForVersion({
        repoRoot,
        reviewId,
        reviewVersion: publicActiveVersion,
        activeVersion: publicActiveVersion,
      })
    : undefined;

  for (const entry of referenceIndex.versions) {
    const publication = publicationConfig.versions.find(
      (candidate) => candidate.version === entry.version
    );
    invariant(
      publication,
      `${reviewId}@${entry.version} publication is missing.`
    );
    if (!publicVersions.has(entry.version)) {
      continue;
    }
    const knowledgeRoot = knowledgeSourceRoot(
      repoRoot,
      reviewId,
      entry.version
    );
    const active = entry.version === publicActiveVersion;
    const buildPack = () =>
      buildKnowledgePack({
        repoRoot,
        reviewId,
        reviewVersion: entry.version,
        publication,
        referenceIndexEntry: entry,
        developmentStatus: active ? developmentStatus : undefined,
      });
    if (!fs.existsSync(knowledgeRoot)) {
      invariant(
        !checkOnly,
        `${reviewId}@${entry.version} knowledge pack is missing; regenerate.`
      );
      writePackAtomically(buildPack(), knowledgeRoot);
    } else if (
      (active ||
        refreshRetained ||
        publicationIdentityDrifted(knowledgeRoot, publication)) &&
      !checkOnly
    ) {
      const pack = buildPack();
      try {
        assertFileMapEquals(
          expectedFileMap(pack, knowledgeRoot),
          knowledgeRoot,
          `${reviewId}@${entry.version} knowledge pack`
        );
      } catch (error) {
        if (!(error instanceof KnowledgePackDriftError)) {
          throw error;
        }
        writePackAtomically(pack, knowledgeRoot, { replace: true });
      }
    }
    validateKnowledgePack({
      repoRoot,
      reviewId,
      reviewVersion: entry.version,
      requireCurrentGenerator: active,
    });
    if (active) {
      assertFileMapEquals(
        expectedFileMap(buildPack(), knowledgeRoot),
        knowledgeRoot,
        `${reviewId}@${entry.version} knowledge pack`
      );
    }
  }
  writeOutput(
    `${checkOnly ? "Verified" : "Generated"} ${
      publicVersions.size
    } published Stream knowledge pack(s) offline.\n`
  );
}

function main(argv = process.argv.slice(2)) {
  try {
    let checkOnly = false;
    let refreshRetained = false;
    let reviewId = DEFAULT_REVIEW_ID;
    for (let index = 0; index < argv.length; index += 1) {
      if (argv[index] === "--check") {
        checkOnly = true;
      } else if (argv[index] === "--refresh-retained") {
        refreshRetained = true;
      } else if (argv[index] === "--review-id") {
        reviewId = argv[index + 1];
        index += 1;
      } else {
        throw new Error(`Unknown argument: ${argv[index]}`);
      }
    }
    generateKnowledgePacks({ reviewId, checkOnly, refreshRetained });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateKnowledgePacks };
