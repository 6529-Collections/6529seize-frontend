#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const {
  bundleOutputSha256,
  sha256Urn,
} = require("./public-reviews/solidity-reference-lib.cjs");
const {
  configSha256,
  generatorSourceSha256,
} = require("./public-reviews/solidity-reference.cjs");
const {
  KNOWLEDGE_SOURCE_DIRECTORY,
  validateKnowledgePack,
} = require("./public-reviews/stream-knowledge.cjs");

const PROFILES = new Set(["production", "staging"]);
const PUBLIC_REVIEW_CONFIG_DIRECTORY = "config/public-reviews";
const PUBLIC_REVIEW_DATA_DIRECTORY = "public/review-data";
const PUBLIC_REVIEW_EDITORIAL_DIRECTORY = "content/public-reviews";
const PUBLIC_REVIEW_PUBLICATION_SCHEMA = "public-review.publication.v3";
const PUBLIC_REVIEW_LIFECYCLE_STATES = new Set([
  "DRAFT",
  "SCHEDULED",
  "PUBLIC_REVIEW",
  "REVIEW_CLOSED",
  "REMEDIATION",
  "AUDIT",
  "FINAL_CANDIDATE",
  "DEPLOYED",
  "ARCHIVED",
]);
const PUBLIC_REVIEW_PUBLIC_ROUTE_STATES = new Set(
  [...PUBLIC_REVIEW_LIFECYCLE_STATES].filter((state) => state !== "DRAFT")
);
const PUBLIC_REVIEW_DEPLOYMENT_STATUSES = new Set(["NOT_DEPLOYED", "DEPLOYED"]);
const PUBLIC_REVIEW_AUDIT_STATUSES = new Set([
  "PRE_AUDIT",
  "AUDIT_IN_PROGRESS",
  "AUDIT_COMPLETE",
]);
const PRODUCTION_BASE_ENDPOINT = "https://6529.io";
const RUNTIME_CONFIG_PATH = ".next/PUBLIC_RUNTIME.json";
const SHA256_URN_PATTERN = /^sha256:[0-9a-f]{64}$/;
const SOURCE_PIN_PATTERN = /^[0-9a-f]{40}$/;
const SOURCE_REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const SAFE_VERSION_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$/;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasValidPublicationMetadata(version) {
  const hasNoPublicationMetadata =
    version.lifecycleState === "DRAFT" &&
    version.deploymentStatus === undefined &&
    version.auditStatus === undefined;
  const hasCompletePublicationMetadata =
    PUBLIC_REVIEW_DEPLOYMENT_STATUSES.has(version.deploymentStatus) &&
    PUBLIC_REVIEW_AUDIT_STATUSES.has(version.auditStatus);
  return hasNoPublicationMetadata || hasCompletePublicationMetadata;
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function isContainedPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function resolveContainedPath(parent, candidate, label) {
  const resolvedParent = path.resolve(parent);
  const resolvedCandidate = path.resolve(resolvedParent, candidate);
  invariant(
    isContainedPath(resolvedParent, resolvedCandidate),
    `${label} must resolve below ${resolvedParent}.`
  );
  return resolvedCandidate;
}

function sortedDirectoryEntries(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
}

function sha256File(filePath) {
  return sha256Urn(fs.readFileSync(filePath));
}

function walkDirectory(root, options = {}) {
  const entries = [];
  if (!fs.existsSync(root)) {
    return entries;
  }

  const visit = (directory, relativeDirectory) => {
    for (const entry of sortedDirectoryEntries(directory)) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      if (options.ignore?.(relativePath, entry)) {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (options.includeDirectories) {
          entries.push({
            path: relativePath,
            type: "directory",
          });
        }
        visit(absolutePath, relativePath);
        continue;
      }
      if (entry.isFile()) {
        entries.push({
          path: relativePath,
          sha256: sha256File(absolutePath),
          type: "file",
        });
        continue;
      }
      if (entry.isSymbolicLink() && options.allowSymlinks) {
        entries.push({
          path: relativePath,
          target: fs.readlinkSync(absolutePath),
          type: "symlink",
        });
        continue;
      }
      throw new Error(
        `${normalizeRelativePath(absolutePath)} is not a supported regular file or directory.`
      );
    }
  };

  visit(root, "");
  return entries;
}

function directoryIdentity(root, options) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(walkDirectory(root, options)))
    .digest("hex");
}

function captureSourceIdentity(repoRoot) {
  const roots = [
    "public",
    PUBLIC_REVIEW_EDITORIAL_DIRECTORY,
    PUBLIC_REVIEW_CONFIG_DIRECTORY,
    KNOWLEDGE_SOURCE_DIRECTORY,
  ];
  return roots.map((relativePath) => {
    const absolutePath = path.join(repoRoot, relativePath);
    return {
      relativePath,
      identity: directoryIdentity(absolutePath),
    };
  });
}

function assertSourceIdentityUnchanged(repoRoot, before) {
  const after = captureSourceIdentity(repoRoot);
  invariant(
    JSON.stringify(after) === JSON.stringify(before),
    "Packaging changed source-controlled public-review inputs."
  );
}

function copyDirectory(source, destination, options = {}) {
  invariant(fs.existsSync(source), `Missing source directory: ${source}`);
  invariant(
    !fs.existsSync(destination),
    `Destination must not already exist: ${destination}`
  );
  fs.mkdirSync(destination, { recursive: true });

  const visit = (sourceDirectory, destinationDirectory, relativeDirectory) => {
    for (const entry of sortedDirectoryEntries(sourceDirectory)) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      if (options.ignore?.(relativePath, entry)) {
        continue;
      }

      const sourcePath = path.join(sourceDirectory, entry.name);
      const destinationPath = path.join(destinationDirectory, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destinationPath);
        visit(sourcePath, destinationPath, relativePath);
        continue;
      }
      invariant(
        entry.isFile(),
        `Refusing to package non-regular source entry: ${normalizeRelativePath(sourcePath)}`
      );
      fs.copyFileSync(sourcePath, destinationPath);
    }
  };

  visit(source, destination, "");
}

