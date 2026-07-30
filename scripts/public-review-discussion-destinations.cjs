#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

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
  let stats;
  try {
    stats = fs.lstatSync(sourceFile);
  } catch {
    throw new Error("Public-review destinations source file is unavailable.");
  }
  invariant(
    stats.isFile() && !stats.isSymbolicLink(),
    "Public-review destinations source must be a regular file."
  );
  return validateDestinationsJson(fs.readFileSync(sourceFile, "utf8"));
}

function assertPrivateRuntimeFile(
  destinationFile,
  expectedIdentity = {
    uid: process.getuid?.(),
    gid: process.getgid?.(),
  }
) {
  const destinationDirectory = path.dirname(destinationFile);
  const directoryStats = fs.lstatSync(destinationDirectory);
  const fileStats = fs.lstatSync(destinationFile);

  invariant(
    directoryStats.isDirectory() && !directoryStats.isSymbolicLink(),
    "Public-review runtime directory must be a regular directory."
  );
  invariant(
    fileStats.isFile() && !fileStats.isSymbolicLink(),
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
}

function writePrivateRuntimeFile(rawValue, destinationFile) {
  const value = validateDestinationsJson(rawValue);
  const destinationDirectory = path.dirname(destinationFile);

  if (fs.existsSync(destinationDirectory)) {
    const stats = fs.lstatSync(destinationDirectory);
    invariant(
      stats.isDirectory() && !stats.isSymbolicLink(),
      "Public-review runtime destination parent must be a regular directory."
    );
    fs.chmodSync(destinationDirectory, 0o700);
  } else {
    fs.mkdirSync(destinationDirectory, { recursive: true, mode: 0o700 });
  }

  if (fs.existsSync(destinationFile)) {
    const stats = fs.lstatSync(destinationFile);
    invariant(
      stats.isFile() && !stats.isSymbolicLink(),
      "Public-review runtime destination must be a regular file."
    );
  }

  fs.writeFileSync(destinationFile, `${value}\n`, { mode: 0o600 });
  fs.chmodSync(destinationFile, 0o600);
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
  validateDestinationsJson,
};
