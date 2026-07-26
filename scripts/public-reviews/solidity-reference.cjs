#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const {
  INDEX_SCHEMA_VERSION,
  assertEverySourceRootMatched,
  buildBundle,
  compareReviewVersions,
  compareStrings,
  createIndexEntry,
  decodeUtf8,
  invariant,
  normalizeLf,
  normalizePath,
  sha256Urn,
  sourceLineCount,
  stableJson,
  validateBundle,
  validateConfig,
  validateDefinitionShards,
  validateRetainedSourceRanges,
} = require("./solidity-reference-lib.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_CONFIG_PATH = "config/public-reviews/6529-stream.reference.json";
const MAX_PROCESS_BUFFER = 512 * 1024 * 1024;
const COMPILER_TIMEOUT_MS = 180_000;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (["--check", "--dry-run"].includes(token)) {
      args[token.slice(2)] = true;
      continue;
    }
    if (["--config", "--source-repo", "--solc"].includes(token)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${token} requires a value.`);
      args[token.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function resolveContainedPath(root, relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `Path must be relative to its containment root: ${relativePath}`
  );
  const rootResolved = path.resolve(root);
  const rootReal = fs.realpathSync.native(rootResolved);
  const resolved = path.resolve(rootResolved, relativePath);
  const rootWithSeparator = `${rootResolved}${path.sep}`;
  invariant(
    resolved === rootResolved || resolved.startsWith(rootWithSeparator),
    `Path escapes its containment root: ${relativePath}`
  );
  const segments = path.relative(rootResolved, resolved).split(path.sep);
  let current = rootResolved;
  const realRootWithSeparator = `${rootReal}${path.sep}`;
  for (const segment of segments) {
    if (!segment) {
      continue;
    }
    current = path.join(current, segment);
    if (!fs.existsSync(current)) {
      break;
    }
    const stat = fs.lstatSync(current);
    invariant(
      !stat.isSymbolicLink(),
      `Path traverses a symbolic link or junction: ${current}`
    );
    const realCurrent = fs.realpathSync.native(current);
    invariant(
      realCurrent === rootReal || realCurrent.startsWith(realRootWithSeparator),
      `Path resolves outside its containment root: ${current}`
    );
  }
  return resolved;
}

function repositoryPath(relativePath) {
  return resolveContainedPath(REPOSITORY_ROOT, relativePath);
}

function acquireGenerationLock(lockPath) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, "wx");
    fs.writeFileSync(descriptor, `${process.pid}\n`);
  } catch (error) {
    const cleanupErrors = [];
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
      try {
        fs.rmSync(lockPath, { force: true });
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        `Unable to acquire and clean up the public-review generation lock ${lockPath}.`
      );
    }
    const contended =
      error &&
      typeof error === "object" &&
      error.code === "EEXIST";
    throw new Error(
      `${
        contended
          ? "Another public-review generation owns the lock"
          : "Unable to acquire the public-review generation lock"
      } ${lockPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    fs.closeSync(descriptor);
    fs.unlinkSync(lockPath);
  };
}

function readJsonFile(relativePath) {
  const buffer = fs.readFileSync(repositoryPath(relativePath));
  const text = decodeUtf8(buffer, relativePath);
  try {
    return { buffer, text, json: JSON.parse(text) };
  } catch (error) {
    throw new Error(
      `${relativePath} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    ...(options.encoding ? { encoding: options.encoding } : {}),
    maxBuffer: MAX_PROCESS_BUFFER,
    timeout: options.timeout,
    windowsHide: true,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr ?? "");
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}: ${stderr.trim()}`
    );
  }
  return result.stdout;
}

function runGit(sourceRepo, args, options = {}) {
  return runProcess("git", ["-C", sourceRepo, ...args], options);
}

function gitText(sourceRepo, args) {
  const output = runGit(sourceRepo, args);
  return decodeUtf8(output, `git ${args.join(" ")}`).trim();
}

function gitObjectBuffer(sourceRepo, commit, objectPath) {
  return runGit(sourceRepo, ["cat-file", "blob", `${commit}:${objectPath}`]);
}

function listSolidityPaths(sourceRepo, config) {
  const roots = config.source.roots.map((root) => root.path);
  const output = runGit(sourceRepo, [
    "ls-tree",
    "-r",
    "-z",
    "--name-only",
    config.source.commit,
    "--",
    ...roots,
  ]);
  const sourcePaths = output
    .toString("utf8")
    .split("\0")
    .filter((entry) => entry.endsWith(".sol"))
    .sort();
  assertEverySourceRootMatched(roots, sourcePaths);
  return sourcePaths;
}

function commitTimestampFromUnixSeconds(value) {
  invariant(
    typeof value === "string" && /^(0|[1-9]\d*)$/.test(value),
    `Git commit timestamp must be Unix seconds, received: ${value}`
  );
  const milliseconds = Number(value) * 1000;
  invariant(
    Number.isSafeInteger(milliseconds),
    `Git commit timestamp is outside the supported range: ${value}`
  );
  const timestamp = new Date(milliseconds).toISOString();
  return timestamp.endsWith(".000Z") ? `${timestamp.slice(0, -5)}Z` : timestamp;
}

function loadPinnedInputs(sourceRepo, config) {
  const resolvedCommit = gitText(sourceRepo, [
    "rev-parse",
    `${config.source.commit}^{commit}`,
  ]);
  invariant(
    resolvedCommit === config.source.commit,
    `Pinned commit resolved to ${resolvedCommit}.`
  );
  const resolvedTree = gitText(sourceRepo, [
    "rev-parse",
    `${config.source.commit}^{tree}`,
  ]);
  invariant(
    resolvedTree === config.source.tree,
    `Pinned tree resolved to ${resolvedTree}, expected ${config.source.tree}.`
  );
  const commitTimestamp = commitTimestampFromUnixSeconds(
    gitText(sourceRepo, ["show", "-s", "--format=%ct", config.source.commit])
  );
  const sourceBuffers = new Map();
  for (const sourcePath of listSolidityPaths(sourceRepo, config)) {
    sourceBuffers.set(
      sourcePath,
      gitObjectBuffer(sourceRepo, config.source.commit, sourcePath)
    );
  }
  invariant(sourceBuffers.size > 0, "Pinned revision has no Solidity sources.");
  const artifacts = {};
  for (const artifactConfig of config.releaseArtifacts) {
    const buffer = gitObjectBuffer(
      sourceRepo,
      config.source.commit,
      artifactConfig.path
    );
    const text = decodeUtf8(buffer, artifactConfig.path);
    try {
      artifacts[artifactConfig.path] = {
        buffer,
        json: JSON.parse(text),
        sha256: sha256Urn(buffer),
      };
    } catch (error) {
      throw new Error(
        `${artifactConfig.path} is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
  return { sourceBuffers, artifacts, commitTimestamp };
}

function compilerVersion(solcCommand) {
  const output = runProcess(solcCommand, ["--version"]);
  const text = decodeUtf8(output, "solc --version");
  const match = text.match(/Version:\s*([^\s]+)/);
  invariant(match, "Unable to parse solc --version output.");
  return match[1];
}

function parseCompilerOutput(output) {
  const text = decodeUtf8(output, "solc standard-json output");
  const firstBrace = text.indexOf("{");
  invariant(firstBrace >= 0, "Solidity compiler returned no JSON object.");
  let parsed;
  try {
    parsed = JSON.parse(text.slice(firstBrace));
  } catch (error) {
    throw new Error(
      `Solidity compiler returned invalid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  const errors = (parsed.errors ?? []).filter(
    (entry) => entry.severity === "error"
  );
  invariant(
    errors.length === 0,
    `Solidity compilation failed:\n${errors
      .slice(0, 20)
      .map((entry) => entry.formattedMessage ?? entry.message)
      .join("\n")}`
  );
  return parsed;
}

function compilePinnedSources(solcCommand, config, sourceBuffers) {
  const actualVersion = compilerVersion(solcCommand);
  invariant(
    actualVersion === config.source.compilerVersion ||
      actualVersion.startsWith(`${config.source.compilerVersion}.`),
    `Expected solc ${config.source.compilerVersion}, got ${actualVersion}.`
  );
  const sources = {};
  for (const [sourcePath, buffer] of sourceBuffers) {
    sources[sourcePath] = { content: decodeUtf8(buffer, sourcePath) };
  }
  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: config.source.optimizer,
      evmVersion: config.source.evmVersion,
      viaIR: config.source.viaIR,
      outputSelection: {
        "*": {
          "": ["ast"],
          "*": ["abi"],
        },
      },
    },
  };
  const output = runProcess(solcCommand, ["--standard-json"], {
    input: stableJson(input),
    timeout: COMPILER_TIMEOUT_MS,
  });
  return {
    compiler: {
      version: config.source.compilerVersion,
      evmVersion: config.source.evmVersion,
      optimizer: config.source.optimizer,
      viaIR: config.source.viaIR,
    },
    output: parseCompilerOutput(output),
  };
}

function generatorSourceSha256() {
  const sourceFiles = [
    "scripts/public-reviews/solidity-reference-lib.cjs",
    "scripts/public-reviews/solidity-reference.cjs",
  ];
  const normalized = sourceFiles
    .map((sourcePath) => {
      const text = fs.readFileSync(repositoryPath(sourcePath), "utf8");
      return `${sourcePath}\n${normalizeLf(text)}`;
    })
    .join("\n");
  return sha256Urn(normalized);
}

function configSha256(configText) {
  return sha256Urn(normalizeLf(configText));
}

function bundlePaths(config) {
  const directory = repositoryPath(config.output.directory);
  const bundle = path.join(directory, config.output.bundleFile);
  const definitions = path.join(directory, config.output.definitionsDirectory);
  const sources = path.join(directory, config.output.sourcesDirectory);
  const index = repositoryPath(config.output.indexFile);
  return { directory, bundle, definitions, sources, index };
}

function validateRetainedVersionRegistry(
  retainedVersions,
  indexVersions,
  discoveredVersions
) {
  const normalize = (values, label) => {
    invariant(Array.isArray(values), `${label} must be an array.`);
    invariant(
      values.every((value) => typeof value === "string" && value.length > 0),
      `${label} contains an invalid review version.`
    );
    invariant(
      new Set(values).size === values.length,
      `${label} contains a duplicate review version.`
    );
    return [...values].sort(compareReviewVersions);
  };
  const retained = normalize(retainedVersions, "Retained version registry");
  const indexed = normalize(indexVersions, "Public review index");
  const discovered = normalize(discoveredVersions, "Snapshot directory set");
  invariant(
    stableJson(retained) === stableJson(indexed) &&
      stableJson(retained) === stableJson(discovered),
    `Retained review versions disagree (registry: ${retained.join(", ")}; index: ${indexed.join(", ")}; snapshots: ${discovered.join(", ")}).`
  );
}

function configForVersion(config, version) {
  const clone = JSON.parse(JSON.stringify(config));
  clone.reviewVersion = version;
  clone.output.directory = normalizePath(
    path.posix.join(path.posix.dirname(config.output.directory), version)
  );
  return clone;
}

function discoveredSnapshotVersions(config, dependencies = {}) {
  const resolveRepositoryPath =
    dependencies.repositoryPath ?? repositoryPath;
  const versionsRoot = resolveRepositoryPath(
    normalizePath(path.posix.dirname(config.output.directory))
  );
  if (!fs.existsSync(versionsRoot)) {
    return [];
  }
  return fs
    .readdirSync(versionsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".stage-"))
    .sort(compareReviewVersions);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  };
  visit(directory);
  return files.sort();
}