function replaceDirectory(source, destination, options = {}) {
  if (fs.existsSync(destination)) {
    const destinationStats = fs.lstatSync(destination);
    invariant(
      !destinationStats.isSymbolicLink(),
      `Refusing to replace symbolic-link destination: ${normalizeRelativePath(destination)}`
    );
    invariant(
      destinationStats.isDirectory(),
      `Replacement destination is not a directory: ${normalizeRelativePath(destination)}`
    );
    fs.rmSync(destination, { recursive: true });
  }
  copyDirectory(source, destination, options);
}

function isReviewDataPath(relativePath) {
  return (
    relativePath === "review-data" || relativePath.startsWith("review-data/")
  );
}

function isKnowledgeProjectionPath(relativePath) {
  const segments = normalizeRelativePath(relativePath).split("/");
  return (
    segments[0] === "review-data" &&
    segments[2] === "versions" &&
    segments.length >= 5 &&
    segments[4] === "knowledge"
  );
}

function getPublicReviewPublicationConfigs(repoRoot) {
  const directory = path.join(repoRoot, PUBLIC_REVIEW_CONFIG_DIRECTORY);
  const publications = sortedDirectoryEntries(directory)
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith(".publication.json")
    )
    .map((entry) => {
      const config = readJson(
        path.join(directory, entry.name),
        "public-review publication config"
      );
      invariant(
        config.schemaVersion === PUBLIC_REVIEW_PUBLICATION_SCHEMA &&
          SAFE_ID_PATTERN.test(config.reviewId) &&
          PUBLIC_REVIEW_LIFECYCLE_STATES.has(config.lifecycleState) &&
          Array.isArray(config.versions) &&
          config.versions.length > 0 &&
          config.versions.every(
            (version) =>
              version !== null &&
              typeof version === "object" &&
              SAFE_VERSION_PATTERN.test(version.version) &&
              PUBLIC_REVIEW_LIFECYCLE_STATES.has(version.lifecycleState) &&
              SOURCE_PIN_PATTERN.test(version.sourceCommit) &&
              hasValidPublicationMetadata(version)
          ) &&
          new Set(config.versions.map((version) => version.version)).size ===
            config.versions.length,
        `${entry.name} is not a valid public-review publication config.`
      );
      return config;
    });
  const referenceIds = discoverReviewConfigs(repoRoot).map(
    (configPath) => readJson(configPath, "public-review source config").reviewId
  );
  const publicationIds = publications.map(
    (publication) => publication.reviewId
  );
  invariant(
    new Set(publicationIds).size === publicationIds.length &&
      JSON.stringify(
        [...publicationIds].sort((left, right) =>
          left.localeCompare(right, "en")
        )
      ) ===
        JSON.stringify(
          [...referenceIds].sort((left, right) =>
            left.localeCompare(right, "en")
          )
        ),
    "Every public-review reference config must have one publication config."
  );
  return publications;
}

function getPublicReviewPublicationPlans(repoRoot) {
  const referenceConfigs = new Map(
    discoverReviewConfigs(repoRoot).map((configPath) => {
      const config = readJson(configPath, "public-review source config");
      return [config.reviewId, { config, configPath }];
    })
  );

  return new Map(
    getPublicReviewPublicationConfigs(repoRoot).map((publication) => {
      const reference = referenceConfigs.get(publication.reviewId);
      invariant(
        reference,
        `${publication.reviewId} has no public-review source config.`
      );
      const retainedVersions = reference.config.output?.retainedVersions;
      invariant(
        Array.isArray(retainedVersions) &&
          retainedVersions.length > 0 &&
          retainedVersions.every((version) =>
            SAFE_VERSION_PATTERN.test(version)
          ) &&
          new Set(retainedVersions).size === retainedVersions.length,
        `${publication.reviewId} retained review versions are invalid.`
      );
      invariant(
        JSON.stringify(
          publication.versions.map((version) => version.version)
        ) === JSON.stringify(retainedVersions),
        `${publication.reviewId} publication versions drifted from retained review versions.`
      );

      const sourceIndex = readJson(
        path.join(
          repoRoot,
          PUBLIC_REVIEW_DATA_DIRECTORY,
          publication.reviewId,
          "index.json"
        ),
        `${publication.reviewId} source review index`
      );
      invariant(
        sourceIndex.reviewId === publication.reviewId &&
          sourceIndex.activeVersion === reference.config.reviewVersion &&
          Array.isArray(sourceIndex.versions) &&
          JSON.stringify(
            sourceIndex.versions.map((version) => version.version)
          ) === JSON.stringify(retainedVersions),
        `${publication.reviewId} source review index drifted from publication config.`
      );
      invariant(
        sourceIndex.versions.every(
          (entry, index) =>
            entry.commit === publication.versions[index].sourceCommit
        ),
        `${publication.reviewId} source review index commits drifted from trusted publication identities.`
      );

      const publishedVersions = new Set(
        publication.versions
          .filter((version) =>
            PUBLIC_REVIEW_PUBLIC_ROUTE_STATES.has(version.lifecycleState)
          )
          .map((version) => version.version)
      );
      const indexActiveVersion = publishedVersions.has(
        reference.config.reviewVersion
      )
        ? reference.config.reviewVersion
        : [...retainedVersions]
            .reverse()
            .find((version) => publishedVersions.has(version));
      const sourceActivePublication = publication.versions.find(
        (version) => version.version === reference.config.reviewVersion
      );
      invariant(
        sourceActivePublication &&
          sourceActivePublication.sourceCommit ===
            reference.config.source.commit,
        `${publication.reviewId} source-active publication identity drifted from source config.`
      );
      if (sourceActivePublication.lifecycleState !== "DRAFT") {
        invariant(
          sourceActivePublication.lifecycleState === publication.lifecycleState,
          `${publication.reviewId} active publication lifecycle drifted.`
        );
      } else if (publication.lifecycleState !== "DRAFT") {
        const fallbackPublication = publication.versions.find(
          (version) => version.version === indexActiveVersion
        );
        invariant(
          fallbackPublication?.lifecycleState === publication.lifecycleState,
          `${publication.reviewId} fallback publication lifecycle drifted.`
        );
      }

      return [
        publication.reviewId,
        {
          configPath: reference.configPath,
          indexActiveVersion,
          publication,
          publishedVersions,
          sourceIndex,
        },
      ];
    })
  );
}

