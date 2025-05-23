import { execSync } from "child_process";
import {
  readFileSync,
  existsSync,
  openSync,
  closeSync,
  readSync,
  ftruncateSync,
  writeSync,
  constants as fsConstants,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";
import libCoverage from "istanbul-lib-coverage";

const { createCoverageMap } = libCoverage;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.resolve(__dirname, "../.coverage-progress.json");

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function readJSON(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function getTotalCoverage(summary) {
  return summary.total.lines.pct;
}

function getLowCoverageFiles(coverageData, limit = 1) {
  const map = createCoverageMap(coverageData);
  const entries = Object.entries(map.data)
    .map(([file, data]) => ({
      file,
      pct: map.fileCoverageFor(file).toSummary().lines.pct,
    }))
    .filter((e) => e.pct < 80)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit);
  return entries.map((e) => path.relative(process.cwd(), e.file));
}

function main() {
  run("npm run test:cov");

  const summaryPath = path.resolve(
    __dirname,
    "../coverage/coverage-summary.json"
  );
  if (!existsSync(summaryPath)) {
    console.error(
      `ERROR: Coverage summary file not found after running tests: ${summaryPath}`
    );
    process.exit(1);
  }

  const summary = readJSON(summaryPath);
  const currentCoverage = getTotalCoverage(summary);
  const coverageData = readJSON(
    path.resolve(__dirname, "../coverage/coverage-final.json")
  );

  let initialCoverage = 0;
  let targetCoverage = 0;
  let fd;
  let fileContent = "";
  let isNewFile = false;

  try {
    console.log(`Attempting to open existing file: ${progressPath}`);
    try {
      fd = openSync(progressPath, fsConstants.O_RDWR | fsConstants.O_NOFOLLOW);
      console.log(`Successfully opened existing file: ${progressPath}`);
      isNewFile = false;

      const chunks = [];
      const CHUNK_SIZE = 4096;
      let bytesRead;
      while (true) {
        const tempBuffer = Buffer.alloc(CHUNK_SIZE);
        bytesRead = readSync(fd, tempBuffer, 0, CHUNK_SIZE, null);
        if (bytesRead === 0) break; // EOF
        chunks.push(tempBuffer.slice(0, bytesRead));
      }
      if (chunks.length > 0) {
        fileContent = Buffer.concat(chunks).toString("utf-8");
      }

    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`File not found (${progressPath}). Attempting to create it exclusively.`);
        try {
          fd = openSync(progressPath, fsConstants.O_RDWR | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW, 0o600);
          console.log(`Successfully created new file exclusively: ${progressPath}`);
          isNewFile = true;

        } catch (createError) {
          console.error(`Failed to create progress file exclusively (${progressPath}):`, createError);
          throw createError;
        }
      } else {
        console.error(`Error opening initial progress file (${progressPath}):`, e);
        throw e;
      }
    }

    if (isNewFile) {
      console.log(
        "Progress file is new. Initializing coverage targets from current values."
      );
      initialCoverage = currentCoverage;
      targetCoverage = currentCoverage + 1.0;
    } else if (fileContent) {
      try {
        const parsedProgress = JSON.parse(fileContent);
        initialCoverage = parsedProgress.initialCoverage || 0;
        targetCoverage = parsedProgress.targetCoverage || 0;

        if (
          targetCoverage === 0 &&
          initialCoverage === 0 &&
          currentCoverage > 0
        ) {
          console.log(
            "Adjusting: Parsed initial/target are 0, but current > 0. Re-initializing from current."
          );
          initialCoverage = currentCoverage;
          targetCoverage = currentCoverage + 1.0;
        } else if (targetCoverage === 0 && initialCoverage > 0) {
          console.log(
            "Adjusting: Parsed target is 0, initial > 0. Setting target based on initial."
          );
          targetCoverage = initialCoverage + 1.0;
        } else if (initialCoverage === 0 && currentCoverage > 0) {
          console.log(
            "Adjusting: Parsed initial is 0, current > 0. Re-initializing initial from current; adjusting target."
          );
          initialCoverage = currentCoverage;
          if (targetCoverage <= initialCoverage) {
            targetCoverage = currentCoverage + 1.0;
          }
        }

        if (
          initialCoverage === 0 &&
          targetCoverage === 0 &&
          currentCoverage === 0
        ) {
          console.log(
            "Adjusting: All coverage figures are zero. Setting target to 1.0% to initiate progress."
          );
          targetCoverage = 1.0;
        }
      } catch (parseJsonError) {
        console.warn(
          `Could not parse JSON from existing progress file. Re-initializing from current. Error: ${parseJsonError.message}`
        );
        initialCoverage = currentCoverage;
        targetCoverage = currentCoverage + 1.0;
      }
    } else {
      console.log(
        "Progress file existed but was empty. Initializing coverage targets from current values."
      );
      initialCoverage = currentCoverage;
      targetCoverage = currentCoverage + 1.0;
    }

    if (
      targetCoverage <= initialCoverage &&
      !(initialCoverage >= 100 && targetCoverage >= 100)
    ) {
      if (currentCoverage > initialCoverage) {
        initialCoverage = currentCoverage;
      }
      targetCoverage = initialCoverage + 1.0;
      console.log(
        `Safeguard: Adjusted target. Initial: ${initialCoverage.toFixed(
          2
        )}%, Target: ${targetCoverage.toFixed(2)}%`
      );
    }
    if (targetCoverage > 100) {
      targetCoverage = 100;
    }

    if (fd === undefined) {
      console.error(
        "Critical error: File descriptor for progress file is undefined. This should not happen."
      );
      process.exit(1);
    }

    const newProgressContent = JSON.stringify(
      { initialCoverage, targetCoverage },
      null,
      2
    );

    ftruncateSync(fd, 0);
    const bufferToWrite = Buffer.from(newProgressContent, "utf-8");
    writeSync(fd, bufferToWrite, 0, bufferToWrite.length, 0);
  } catch (error) {
    console.error(`Error handling progress file ${progressPath}:`, error);
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch (closeErr) {
        console.error("Error closing fd in error handler:", closeErr);
      }
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
    console.log(
      `\nSuccess: Current coverage of ${currentCoverage.toFixed(
        2
      )}% has met or exceeded the target of ${targetCoverage.toFixed(
        2
      )}%. Task completed.`
    );
  } else {
    const nextFiles = getLowCoverageFiles(coverageData, 1);
    if (nextFiles.length > 0) {
      console.log(
        `\nAction: Add tests for ${nextFiles[0]} to improve coverage. Then re-run 'npm run improve-coverage'.`
      );
    } else {
      console.log(
        `\nInfo: All individual files meet the 80% threshold. However, current coverage of ${currentCoverage.toFixed(
          2
        )}% has not yet reached the target of ${targetCoverage.toFixed(
          2
        )}%. Please add more tests to any module to increase the overall percentage. Then re-run 'npm run improve-coverage'.`
      );
    }
  }
}

main();