function expectedSnapshotFiles(config, bundle, definitionShards, sources) {
  const paths = bundlePaths(config);
  const expected = new Map([[paths.bundle, Buffer.from(stableJson(bundle))]]);
  for (const [relativePath, shard] of definitionShards) {
    expected.set(
      path.join(paths.directory, ...relativePath.split("/")),
      shard.buffer
    );
  }
  for (const [sourcePath, source] of sources) {
    const outputPath = path.join(paths.sources, ...sourcePath.split("/"));
    expected.set(outputPath, source.buffer);
  }
  return expected;
}

function ensureImmutableSnapshot(config, expected) {
  const { directory } = bundlePaths(config);
  if (!fs.existsSync(directory)) {
    return false;
  }
  const actualPaths = listFiles(directory);
  const expectedPaths = [...expected.keys()].sort();
  invariant(
    JSON.stringify(actualPaths) === JSON.stringify(expectedPaths),
    `${config.reviewVersion}: immutable snapshot file set would change; increment reviewVersion.`
  );
  for (const [filePath, expectedBuffer] of expected) {
    const actualBuffer = fs.readFileSync(filePath);
    invariant(
      actualBuffer.equals(expectedBuffer),
      `${config.reviewVersion}: immutable snapshot ${normalizePath(
        path.relative(REPOSITORY_ROOT, filePath)
      )} would change; increment reviewVersion.`
    );
  }
  return true;
}

