import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import libCoverage from 'istanbul-lib-coverage';

const { createCoverageMap } = libCoverage;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runJest() {
  try {
    execSync('CI=1 jest --coverage --watchAll=false', { stdio: 'inherit' });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

function getChangedFiles() {
  try {
    const mergeBase = execSync('git merge-base HEAD main').toString().trim();
    const output = execSync(`git diff --name-only ${mergeBase}`).toString().trim();
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function checkCoverage(changedFiles) {
  const coveragePath = path.resolve(__dirname, '../coverage/coverage-final.json');
  const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
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
    console.error('\nCoverage below 80% for the following files:');
    for (const f of failures) console.error('  ' + f);
    console.error('\nAdd or update tests to reach at least 80% coverage.');
    process.exit(1);
  }
}

runJest();
const changedFiles = getChangedFiles();
if (changedFiles.length) {
  checkCoverage(changedFiles);
}
