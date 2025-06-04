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
import crypto from "crypto";

const { createCoverageMap } = libCoverage;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Add parallel processing configuration - support both CLI args and env vars
let PROCESS_ID, TOTAL_PROCESSES;

// Check if arguments are provided via command line
if (process.argv.length >= 4) {
  PROCESS_ID = parseInt(process.argv[2]);
  TOTAL_PROCESSES = parseInt(process.argv[3]);
} else if (process.env.PROCESS_ID && process.env.TOTAL_PROCESSES) {
  PROCESS_ID = parseInt(process.env.PROCESS_ID);
  TOTAL_PROCESSES = parseInt(process.env.TOTAL_PROCESSES);
} else {
  console.error("Error: Process configuration not provided.");
  console.error("");
  console.error("You can either:");
  console.error("1. Pass arguments directly:");
  console.error("   npm run improve-coverage 0 1  # Single process");
  console.error("   npm run improve-coverage 0 8  # Process 0 of 8");
  console.error("");
  console.error("2. Set up environment variables:");
  console.error("   source scripts/setup-coverage-env.sh <process_id> <total_processes>");
  console.error("   npm run improve-coverage");
  process.exit(1);
}

if (isNaN(PROCESS_ID) || PROCESS_ID < 0 || PROCESS_ID >= TOTAL_PROCESSES) {
  console.error(`PROCESS_ID must be between 0 and ${TOTAL_PROCESSES - 1}`);
  process.exit(1);
}

if (isNaN(TOTAL_PROCESSES) || TOTAL_PROCESSES < 1) {
  console.error("TOTAL_PROCESSES must be a positive integer");
  process.exit(1);
}

// Create unique progress file per process when running in parallel
const progressFilename = ".coverage-progress.json"
const progressPath = path.resolve(__dirname, "..", progressFilename);

const COVERAGE_INCREMENT_PERCENT_ENV = parseFloat(
  process.env.COVERAGE_INCREMENT_PERCENT_ENV
);
const COVERAGE_INCREMENT_PERCENT = !isNaN(COVERAGE_INCREMENT_PERCENT_ENV)
  ? COVERAGE_INCREMENT_PERCENT_ENV
  : 0;

// Add time limit configuration
const TIME_LIMIT_MINUTES_ENV = parseFloat(
  process.env.TIME_LIMIT_MINUTES
);
const TIME_LIMIT_MINUTES = !isNaN(TIME_LIMIT_MINUTES_ENV)
  ? TIME_LIMIT_MINUTES_ENV
  : 60;

// Number of files to suggest each iteration
const FILE_SUGGESTION_COUNT_ENV = parseInt(process.env.FILE_SUGGESTION_COUNT);
const FILE_SUGGESTION_COUNT = !isNaN(FILE_SUGGESTION_COUNT_ENV)
  ? FILE_SUGGESTION_COUNT_ENV
  : 10;

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function readJSON(file) {
  return JSON.parse(readFileSync(file, "utf-8"));
}

function getTotalCoverage(summary) {
  return summary.total.lines.pct;
}

function getFileHash(filepath) {
  // Create a deterministic hash for the file path
  return crypto.createHash('md5').update(filepath).digest('hex');
}

function isFileAssignedToProcess(filepath, processId, totalProcesses) {
  // Convert hex hash to number and use modulo to assign to a process
  const hash = getFileHash(filepath);
  const hashNum = parseInt(hash.substring(0, 8), 16);
  return (hashNum % totalProcesses) === processId;
}