function getPublishedReviewIds(repoRoot) {
  return new Set(
    [...getPublicReviewPublicationPlans(repoRoot).entries()]
      .filter(([, plan]) =>
        PUBLIC_REVIEW_PUBLIC_ROUTE_STATES.has(plan.publication.lifecycleState)
      )
      .map(([reviewId]) => reviewId)
  );
}

function hasPublishedReviewVersions(publicationPlans) {
  return [...publicationPlans.values()].some(
    (plan) => plan.publishedVersions.size > 0
  );
}

function isUnpublishedReviewDataPath(relativePath, publicationPlans) {
  if (relativePath === "review-data") {
    return !hasPublishedReviewVersions(publicationPlans);
  }
  if (!relativePath.startsWith("review-data/")) {
    return false;
  }
  const segments = normalizeRelativePath(relativePath).split("/");
  const plan = publicationPlans.get(segments[1]);
  if (!plan || plan.publishedVersions.size === 0) {
    return true;
  }
  if (segments.length === 2) {
    return false;
  }
  if (segments[2] === "index.json") {
    return segments.length !== 3;
  }
  if (segments[2] !== "versions") {
    return true;
  }
  return segments.length >= 4 && !plan.publishedVersions.has(segments[3]);
}

function isUnpublishedEditorialPath(relativePath, publicationPlans) {
  const segments = normalizeRelativePath(relativePath).split("/");
  const plan = publicationPlans.get(segments[0]);
  if (!plan || plan.publishedVersions.size === 0) {
    return true;
  }
  if (segments.length === 1) {
    return false;
  }
  if (segments[1] !== "versions") {
    return true;
  }
  return segments.length >= 3 && !plan.publishedVersions.has(segments[2]);
}

function isReviewIndexPath(relativePath, publicationPlans) {
  const segments = normalizeRelativePath(relativePath).split("/");
  return (
    segments.length === 3 &&
    segments[0] === "review-data" &&
    publicationPlans.has(segments[1]) &&
    segments[2] === "index.json"
  );
}

function projectPublishedReviewIndex(plan) {
  invariant(
    plan.indexActiveVersion,
    `${plan.publication.reviewId} has no public review version.`
  );
  return {
    ...plan.sourceIndex,
    activeVersion: plan.indexActiveVersion,
    versions: plan.sourceIndex.versions.filter((version) =>
      plan.publishedVersions.has(version.version)
    ),
  };
}

function writePublishedReviewIndexes(bundleRoot, publicationPlans) {
  for (const [reviewId, plan] of publicationPlans) {
    if (plan.publishedVersions.size === 0) {
      continue;
    }
    fs.writeFileSync(
      path.join(
        bundleRoot,
        PUBLIC_REVIEW_DATA_DIRECTORY,
        reviewId,
        "index.json"
      ),
      `${JSON.stringify(projectPublishedReviewIndex(plan), null, 2)}\n`
    );
  }
}

function assertPublishedReviewIndexes(bundleRoot, publicationPlans) {
  for (const [reviewId, plan] of publicationPlans) {
    if (plan.publishedVersions.size === 0) {
      continue;
    }
    const indexPath = path.join(
      bundleRoot,
      PUBLIC_REVIEW_DATA_DIRECTORY,
      reviewId,
      "index.json"
    );
    const expected = `${JSON.stringify(
      projectPublishedReviewIndex(plan),
      null,
      2
    )}\n`;
    invariant(
      fs.readFileSync(indexPath, "utf8") === expected,
      `${reviewId} packaged review index is not the public projection.`
    );
  }
}

function containsSegmentPair(relativePath, first, second) {
  const segments = normalizeRelativePath(relativePath).split("/");
  return segments.some(
    (segment, index) => segment === first && segments[index + 1] === second
  );
}

function assertProductionAbsence(bundleRoot) {
  const forbidden = walkDirectory(bundleRoot, {
    allowSymlinks: true,
    includeDirectories: true,
  })
    .map((entry) => entry.path)
    .filter(
      (relativePath) =>
        containsSegmentPair(relativePath, "public", "review-data") ||
        containsSegmentPair(relativePath, "content", "public-reviews")
    );
  invariant(
    forbidden.length === 0,
    `Production bundle contains public-review evidence: ${forbidden.join(", ")}`
  );
  assertEffectivePathAbsent(
    bundleRoot,
    ["public", "review-data"],
    "Production public review-data"
  );
  assertEffectivePathAbsent(
    bundleRoot,
    ["content", "public-reviews"],
    "Production editorial content"
  );
}

