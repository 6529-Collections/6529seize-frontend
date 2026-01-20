#!/usr/bin/env node
import { execSync } from "node:child_process";

const REMOTE = "origin";
const BRANCH = "main";
const TARGET = `${REMOTE}/${BRANCH}`;

const run = (command, options = {}) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();

const fail = (message, code = 1) => {
  console.error(`ERROR: ${message}`);
  process.exit(code);
};

const KNIP_IGNORE_PATTERNS = [
  /(^|\/)__tests__\//,
  /(^|\/)__mocks__\//,
  /\.test\.[^/]+$/,
  /\.spec\.[^/]+$/,
];

const isIgnoredKnipPath = (filePath) => {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, "/");
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
  return Object.entries(row).some(([key, value]) => {
    if (key === "file" || key === "owners") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object")
      return Object.keys(value).length > 0;
    return false;
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

const getIssueCounts = (row) => {
  const counts = [];
  for (const [key, value] of Object.entries(row)) {
    if (key === "file" || key === "owners") continue;
    if (Array.isArray(value) && value.length > 0) {
      counts.push(`${key}:${value.length}`);
    } else if (value && typeof value === "object") {
      const nestedCount = Object.values(value).reduce((total, items) => {
        if (Array.isArray(items)) return total + items.length;
        return total;
      }, 0);
      if (nestedCount > 0) counts.push(`${key}:${nestedCount}`);
    }
  }
  return counts;
};

const printKnipSummary = (data) => {
  if (data.files.length > 0) {
    console.error("Knip unused files:");
    for (const file of data.files) {
      console.error(`  ${file}`);
    }
  }
  const issueRows = data.issues.filter((row) => hasIssuesInRow(row));
  if (issueRows.length > 0) {
    console.error("Knip issues:");
    for (const row of issueRows) {
      const counts = getIssueCounts(row);
      const suffix = counts.length > 0 ? ` (${counts.join(", ")})` : "";
      console.error(`  ${row.file}${suffix}`);
    }
  }
};

try {
  run("git rev-parse --git-dir");
} catch (error) {
  fail("Not a git repository.", 2);
}

try {
  execSync(`git fetch ${REMOTE} ${BRANCH} --quiet`, { stdio: "inherit" });
} catch (error) {
  fail(`Failed to fetch ${TARGET}.`, 2);
}

let counts;
try {
  counts = run(`git rev-list --left-right --count ${TARGET}...HEAD`);
} catch (error) {
  fail(`Failed to compare HEAD with ${TARGET}.`, 2);
}

const [behindRaw, aheadRaw] = counts.split(/\s+/);
const behind = Number.parseInt(behindRaw, 10);
const ahead = Number.parseInt(aheadRaw, 10);

if (!Number.isFinite(behind) || !Number.isFinite(ahead)) {
  fail(`Unexpected comparison result: "${counts}".`, 2);
}

if (behind > 0) {
  fail(
    `Branch is behind ${TARGET} by ${behind} commit${behind === 1 ? "" : "s"}. Please sync.`
  );
}

try {
  execSync("npx --no-install tsc --noEmit -p tsconfig.typecheck.json", {
    stdio: "inherit",
  });
} catch (error) {
  fail("TypeScript check failed.");
}

let knipStdout = "";
let knipStderr = "";
let knipStatus = 0;
try {
  knipStdout = execSync("npx --no-install knip --reporter json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
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
