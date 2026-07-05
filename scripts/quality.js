#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REMOTE = "origin";
const BRANCH = "main";
const TARGET = `${REMOTE}/${BRANCH}`;
const coderabbitCmd =
  process.platform === "win32" ? "coderabbit.cmd" : "coderabbit";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const repoCommand =
  process.platform === "win32"
    ? path.join(repoRoot, "bin", "6529.cmd")
    : path.join(repoRoot, "bin", "6529");

const args = new Set(process.argv.slice(2));
const enableCoderabbit = args.has("--coderabbit");
const changedMode = args.has("--changed");

const runCommand = ({ command, args = [], inheritOutput = false }) => {
  // Node refuses to spawn .cmd/.bat files without a shell (CVE-2024-27980),
  // and combining shell:true with an args array is deprecated (DEP0190), so
  // shim invocations collapse into one command line. Safe here: every token
  // is a static string, and the quoted shim path survives a repo path with
  // spaces under cmd.exe.
  const useShell = /\.(cmd|bat)$/i.test(command);
  // Sonar hotspot accepted: this is a trusted local developer script.
  const result = spawnSync(
    useShell ? [`"${command}"`, ...args].join(" ") : command,
    useShell ? [] : args,
    {
      encoding: "utf8",
      cwd: repoRoot,
      stdio: inheritOutput ? "inherit" : ["ignore", "pipe", "pipe"],
      shell: useShell,
    }
  );

  if (result.error) {
    throw result.error;
  }

  return result;
};

const run = (command, commandArgs = []) => {
  const result = runCommand({ command, args: commandArgs });
  if (result.status !== 0) {
    const stderr = result.stderr?.trim() || "";
    throw new Error(
      stderr ||
        `${command} ${commandArgs.join(" ")} failed with status ${result.status}`
    );
  }
  return (result.stdout ?? "").trim();
};

const fail = (message, code = 1) => {
  console.error(`ERROR: ${message}`);
  process.exit(code);
};

const ensureSuccess = (result, label) => {
  if (result.status !== 0) {
    throw new Error(`${label} failed with status ${result.status}`);
  }
};

const KNIP_IGNORE_PATTERNS = [
  /(^|\/)__tests__\//,
  /(^|\/)__mocks__\//,
  /\.test\.[^/]+$/,
  /\.spec\.[^/]+$/,
];

const isIgnoredKnipPath = (filePath) => {
  if (!filePath) return false;
  const normalized = filePath.replaceAll("\\", "/");
  return KNIP_IGNORE_PATTERNS.some((pattern) => pattern.test(normalized));
};

const parseKnipJson = (stdout) => {
  if (!stdout) return null;
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const lastLine = trimmed.split("\n").pop();
    if (!lastLine) return null;
    try {
      return JSON.parse(lastLine);
    } catch (innerError) {
      return null;
    }
  }
};

const hasIssuesInRow = (row) => {
  if (!row) return false;
  const hasItems = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") {
      return Object.values(value).some((nested) => hasItems(nested));
    }
    return false;
  };
  return Object.entries(row).some(([key, value]) => {
    if (key === "file" || key === "owners") return false;
    return hasItems(value);
  });
};

const hasKnipIssues = (data) => {
  const files = Array.isArray(data?.files) ? data.files : [];
  const issues = Array.isArray(data?.issues) ? data.issues : [];
  return files.length > 0 || issues.some((row) => hasIssuesInRow(row));
};

const filterKnipData = (data) => {
  const files = Array.isArray(data?.files) ? data.files : [];
  const issues = Array.isArray(data?.issues) ? data.issues : [];
  return {
    files: files.filter((file) => !isIgnoredKnipPath(file)),
    issues: issues.filter((row) => !isIgnoredKnipPath(row?.file)),
  };
};

const formatIssueLocation = (issue) => {
  if (!issue || issue.line == null) return "";
  const col = issue.col == null ? "" : `:${issue.col}`;
  return `:${issue.line}${col}`;
};