function assertEffectivePathAbsent(root, segments, label) {
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    let stats;
    try {
      stats = fs.lstatSync(current);
    } catch (error) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    invariant(
      !stats.isSymbolicLink(),
      `${label} has a symbolic-link ancestor: ${normalizeRelativePath(current)}`
    );
    if (index === segments.length - 1) {
      throw new Error(
        `${label} must be absent: ${normalizeRelativePath(current)}`
      );
    }
    invariant(
      stats.isDirectory(),
      `${label} has a non-directory ancestor: ${normalizeRelativePath(current)}`
    );
  }
}

function readJson(filePath, label) {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Unable to read ${label} at ${normalizeRelativePath(filePath)}: ${error.message}`
    );
  }
  invariant(
    value !== null && typeof value === "object" && !Array.isArray(value),
    `${label} must be a JSON object.`
  );
  return value;
}

function publicPathToRelative(value, expectedPrefix, label) {
  invariant(
    typeof value === "string" && value.startsWith(`${expectedPrefix}/`),
    `${label} is outside ${expectedPrefix}.`
  );
  const relativePath = value.slice(expectedPrefix.length + 1);
  invariant(
    relativePath.length > 0 &&
      !relativePath.split("/").some((segment) => segment === ".."),
    `${label} is not a safe relative path.`
  );
  return relativePath;
}

function assertExactFileSet(directory, expectedRelativePaths, label) {
  const actual = walkDirectory(directory).map((entry) => entry.path);
  const expected = [...expectedRelativePaths].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} file set does not match its manifest.`
  );
}

