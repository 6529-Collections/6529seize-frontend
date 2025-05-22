import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import libCoverage from 'istanbul-lib-coverage';

const { createCoverageMap } = libCoverage;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.resolve(__dirname, '../.coverage-progress.json');

function run(command) {
  execSync(command, { stdio: 'inherit' });
}

function readJSON(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function getTotalCoverage(summary) {
  return summary.total.lines.pct;
}

function getLowCoverageFiles(coverageData, limit = 1) {
  const map = createCoverageMap(coverageData);
  const entries = Object.entries(map.data)
    .map(([file, data]) => ({ file, pct: map.fileCoverageFor(file).toSummary().lines.pct }))
    .filter((e) => e.pct < 80)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit);
  return entries.map((e) => path.relative(process.cwd(), e.file));
}

function main() {
  run('npm run test:cov');

  const summaryPath = path.resolve(__dirname, '../coverage/coverage-summary.json');
  if (!existsSync(summaryPath)) {
    console.error(`ERROR: Coverage summary file not found after running tests: ${summaryPath}`);
    process.exit(1);
  }

  const summary = readJSON(summaryPath);
  const currentCoverage = getTotalCoverage(summary);
  const coverageData = readJSON(path.resolve(__dirname, '../coverage/coverage-final.json'));

  let initialCoverage = 0;
  let targetCoverage = 0;

  if (existsSync(progressPath)) {
    const progress = readJSON(progressPath);
    initialCoverage = progress.initialCoverage || 0;
    targetCoverage = progress.targetCoverage || 0;
    if (targetCoverage === 0 && initialCoverage === 0 && currentCoverage > 0) {
        console.log('Progress file found with invalid state, re-initializing target...');
        initialCoverage = currentCoverage;
        targetCoverage = currentCoverage + 1.0;
        writeFileSync(progressPath, JSON.stringify({ initialCoverage, targetCoverage }, null, 2));
    } else if (targetCoverage === 0 && initialCoverage > 0) {
        targetCoverage = initialCoverage + 1.0;
        writeFileSync(progressPath, JSON.stringify({ initialCoverage, targetCoverage }, null, 2));
    }

  } else {
    initialCoverage = currentCoverage;
    targetCoverage = currentCoverage + 1.0;
    writeFileSync(progressPath, JSON.stringify({ initialCoverage, targetCoverage }, null, 2));
  }

  console.log(`initial: ${initialCoverage.toFixed(2)}%`);
  console.log(`target: ${targetCoverage.toFixed(2)}%`);
  console.log(`current: ${currentCoverage.toFixed(2)}%`);

  if (currentCoverage >= targetCoverage) {
    console.log(`\nSuccess: Current coverage of ${currentCoverage.toFixed(2)}% has met or exceeded the target of ${targetCoverage.toFixed(2)}%. Task completed.`);
  } else {
    const nextFiles = getLowCoverageFiles(coverageData, 1);
    if (nextFiles.length > 0) {
      console.log(`\nAction: Add tests for ${nextFiles[0]} to improve coverage. Then re-run 'npm run improve-coverage'.`);
    } else {
      console.log(`\nInfo: All individual files meet the 80% threshold. However, current coverage of ${currentCoverage.toFixed(2)}% has not yet reached the target of ${targetCoverage.toFixed(2)}%. Please add more tests to any module to increase the overall percentage. Then re-run 'npm run improve-coverage'.`);
    }
  }
}

main();
