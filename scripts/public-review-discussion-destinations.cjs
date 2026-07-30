#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const STREAM_REVIEW_UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateDestinationsJson(rawValue) {
  const value = rawValue.trim();
  invariant(value.length > 0, "Public-review destinations are empty.");

  let destinations;
  try {
    destinations = JSON.parse(value);
  } catch {
    throw new Error("Public-review destinations are not valid JSON.");
  }

  invariant(
    destinations &&
      typeof destinations === "object" &&
      !Array.isArray(destinations) &&
      destinations.staging &&
      typeof destinations.staging === "object" &&
      !Array.isArray(destinations.staging) &&
      typeof destinations.staging["stream-review"] === "string" &&
      STREAM_REVIEW_UUID_V4.test(destinations.staging["stream-review"]) &&
      !Object.hasOwn(destinations, "production"),
    "Public-review destinations must contain only a valid staging Stream review destination."
  );

  return value;
}

function decodeDestinationsBase64(encodedValue) {
  const value = encodedValue.trim();
  invariant(
    value.length > 0 &&
      value.length % 4 === 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(value),
    "Public-review destinations are not valid Base64."
  );
  const decoded = Buffer.from(value, "base64");
  invariant(
    decoded.toString("base64") === value,
    "Public-review destinations are not canonical Base64."
  );
  return validateDestinationsJson(decoded.toString("utf8"));
}

function readDestinationsFile(sourceFile) {
  invariant(sourceFile, "A public-review destinations source file is required.");
  let sourceDescriptor;
  try {
    sourceDescriptor = fs.openSync(
      sourceFile,
      fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW
    );
    invariant(
      fs.fstatSync(sourceDescriptor).isFile(),
      "Public-review destinations source must be a regular file."
    );
    return validateDestinationsJson(
      fs.readFileSync(sourceDescriptor, "utf8")
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("Public-review destinations source file is unavailable.");
    }
    throw error;
  } finally {
    if (sourceDescriptor !== undefined) {
      fs.closeSync(sourceDescriptor);
    }
  }
}

function withPrivateRuntimeFile(
  destinationFile,
  expectedIdentity = {
    uid: process.getuid?.(),
    gid: process.getgid?.(),
  },
  readFile
) {
  const destinationDirectory = path.dirname(destinationFile);
  let directoryDescriptor;
  let fileDescriptor;
  try {
    directoryDescriptor = fs.openSync(
      destinationDirectory,
      fs.constants.O_RDONLY |
        fs.constants.O_DIRECTORY |
        fs.constants.O_NOFOLLOW
    );
    fileDescriptor = fs.openSync(
      destinationFile,
      fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW
    );
    const directoryStats = fs.fstatSync(directoryDescriptor);
    const fileStats = fs.fstatSync(fileDescriptor);

    invariant(
      directoryStats.isDirectory(),
      "Public-review runtime directory must be a regular directory."
    );
    invariant(
      fileStats.isFile(),
      "Public-review runtime configuration must be a regular file."
    );
    invariant(
      (directoryStats.mode & 0o777) === 0o700,
      "Public-review runtime directory permissions must be 0700."
    );
    invariant(
      (fileStats.mode & 0o777) === 0o600,
      "Public-review runtime configuration permissions must be 0600."
    );
    if (
      expectedIdentity.uid !== undefined &&
      expectedIdentity.gid !== undefined
    ) {
      invariant(
        directoryStats.uid === expectedIdentity.uid &&
          directoryStats.gid === expectedIdentity.gid &&
          fileStats.uid === expectedIdentity.uid &&
          fileStats.gid === expectedIdentity.gid,
        "Public-review runtime configuration ownership is invalid."
      );
    }
    return readFile?.(fileDescriptor);
  } finally {
    if (fileDescriptor !== undefined) {
      fs.closeSync(fileDescriptor);
    }
    if (directoryDescriptor !== undefined) {
      fs.closeSync(directoryDescriptor);
    }
  }
}

function assertPrivateRuntimeFile(destinationFile, expectedIdentity) {
  withPrivateRuntimeFile(destinationFile, expectedIdentity);
}

function readPrivateRuntimeFile(destinationFile, expectedIdentity) {
  return withPrivateRuntimeFile(
    destinationFile,
    expectedIdentity,
    (fileDescriptor) =>
      validateDestinationsJson(fs.readFileSync(fileDescriptor, "utf8"))
  );
}

function writePrivateRuntimeFile(rawValue, destinationFile) {
  const value = validateDestinationsJson(rawValue);
  const destinationDirectory = path.dirname(destinationFile);

  fs.mkdirSync(destinationDirectory, { recursive: true, mode: 0o700 });
  let directoryDescriptor;
  try {
    directoryDescriptor = fs.openSync(
      destinationDirectory,
      fs.constants.O_RDONLY |
        fs.constants.O_DIRECTORY |
        fs.constants.O_NOFOLLOW
    );
    invariant(
      fs.fstatSync(directoryDescriptor).isDirectory(),
      "Public-review runtime destination parent must be a regular directory."
    );
    fs.fchmodSync(directoryDescriptor, 0o700);
  } finally {
    if (directoryDescriptor !== undefined) {
      fs.closeSync(directoryDescriptor);
    }
  }

  const temporaryFile = path.join(
    destinationDirectory,
    `.${path.basename(destinationFile)}.${process.pid}.${randomUUID()}.tmp`
  );
  let temporaryDescriptor;
  try {
    temporaryDescriptor = fs.openSync(
      temporaryFile,
      fs.constants.O_WRONLY |
        fs.constants.O_CREAT |
        fs.constants.O_EXCL |
        fs.constants.O_NOFOLLOW,
      0o600
    );
    fs.writeFileSync(temporaryDescriptor, `${value}\n`);
    fs.fchmodSync(temporaryDescriptor, 0o600);
    fs.fsyncSync(temporaryDescriptor);
    fs.closeSync(temporaryDescriptor);
    temporaryDescriptor = undefined;
    fs.renameSync(temporaryFile, destinationFile);
  } finally {
    if (temporaryDescriptor !== undefined) {
      fs.closeSync(temporaryDescriptor);
    }
    fs.rmSync(temporaryFile, { force: true });
  }

  assertPrivateRuntimeFile(destinationFile);
  return destinationFile;
}

function prepareRuntimeFile({
  encodedValue,
  sourceFile,
  destinationFile,
}) {
  invariant(
    Boolean(encodedValue) !== Boolean(sourceFile),
    "Provide exactly one public-review destinations input."
  );
  invariant(destinationFile, "A runtime destination file is required.");
  const value = encodedValue
    ? decodeDestinationsBase64(encodedValue)
    : readDestinationsFile(sourceFile);
  return writePrivateRuntimeFile(value, destinationFile);
}

function parseCli(argv) {
  const options = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    invariant(key?.startsWith("--") && value, "Invalid command arguments.");
    options.set(key, value);
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parseCli(argv);
  const inputMode = options.get("--input");
  const destinationFile = options.get("--destination");
  if (inputMode === "base64-stdin") {
    prepareRuntimeFile({
      encodedValue: fs.readFileSync(0, "utf8"),
      destinationFile,
    });
  } else if (inputMode === "source-file") {
    prepareRuntimeFile({
      sourceFile: options.get("--source"),
      destinationFile,
    });
  } else {
    throw new Error("--input must be base64-stdin or source-file.");
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  assertPrivateRuntimeFile,
  decodeDestinationsBase64,
  prepareRuntimeFile,
  readDestinationsFile,
  readPrivateRuntimeFile,
  validateDestinationsJson,
};