function writeStagedSnapshot(config, expected) {
  const { directory } = bundlePaths(config);
  const versionsRoot = path.dirname(directory);
  fs.mkdirSync(versionsRoot, { recursive: true });
  const stageDirectory = fs.mkdtempSync(
    path.join(versionsRoot, `.stage-${config.reviewVersion}-`)
  );
  let renamed = false;
  try {
    for (const [filePath, buffer] of expected) {
      const relativePath = path.relative(directory, filePath);
      invariant(
        relativePath !== "" &&
          !relativePath.startsWith(`..${path.sep}`) &&
          relativePath !== ".." &&
          !path.isAbsolute(relativePath),
        `Staged snapshot file escapes its version root: ${filePath}`
      );
      const stagePath = resolveContainedPath(stageDirectory, relativePath);
      fs.mkdirSync(path.dirname(stagePath), { recursive: true });
      fs.writeFileSync(stagePath, buffer, { flag: "wx" });
    }
    invariant(
      stableJson(
        listFiles(stageDirectory).map((filePath) =>
          normalizePath(path.relative(stageDirectory, filePath))
        )
      ) ===
        stableJson(
          [...expected.keys()]
            .map((filePath) =>
              normalizePath(path.relative(directory, filePath))
            )
            .sort(compareStrings)
        ),
      `${config.reviewVersion}: staged snapshot file set is incomplete.`
    );
    fs.renameSync(stageDirectory, directory);
    renamed = true;
  } finally {
    if (!renamed && fs.existsSync(stageDirectory)) {
      const resolvedStage = path.resolve(stageDirectory);
      invariant(
        path.dirname(resolvedStage) === path.resolve(versionsRoot) &&
          path
            .basename(resolvedStage)
            .startsWith(`.stage-${config.reviewVersion}-`),
        "Refusing to clean an unverified snapshot staging directory."
      );
      fs.rmSync(resolvedStage, { recursive: true, force: true });
    }
  }
}

