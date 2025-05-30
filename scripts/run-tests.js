import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import libCoverage from "istanbul-lib-coverage";

const { createCoverageMap } = libCoverage;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runJest() {
  try {
    execSync(
      "CI=1 jest --coverage --watchAll=false --silent --coverageReporters=json",
      { stdio: "inherit" }
    );
  } catch (err) {
    process.exit(err.status || 1);
  }
}

function getChangedFiles() {
  try {
    const mergeBase = execSync("git merge-base HEAD main").toString().trim();
    const output = execSync(`git diff --name-only ${mergeBase}`)
      .toString()
      .trim();
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function checkCoverage(changedFiles) {
  const coveragePath = path.resolve(
    __dirname,
    "../coverage/coverage-final.json"
  );
  const coverageData = JSON.parse(readFileSync(coveragePath, "utf-8"));
  const coverageMap = createCoverageMap(coverageData);
  const failures = [];

  for (const file of changedFiles) {
    const absPath = path.resolve(file);
    if (!coverageMap.data[absPath]) continue;
    const summary = coverageMap.fileCoverageFor(absPath).toSummary();
    if (summary.lines.pct < 80) {
      failures.push(`${file}: ${summary.lines.pct.toFixed(2)}%`);
    }
  }

  if (failures.length) {
    const red = "\x1b[31m";
    const bold = "\x1b[1m";
    const reset = "\x1b[0m";

    console.error(`\n${red}${bold}ERROR: Code coverage check failed!${reset}`);
    console.error(
      `${red}The following files (${failures.length}) have line coverage below 80%:${reset}`
    );
    for (const f of failures) {
      console.error(`${red}  - ${f}${reset}`);
    }
    console.error(
      `${red}\nPlease add or update tests to ensure all changed files reach at least 80% line coverage.${reset}`
    );
    process.exit(1);
  }
}

runJest();
const changedFiles = getChangedFiles();
if (changedFiles.length) {
  checkCoverage(changedFiles);
}