const formatIssuePath = (file, issue) => {
  if (!issue || issue.line == null) return file;
  const col = issue.col == null ? "" : `:${issue.col}`;
  return `${file}:${issue.line}${col}`;
};

const printKnipSummary = (data) => {
  const issueLabels = {
    files: "UNUSED FILE",
    dependencies: "UNUSED DEP",
    devDependencies: "UNUSED DEV DEP",
    optionalPeerDependencies: "UNUSED OPTIONAL PEER DEP",
    unlisted: "UNLISTED DEP",
    binaries: "UNUSED BINARY",
    unresolved: "UNRESOLVED IMPORT",
    exports: "UNUSED EXPORT",
    nsExports: "UNUSED NAMESPACE EXPORT",
    types: "UNUSED TYPE EXPORT",
    nsTypes: "UNUSED NAMESPACE TYPE",
    enumMembers: "UNUSED ENUM MEMBER",
    classMembers: "UNUSED CLASS MEMBER",
    duplicates: "DUPLICATE EXPORT",
    catalog: "UNUSED CATALOG ITEM",
  };
  const lines = [];
  for (const file of data.files) {
    lines.push(`${file} - ${issueLabels.files}`);
  }
  const issueRows = data.issues.filter((row) => hasIssuesInRow(row));
  for (const row of issueRows) {
    for (const [type, value] of Object.entries(row)) {
      if (type === "file" || type === "owners") continue;
      const label = issueLabels[type] ?? type.toUpperCase();
      if (Array.isArray(value)) {
        for (const item of value) {
          if (Array.isArray(item)) {
            const names = item
              .map((entry) => entry?.name)
              .filter(Boolean)
              .join(", ");
            lines.push(`${row.file} - ${label} - ${names || "(unknown)"}`);
            continue;
          }
          const name = item?.name ?? "(unknown)";
          const path = formatIssuePath(row.file, item);
          lines.push(`${path} - ${label} - ${name}`);
        }
        continue;
      }
      if (value && typeof value === "object") {
        for (const [parent, items] of Object.entries(value)) {
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const name = item?.name ?? "(unknown)";
            const path = formatIssuePath(row.file, item);
            const fullName = parent ? `${parent}.${name}` : name;
            lines.push(`${path} - ${label} - ${fullName}`);
          }
        }
      }
    }
  }
  if (lines.length > 0) {
    console.error("Knip issues:");
    for (const line of lines) {
      console.error(`  ${line}`);
    }
  }
};

try {
  run("git", ["rev-parse", "--git-dir"]);
} catch (error) {
  fail("Not a git repository.", 2);
}

try {
  const result = runCommand({
    command: "git",
    args: ["fetch", REMOTE, BRANCH, "--quiet"],
    inheritOutput: true,
  });
  ensureSuccess(result, `git fetch ${TARGET}`);
} catch (error) {
  fail(`Failed to fetch ${TARGET}.`, 2);
}

let counts;
try {
  counts = run("git", [
    "rev-list",
    "--left-right",
    "--count",
    `${TARGET}...HEAD`,
  ]);
} catch (error) {
  fail(`Failed to compare HEAD with ${TARGET}.`, 2);
}

const [behindRaw, aheadRaw] = counts.split(/\s+/);
const behind = Number.parseInt(behindRaw, 10);
const ahead = Number.parseInt(aheadRaw, 10);

if (!Number.isFinite(behind) || !Number.isFinite(ahead)) {
  fail(`Unexpected comparison result: "${counts}".`, 2);
}

// if (behind > 0) {
//   fail(
//     `Branch is behind ${TARGET} by ${behind} commit${behind === 1 ? "" : "s"}. Please sync.`
//   );
// }