function writeFileAtomic(filePath, buffer) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const safeTemporaryPath = resolveContainedPath(
    path.dirname(filePath),
    path.basename(temporaryPath)
  );
  try {
    fs.writeFileSync(safeTemporaryPath, buffer, { flag: "wx" });
    fs.renameSync(safeTemporaryPath, filePath);
  } finally {
    if (fs.existsSync(safeTemporaryPath)) {
      fs.unlinkSync(safeTemporaryPath);
    }
  }
}

function bundlePublicPath(config) {
  return `/${normalizePath(
    `${config.output.directory}/${config.output.bundleFile}`
  ).replace(/^public\//, "")}`;
}

function nextIndex(config, bundle) {
  const { index: indexPath } = bundlePaths(config);
  let versions = [];
  if (fs.existsSync(indexPath)) {
    const current = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    invariant(
      current.schemaVersion === INDEX_SCHEMA_VERSION,
      "Existing public review reference index schema is unsupported."
    );
    invariant(
      current.reviewId === config.reviewId,
      "Existing public review reference index belongs to another review."
    );
    versions = current.versions ?? [];
  }
  const entry = createIndexEntry(bundle, bundlePublicPath(config));
  const existing = versions.find(
    (candidate) => candidate.version === entry.version
  );
  if (existing) {
    invariant(
      stableJson(existing) === stableJson(entry),
      `${entry.version}: immutable index entry would change; increment reviewVersion.`
    );
  } else {
    versions.push(entry);
  }
  versions.sort((left, right) =>
    compareReviewVersions(left.version, right.version)
  );
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    reviewId: config.reviewId,
    activeVersion: config.reviewVersion,
    versions,
  };
}

