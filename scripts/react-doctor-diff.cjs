#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SOURCE_PATTERNS = [
  "*.js",
  "*.jsx",
  "*.ts",
  "*.tsx",
  ":(exclude)generated/**",
];
const REACT_DOCTOR_ARGS = [
  ".",
  "--project",
  "6529seize",
  "--verbose",
  "--offline",
  "--diff=HEAD",
];

const repoRoot = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "react-doctor-diff-"));
const tempIndexPath = path.join(tempDir, "index");

const findWindowsGitCommand = () => {
  const candidates = [
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, "Git", "cmd", "git.exe"),
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, "Git", "bin", "git.exe"),
    process.env["ProgramFiles(x86)"] &&
      path.join(process.env["ProgramFiles(x86)"], "Git", "cmd", "git.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? "git";
};

const gitCommand =
  process.platform === "win32" ? findWindowsGitCommand() : "git";
const pathKey =
  process.platform === "win32"
    ? (Object.keys(process.env).find((key) => key.toLowerCase() === "path") ??
      "Path")
    : "PATH";
const gitDir = gitCommand === "git" ? null : path.dirname(gitCommand);
const commandEnv = {
  ...process.env,
  GIT_INDEX_FILE: tempIndexPath,
  [pathKey]: gitDir
    ? `${gitDir}${path.delimiter}${process.env[pathKey] ?? ""}`
    : process.env[pathKey],
};
const reactDoctorBin = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "react-doctor.cmd" : "react-doctor"
);

const formatCommand = (command, args) => [command, ...args].join(" ");

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: commandEnv,
    encoding: "utf8",
    input: options.input,
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(
      stderr ||
        `${formatCommand(command, args)} failed with status ${result.status}`
    );
  }

  return result.stdout ?? "";
};

const getUntrackedSourceFiles = () => {
  const output = runCommand(
    gitCommand,
    ["ls-files", "--others", "--exclude-standard", "-z", "--"].concat(
      SOURCE_PATTERNS
    )
  );

  return output.split("\0").filter(Boolean);
};

const addIntentToAddEntries = (filePaths) => {
  if (filePaths.length === 0) {
    return;
  }

  runCommand(
    gitCommand,
    ["add", "--intent-to-add", "--pathspec-from-file=-", "--pathspec-file-nul"],
    { input: `${filePaths.join("\0")}\0` }
  );
};

const runReactDoctor = () =>
  spawnSync(reactDoctorBin, REACT_DOCTOR_ARGS, {
    cwd: repoRoot,
    env: commandEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

try {
  runCommand(gitCommand, ["read-tree", "HEAD"]);
  addIntentToAddEntries(getUntrackedSourceFiles());

  const result = runReactDoctor();
  if (result.error) {
    throw result.error;
  }
  if (result.signal) {
    console.error(`react-doctor terminated with signal ${result.signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
