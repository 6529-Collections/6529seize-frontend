#!/usr/bin/env node

// Copies `public/` into a staging or production deployment bundle and proves
// the packaged bytes: the bundle's `public/` matches the source tree, the
// production runtime configuration targets 6529.io, and the final zip listing
// and extracted archive match the verified bundle exactly.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PROFILES = new Set(["production", "staging"]);
const PRODUCTION_BASE_ENDPOINT = "https://6529.io";
const RUNTIME_CONFIG_PATH = ".next/PUBLIC_RUNTIME.json";

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeRelativePath(value) {
  return value.split(path.sep).join("/");
}

function isContainedPath(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function resolveContainedPath(parent, candidate, label) {
  const resolvedParent = path.resolve(parent);
  const resolvedCandidate = path.resolve(resolvedParent, candidate);
  invariant(
    isContainedPath(resolvedParent, resolvedCandidate),
    `${label} must resolve below ${resolvedParent}.`
  );
  return resolvedCandidate;
}

function sortedDirectoryEntries(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
}

function sha256File(filePath) {
  return `sha256:${crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex")}`;
}

/** Inventories files deterministically, rejecting unsupported entries and unapproved symlinks. */
function walkDirectory(root, options = {}) {
  const entries = [];
  if (!fs.existsSync(root)) {
    return entries;
  }

  const visit = (directory, relativeDirectory) => {
    for (const entry of sortedDirectoryEntries(directory)) {
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (options.includeDirectories) {
          entries.push({ path: relativePath, type: "directory" });
        }
        visit(absolutePath, relativePath);
        continue;
      }
      if (entry.isFile()) {
        entries.push({
          path: relativePath,
          sha256: sha256File(absolutePath),
          type: "file",
        });
        continue;
      }
      if (entry.isSymbolicLink() && options.allowSymlinks) {
        entries.push({
          path: relativePath,
          target: fs.readlinkSync(absolutePath),
          type: "symlink",
        });
        continue;
      }
      throw new Error(
        `${normalizeRelativePath(absolutePath)} is not a supported regular file or directory.`
      );
    }
  };

  visit(root, "");
  return entries;
}

/** Hashes a deterministic file inventory to detect changed artifact or source bytes. */
function directoryIdentity(root, options) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(walkDirectory(root, options)))
    .digest("hex");
}

function copyDirectory(source, destination) {
  invariant(fs.existsSync(source), `Missing source directory: ${source}`);
  invariant(
    !fs.existsSync(destination),
    `Destination must not already exist: ${destination}`
  );
  fs.mkdirSync(destination, { recursive: true });

  const visit = (sourceDirectory, destinationDirectory) => {
    for (const entry of sortedDirectoryEntries(sourceDirectory)) {
      const sourcePath = path.join(sourceDirectory, entry.name);
      const destinationPath = path.join(destinationDirectory, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destinationPath);
        visit(sourcePath, destinationPath);
        continue;
      }
      invariant(
        entry.isFile(),
        `Refusing to package non-regular source entry: ${normalizeRelativePath(sourcePath)}`
      );
      fs.copyFileSync(sourcePath, destinationPath);
    }
  };

  visit(source, destination);
}

function replaceDirectory(source, destination) {
  if (fs.existsSync(destination)) {
    const destinationStats = fs.lstatSync(destination);
    invariant(
      !destinationStats.isSymbolicLink(),
      `Refusing to replace symbolic-link destination: ${normalizeRelativePath(destination)}`
    );
    invariant(
      destinationStats.isDirectory(),
      `Replacement destination is not a directory: ${normalizeRelativePath(destination)}`
    );
    fs.rmSync(destination, { recursive: true });
  }
  copyDirectory(source, destination);
}

function assertPublicCopyIdentity(repoRoot, bundleRoot, profile) {
  invariant(
    directoryIdentity(path.join(repoRoot, "public")) ===
      directoryIdentity(path.join(bundleRoot, "public")),
    `${profile} public directory does not match the source public directory.`
  );
}

function assertProductionRuntimeConfig(bundleRoot) {
  const runtimeConfigPath = path.join(bundleRoot, RUNTIME_CONFIG_PATH);
  invariant(
    fs.existsSync(runtimeConfigPath) && fs.statSync(runtimeConfigPath).isFile(),
    `Production bundle is missing ${RUNTIME_CONFIG_PATH}.`
  );

  let runtimeConfig;
  try {
    runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8"));
  } catch {
    throw new Error(
      `Production bundle contains invalid JSON at ${RUNTIME_CONFIG_PATH}.`
    );
  }

  invariant(
    runtimeConfig &&
      typeof runtimeConfig === "object" &&
      !Array.isArray(runtimeConfig),
    `Production bundle contains a non-object ${RUNTIME_CONFIG_PATH}.`
  );
  invariant(
    runtimeConfig.BASE_ENDPOINT === PRODUCTION_BASE_ENDPOINT,
    `Production bundle BASE_ENDPOINT must equal ${PRODUCTION_BASE_ENDPOINT}.`
  );
  invariant(
    typeof runtimeConfig.GIPHY_API_KEY === "string" &&
      runtimeConfig.GIPHY_API_KEY.trim().length > 0,
    "Production bundle GIPHY_API_KEY must be configured."
  );
}

/** Verifies a complete staging or production bundle. */
function assertProfileBundle({ repoRoot, bundleRoot, profile }) {
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  invariant(fs.statSync(bundleRoot).isDirectory(), "Bundle root is missing.");
  assertPublicCopyIdentity(repoRoot, bundleRoot, profile);
  if (profile === "production") {
    assertProductionRuntimeConfig(bundleRoot);
  }
}