function getLowCoverageFiles(coverageData, limit = 1) {
  const map = createCoverageMap(coverageData);
  const allLowCoverageFiles = Object.entries(map.data)
    .map(([file, data]) => ({
      file,
      pct: map.fileCoverageFor(file).toSummary().lines.pct,
    }))
    .filter((e) => e.pct < 80)
    .sort((a, b) => a.pct - b.pct);

  // Filter files assigned to this process
  const assignedFiles = allLowCoverageFiles.filter(entry => 
    isFileAssignedToProcess(entry.file, PROCESS_ID, TOTAL_PROCESSES)
  );

  const selectedFiles = assignedFiles.slice(0, limit);
  return selectedFiles.map((e) => path.relative(process.cwd(), e.file));
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
  let startTime = null;
  let fd;
  let fileContent = "";
  let isNewFile = false;

  try {
    try {
      fd = openSync(progressPath, fsConstants.O_RDWR | fsConstants.O_NOFOLLOW);
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
      if (e.code === "ENOENT") {
        console.log(
          `File not found (${progressPath}). Attempting to create it exclusively.`
        );
        try {
          fd = openSync(
            progressPath,
            fsConstants.O_RDWR |
              fsConstants.O_CREAT |
              fsConstants.O_EXCL |
              fsConstants.O_NOFOLLOW,
            0o600
          );
          console.log(
            `Successfully created new file exclusively: ${progressPath}`
          );
          isNewFile = true;
        } catch (createError) {
          console.error(
            `Failed to create progress file exclusively (${progressPath}):`,
            createError
          );
          throw createError;
        }
      } else {
        console.error(
          `Error opening initial progress file (${progressPath}):`,
          e
        );
        throw e;
      }
    }

    if (isNewFile) {
      console.log(
        "Progress file is new. Initializing coverage targets from current values."
      );
      initialCoverage = currentCoverage;
      targetCoverage = currentCoverage + COVERAGE_INCREMENT_PERCENT;
      startTime = Date.now();
    } else if (fileContent) {
      try {
        const parsedProgress = JSON.parse(fileContent);
        initialCoverage = parsedProgress.initialCoverage || 0;
        targetCoverage = parsedProgress.targetCoverage || 0;
        startTime = parsedProgress.startTime || Date.now();

        if (
          targetCoverage === 0 &&
          initialCoverage === 0 &&
          currentCoverage > 0
        ) {
          console.log(
            "Adjusting: Parsed initial/target are 0, but current > 0. Re-initializing from current."
          );
          initialCoverage = currentCoverage;
          targetCoverage = currentCoverage + COVERAGE_INCREMENT_PERCENT;
        } else if (targetCoverage === 0 && initialCoverage > 0) {
          console.log(
            "Adjusting: Parsed target is 0, initial > 0. Setting target based on initial."
          );
          targetCoverage = initialCoverage + COVERAGE_INCREMENT_PERCENT;
        } else if (initialCoverage === 0 && currentCoverage > 0) {
          console.log(
            "Adjusting: Parsed initial is 0, current > 0. Re-initializing initial from current; adjusting target."
          );
          initialCoverage = currentCoverage;
          if (targetCoverage <= initialCoverage) {
            targetCoverage = currentCoverage + COVERAGE_INCREMENT_PERCENT;
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
          targetCoverage = COVERAGE_INCREMENT_PERCENT;
        }
      } catch (parseJsonError) {
        console.warn(
          `Could not parse JSON from existing progress file. Re-initializing from current. Error: ${parseJsonError.message}`
        );
        initialCoverage = currentCoverage;
        targetCoverage = currentCoverage + COVERAGE_INCREMENT_PERCENT;
      }
    } else {
      console.log(
        "Progress file existed but was empty. Initializing coverage targets from current values."
      );
      initialCoverage = currentCoverage;
      targetCoverage = currentCoverage + COVERAGE_INCREMENT_PERCENT;
    }

    if (
      targetCoverage <= initialCoverage &&
      !(initialCoverage >= 100 && targetCoverage >= 100)
    ) {
      if (currentCoverage > initialCoverage) {
        initialCoverage = currentCoverage;
      }
    }
    if (targetCoverage > 100) {
      targetCoverage = 100;
    }

    // Ensure startTime is always set
    if (!startTime) {
      startTime = Date.now();
      console.log("Warning: startTime was not set, initializing to current time.");
    }

    if (fd === undefined) {
      console.error(
        "Critical error: File descriptor for progress file is undefined. This should not happen."
      );
      process.exit(1);
    }

    const newProgressContent = JSON.stringify(
      { initialCoverage, targetCoverage, startTime },
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

  // Check time constraint
  const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;

  if (elapsedMinutes >= TIME_LIMIT_MINUTES) {
    console.log(
      `\nSuccess: Time limit of ${TIME_LIMIT_MINUTES} minutes has been reached. Task completed due to time constraint.`
    );
    console.log(`Final coverage: ${currentCoverage.toFixed(2)}%`);
  } else {
    
    const nextFiles = getLowCoverageFiles(coverageData, FILE_SUGGESTION_COUNT);
    if (nextFiles.length > 0) {
      console.log(
        `\nAction: Add tests for:`
      );
      for (const file of nextFiles) {
        console.log(`- ${file}`);
      }
      console.log(`to improve coverage. After each set of tests, re-run 'npm run improve-coverage' to get new suggestions. Continue until the time limit is reached.`)
    } else {
      // Check if there are low coverage files, just not assigned to this process
      const map = createCoverageMap(coverageData);
      const totalLowCoverageFiles = Object.entries(map.data)
        .filter(([file, data]) => map.fileCoverageFor(file).toSummary().lines.pct < 80)
        .length;
      
      if (TOTAL_PROCESSES > 1 && totalLowCoverageFiles > 0) {
        console.log(
          `\nInfo: No files assigned to process ${PROCESS_ID}. There are ${totalLowCoverageFiles} low coverage files ` +
          `assigned to other processes. This process can rest while others work on coverage.`
        );
      } else {
        console.log(
          `\nInfo: All individual files meet the 80% threshold. Continue adding meaningful tests across the project and re-run 'npm run improve-coverage' until the time limit message is displayed.`
        );
      }
    }
  }
}

main();
