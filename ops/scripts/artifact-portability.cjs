#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");
const { parseArgs } = require("./cli-args.cjs");
const {
  BAKED_INPUTS,
  COMPARISON_SCHEMA_VERSION,
  CONTRACT,
  GIT_SHA_PATTERN,
  HEX_SHA256_PATTERN,
  KNOWN_RUNTIME_KEYS,
  PROVENANCE_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TRUSTED_REPORT_PRODUCERS,
  validateInventory,
  verifyReportRun,
  verifyReportSource,
} = require("./artifact-portability-contract.cjs");

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compareStrings(left, right) {
  return left.localeCompare(right, "en");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort(compareStrings)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digestJson(value) {
  return sha256(Buffer.from(canonicalize(value), "utf8"));
}

function assertRegularFile(filePath, label) {
  let stats;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit evidence path.
    stats = fs.lstatSync(filePath);
  } catch {
    throw new Error(`${label} is missing: ${filePath}`);
  }
  invariant(stats.isFile(), `${label} must be a regular file: ${filePath}`);
}

function assertDirectory(directoryPath, label) {
  let stats;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit extracted-package path.
    stats = fs.lstatSync(directoryPath);
  } catch {
    throw new Error(`${label} is missing: ${directoryPath}`);
  }
  invariant(
    stats.isDirectory() && !stats.isSymbolicLink(),
    `${label} must be a real directory: ${directoryPath}`
  );
}

function readJsonFile(filePath, label) {
  assertRegularFile(filePath, label);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit evidence path.
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function sha256File(filePath, label) {
  assertRegularFile(filePath, label);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit evidence path.
  return sha256(fs.readFileSync(filePath));
}

function decodeUtf8(buffer, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
}

function isPathWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function validateContainedPackageSymlink(root, realRoot, absolutePath) {
  let linkTargetBytes;
  let realTarget;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path is a directory entry from the closed extracted-package walk.
    linkTargetBytes = fs.readlinkSync(absolutePath, { encoding: "buffer" });
  } catch (error) {
    throw new Error(
      `Cannot read extracted-package symbolic link: ${absolutePath}: ${error.message}`
    );
  }
  const linkTarget = decodeUtf8(
    linkTargetBytes,
    `Extracted package symbolic link target: ${absolutePath}`
  );
  invariant(
    !path.isAbsolute(linkTarget),
    `Extracted package contains an absolute symbolic link: ${absolutePath}`
  );
  let lexicalRoot;
  if (isPathWithin(root, absolutePath)) {
    lexicalRoot = root;
  } else if (isPathWithin(realRoot, absolutePath)) {
    lexicalRoot = realRoot;
  }
  const lexicalTarget = path.resolve(path.dirname(absolutePath), linkTarget);
  invariant(
    lexicalRoot !== undefined && isPathWithin(lexicalRoot, lexicalTarget),
    `Extracted package symbolic link lexically escapes its root: ${absolutePath}`
  );
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path is a directory entry from the closed extracted-package walk.
    realTarget = fs.realpathSync(absolutePath);
  } catch (error) {
    throw new Error(
      `Extracted package symbolic link target is unavailable: ${absolutePath}: ${error.message}`
    );
  }

  invariant(
    isPathWithin(realRoot, realTarget),
    `Extracted package symbolic link escapes its root: ${absolutePath}`
  );
  let targetStats;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- realTarget was resolved and proven contained above.
    targetStats = fs.statSync(realTarget);
  } catch (error) {
    throw new Error(
      `Extracted package symbolic link target is unavailable: ${absolutePath}: ${error.message}`
    );
  }
  invariant(
    targetStats.isFile() || targetStats.isDirectory(),
    `Extracted package symbolic link has an unsupported target: ${absolutePath}`
  );
  return {
    linkTarget,
    linkTargetSha256: sha256(linkTargetBytes),
    realTarget,
    targetType: targetStats.isDirectory() ? "directory" : "file",
  };
}