function generate(configRecord, args) {
  validateConfig(configRecord.json);
  const sourceRepo =
    args["source-repo"] ?? process.env["STREAM_REVIEW_SOURCE_REPO"];
  invariant(
    typeof sourceRepo === "string" && sourceRepo.length > 0,
    "Generation requires --source-repo <exact Git repository>."
  );
  const solcCommand = args.solc ?? process.env["SOLC_BIN"] ?? "solc";
  const inputs = loadPinnedInputs(path.resolve(sourceRepo), configRecord.json);
  const compilation = compilePinnedSources(
    solcCommand,
    configRecord.json,
    inputs.sourceBuffers
  );
  const { bundle, definitionShards, sources } = buildBundle({
    config: configRecord.json,
    configSha256: configSha256(configRecord.text),
    generatorSha256: generatorSourceSha256(),
    compiler: compilation.compiler,
    compilerOutput: compilation.output,
    sourceBuffers: inputs.sourceBuffers,
    artifacts: inputs.artifacts,
    commitTimestamp: inputs.commitTimestamp,
  });
  validateBundle(bundle);
  validateDefinitionShards(bundle, definitionShards);
  const expected = expectedSnapshotFiles(
    configRecord.json,
    bundle,
    definitionShards,
    sources
  );
  if (args["dry-run"]) {
    process.stdout.write(
      `Validated ${bundle.summary.definitionCount} definitions from ${bundle.summary.fileCount} pinned Solidity files without writing output.\n`
    );
    return;
  }
  const { directory, index: indexPath } = bundlePaths(configRecord.json);
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  repositoryPath(configRecord.json.output.indexFile);
  const lockPath = resolveContainedPath(
    path.dirname(indexPath),
    ".solidity-reference-generation.lock"
  );
  const releaseLock = acquireGenerationLock(lockPath);
  let createdSnapshot = false;
  const previousIndexBuffer = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath)
    : null;
  let wroteIndex = false;
  try {
    const index = nextIndex(configRecord.json, bundle);
    const discoveredVersions = discoveredSnapshotVersions(configRecord.json);
    const plannedVersions = discoveredVersions.includes(
      configRecord.json.reviewVersion
    )
      ? discoveredVersions
      : [...discoveredVersions, configRecord.json.reviewVersion];
    validateRetainedVersionRegistry(
      configRecord.json.output.retainedVersions,
      index.versions.map((entry) => entry.version),
      plannedVersions
    );
    const existed = ensureImmutableSnapshot(configRecord.json, expected);
    if (!existed) {
      writeStagedSnapshot(configRecord.json, expected);
      createdSnapshot = true;
    }
    writeFileAtomic(indexPath, Buffer.from(stableJson(index)));
    wroteIndex = true;
    check(configRecord);
  } catch (error) {
    if (createdSnapshot && fs.existsSync(directory)) {
      const versionsRoot = path.dirname(directory);
      invariant(
        path.dirname(path.resolve(directory)) === path.resolve(versionsRoot) &&
          path.basename(directory) === configRecord.json.reviewVersion,
        "Refusing to roll back an unverified generated snapshot directory."
      );
      fs.rmSync(directory, { recursive: true, force: true });
    }
    if (wroteIndex) {
      if (previousIndexBuffer) {
        writeFileAtomic(indexPath, previousIndexBuffer);
      } else if (fs.existsSync(indexPath)) {
        fs.unlinkSync(indexPath);
      }
    }
    throw error;
  } finally {
    releaseLock();
  }
  process.stdout.write(
    `Generated ${bundle.summary.definitionCount} definitions from ${bundle.summary.fileCount} pinned Solidity files.\n`
  );
}

function relativeSourceFiles(config) {
  const { sources } = bundlePaths(config);
  return listFiles(sources).map((filePath) =>
    normalizePath(path.relative(sources, filePath))
  );
}

