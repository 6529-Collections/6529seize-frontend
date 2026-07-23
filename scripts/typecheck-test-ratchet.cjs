#!/usr/bin/env node

const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
// TypeScript is intentionally a development dependency for this CI-only tool.
// eslint-disable-next-line import/no-extraneous-dependencies
const ts = require("typescript");

const SCHEMA_VERSION = "jest-typecheck-ratchet.v1";
const REPO_ROOT = path.resolve(__dirname, "..");
const CONFIG_RELATIVE_PATH = "tsconfig.jest.json";
const CONFIG_PATH = path.join(REPO_ROOT, CONFIG_RELATIVE_PATH);
const BASE_CONFIG_PATH = path.join(REPO_ROOT, "tsconfig.json");
const LOCKFILE_PATH = path.join(REPO_ROOT, "pnpm-lock.yaml");
const BASELINE_PATH = path.join(
  REPO_ROOT,
  "scripts",
  "typecheck-test-baseline.json"
);
const GLOBAL_DIAGNOSTIC_PATH = "<global>";
const MAX_REPORTED_DELTAS = 30;

const formatHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => REPO_ROOT,
  getNewLine: () => ts.sys.newLine,
};

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isJestDiagnosticPath(filePath) {
  const normalized = normalizePath(filePath);
  const isTypeScript = /\.(?:ts|tsx)$/.test(normalized);
  if (!isTypeScript || normalized.endsWith(".d.ts")) {
    return false;
  }
  return (
    normalized.startsWith("__tests__/") ||
    normalized.startsWith("__mocks__/") ||
    /\.test\.(?:ts|tsx)$/.test(normalized)
  );
}

function diagnosticDirectory(filePath) {
  if (filePath === GLOBAL_DIAGNOSTIC_PATH) {
    return filePath;
  }
  const directory = path.posix.dirname(normalizePath(filePath));
  const segments = directory.split("/");
  if (segments[0] === "__tests__") {
    return segments.slice(0, 3).join("/");
  }
  return segments.slice(0, 2).join("/");
}

function sortedRecord(entries) {
  return Object.fromEntries(
    [...entries].sort(([left], [right]) => left.localeCompare(right))
  );
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function repoRelativePath(filePath) {
  return normalizePath(path.relative(REPO_ROOT, filePath));
}

function readCompilerConfig() {
  const readResult = ts.readConfigFile(CONFIG_PATH, ts.sys.readFile);
  if (readResult.error) {
    throw new Error(ts.formatDiagnostic(readResult.error, formatHost));
  }

  const parsed = ts.parseJsonConfigFileContent(
    readResult.config,
    ts.sys,
    REPO_ROOT,
    { incremental: false },
    CONFIG_PATH
  );
  if (parsed.errors.length > 0) {
    throw new Error(ts.formatDiagnostics(parsed.errors, formatHost));
  }
  return parsed;
}

function collectSnapshot() {
  const parsed = readCompilerConfig();
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: {
      ...parsed.options,
      incremental: false,
      tsBuildInfoFile: undefined,
    },
    projectReferences: parsed.projectReferences,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const files = new Map();
  const codes = new Map();
  const directories = new Map();

  for (const diagnostic of diagnostics) {
    const relativePath = diagnostic.file
      ? repoRelativePath(diagnostic.file.fileName)
      : GLOBAL_DIAGNOSTIC_PATH;
    if (
      relativePath !== GLOBAL_DIAGNOSTIC_PATH &&
      !isJestDiagnosticPath(relativePath)
    ) {
      continue;
    }
    increment(files, relativePath);
    increment(codes, `TS${diagnostic.code}`);
    increment(directories, diagnosticDirectory(relativePath));
  }

  return {
    diagnosticCount: [...files.values()].reduce(
      (total, count) => total + count,
      0
    ),
    affectedFileCount: files.size,
    files: sortedRecord(files.entries()),
    codes: sortedRecord(codes.entries()),
    directories: sortedRecord(directories.entries()),
  };
}

function fileSha256(filePath) {
  // The caller supplies fixed, repository-owned paths declared above.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function currentToolchain() {
  return {
    typescript_version: ts.version,
    pnpm_lock_sha256: fileSha256(LOCKFILE_PATH),
    jest_tsconfig_sha256: fileSha256(CONFIG_PATH),
    base_tsconfig_sha256: fileSha256(BASE_CONFIG_PATH),
  };
}

function createBaseline(toolchain, files) {
  return {
    schema_version: SCHEMA_VERSION,
    config: CONFIG_RELATIVE_PATH,
    toolchain,
    files: sortedRecord(Object.entries(files)),
  };
}

function validateCountRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  for (const [filePath, count] of Object.entries(value)) {
    if (!filePath || !Number.isInteger(count) || count < 0) {
      throw new Error(`${label}.${filePath || "<empty>"} is invalid.`);
    }
  }
}

function validateBaseline(baseline) {
  if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) {
    throw new Error("Jest typecheck baseline must be an object.");
  }
  if (baseline.schema_version !== SCHEMA_VERSION) {
    throw new Error(
      `Unsupported Jest typecheck baseline schema: ${String(
        baseline.schema_version
      )}`
    );
  }
  if (baseline.config !== CONFIG_RELATIVE_PATH) {
    throw new Error(
      `Jest typecheck baseline config must be ${CONFIG_RELATIVE_PATH}.`
    );
  }
  if (
    !baseline.toolchain ||
    typeof baseline.toolchain !== "object" ||
    Array.isArray(baseline.toolchain)
  ) {
    throw new Error("Jest typecheck baseline toolchain is invalid.");
  }
  validateCountRecord(baseline.files, "files");
  return baseline;
}

