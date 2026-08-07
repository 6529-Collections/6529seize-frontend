const { spawnSync } = require("node:child_process");

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const MUSEUM_PREFIXES = [
  "app/museum/network/",
  "components/museum/",
  "lib/museum/",
  "tests/museum/",
];
const MUSEUM_FILES = new Set([
  "config/museumPublicationEnv.server.ts",
  "i18n/messages/museum.en-US.json",
]);

function isMuseumOwnedPath(file) {
  const normalized = file.replaceAll("\\", "/");
  return (
    MUSEUM_FILES.has(normalized) ||
    MUSEUM_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

function museumRequiredForFiles(files) {
  return files.some(isMuseumOwnedPath);
}

function classifyGitRange(baseSha, headSha, spawn = spawnSync) {
  if (!SHA_PATTERN.test(baseSha) || !SHA_PATTERN.test(headSha)) {
    return {
      required: true,
      reason: "The deployed change range is incomplete or invalid.",
    };
  }

  const result = spawn(
    "git",
    ["diff", "--no-renames", "--name-only", "-z", baseSha, headSha, "--"],
    { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 }
  );
  if (
    result.status !== 0 ||
    result.error ||
    !Buffer.isBuffer(result.stdout)
  ) {
    const detail = result.error?.message
      ? `error=${result.error.message}`
      : `status=${String(result.status)}, signal=${String(result.signal ?? "none")}`;
    return {
      required: true,
      reason: `Git could not prove the deployed change range (${detail}).`,
    };
  }

  const files = result.stdout.toString("utf8").split("\0").filter(Boolean);
  return {
    required: museumRequiredForFiles(files),
    reason:
      files.length === 0 ? "No files changed." : "Change range classified.",
    files,
  };
}

function readOption(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? "" : (argv[index + 1] ?? "");
}

function main(argv = process.argv.slice(2)) {
  const result = classifyGitRange(
    readOption(argv, "--base"),
    readOption(argv, "--head")
  );
  if (result.required && result.reason !== "Change range classified.") {
    process.stderr.write(`::warning::${result.reason} Retaining Museum E2E.\n`);
  }
  process.stdout.write(result.required ? "true" : "false");
}

if (require.main === module) {
  main();
}

module.exports = {
  classifyGitRange,
  isMuseumOwnedPath,
  museumRequiredForFiles,
};