function assertExactChildDirectories(directory, expectedNames, label) {
  const entries = sortedDirectoryEntries(directory);
  invariant(
    entries.every((entry) => entry.isDirectory()),
    `${label} may contain only review directories.`
  );
  const actual = entries.map((entry) => entry.name);
  const expected = [...expectedNames].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} directory set does not match the configured reviews.`
  );
}

function assertSourceFiles(bundle, versionRoot) {
  invariant(Array.isArray(bundle.files), "Reference bundle files are missing.");
  invariant(
    bundle.summary?.fileCount === bundle.files.length,
    "Reference bundle source-file summary is inconsistent."
  );

  const publicPrefix = `/review-data/${bundle.reviewId}/versions/${bundle.reviewVersion}/sources`;
  const sourceRoot = path.join(versionRoot, "sources");
  const expectedPaths = [];
  const seen = new Set();

  for (const file of bundle.files) {
    invariant(
      typeof file.path === "string" &&
        file.path.length > 0 &&
        !seen.has(file.path),
      "Reference bundle contains an invalid or duplicate source path."
    );
    seen.add(file.path);
    const relativePath = publicPathToRelative(
      file.publicPath,
      publicPrefix,
      `${file.path} public source path`
    );
    invariant(
      relativePath === file.path,
      `${file.path} public source path does not preserve source identity.`
    );
    invariant(
      SHA256_URN_PATTERN.test(file.sha256),
      `${file.path} source checksum is invalid.`
    );

    const sourcePath = resolveContainedPath(
      sourceRoot,
      relativePath,
      `${file.path} packaged source`
    );
    invariant(
      fs.statSync(sourcePath).isFile(),
      `${file.path} source is missing.`
    );
    invariant(
      sha256File(sourcePath) === file.sha256,
      `${file.path} packaged source checksum drifted.`
    );
    invariant(
      fs.statSync(sourcePath).size === file.byteLength,
      `${file.path} packaged source byte length drifted.`
    );
    expectedPaths.push(relativePath);
  }

  assertExactFileSet(sourceRoot, expectedPaths, "Packaged source");
}

function assertDefinitionShards(bundle, versionRoot) {
  invariant(
    Array.isArray(bundle.definitionIndex),
    "Reference bundle definition index is missing."
  );
  invariant(
    bundle.summary?.definitionCount === bundle.definitionIndex.length,
    "Reference bundle definition summary is inconsistent."
  );

  const publicPrefix = `/review-data/${bundle.reviewId}/versions/${bundle.reviewVersion}/definitions`;
  const definitionsRoot = path.join(versionRoot, "definitions");
  const expectedPaths = [];
  const seen = new Set();

  for (const definition of bundle.definitionIndex) {
    invariant(
      typeof definition.id === "string" &&
        definition.id.length > 0 &&
        !seen.has(definition.id),
      "Reference bundle contains an invalid or duplicate definition identity."
    );
    seen.add(definition.id);
    invariant(
      SHA256_URN_PATTERN.test(definition.shardSha256),
      `${definition.id} definition checksum is invalid.`
    );
    const relativePath = publicPathToRelative(
      definition.shardPath,
      publicPrefix,
      `${definition.id} definition shard path`
    );
    const shardPath = resolveContainedPath(
      definitionsRoot,
      relativePath,
      `${definition.id} packaged definition shard`
    );
    invariant(
      fs.statSync(shardPath).isFile(),
      `${definition.id} definition shard is missing.`
    );
    invariant(
      sha256File(shardPath) === definition.shardSha256,
      `${definition.id} definition shard checksum drifted.`
    );
    const shard = readJson(shardPath, `${definition.id} definition shard`);
    invariant(
      shard.definition?.id === definition.id,
      `${definition.id} definition shard identity drifted.`
    );
    expectedPaths.push(relativePath);
  }

  assertExactFileSet(
    definitionsRoot,
    expectedPaths,
    "Packaged definition shard"
  );
}

function assertCanonicalReviewEvidence({
  repoRoot,
  bundlePublicRoot,
  configPath,
  publicationPlan,
}) {
  const configText = fs.readFileSync(configPath, "utf8");
  const config = readJson(configPath, "public-review source config");
  invariant(
    SAFE_ID_PATTERN.test(config.reviewId),
    "Public-review config reviewId is invalid."
  );
  invariant(
    SAFE_VERSION_PATTERN.test(config.reviewVersion),
    "Public-review config reviewVersion is invalid."
  );
  invariant(
    SOURCE_PIN_PATTERN.test(config.source?.commit) &&
      SOURCE_PIN_PATTERN.test(config.source?.tree),
    "Public-review config source pins are invalid."
  );
  invariant(
    SOURCE_REPOSITORY_PATTERN.test(config.source?.repository),
    "Public-review config source repository is invalid."
  );

  const expectedDirectory = `public/review-data/${config.reviewId}/versions/${config.reviewVersion}`;
  const expectedIndex = `public/review-data/${config.reviewId}/index.json`;
  invariant(
    config.output?.directory === expectedDirectory &&
      config.output?.indexFile === expectedIndex &&
      config.output?.bundleFile === "reference-manifest.json" &&
      config.output?.definitionsDirectory === "definitions" &&
      config.output?.sourcesDirectory === "sources",
    `${config.reviewId} output paths are not canonical.`
  );

  invariant(
    publicationPlan?.publication.reviewId === config.reviewId,
    `${config.reviewId} publication plan is missing.`
  );
  const index = publicationPlan.sourceIndex;
  invariant(
    index.reviewId === config.reviewId &&
      index.activeVersion === config.reviewVersion &&
      Array.isArray(index.versions),
    `${config.reviewId} review index identity drifted.`
  );
  invariant(
    Array.isArray(config.output.retainedVersions) &&
      JSON.stringify(index.versions.map((entry) => entry.version)) ===
        JSON.stringify(config.output.retainedVersions),
    `${config.reviewId} retained review versions drifted.`
  );
  const activeEntries = index.versions.filter(
    (entry) => entry.version === config.reviewVersion
  );
  invariant(
    activeEntries.length === 1,
    `${config.reviewId} review index must contain one active version.`
  );
  const activeEntry = activeEntries[0];
  invariant(
    activeEntry.commit === config.source.commit &&
      activeEntry.tree === config.source.tree,
    `${config.reviewId} review index source pin drifted.`
  );

  const reviewRoot = path.join(
    bundlePublicRoot,
    "review-data",
    config.reviewId
  );
  return index.versions
    .filter((entry) => publicationPlan.publishedVersions.has(entry.version))
    .map((entry) => {
      invariant(
        SAFE_VERSION_PATTERN.test(entry.version) &&
          SOURCE_PIN_PATTERN.test(entry.commit) &&
          SOURCE_PIN_PATTERN.test(entry.tree) &&
          SHA256_URN_PATTERN.test(entry.bundleSha256),
        `${config.reviewId}@${entry.version} review index entry is invalid.`
      );
      const versionRoot = path.join(reviewRoot, "versions", entry.version);
      const bundlePath = path.join(versionRoot, config.output.bundleFile);
      const expectedBundlePath = `/review-data/${config.reviewId}/versions/${entry.version}/${config.output.bundleFile}`;
      invariant(
        entry.bundlePath === expectedBundlePath,
        `${config.reviewId}@${entry.version} review bundle path drifted.`
      );
      const bundle = readJson(
        bundlePath,
        `${config.reviewId}@${entry.version} reference bundle`
      );
      invariant(
        bundle.reviewId === config.reviewId &&
          bundle.reviewVersion === entry.version &&
          bundle.source?.repository === config.source.repository &&
          bundle.source?.commit === entry.commit &&
          bundle.source?.tree === entry.tree,
        `${config.reviewId}@${entry.version} reference bundle identity drifted.`
      );
      if (entry.version === config.reviewVersion) {
        invariant(
          bundle.generator?.configSha256 === configSha256(configText),
          `${config.reviewId} reference bundle config checksum drifted.`
        );
        invariant(
          bundle.generator?.sourceSha256 === generatorSourceSha256(),
          `${config.reviewId} reference bundle generator checksum drifted.`
        );
      } else {
        invariant(
          SHA256_URN_PATTERN.test(bundle.generator?.configSha256) &&
            SHA256_URN_PATTERN.test(bundle.generator?.sourceSha256),
          `${config.reviewId}@${entry.version} historical generator provenance is invalid.`
        );
      }
      invariant(
        bundle.generator?.outputSha256 === bundleOutputSha256(bundle) &&
          bundle.generator.outputSha256 === entry.bundleSha256,
        `${config.reviewId}@${entry.version} reference bundle semantic checksum drifted.`
      );

      assertSourceFiles(bundle, versionRoot);
      assertDefinitionShards(bundle, versionRoot);
      const sourceKnowledgeRoot = path.join(
        repoRoot,
        KNOWLEDGE_SOURCE_DIRECTORY,
        config.reviewId,
        "versions",
        entry.version,
        "knowledge"
      );
      const bundleKnowledgeRoot = path.join(versionRoot, "knowledge");
      // Validate bytes from the packaged tree while comparing them with the
      // canonical source pack rooted in the checkout.
      validateKnowledgePack({
        repoRoot: path.dirname(bundlePublicRoot),
        reviewId: config.reviewId,
        reviewVersion: entry.version,
        requireCurrentGenerator: entry.version === config.reviewVersion,
        publicationOverride: publicationPlan.publication.versions.find(
          (version) => version.version === entry.version
        ),
        referenceIndexEntryOverride: entry,
        knowledgeRootOverride: bundleKnowledgeRoot,
      });
      invariant(
        directoryIdentity(sourceKnowledgeRoot) ===
          directoryIdentity(bundleKnowledgeRoot),
        `${config.reviewId}@${entry.version} packaged knowledge does not exactly match the canonical source pack.`
      );

      return {
        reviewId: config.reviewId,
        reviewVersion: entry.version,
        sourceCommit: entry.commit,
        sourceRepository: config.source.repository,
        sourceTree: entry.tree,
        bundleSha256: bundle.generator.outputSha256,
      };
    });
}

function discoverReviewConfigs(repoRoot) {
  const directory = path.join(repoRoot, PUBLIC_REVIEW_CONFIG_DIRECTORY);
  invariant(
    fs.existsSync(directory),
    "Public-review config directory is missing."
  );
  const configs = sortedDirectoryEntries(directory)
    .filter((entry) => entry.isFile() && entry.name.endsWith(".reference.json"))
    .map((entry) => path.join(directory, entry.name));
  invariant(configs.length > 0, "No public-review source configs were found.");
  return configs;
}

function assertEditorialEvidence({ bundleRoot, review }) {
  const editorialRoot = path.join(
    bundleRoot,
    PUBLIC_REVIEW_EDITORIAL_DIRECTORY,
    review.reviewId,
    "versions",
    review.reviewVersion,
    "editorial"
  );
  const manifest = readJson(
    path.join(editorialRoot, "manifest.json"),
    `${review.reviewId} editorial manifest`
  );
  invariant(
    manifest.schema_version === 1 &&
      manifest.review_id === review.reviewId &&
      manifest.review_version === review.reviewVersion &&
      manifest.source_commit === review.sourceCommit &&
      manifest.source_repository ===
        `https://github.com/${review.sourceRepository}`,
    `${review.reviewId} editorial manifest identity drifted.`
  );
  invariant(
    Array.isArray(manifest.pages) && manifest.pages.length > 0,
    `${review.reviewId} editorial manifest has no pages.`
  );

  const expectedFiles = ["manifest.json"];
  const pageIds = new Set();
  for (const page of manifest.pages) {
    invariant(
      SAFE_ID_PATTERN.test(page.id) && !pageIds.has(page.id),
      `${review.reviewId} editorial page identity is invalid or duplicated.`
    );
    pageIds.add(page.id);
    invariant(
      typeof page.title === "string" && page.title.trim().length > 0,
      `${review.reviewId} editorial page title is missing.`
    );
    invariant(
      typeof page.file === "string" &&
        page.file === `${page.id}.md` &&
        path.basename(page.file) === page.file,
      `${review.reviewId} editorial page file is not canonical.`
    );
    const pagePath = path.join(editorialRoot, page.file);
    invariant(
      fs.statSync(pagePath).isFile() && fs.statSync(pagePath).size > 0,
      `${review.reviewId} editorial page ${page.id} is empty or missing.`
    );
    expectedFiles.push(page.file);
  }
  assertExactFileSet(
    editorialRoot,
    expectedFiles,
    `${review.reviewId} editorial`
  );

  return directoryIdentity(editorialRoot);
}