function walkContainedPackageSymlink({
  root,
  realRoot,
  relativePath,
  absolutePath,
  options,
  ancestorRealDirectories,
}) {
  const symlink = validateContainedPackageSymlink(
    root,
    realRoot,
    absolutePath
  );
  const normalizedPath = relativePath.replaceAll(path.sep, "/");
  const symlinkEntry = {
    path: normalizedPath,
    symlink_target: symlink.linkTarget.replaceAll(path.sep, "/"),
    symlink_target_sha256: symlink.linkTargetSha256,
    target_path: path
      .relative(realRoot, symlink.realTarget)
      .replaceAll(path.sep, "/"),
    target_type: symlink.targetType,
  };
  if (symlink.targetType === "file") {
    symlinkEntry.target_sha256 = sha256File(
      symlink.realTarget,
      "contained symbolic-link target"
    );
    return {
      entries: [symlinkEntry],
      scanFiles: [{ path: normalizedPath, realPath: symlink.realTarget }],
    };
  }

  const walked = walkDirectory(root, relativePath, {
    ...options,
    realRoot,
    physicalDirectory: symlink.realTarget,
    ancestorRealDirectories,
  });
  return {
    entries: [symlinkEntry, ...walked.entries],
    scanFiles: walked.scanFiles,
  };
}

