#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const ts = require("typescript");

const BRANCH = "main";
const EXEC_OPTIONS = {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
};

const canonicalPath = (filePath) => {
  const normalized = path.resolve(filePath).replaceAll("\\", "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
};

const runGitCommand = (args) => {
  const result = spawnSync("git", args, EXEC_OPTIONS);
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.toString().trim();
    throw new Error(
      stderr || `git ${args.join(" ")} failed with exit code ${result.status}`
    );
  }

  return result.stdout ?? "";
};

const runChangedFilesCommand = () => {
  const patterns = [
    "*.ts",
    "*.tsx",
    "*.mts",
    "*.cts",
    ":(exclude)generated/**",
  ];
  const changedTracked = runGitCommand(
    ["diff", "--name-only", "-z", `${BRANCH}...HEAD`, "--"].concat(patterns)
  );
  const changedUntracked = runGitCommand(
    ["ls-files", "--others", "--exclude-standard", "-z", "--"].concat(patterns)
  );
  return changedTracked + changedUntracked;
};

const getChangedTypeScriptFiles = () => {
  const output = runChangedFilesCommand();
  if (!output) return [];

  const rawFiles = output.split("\0").filter(Boolean);
  const deduped = new Set(rawFiles.map((file) => file.trim()).filter(Boolean));
  return [...deduped];
};

const readTypecheckConfig = () => {
  const cwd = process.cwd();
  const configPath = ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    "tsconfig.typecheck.json"
  );

  if (!configPath) {
    throw new Error("Cannot find tsconfig.typecheck.json");
  }

  const readConfigResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (readConfigResult.error) {
    throw new Error(
      ts.formatDiagnostic(readConfigResult.error, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => cwd,
        getNewLine: () => ts.sys.newLine,
      })
    );
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    readConfigResult.config,
    ts.sys,
    path.dirname(configPath)
  );

  return parsedConfig;
};

const formatHost = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => ts.sys.newLine,
};

const main = () => {
  let changedFiles;
  try {
    changedFiles = getChangedTypeScriptFiles();
  } catch (error) {
    console.error(
      "Failed to resolve changed TypeScript files against main...HEAD"
    );
    if (error instanceof Error && error.message) {
      console.error(error.message);
    }
    process.exit(2);
  }

  if (changedFiles.length === 0) {
    console.log("No changed TypeScript files to typecheck.");
    return;
  }

  let parsedConfig;
  try {
    parsedConfig = readTypecheckConfig();
  } catch (error) {
    console.error("Failed to read TypeScript configuration.");
    if (error instanceof Error && error.message) {
      console.error(error.message);
    }
    process.exit(2);
  }

  const projectFilesSet = new Set(parsedConfig.fileNames.map(canonicalPath));
  const changedProjectFiles = changedFiles
    .map((file) => path.resolve(file))
    .filter((file) => projectFilesSet.has(canonicalPath(file)));
  const declarationSupportFiles = parsedConfig.fileNames.filter((filePath) => {
    if (!filePath.endsWith(".d.ts")) {
      return false;
    }
    const normalized = canonicalPath(filePath);
    return !normalized.includes("/.next/dev/types/");
  });

  if (changedProjectFiles.length === 0) {
    console.log(
      "No changed TypeScript files are included in tsconfig.typecheck.json."
    );
    return;
  }

  const rootNames = [
    ...new Set([...changedProjectFiles, ...declarationSupportFiles]),
  ];

  const program = ts.createProgram({
    rootNames,
    options: {
      ...parsedConfig.options,
      incremental: false,
    },
    projectReferences: parsedConfig.projectReferences,
  });

  const changedFilesSet = new Set(changedProjectFiles.map(canonicalPath));
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => {
    if (!diagnostic.file) {
      return true;
    }
    return changedFilesSet.has(canonicalPath(diagnostic.file.fileName));
  });
  if (diagnostics.length === 0) {
    console.log(
      `Typecheck passed for ${changedProjectFiles.length} changed TypeScript file${
        changedProjectFiles.length === 1 ? "" : "s"
      }.`
    );
    return;
  }

  const output = ts.formatDiagnosticsWithColorAndContext(
    diagnostics,
    formatHost
  );
  console.error(output);
  process.exit(1);
};

main();
