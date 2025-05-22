import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, openSync, closeSync, readSync, statSync, fstatSync, ftruncateSync, writeSync } from 'fs';
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
  let fd;

  try {
    try {
      fd = openSync(progressPath, 'r+');
      const stats = fstatSync(fd);
      let fileContent = '';
      if (stats.size > 0) {
        const buffer = Buffer.alloc(stats.size);
        readSync(fd, buffer, 0, buffer.length, null);
        fileContent = buffer.toString('utf-8');
      }
      
      if (fileContent) {
        const progress = JSON.parse(fileContent);
        initialCoverage = progress.initialCoverage || 0;
        targetCoverage = progress.targetCoverage || 0;

        if (targetCoverage === 0 && initialCoverage === 0 && currentCoverage > 0) {
            console.log('Progress file content invalid or state indicates first real run, re-initializing target...');
            initialCoverage = currentCoverage;
            targetCoverage = currentCoverage + 1.0;
        } else if (targetCoverage === 0 && initialCoverage > 0) {
            console.log('Target coverage not set in progress file, re-initializing target...');
            targetCoverage = initialCoverage + 1.0;
        } else if (initialCoverage === 0 && currentCoverage > 0) {
             console.log('Initial coverage was zero in progress file, re-initializing...');
             initialCoverage = currentCoverage;
             targetCoverage = currentCoverage + 1.0;
        }
      } else {
          console.log('Progress file is empty or unreadable, initializing target...');
          initialCoverage = currentCoverage;
          targetCoverage = currentCoverage + 1.0;
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log('Progress file not found, attempting to create it exclusively...');
        initialCoverage = currentCoverage;
        targetCoverage = currentCoverage + 1.0;
        fd = openSync(progressPath, 'wx');
      } else {
        throw e;
      }
    }

    if (fd === undefined) {
        console.error("Critical error: File descriptor for progress file is undefined. This should not happen.");
        process.exit(1);
    }

    const newProgressContent = JSON.stringify({ initialCoverage, targetCoverage }, null, 2);
    
    ftruncateSync(fd, 0);
    const bufferToWrite = Buffer.from(newProgressContent, 'utf-8');
    writeSync(fd, bufferToWrite, 0, bufferToWrite.length, 0);

  } catch (error) {
    console.error(`Error handling progress file ${progressPath}:`, error);
    if (fd !== undefined) {
        try { closeSync(fd); } catch (closeErr) { console.error("Error closing fd in error handler:", closeErr); }
        fd = undefined;
    }
    process.exit(1); 
  } finally {
    if (fd !== undefined) {
      closeSync(fd);
    }
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