function walkDirectory(root, relativeDirectory = "", options = {}) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Content roots and extracted package roots are asserted operator inputs.
  const realRoot = options.realRoot || fs.realpathSync(root);
  const entries = [];
  const scanFiles = [];
  const absoluteDirectory =
    options.physicalDirectory || path.join(root, relativeDirectory);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The directory is either below the asserted root or a validated contained link target.
  const realDirectory = fs.realpathSync(absoluteDirectory);
  assertRealPathWithin(realRoot, realDirectory, "walked directory");
  const ancestorRealDirectories = options.ancestorRealDirectories || new Set();
  invariant(
    !ancestorRealDirectories.has(realDirectory),
    `Extracted package symbolic-link cycle reaches: ${absoluteDirectory}`
  );
  const nextAncestors = new Set(ancestorRealDirectories);
  nextAncestors.add(realDirectory);
  let children;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Content roots are validated operator inputs.
    children = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, "en"));
  } catch (error) {
    throw new Error(`Cannot read content root ${root}: ${error.message}`);
  }

  for (const child of children) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${child.name}`
      : child.name;
    const absolutePath = path.join(absoluteDirectory, child.name);
    if (child.isDirectory()) {
      const walked = walkDirectory(root, relativePath, {
        ...options,
        realRoot,
        physicalDirectory: absolutePath,
        ancestorRealDirectories: nextAncestors,
      });
      entries.push(...walked.entries);
      scanFiles.push(...walked.scanFiles);
    } else if (child.isFile()) {
      const normalizedPath = relativePath.replaceAll(path.sep, "/");
      entries.push({
        path: normalizedPath,
        sha256: sha256File(absolutePath, "content file"),
      });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The file is a regular entry under the asserted or validated contained directory.
      const realPath = fs.realpathSync(absolutePath);
      assertRealPathWithin(realRoot, realPath, "scanned file");
      scanFiles.push({ path: normalizedPath, realPath });
    } else if (child.isSymbolicLink() && options.allowContainedSymlinks) {
      const walked = walkContainedPackageSymlink({
        root,
        realRoot,
        relativePath,
        absolutePath,
        options,
        ancestorRealDirectories: nextAncestors,
      });
      entries.push(...walked.entries);
      scanFiles.push(...walked.scanFiles);
    } else {
      throw new Error(
        `Content root contains an unsupported entry: ${absolutePath}`
      );
    }
  }

  return { entries, scanFiles };
}

function assertRealPathWithin(root, candidate, label) {
  invariant(
    isPathWithin(root, candidate),
    `${label} escapes source root through a symlink`
  );
}

function packageLiteralPatterns(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  const serialized = JSON.stringify(value);
  const raw = typeof value === "string" ? value : serialized;
  return [...new Set([raw, serialized])]
    .filter(
      (candidate) => typeof candidate === "string" && candidate.length > 0
    )
    .map((candidate) => Buffer.from(candidate, "utf8"));
}

function scanExtractedPackage(extractedRoot, baked) {
  const root = path.resolve(extractedRoot);
  assertDirectory(root, "extracted package root");
  const matchesByName = new Map(
    baked.entries.map((entry) => [entry.name, new Set()])
  );
  const patternsByName = new Map(
    baked.entries.map((entry) => [
      entry.name,
      packageLiteralPatterns(baked.values.get(entry.name)),
    ])
  );
  const walked = walkDirectory(root, "", {
    allowContainedSymlinks: true,
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The extracted root is an asserted real directory supplied by the operator.
    realRoot: fs.realpathSync(root),
  });
  const treeEntries = walked.entries;
  const files = walked.scanFiles;
  const canonicalFiles = new Map();
  let totalBytes = 0;

  for (const file of files) {
    let canonicalFile = canonicalFiles.get(file.realPath);
    if (!canonicalFile) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Every real path is a contained regular file returned by the closed directory walk.
      const bytes = fs.readFileSync(file.realPath);
      const matchedNames = [];
      totalBytes += bytes.length;
      for (const [name, patterns] of patternsByName) {
        if (patterns.some((pattern) => bytes.includes(pattern))) {
          matchedNames.push(name);
        }
      }
      canonicalFile = { matchedNames };
      canonicalFiles.set(file.realPath, canonicalFile);
    }
    for (const name of canonicalFile.matchedNames) {
      matchesByName.get(name).add(file.path);
    }
  }

  const inputs = baked.entries.map((entry) => {
    const matchedPaths = [...matchesByName.get(entry.name)].sort(
      compareStrings
    );
    return {
      name: entry.name,
      present: entry.present,
      value_sha256: entry.value_sha256,
      matched: matchedPaths.length > 0,
      matched_file_count: matchedPaths.length,
      matched_paths_sha256: digestJson(matchedPaths),
      sample_paths: matchedPaths.slice(0, 20),
    };
  });

  return {
    root_name: path.basename(root),
    scan_mode: "all_regular_files_exact_utf8_and_json_literals",
    scan_complete: true,
    tree_sha256: digestJson(treeEntries),
    file_count: canonicalFiles.size,
    total_bytes: totalBytes,
    input_count: inputs.length,
    present_input_count: inputs.filter((input) => input.present).length,
    matched_input_count: inputs.filter((input) => input.matched).length,
    inputs,
  };
}

function digestContentRoots(sourceRoot, contentRoots) {
  const resolvedSourceRoot = path.resolve(sourceRoot);
  assertDirectory(resolvedSourceRoot, "source root");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The source root is a validated real directory before canonicalization.
  const realSourceRoot = fs.realpathSync(resolvedSourceRoot);
  const roots = contentRoots.map((relativeRoot) => {
    const normalizedRoot = relativeRoot.replaceAll("\\", "/");
    const absoluteRoot = path.resolve(resolvedSourceRoot, normalizedRoot);
    invariant(
      absoluteRoot === resolvedSourceRoot ||
        absoluteRoot.startsWith(`${resolvedSourceRoot}${path.sep}`),
      `content root escapes source root: ${relativeRoot}`
    );
    assertDirectory(absoluteRoot, `content root ${relativeRoot}`);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The content root is validated before canonicalization and checked within the real source root below.
    const realRoot = fs.realpathSync(absoluteRoot);
    assertRealPathWithin(
      realSourceRoot,
      realRoot,
      `content root ${relativeRoot}`
    );
    return {
      path: normalizedRoot,
      files: walkDirectory(realRoot).entries,
    };
  });

  return {
    digest: digestJson(roots),
    roots,
  };
}

function buildToolchainDigest(sourceRoot, options) {
  const packagePath = path.join(sourceRoot, "package.json");
  const lockPath = path.join(sourceRoot, "pnpm-lock.yaml");
  const inputs = {
    package_json_sha256: sha256File(packagePath, "package.json"),
    pnpm_lock_sha256: sha256File(lockPath, "pnpm-lock.yaml"),
    node_version: options.nodeVersion || process.version,
    pnpm_version: options.pnpmVersion || null,
  };
  return { digest: digestJson(inputs), inputs };
}

function getEnvironmentPackageDigest(manifest, environment) {
  if (typeof manifest.package_sha256 === "string") {
    return manifest.package_sha256;
  }
  return manifest.profiles?.[environment]?.package_sha256;
}

function getArtifactContractVersion(manifest) {
  if (manifest.artifact_contract_version === "environment-bound-v3") {
    return "environment-bound-v3";
  }
  if (
    manifest.schema_version === 2 ||
    manifest.artifact_contract === "legacy-v2"
  ) {
    return "legacy-v2";
  }
  return manifest.artifact_contract || "unknown";
}

function buildBakedInputs({ runtimeConfig, assetsFromS3, environment }) {
  const unknownRuntimeKeys = Object.keys(runtimeConfig)
    .filter((key) => !KNOWN_RUNTIME_KEYS.has(key))
    .sort(compareStrings);
  const descriptors = [
    ...BAKED_INPUTS,
    ...unknownRuntimeKeys.map((name) => ({
      name,
      category: "unclassified_runtime",
      classification: "unclassified_runtime_fail_closed",
      environment_bound: true,
    })),
  ].sort((left, right) => left.name.localeCompare(right.name, "en"));
  const values = new Map();
  const entries = descriptors.map((descriptor) => {
    const {
      name,
      category,
      classification,
      environment_bound: environmentBound,
    } = descriptor;
    let value;
    let source = "PUBLIC_RUNTIME.json";
    if (name === "PUBLIC_REVIEW_PROFILE") {
      value = environment;
      source = "artifact manifest environment";
    } else if (name === "ASSETS_FROM_S3") {
      value = assetsFromS3;
      source = ".next/ASSETS_FROM_S3";
    } else {
      value = runtimeConfig[name];
    }
    values.set(name, value);

    const present = value !== undefined && value !== null && value !== "";
    return {
      name,
      category,
      classification,
      environment_bound: environmentBound,
      present,
      source,
      value_sha256: present ? digestJson(value) : null,
    };
  });

  return { entries, unknownRuntimeKeys, values };
}

function buildInventory(options) {
  const sourceRoot = path.resolve(options.sourceRoot || process.cwd());
  const environment = options.environment;
  invariant(
    environment === "staging" || environment === "production",
    "environment must be staging or production"
  );

  const manifestPath = path.resolve(options.manifest);
  const manifest = readJsonFile(manifestPath, "artifact manifest");
  const sourceSha = options.sourceSha || manifest.source_sha;
  invariant(
    typeof sourceSha === "string" && GIT_SHA_PATTERN.test(sourceSha),
    "artifact manifest source_sha must be a lowercase 40-character commit SHA"
  );

  const packagePath = path.resolve(options.package);
  const packageSha256 = sha256File(packagePath, "artifact package");
  const expectedPackageSha256 = getEnvironmentPackageDigest(
    manifest,
    environment
  );
  invariant(
    typeof expectedPackageSha256 === "string" &&
      HEX_SHA256_PATTERN.test(expectedPackageSha256),
    `artifact manifest has no valid package digest for ${environment}`
  );
  invariant(
    packageSha256 === expectedPackageSha256,
    `artifact package digest does not match the manifest for ${environment}`
  );

  const runtimeConfigPath = path.resolve(options.runtimeConfig);
  const runtimeConfig = readJsonFile(runtimeConfigPath, "baked runtime config");
  invariant(
    runtimeConfig &&
      typeof runtimeConfig === "object" &&
      !Array.isArray(runtimeConfig),
    "baked runtime config must be a JSON object"
  );

  const assetsFlagPath = options.assetsFlag
    ? path.resolve(options.assetsFlag)
    : null;
  let assetsFromS3 = runtimeConfig.ASSETS_FROM_S3;
  if (assetsFlagPath) {
    assertRegularFile(assetsFlagPath, "assets flag");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit artifact path.
    assetsFromS3 = fs.readFileSync(assetsFlagPath, "utf8").trim();
  }
  invariant(
    assetsFromS3 === "true" || assetsFromS3 === "false",
    "ASSETS_FROM_S3 must be present as true or false"
  );

  const contentRoots = (
    Array.isArray(options.contentRoots)
      ? options.contentRoots
      : String(options.contentRoots || "").split(",")
  )
    .map((root) => root.trim())
    .filter(Boolean);
  invariant(
    contentRoots.length > 0,
    "content-roots must contain at least one root"
  );

  const content = digestContentRoots(sourceRoot, contentRoots);
  const toolchain = buildToolchainDigest(sourceRoot, options);
  const runtimeConfigWithAssets = {
    config: runtimeConfig,
    assets_from_s3: assetsFromS3,
  };
  const runtimeConfigSha256 = digestJson(runtimeConfigWithAssets);
  const baked = buildBakedInputs({
    runtimeConfig,
    assetsFromS3,
    environment,
  });
  const extractedRoot = path.resolve(options.extractedRoot || "");
  invariant(options.extractedRoot, "extracted-root is required");
  const packageScan = scanExtractedPackage(extractedRoot, baked);
  const artifactContractVersion = getArtifactContractVersion(manifest);
  const presentEnvironmentInputs = baked.entries
    .filter((entry) => entry.environment_bound && entry.present)
    .map((entry) => entry.name);
  const blockers = [
    `${artifactContractVersion} is environment-bound and is not eligible for cross-environment reuse`,
    "runtime configuration is persisted in package bytes rather than supplied at runtime",
    "this inventory is report-only; reuse and promotion authorization are disabled",
    ...presentEnvironmentInputs.map(
      (name) => `baked environment input: ${name}`
    ),
    ...baked.unknownRuntimeKeys.map(
      (name) => `unclassified baked runtime input: ${name}`
    ),
  ];

  const inventory = {
    schema_version: SCHEMA_VERSION,
    contract: CONTRACT,
    mode: "report_only",
    repository: manifest.repository || "frontend",
    environment,
    source: {
      git_sha: sourceSha,
    },
    artifact: {
      contract: manifest.artifact_contract || null,
      contract_version: artifactContractVersion,
      manifest_sha256: sha256File(manifestPath, "artifact manifest"),
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The operator supplies an explicit artifact path.
      package_size_bytes: fs.statSync(packagePath).size,
    },
    digests: {
      source_sha: sourceSha,
      content_sha256: content.digest,
      toolchain_sha256: toolchain.digest,
      package_sha256: packageSha256,
      runtime_config_sha256: runtimeConfigSha256,
    },
    content: {
      roots: content.roots.map((root) => ({
        path: root.path,
        sha256: digestJson(root.files),
        file_count: root.files.length,
      })),
    },
    toolchain,
    runtime_config: {
      source_paths: [
        path.posix.join(".next", path.basename(runtimeConfigPath)),
        ...(assetsFlagPath
          ? [path.posix.join(".next", path.basename(assetsFlagPath))]
          : []),
      ],
      sha256: runtimeConfigSha256,
      key_count: Object.keys(runtimeConfig).length,
    },
    baked_inputs: baked.entries,
    unclassified_runtime_keys: baked.unknownRuntimeKeys,
    package_scan: packageScan,
    portability: {
      status: "NOT_PORTABLE",
      portable: false,
      reuse_authorized: false,
      promotion_authorized: false,
      blockers,
    },
  };

  validateInventory(inventory);
  return inventory;
}

function compareInventories(staging, production) {
  validateInventory(staging);
  validateInventory(production);
  invariant(
    staging.environment === "staging",
    "first inventory must be staging"
  );
  invariant(
    production.environment === "production",
    "second inventory must be production"
  );

  const digestKeys = [
    "source_sha",
    "content_sha256",
    "toolchain_sha256",
    "package_sha256",
    "runtime_config_sha256",
  ];
  const digestComparison = Object.fromEntries(
    digestKeys.map((key) => [
      key,
      staging.digests[key] === production.digests[key],
    ])
  );
  const inputByName = new Map(
    [...staging.baked_inputs, ...production.baked_inputs].map((input) => [
      input.name,
      input,
    ])
  );
  const bakedInputDifferences = [...inputByName.keys()]
    .sort(compareStrings)
    .flatMap((name) => {
      const stagingInput =
        staging.baked_inputs.find((input) => input.name === name) || null;
      const productionInput =
        production.baked_inputs.find((input) => input.name === name) || null;
      if (
        stagingInput?.value_sha256 === productionInput?.value_sha256 &&
        stagingInput?.present === productionInput?.present
      ) {
        return [];
      }
      return [
        {
          name,
          staging_value_sha256: stagingInput?.value_sha256 ?? null,
          production_value_sha256: productionInput?.value_sha256 ?? null,
          staging_present: stagingInput?.present ?? false,
          production_present: productionInput?.present ?? false,
        },
      ];
    });

  return {
    schema_version: COMPARISON_SCHEMA_VERSION,
    contract: "artifact-portability-comparison-v1",
    mode: "report_only",
    generated_at: new Date().toISOString(),
    environments: {
      staging: {
        source_sha: staging.source.git_sha,
        package_sha256: staging.digests.package_sha256,
        runtime_config_sha256: staging.digests.runtime_config_sha256,
      },
      production: {
        source_sha: production.source.git_sha,
        package_sha256: production.digests.package_sha256,
        runtime_config_sha256: production.digests.runtime_config_sha256,
      },
    },
    comparison: {
      digests: digestComparison,
      baked_input_differences: bakedInputDifferences,
      unclassified_runtime_keys: {
        staging: staging.unclassified_runtime_keys,
        production: production.unclassified_runtime_keys,
      },
    },
    decision: {
      status: "BLOCKED",
      portable: false,
      reuse_authorized: false,
      promotion_authorized: false,
      reasons: [
        "Current frontend artifacts are environment-bound-v3 or legacy dual-profile artifacts.",
        "Runtime configuration is baked into package bytes and differs by environment.",
        "This report does not authorize artifact reuse, promotion, or environment mutation.",
      ],
    },
  };
}

function writeJsonFile(output, value) {
  if (!output) {
    return;
  }
  const target = path.resolve(output);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Operator CLI writes evidence to an explicit workflow/local path.
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function requireOption(args, name) {
  const value = args[name];
  invariant(
    typeof value === "string" && value.length > 0,
    `--${name} is required`
  );
  return value;
}

function runCli(args) {
  const command = args._[0];
  if (command === "inventory") {
    const inventory = buildInventory({
      manifest: requireOption(args, "manifest"),
      package: requireOption(args, "package"),
      runtimeConfig: requireOption(args, "runtime-config"),
      extractedRoot: requireOption(args, "extracted-root"),
      assetsFlag: args["assets-flag"],
      sourceRoot: args["source-root"],
      contentRoots: args["content-roots"],
      environment: requireOption(args, "environment"),
      sourceSha: args["source-sha"],
      nodeVersion: args["node-version"],
      pnpmVersion: args["pnpm-version"],
    });
    writeJsonFile(args.output, inventory);
    return inventory;
  }

  if (command === "compare") {
    const staging = validateInventory(
      readJsonFile(
        path.resolve(requireOption(args, "staging")),
        "staging inventory"
      )
    );
    const production = validateInventory(
      readJsonFile(
        path.resolve(requireOption(args, "production")),
        "production inventory"
      )
    );
    const comparison = compareInventories(staging, production);
    writeJsonFile(args.output, comparison);
    return comparison;
  }

  if (command === "verify-run" || command === "verify-report-source") {
    const options = {
      role: requireOption(args, "role"),
      repository: requireOption(args, "repository"),
      expectedRunId: requireOption(args, "expected-run-id"),
      expectedRunHeadSha: requireOption(args, "expected-run-head-sha"),
      expectedSourceSha: requireOption(args, "expected-source-sha"),
      expectedWorkflowPath: requireOption(args, "expected-workflow-path"),
      artifactName: requireOption(args, "artifact-name"),
      run: readJsonFile(
        path.resolve(requireOption(args, "run-json")),
        "source run"
      ),
      artifactMetadata:
        command === "verify-report-source"
          ? readJsonFile(
              path.resolve(requireOption(args, "artifact-metadata-json")),
              "GitHub artifact metadata"
            )
          : undefined,
      expectedArtifactDigest: args["expected-artifact-digest"],
    };
    const result =
      command === "verify-run"
        ? verifyReportRun(options)
        : verifyReportSource({
            ...options,
            artifactRoot: requireOption(args, "artifact-root"),
          });
    writeJsonFile(args.output, result);
    return result;
  }

  throw new Error(
    "command must be inventory, compare, verify-run, or verify-report-source"
  );
}

if (require.main === module) {
  try {
    const result = runCli(parseArgs(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.error(`Artifact portability check failed closed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BAKED_INPUTS,
  COMPARISON_SCHEMA_VERSION,
  CONTRACT,
  KNOWN_RUNTIME_KEYS,
  PROVENANCE_SCHEMA_VERSION,
  SCHEMA_VERSION,
  TRUSTED_REPORT_PRODUCERS,
  buildBakedInputs,
  buildInventory,
  canonicalize,
  compareInventories,
  digestJson,
  scanExtractedPackage,
  validateInventory,
  verifyReportRun,
  verifyReportSource,
  writeJsonFile,
};