function assertStagingEvidence(
  repoRoot,
  bundleRoot,
  publicationPlans = getPublicReviewPublicationPlans(repoRoot)
) {
  const sourcePublicReviewRoot = path.join(
    repoRoot,
    PUBLIC_REVIEW_DATA_DIRECTORY
  );
  const bundlePublicReviewRoot = path.join(
    bundleRoot,
    PUBLIC_REVIEW_DATA_DIRECTORY
  );
  invariant(
    directoryIdentity(sourcePublicReviewRoot, {
      ignore: (relativePath) => {
        const publicRelativePath = `review-data/${relativePath}`;
        return (
          isReviewIndexPath(publicRelativePath, publicationPlans) ||
          isUnpublishedReviewDataPath(publicRelativePath, publicationPlans) ||
          isKnowledgeProjectionPath(publicRelativePath)
        );
      },
    }) ===
      directoryIdentity(bundlePublicReviewRoot, {
        ignore: (relativePath) => {
          const publicRelativePath = `review-data/${relativePath}`;
          return (
            isReviewIndexPath(publicRelativePath, publicationPlans) ||
            isKnowledgeProjectionPath(publicRelativePath)
          );
        },
      }),
    "Staging public-review data does not exactly match the trusted source tree."
  );
  assertPublishedReviewIndexes(bundleRoot, publicationPlans);

  const sourceEditorialRoot = path.join(
    repoRoot,
    PUBLIC_REVIEW_EDITORIAL_DIRECTORY
  );
  const bundleEditorialRoot = path.join(
    bundleRoot,
    PUBLIC_REVIEW_EDITORIAL_DIRECTORY
  );
  invariant(
    directoryIdentity(sourceEditorialRoot, {
      ignore: (relativePath) =>
        isUnpublishedEditorialPath(relativePath, publicationPlans),
    }) === directoryIdentity(bundleEditorialRoot),
    "Staging editorial content does not exactly match the trusted source tree."
  );

  const reviews = [...publicationPlans.values()].flatMap((plan) =>
    plan.publishedVersions.size > 0
      ? assertCanonicalReviewEvidence({
          repoRoot,
          bundlePublicRoot: path.join(bundleRoot, "public"),
          configPath: plan.configPath,
          publicationPlan: plan,
        })
      : []
  );
  const reviewIds = [...publicationPlans.entries()]
    .filter(([, plan]) => plan.publishedVersions.size > 0)
    .map(([reviewId]) => reviewId);
  if (reviewIds.length === 0) {
    invariant(
      !fs.existsSync(bundlePublicReviewRoot) &&
        !fs.existsSync(bundleEditorialRoot),
      "Draft public-review evidence must be absent from staging."
    );
  } else {
    assertExactChildDirectories(
      bundlePublicReviewRoot,
      reviewIds,
      "Staging public-review data"
    );
    assertExactChildDirectories(
      bundleEditorialRoot,
      reviewIds,
      "Staging editorial content"
    );
  }

  return reviews.map((review) => ({
    ...review,
    editorialSha256: `sha256:${assertEditorialEvidence({
      bundleRoot,
      review,
    })}`,
  }));
}