function readBaseline() {
  // BASELINE_PATH is a fixed, repository-owned path.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const text = fs.readFileSync(BASELINE_PATH, "utf8");
  return validateBaseline(JSON.parse(text));
}

function compareDiagnosticCounts(currentFiles, baselineFiles) {
  const increases = [];
  const decreases = [];
  const filePaths = new Set([
    ...Object.keys(currentFiles),
    ...Object.keys(baselineFiles),
  ]);

  for (const filePath of [...filePaths].sort()) {
    const current = currentFiles[filePath] ?? 0;
    const baseline = baselineFiles[filePath] ?? 0;
    if (current > baseline) {
      increases.push({ file: filePath, baseline, current });
    } else if (current < baseline) {
      decreases.push({ file: filePath, baseline, current });
    }
  }
  return { increases, decreases };
}

function toolchainMismatches(current, baseline) {
  const mismatches = [];
  const keys = new Set([...Object.keys(current), ...Object.keys(baseline)]);
  for (const key of [...keys].sort()) {
    if (current[key] !== baseline[key]) {
      mismatches.push({
        key,
        baseline: baseline[key],
        current: current[key],
      });
    }
  }
  return mismatches;
}

function reportDeltas(label, deltas) {
  if (deltas.length === 0) {
    return;
  }
  console.error(`${label}:`);
  for (const delta of deltas.slice(0, MAX_REPORTED_DELTAS)) {
    console.error(
      `- ${delta.file}: baseline ${delta.baseline}, current ${delta.current}`
    );
  }
  if (deltas.length > MAX_REPORTED_DELTAS) {
    console.error(
      `- ...and ${deltas.length - MAX_REPORTED_DELTAS} more file(s)`
    );
  }
}

function reportToolchainMismatches(mismatches) {
  if (mismatches.length === 0) {
    return;
  }
  console.error("Toolchain/config fingerprint changed:");
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch.key}`);
  }
}

function snapshotSummary(snapshot) {
  const diagnosticLabel =
    snapshot.diagnosticCount === 1 ? "diagnostic" : "diagnostics";
  const fileLabel = snapshot.affectedFileCount === 1 ? "file" : "files";
  return `${snapshot.diagnosticCount} ${diagnosticLabel} in ${snapshot.affectedFileCount} ${fileLabel}`;
}

function writeBaseline(baseline) {
  // BASELINE_PATH is a fixed, repository-owned path.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
}

function updateBaseline(snapshot, toolchain, initialize) {
  // BASELINE_PATH is a fixed, repository-owned path.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const baselineExists = fs.existsSync(BASELINE_PATH);
  if (!baselineExists && !initialize) {
    throw new Error(
      "Baseline is missing. Initial creation requires --update --initialize."
    );
  }

  if (baselineExists) {
    const baseline = readBaseline();
    const comparison = compareDiagnosticCounts(snapshot.files, baseline.files);
    if (comparison.increases.length > 0) {
      reportDeltas("Refusing baseline increases", comparison.increases);
      throw new Error(
        "Fix the new Jest type errors before updating the baseline."
      );
    }
  }

  writeBaseline(createBaseline(toolchain, snapshot.files));
  process.stdout.write(
    `Updated Jest typecheck baseline: ${snapshotSummary(snapshot)}.\n`
  );
}

function checkBaseline(snapshot, toolchain) {
  const baseline = readBaseline();
  const comparison = compareDiagnosticCounts(snapshot.files, baseline.files);
  const mismatches = toolchainMismatches(toolchain, baseline.toolchain);
  const hasChanges =
    comparison.increases.length > 0 ||
    comparison.decreases.length > 0 ||
    mismatches.length > 0;

  if (!hasChanges) {
    process.stdout.write(
      `Jest typecheck ratchet passed: ${snapshotSummary(snapshot)}.\n`
    );
    return;
  }

  reportDeltas("Diagnostic increases", comparison.increases);
  reportDeltas("Uncommitted diagnostic improvements", comparison.decreases);
  reportToolchainMismatches(mismatches);
  if (comparison.increases.length > 0) {
    throw new Error("Jest typecheck debt increased.");
  }
  throw new Error(
    "Run `6529 run typecheck:jest:update-baseline` and commit the lowered or refreshed baseline."
  );
}

function parseOptions(argv) {
  const args = new Set(argv.filter((value) => value !== "--"));
  const known = new Set(["--initialize", "--inventory", "--update"]);
  const unknown = [...args].filter((value) => !known.has(value));
  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.join(", ")}`);
  }
  const update = args.has("--update");
  const initialize = args.has("--initialize");
  const inventory = args.has("--inventory");
  if (initialize && !update) {
    throw new Error("--initialize requires --update.");
  }
  if (inventory && update) {
    throw new Error("--inventory cannot be combined with --update.");
  }
  return { initialize, inventory, update };
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const snapshot = collectSnapshot();
  const toolchain = currentToolchain();

  if (options.inventory) {
    process.stdout.write(
      `${JSON.stringify(
        {
          schema_version: SCHEMA_VERSION,
          config: CONFIG_RELATIVE_PATH,
          toolchain,
          observed: {
            diagnostics: snapshot.diagnosticCount,
            affected_files: snapshot.affectedFileCount,
            by_code: snapshot.codes,
            by_directory: snapshot.directories,
          },
        },
        null,
        2
      )}\n`
    );
    return;
  }
  if (options.update) {
    updateBaseline(snapshot, toolchain, options.initialize);
    return;
  }
  checkBaseline(snapshot, toolchain);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Jest typecheck ratchet failed: ${message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  SCHEMA_VERSION,
  compareDiagnosticCounts,
  createBaseline,
  diagnosticDirectory,
  isJestDiagnosticPath,
  parseOptions,
  toolchainMismatches,
  validateBaseline,
};