try {
  const result = runCommand({
    command: repoCommand,
    args: ["run", changedMode ? "format:changed" : "format:uncommitted"],
    inheritOutput: true,
  });
  ensureSuccess(result, changedMode ? "format:changed" : "format:uncommitted");
} catch (error) {
  fail(
    changedMode
      ? "Format changed files failed."
      : "Format uncommitted files failed."
  );
}

try {
  const result = runCommand({
    command: repoCommand,
    args: ["run", changedMode ? "lint:changed" : "lint:diff"],
    inheritOutput: true,
  });
  ensureSuccess(result, changedMode ? "lint:changed" : "lint:diff");
} catch (error) {
  fail(
    changedMode ? "ESLint changed check failed." : "ESLint diff check failed."
  );
}

try {
  const result = changedMode
    ? runCommand({
        command: repoCommand,
        args: ["run", "typecheck:changed"],
        inheritOutput: true,
      })
    : runCommand({
        command: repoCommand,
        args: ["exec", "tsc", "--noEmit", "-p", "tsconfig.typecheck.json"],
        inheritOutput: true,
      });
  ensureSuccess(result, changedMode ? "typecheck:changed" : "typecheck");
} catch (error) {
  console.error(error);
  fail(
    changedMode
      ? "TypeScript changed check failed."
      : "TypeScript check failed."
  );
}

let knipStdout = "";
let knipStderr = "";
let knipStatus = 0;
try {
  const result = runCommand({
    command: repoCommand,
    args: ["exec", "knip", "--reporter", "json"],
  });
  knipStdout = result.stdout ?? "";
  knipStderr = result.stderr ?? "";
  knipStatus = typeof result.status === "number" ? result.status : 1;
} catch (error) {
  knipStdout = error.stdout?.toString() ?? "";
  knipStderr = error.stderr?.toString() ?? "";
  knipStatus = typeof error.status === "number" ? error.status : 1;
}

const knipData = parseKnipJson(knipStdout);
if (!knipData) {
  if (knipStderr) console.error(knipStderr.trim());
  fail("Knip deadcode check failed.");
}

if (knipStatus === 2) {
  if (knipStderr) console.error(knipStderr.trim());
  fail("Knip deadcode check failed.");
}

const knipHasIssues = hasKnipIssues(knipData);
const filteredKnipData = filterKnipData(knipData);
const filteredKnipHasIssues = hasKnipIssues(filteredKnipData);

if (filteredKnipHasIssues) {
  printKnipSummary(filteredKnipData);
  fail("Knip deadcode check failed.");
}

if (!filteredKnipHasIssues && !knipHasIssues && knipStatus !== 0) {
  if (knipStderr) console.error(knipStderr.trim());
  fail("Knip deadcode check failed.");
}

if (ahead > 0) {
  console.log(
    `Branch is ahead of ${TARGET} by ${ahead} commit${ahead === 1 ? "" : "s"}.`
  );
}

console.log(`Branch is up to date with ${TARGET}.`);

if (enableCoderabbit) {
  if (changedMode) {
    if (ahead > 0) {
      console.log(
        `\nRunning CodeRabbit review on committed changes vs ${BRANCH}...\n`
      );
      try {
        runCommand({
          command: coderabbitCmd,
          args: ["--prompt-only", "--type", "committed", "--base", BRANCH],
          inheritOutput: true,
        });
      } catch (error) {
        // CodeRabbit may exit with non-zero even on success, just let output through
      }
    } else {
      console.log(`\nNo committed changes to review vs ${BRANCH}.`);
    }
  } else {
    const uncommittedFiles = run("git", ["status", "--porcelain"]);
    if (uncommittedFiles) {
      console.log("\nRunning CodeRabbit review on uncommitted changes...\n");
      try {
        runCommand({
          command: coderabbitCmd,
          args: ["--prompt-only", "--type", "uncommitted"],
          inheritOutput: true,
        });
      } catch (error) {
        // CodeRabbit may exit with non-zero even on success, just let output through
      }
    } else {
      console.log("\nNo uncommitted changes to review with CodeRabbit.");
    }
  }
}