function validateCheckedSources(config, bundle) {
  const { sources } = bundlePaths(config);
  const expectedPaths = bundle.files.map((file) => file.path).sort();
  const actualPaths = relativeSourceFiles(config).sort();
  invariant(
    JSON.stringify(actualPaths) === JSON.stringify(expectedPaths),
    "Checked source snapshot file set disagrees with the generated bundle."
  );
  for (const file of bundle.files) {
    const filePath = path.join(sources, ...file.path.split("/"));
    const buffer = fs.readFileSync(filePath);
    invariant(
      buffer.length === file.byteLength,
      `${file.path}: checked source byte length drifted.`
    );
    invariant(
      sha256Urn(buffer) === file.sha256,
      `${file.path}: checked source checksum drifted.`
    );
    invariant(
      sourceLineCount(buffer) === file.lineCount,
      `${file.path}: checked source line count drifted.`
    );
    validateRetainedSourceRanges(
      file.topLevelDeclarations,
      file.path,
      file,
      buffer,
      `${file.path}: top-level declarations`
    );
    validateRetainedSourceRanges(
      bundle.definitionIndex.filter(
        (definition) => definition.sourcePath === file.path
      ),
      file.path,
      file,
      buffer,
      `${file.path}: definition index`
    );
    validateRetainedSourceRanges(
      bundle.declarationIndex?.filter(
        (declaration) => declaration.sourcePath === file.path
      ) ?? [],
      file.path,
      file,
      buffer,
      `${file.path}: declaration index`
    );
  }
}