function assertPublicCopyIdentity(
  repoRoot,
  bundleRoot,
  profile,
  publicationPlans = getPublicReviewPublicationPlans(repoRoot)
) {
  const sourcePublic = path.join(repoRoot, "public");
  const bundlePublic = path.join(bundleRoot, "public");
  const options = {
    ignore: (relativePath) => {
      if (profile === "production") {
        return isReviewDataPath(relativePath);
      }
      return (
        isReviewIndexPath(relativePath, publicationPlans) ||
        isUnpublishedReviewDataPath(relativePath, publicationPlans) ||
        isKnowledgeProjectionPath(relativePath)
      );
    },
  };
  invariant(
    directoryIdentity(sourcePublic, options) ===
      directoryIdentity(bundlePublic, options),
    `${profile} public directory does not match its profile-aware source set.`
  );
}

function assertProductionRuntimeConfig(bundleRoot) {
  const runtimeConfigPath = path.join(bundleRoot, RUNTIME_CONFIG_PATH);
  invariant(
    fs.existsSync(runtimeConfigPath) && fs.statSync(runtimeConfigPath).isFile(),
    `Production bundle is missing ${RUNTIME_CONFIG_PATH}.`
  );

  let runtimeConfig;
  try {
    runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8"));
  } catch {
    throw new Error(
      `Production bundle contains invalid JSON at ${RUNTIME_CONFIG_PATH}.`
    );
  }

  invariant(
    runtimeConfig &&
      typeof runtimeConfig === "object" &&
      !Array.isArray(runtimeConfig),
    `Production bundle contains a non-object ${RUNTIME_CONFIG_PATH}.`
  );
  invariant(
    runtimeConfig.BASE_ENDPOINT === PRODUCTION_BASE_ENDPOINT,
    `Production bundle BASE_ENDPOINT must equal ${PRODUCTION_BASE_ENDPOINT}.`
  );
  invariant(
    typeof runtimeConfig.GIPHY_API_KEY === "string" &&
      runtimeConfig.GIPHY_API_KEY.trim().length > 0,
    "Production bundle GIPHY_API_KEY must be configured."
  );
}

function assertProfileBundle({
  repoRoot,
  bundleRoot,
  profile,
  publicationPlans = getPublicReviewPublicationPlans(repoRoot),
}) {
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  invariant(fs.statSync(bundleRoot).isDirectory(), "Bundle root is missing.");
  assertPublicCopyIdentity(repoRoot, bundleRoot, profile, publicationPlans);

  if (profile === "production") {
    assertProductionAbsence(bundleRoot);
    assertProductionRuntimeConfig(bundleRoot);
    return [];
  }
  return assertStagingEvidence(repoRoot, bundleRoot, publicationPlans);
}

function removeDirectoryIfPresent(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }
  const stats = fs.lstatSync(directory);
  invariant(
    !stats.isSymbolicLink() && stats.isDirectory(),
    `Refusing to remove non-directory or symbolic-link destination: ${normalizeRelativePath(directory)}`
  );
  fs.rmSync(directory, { recursive: true });
}

function copyPublishedKnowledgePacks(repoRoot, bundleRoot, publicationPlans) {
  for (const [reviewId, plan] of publicationPlans) {
    for (const reviewVersion of plan.publishedVersions) {
      const source = path.join(
        repoRoot,
        KNOWLEDGE_SOURCE_DIRECTORY,
        reviewId,
        "versions",
        reviewVersion,
        "knowledge"
      );
      invariant(
        fs.existsSync(source),
        `${reviewId}@${reviewVersion} knowledge pack is missing; run 6529 run public-review:knowledge.`
      );
      const destination = path.join(
        bundleRoot,
        PUBLIC_REVIEW_DATA_DIRECTORY,
        reviewId,
        "versions",
        reviewVersion,
        "knowledge"
      );
      copyDirectory(source, destination);
    }
  }
}

function prepareProfileBundle({ repoRoot, bundleRoot, profile }) {
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  const sourceIdentity = captureSourceIdentity(repoRoot);
  const sourcePublic = path.join(repoRoot, "public");
  const bundlePublic = path.join(bundleRoot, "public");
  const publicationPlans = getPublicReviewPublicationPlans(repoRoot);
  replaceDirectory(sourcePublic, bundlePublic, {
    ignore: (relativePath) =>
      profile === "production"
        ? isReviewDataPath(relativePath)
        : isUnpublishedReviewDataPath(relativePath, publicationPlans),
  });
  if (profile === "staging") {
    writePublishedReviewIndexes(bundleRoot, publicationPlans);
    copyPublishedKnowledgePacks(repoRoot, bundleRoot, publicationPlans);
  }

  if (profile === "staging") {
    const sourceEditorial = path.join(
      repoRoot,
      PUBLIC_REVIEW_EDITORIAL_DIRECTORY
    );
    const bundleEditorial = path.join(
      bundleRoot,
      PUBLIC_REVIEW_EDITORIAL_DIRECTORY
    );
    if (hasPublishedReviewVersions(publicationPlans)) {
      replaceDirectory(sourceEditorial, bundleEditorial, {
        ignore: (relativePath) =>
          isUnpublishedEditorialPath(relativePath, publicationPlans),
      });
    } else {
      removeDirectoryIfPresent(bundleEditorial);
    }
  }

  const reviews = assertProfileBundle({
    repoRoot,
    bundleRoot,
    profile,
    publicationPlans,
  });
  assertSourceIdentityUnchanged(repoRoot, sourceIdentity);
  return reviews;
}

