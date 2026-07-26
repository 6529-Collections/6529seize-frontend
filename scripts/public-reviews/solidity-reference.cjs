#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const {
  INDEX_SCHEMA_VERSION,
  buildBundle,
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
} = require("./solidity-reference-lib.cjs");

const REPOSITORY_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_CONFIG_PATH =
  "config/public-reviews/6529-stream.reference.json";
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

function repositoryPath(relativePath) {
  const resolved = path.resolve(REPOSITORY_ROOT, relativePath);
  const rootWithSeparator = `${REPOSITORY_ROOT}${path.sep}`;
  invariant(
    resolved === REPOSITORY_ROOT || resolved.startsWith(rootWithSeparator),
    `Path escapes the frontend repository: ${relativePath}`
  );
  return resolved;
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
  return runGit(sourceRepo, [
    "cat-file",
    "blob",
    `${commit}:${objectPath}`,
  ]);
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
  return output
    .toString("utf8")
    .split("\0")
    .filter((entry) => entry.endsWith(".sol"))
    .sort();
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
  const commitTimestamp = gitText(sourceRepo, [
    "show",
    "-s",
    "--format=%cI",
    config.source.commit,
  ]);
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
  const definitions = path.join(
    directory,
    config.output.definitionsDirectory
  );
  const sources = path.join(directory, config.output.sourcesDirectory);
  const index = repositoryPath(config.output.indexFile);
  return { directory, bundle, definitions, sources, index };
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

function expectedSnapshotFiles(
  config,
  bundle,
  definitionShards,
  sources
) {
  const paths = bundlePaths(config);
  const expected = new Map([[paths.bundle, Buffer.from(stableJson(bundle))]]);
  for (const [relativePath, shard] of definitionShards) {
    expected.set(
      path.join(paths.directory, ...relativePath.split("/")),
      shard.buffer
    );
  }
  for (const [sourcePath, source] of sources) {
    const outputPath = path.join(
      paths.sources,
      ...sourcePath.split("/")
    );
    expected.set(outputPath, source.buffer);
  }
  return expected;
}

function ensureImmutableSnapshot(config, expected) {
  const { directory } = bundlePaths(config);
  if (!fs.existsSync(directory)) {
    return;
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
}

function writeExpectedFiles(expected) {
  for (const [filePath, buffer] of expected) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
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
  versions.sort((left, right) => left.version.localeCompare(right.version));
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    reviewId: config.reviewId,
    activeVersion: config.reviewVersion,
    versions,
  };
}

function generate(configRecord, args) {
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
  ensureImmutableSnapshot(configRecord.json, expected);
  writeExpectedFiles(expected);
  const index = nextIndex(configRecord.json, bundle);
  const { index: indexPath } = bundlePaths(configRecord.json);
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, stableJson(index));
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
  }
  validateDefinitionShards(bundle, definitionShards);
}

function validateCheckedIndex(config, bundle) {
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
  const expectedEntry = createIndexEntry(bundle, bundlePublicPath(config));
  const entry = index.versions?.find(
    (candidate) => candidate.version === config.reviewVersion
  );
  invariant(entry, "Checked public review reference index entry is missing.");
  invariant(
    stableJson(entry) === stableJson(expectedEntry),
    "Checked public review reference index entry drifted."
  );
}

function check(configRecord) {
  validateConfig(configRecord.json);
  const { bundle: bundlePath } = bundlePaths(configRecord.json);
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  validateBundle(bundle);
  invariant(
    bundle.reviewId === configRecord.json.reviewId &&
      bundle.reviewVersion === configRecord.json.reviewVersion,
    "Checked bundle review identity drifted."
  );
  invariant(
    bundle.source.commit === configRecord.json.source.commit &&
      bundle.source.tree === configRecord.json.source.tree,
    "Checked bundle source pin drifted."
  );
  invariant(
    bundle.generator.configSha256 === configSha256(configRecord.text),
    "Checked bundle input manifest checksum drifted; regenerate a new review version."
  );
  invariant(
    bundle.generator.sourceSha256 === generatorSourceSha256(),
    "Checked bundle generator checksum drifted; regenerate the active snapshot."
  );
  validateCheckedDefinitionShards(configRecord.json, bundle);
  validateCheckedSources(configRecord.json, bundle);
  validateCheckedIndex(configRecord.json, bundle);
  process.stdout.write(
    `Verified ${bundle.summary.definitionCount} definitions and ${bundle.summary.fileCount} source files offline.\n`
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
  bundlePublicPath,
  check,
  compilePinnedSources,
  configSha256,
  ensureImmutableSnapshot,
  expectedSnapshotFiles,
  generatorSourceSha256,
  listSolidityPaths,
  loadPinnedInputs,
  nextIndex,
  parseArgs,
};