function prepareProfileBundle({ repoRoot, bundleRoot, profile }) {
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  const sourcePublic = path.join(repoRoot, "public");
  const sourceIdentity = directoryIdentity(sourcePublic);
  replaceDirectory(sourcePublic, path.join(bundleRoot, "public"));
  assertProfileBundle({ repoRoot, bundleRoot, profile });
  invariant(
    directoryIdentity(sourcePublic) === sourceIdentity,
    "Packaging changed the source public directory."
  );
}

function parseZipListing(listingText) {
  const entries = [];
  const seen = new Set();
  for (const rawLine of listingText.split(/\r?\n/)) {
    if (rawLine.length === 0) {
      continue;
    }
    const normalized = rawLine.startsWith("./") ? rawLine.slice(2) : rawLine;
    if (normalized.length === 0 && rawLine === "./") {
      continue;
    }
    invariant(
      normalized.length > 0 &&
        !normalized.startsWith("/") &&
        !normalized.includes("\\") &&
        !normalized.split("/").some((segment) => segment === ".."),
      `Zip listing contains an unsafe path: ${rawLine}`
    );
    if (normalized.endsWith("/")) {
      continue;
    }
    invariant(!seen.has(normalized), `Zip listing duplicates ${normalized}.`);
    seen.add(normalized);
    entries.push(normalized);
  }
  return entries.sort((left, right) => left.localeCompare(right, "en"));
}

function expectedBundleEntries(bundleRoot) {
  return walkDirectory(bundleRoot, { allowSymlinks: true })
    .map((entry) => entry.path)
    .sort((left, right) => left.localeCompare(right, "en"));
}

function assertExtractedArchive(bundleRoot, extractedRoot) {
  const options = { allowSymlinks: true, includeDirectories: true };
  invariant(
    directoryIdentity(bundleRoot, options) ===
      directoryIdentity(extractedRoot, options),
    "Extracted package.zip bytes do not exactly match the verified bundle."
  );
}

function assertListingMatchesBundle(bundleRoot, listingFile) {
  const actual = parseZipListing(fs.readFileSync(listingFile, "utf8"));
  const expected = expectedBundleEntries(bundleRoot);
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    "Final package.zip file listing does not exactly match the verified bundle."
  );
}

function assertZipListingSafety({
  repoRoot,
  bundleRoot,
  profile,
  listingFile,
}) {
  assertProfileBundle({ repoRoot, bundleRoot, profile });
  assertListingMatchesBundle(bundleRoot, listingFile);
}

function assertZipListing({
  repoRoot,
  bundleRoot,
  profile,
  listingFile,
  extractedRoot,
}) {
  assertProfileBundle({ repoRoot, bundleRoot, profile });
  assertListingMatchesBundle(bundleRoot, listingFile);
  assertProfileBundle({ repoRoot, bundleRoot: extractedRoot, profile });
  assertExtractedArchive(bundleRoot, extractedRoot);
}

function parseCli(argv) {
  const [command, ...tokens] = argv;
  invariant(
    ["prepare", "assert-listing", "assert-zip"].includes(command),
    "Usage: package-web-artifact.cjs <prepare|assert-listing|assert-zip> --profile <production|staging> --bundle-root <path> [--listing-file <path>] [--extracted-root <path>] [--repo-root <path>]"
  );
  invariant(tokens.length % 2 === 0, "CLI options must be key-value pairs.");

  const options = new Map();
  for (let index = 0; index < tokens.length; index += 2) {
    const key = tokens[index];
    const value = tokens[index + 1];
    invariant(
      [
        "--profile",
        "--bundle-root",
        "--listing-file",
        "--extracted-root",
        "--repo-root",
      ].includes(key),
      `Unknown option: ${key}`
    );
    invariant(!options.has(key), `Duplicate option: ${key}`);
    invariant(value && !value.startsWith("--"), `Missing value for ${key}.`);
    options.set(key, value);
  }

  const profile = options.get("--profile");
  invariant(PROFILES.has(profile), `Unsupported artifact profile: ${profile}`);
  const repoRoot = path.resolve(options.get("--repo-root") ?? process.cwd());
  const bundleValue = options.get("--bundle-root");
  invariant(bundleValue, "--bundle-root is required.");
  const bundleRoot = resolveContainedPath(repoRoot, bundleValue, "Bundle root");
  const listingValue = options.get("--listing-file");
  const extractedValue = options.get("--extracted-root");
  if (command === "prepare") {
    invariant(
      !listingValue && !extractedValue,
      "--listing-file and --extracted-root are valid only for assertions."
    );
  } else if (command === "assert-listing") {
    invariant(
      Boolean(listingValue) && !extractedValue,
      "--listing-file is required and --extracted-root is invalid for assert-listing."
    );
  } else {
    invariant(
      Boolean(listingValue) && Boolean(extractedValue),
      "--listing-file and --extracted-root are required for assert-zip."
    );
  }
  return {
    command,
    repoRoot,
    bundleRoot,
    profile,
    listingFile: listingValue ? path.resolve(listingValue) : undefined,
    extractedRoot: extractedValue ? path.resolve(extractedValue) : undefined,
  };
}

function main(argv = process.argv.slice(2)) {
  const options = parseCli(argv);
  if (options.command === "prepare") {
    prepareProfileBundle(options);
  } else if (options.command === "assert-listing") {
    assertZipListingSafety(options);
  } else {
    assertZipListing(options);
  }
  process.stdout.write(`Verified ${options.profile} artifact bundle.\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  assertExtractedArchive,
  assertListingMatchesBundle,
  assertProfileBundle,
  assertZipListing,
  assertZipListingSafety,
  directoryIdentity,
  expectedBundleEntries,
  main,
  parseCli,
  parseZipListing,
  prepareProfileBundle,
};