function validateCheckedDefinitionShards(config, bundle) {
  const { definitions } = bundlePaths(config);
  const actualPaths = listFiles(definitions).map((filePath) =>
    normalizePath(path.relative(definitions, filePath))
  );
  const expectedPaths = bundle.definitionIndex
    .map((entry) => `${entry.key}.json`)
    .sort();
  invariant(
    JSON.stringify(actualPaths.sort()) === JSON.stringify(expectedPaths),
    "Checked definition shard file set disagrees with the generated bundle."
  );
  const definitionShards = new Map();
  for (const entry of bundle.definitionIndex) {
    const expectedPublicPath = `/${normalizePath(
      `${config.output.directory}/${config.output.definitionsDirectory}/${entry.key}.json`
    ).replace(/^public\//, "")}`;
    invariant(
      entry.shardPath === expectedPublicPath,
      `${entry.id}: checked definition shard pointer drifted.`
    );
    const filePath = path.join(definitions, `${entry.key}.json`);
    const buffer = fs.readFileSync(filePath);
    invariant(
      sha256Urn(buffer) === entry.shardSha256,
      `${entry.id}: checked definition shard checksum drifted.`
    );
    let shard;
    try {
      shard = JSON.parse(decodeUtf8(buffer, entry.shardPath));
    } catch (error) {
      throw new Error(
        `${entry.id}: checked definition shard is invalid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    definitionShards.set(entry.key, { buffer, shard });
    const sourceRecord = bundle.files.find(
      (file) => file.path === shard.definition.sourcePath
    );
    invariant(
      sourceRecord,
      `${shard.definition.id}: checked definition source is missing.`
    );
    const sourceBuffer = fs.readFileSync(
      path.join(bundlePaths(config).sources, ...sourceRecord.path.split("/"))
    );
    validateRetainedSourceRanges(
      shard.definition,
      sourceRecord.path,
      sourceRecord,
      sourceBuffer,
      `${shard.definition.id}: definition shard`
    );
  }
  validateDefinitionShards(bundle, definitionShards);
}

function validateCheckedSnapshotFileSet(config, bundle) {
  const { directory } = bundlePaths(config);
  const expected = [
    config.output.bundleFile,
    ...bundle.definitionIndex.map(
      (entry) => `${config.output.definitionsDirectory}/${entry.key}.json`
    ),
    ...bundle.files.map(
      (file) => `${config.output.sourcesDirectory}/${file.path}`
    ),
  ].sort(compareStrings);
  const actual = listFiles(directory)
    .map((filePath) => normalizePath(path.relative(directory, filePath)))
    .sort(compareStrings);
  invariant(
    stableJson(actual) === stableJson(expected),
    `${config.reviewVersion}: checked immutable snapshot file set drifted.`
  );
}

function readCheckedIndex(config) {
  const { index: indexPath } = bundlePaths(config);
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  invariant(
    index.schemaVersion === INDEX_SCHEMA_VERSION,
    "Checked public review reference index schema is unsupported."
  );
  invariant(
    index.reviewId === config.reviewId &&
      index.activeVersion === config.reviewVersion,
    "Checked public review reference index active version drifted."
  );
  invariant(
    Array.isArray(index.versions) && index.versions.length > 0,
    "Checked public review reference index has no versions."
  );
  const orderedVersions = index.versions.map((entry) => entry.version);
  invariant(
    stableJson(orderedVersions) ===
      stableJson([...orderedVersions].sort(compareReviewVersions)),
    "Checked public review reference index is not deterministically ordered."
  );
  validateRetainedVersionRegistry(
    config.output.retainedVersions,
    orderedVersions,
    discoveredSnapshotVersions(config)
  );
  return index;
}

function check(configRecord, dependencies = {}) {
  validateConfig(configRecord.json);
  const index = (dependencies.readIndex ?? readCheckedIndex)(configRecord.json);
  let activeBundle;
  for (const entry of index.versions) {
    const versionConfig = configForVersion(configRecord.json, entry.version);
    const bundle = dependencies.readBundle
      ? dependencies.readBundle(versionConfig, entry)
      : JSON.parse(fs.readFileSync(bundlePaths(versionConfig).bundle, "utf8"));
    const active = entry.version === configRecord.json.reviewVersion;
    validateBundle(bundle, { requireCurrentIdentity: active });
    invariant(
      bundle.reviewId === configRecord.json.reviewId &&
        bundle.reviewVersion === entry.version,
      `${entry.version}: checked bundle review identity drifted.`
    );
    invariant(
      stableJson(entry) ===
        stableJson(createIndexEntry(bundle, bundlePublicPath(versionConfig))),
      `${entry.version}: checked public review reference index entry drifted.`
    );
    (dependencies.validateDefinitionShards ?? validateCheckedDefinitionShards)(
      versionConfig,
      bundle,
      entry
    );
    (dependencies.validateSources ?? validateCheckedSources)(
      versionConfig,
      bundle,
      entry
    );
    (dependencies.validateSnapshotFileSet ?? validateCheckedSnapshotFileSet)(
      versionConfig,
      bundle,
      entry
    );
    if (active) {
      activeBundle = bundle;
    }
  }
  invariant(activeBundle, "Checked active review bundle is missing.");
  invariant(
    activeBundle.source.commit === configRecord.json.source.commit &&
      activeBundle.source.tree === configRecord.json.source.tree,
    "Checked active bundle source pin drifted."
  );
  invariant(
    activeBundle.generator.configSha256 === configSha256(configRecord.text),
    "Checked active bundle input manifest checksum drifted; regenerate a new review version."
  );
  invariant(
    activeBundle.generator.sourceSha256 === generatorSourceSha256(),
    "Checked active bundle generator checksum drifted; regenerate the active snapshot."
  );
  (dependencies.writeOutput ?? process.stdout.write.bind(process.stdout))(
    `Verified ${index.versions.length} retained review version(s), including ${activeBundle.summary.definitionCount} active definitions and ${activeBundle.summary.fileCount} active source files, offline.\n`
  );
}

function main(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    const configPath = normalizePath(args.config ?? DEFAULT_CONFIG_PATH);
    const configRecord = readJsonFile(configPath);
    if (args.check) {
      check(configRecord);
    } else {
      generate(configRecord, args);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  acquireGenerationLock,
  bundlePublicPath,
  check,
  compilePinnedSources,
  commitTimestampFromUnixSeconds,
  configSha256,
  ensureImmutableSnapshot,
  expectedSnapshotFiles,
  discoveredSnapshotVersions,
  generatorSourceSha256,
  listSolidityPaths,
  loadPinnedInputs,
  nextIndex,
  parseArgs,
  resolveContainedPath,
  validateRetainedVersionRegistry,
};