function parseZipListing(listingText) {
  const entries = [];
  const seen = new Set();
  for (const rawLine of listingText.split(/\r?\n/)) {
    if (rawLine.length === 0) {
      continue;
    }
    const normalized = rawLine.startsWith("./") ? rawLine.slice(2) : rawLine;
    if (normalized.length === 0 && rawLine === "./") {
      continue;
    }
    invariant(
      normalized.length > 0 &&
        !normalized.startsWith("/") &&
        !normalized.includes("\\") &&
        !normalized.split("/").some((segment) => segment === ".."),
      `Zip listing contains an unsafe path: ${rawLine}`
    );
    if (normalized.endsWith("/")) {
      continue;
    }
    invariant(!seen.has(normalized), `Zip listing duplicates ${normalized}.`);
    seen.add(normalized);
    entries.push(normalized);
  }
  return entries.sort((left, right) => left.localeCompare(right, "en"));
}

function expectedBundleEntries(bundleRoot) {
  return walkDirectory(bundleRoot, { allowSymlinks: true })
    .map((entry) => entry.path)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function assertExtractedArchive(bundleRoot, extractedRoot) {
  const options = { allowSymlinks: true, includeDirectories: true };
  invariant(
    directoryIdentity(bundleRoot, options) ===
      directoryIdentity(extractedRoot, options),
    "Extracted package.zip bytes do not exactly match the verified bundle."
  );
}

function assertListingMatchesBundle(bundleRoot, listingFile) {
  const actual = parseZipListing(fs.readFileSync(listingFile, "utf8"));
  const expected = expectedBundleEntries(bundleRoot);
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    "Final package.zip file listing does not exactly match the verified bundle."
  );
}

function assertZipListingSafety({
  repoRoot,
  bundleRoot,
  profile,
  listingFile,
}) {
  const reviews = assertProfileBundle({ repoRoot, bundleRoot, profile });
  assertListingMatchesBundle(bundleRoot, listingFile);
  return reviews;
}

function assertZipListing({
  repoRoot,
  bundleRoot,
  profile,
  listingFile,
  extractedRoot,
}) {
  const reviews = assertProfileBundle({ repoRoot, bundleRoot, profile });
  assertListingMatchesBundle(bundleRoot, listingFile);
  assertProfileBundle({
    repoRoot,
    bundleRoot: extractedRoot,
    profile,
  });
  assertExtractedArchive(bundleRoot, extractedRoot);
  return reviews;
}

function parseCli(argv) {
  const [command, ...tokens] = argv;
  invariant(
    ["prepare", "assert-listing", "assert-zip"].includes(command),
    "Usage: package-public-review-artifacts.cjs <prepare|assert-listing|assert-zip> --profile <production|staging> --bundle-root <path> [--listing-file <path>] [--extracted-root <path>] [--repo-root <path>]"
  );
  invariant(tokens.length % 2 === 0, "CLI options must be key-value pairs.");

  const options = new Map();
  for (let index = 0; index < tokens.length; index += 2) {
    const key = tokens[index];
    const value = tokens[index + 1];
    invariant(
      [
        "--profile",
        "--bundle-root",
        "--listing-file",
        "--extracted-root",
        "--repo-root",
      ].includes(key),
      `Unknown option: ${key}`
    );
    invariant(!options.has(key), `Duplicate option: ${key}`);
    invariant(value && !value.startsWith("--"), `Missing value for ${key}.`);
    options.set(key, value);
  }

  const profile = options.get("--profile");
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  const repoRoot = path.resolve(options.get("--repo-root") ?? process.cwd());
  const bundleValue = options.get("--bundle-root");
  invariant(bundleValue, "--bundle-root is required.");
  const bundleRoot = resolveContainedPath(repoRoot, bundleValue, "Bundle root");
  const listingValue = options.get("--listing-file");
  const extractedValue = options.get("--extracted-root");
  if (command === "prepare") {
    invariant(
      !listingValue && !extractedValue,
      "--listing-file and --extracted-root are valid only for assertions."
    );
  } else if (command === "assert-listing") {
    invariant(
      Boolean(listingValue) && !extractedValue,
      "--listing-file is required and --extracted-root is invalid for assert-listing."
    );
  } else {
    invariant(
      Boolean(listingValue) && Boolean(extractedValue),
      "--listing-file and --extracted-root are required for assert-zip."
    );
  }
  return {
    command,
    repoRoot,
    bundleRoot,
    profile,
    listingFile: listingValue ? path.resolve(listingValue) : undefined,
    extractedRoot: extractedValue ? path.resolve(extractedValue) : undefined,
  };
}

function main(argv = process.argv.slice(2)) {
  const options = parseCli(argv);
  let reviews;
  if (options.command === "prepare") {
    reviews = prepareProfileBundle(options);
  } else if (options.command === "assert-listing") {
    reviews = assertZipListingSafety(options);
  } else {
    reviews = assertZipListing(options);
  }
  const detail =
    reviews.length === 0
      ? "public-review evidence absent"
      : reviews
          .map(
            (review) =>
              `${review.reviewId}@${review.reviewVersion} ${review.bundleSha256}`
          )
          .join(", ");
  process.stdout.write(
    `Verified ${options.profile} artifact profile: ${detail}.\n`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  assertCanonicalReviewEvidence,
  assertExtractedArchive,
  assertListingMatchesBundle,
  assertProfileBundle,
  assertZipListing,
  assertZipListingSafety,
  captureSourceIdentity,
  directoryIdentity,
  expectedBundleEntries,
  getPublishedReviewIds,
  hasValidPublicationMetadata,
  main,
  parseCli,
  parseZipListing,
  prepareProfileBundle,
};
