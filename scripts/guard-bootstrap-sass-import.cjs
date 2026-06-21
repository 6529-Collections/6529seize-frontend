#!/usr/bin/env node

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const repoRoot = resolve(__dirname, "..");
const bootstrapScssPath = resolve(repoRoot, "styles/seize-bootstrap.scss");
const nextConfigPath = resolve(repoRoot, "config/nextConfig.ts");

function readRequiredFile(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read ${filePath}: ${message}`);
    process.exit(1);
  }
}

function isQuote(char) {
  return char === '"' || char === "'" || char === "`";
}

function readQuotedString(source, startIndex) {
  const quote = source[startIndex];
  let text = quote;
  let index = startIndex + 1;

  while (index < source.length) {
    const char = source[index];
    text += char;

    if (char === "\\" && index + 1 < source.length) {
      text += source[index + 1];
      index += 2;
      continue;
    }

    index += 1;

    if (char === quote) {
      break;
    }
  }

  return { text, nextIndex: index };
}

function readLineCommentReplacement(source, startIndex) {
  let index = startIndex + 2;

  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }

  return {
    text: index < source.length ? "\n" : "",
    nextIndex: index < source.length ? index + 1 : index,
  };
}

function readBlockCommentReplacement(source, startIndex) {
  let index = startIndex + 2;
  let text = "";

  while (
    index < source.length &&
    !(source[index] === "*" && source[index + 1] === "/")
  ) {
    if (source[index] === "\n") {
      text += "\n";
    }
    index += 1;
  }

  return {
    text,
    nextIndex: index < source.length ? index + 2 : index,
  };
}

function stripComments(source) {
  let result = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (isQuote(char)) {
      const quoted = readQuotedString(source, index);
      result += quoted.text;
      index = quoted.nextIndex;
      continue;
    }

    if (char === "/" && nextChar === "/") {
      const comment = readLineCommentReplacement(source, index);
      result += comment.text;
      index = comment.nextIndex;
      continue;
    }

    if (char === "/" && nextChar === "*") {
      const comment = readBlockCommentReplacement(source, index);
      result += comment.text;
      index = comment.nextIndex;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

function getSassImportStatements(source) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@use ") || line.startsWith("@import "));
}

function hasBootstrapPackageUse(source) {
  return getSassImportStatements(source).some(
    (line) =>
      line.startsWith('@use "bootstrap/scss/bootstrap"') ||
      line.startsWith("@use 'bootstrap/scss/bootstrap'")
  );
}

function hasUnexpectedBootstrapStatement(source) {
  return getSassImportStatements(source).some((line) =>
    line.includes("bootstrap/scss/bootstrap") &&
    !line.startsWith('@use "bootstrap/scss/bootstrap"') &&
    !line.startsWith("@use 'bootstrap/scss/bootstrap'")
  );
}

const bootstrapScss = stripComments(readRequiredFile(bootstrapScssPath));
const nextConfig = stripComments(readRequiredFile(nextConfigPath));
const failures = [];

if (!hasBootstrapPackageUse(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must import Bootstrap with @use "bootstrap/scss/bootstrap".`
  );
}

if (hasUnexpectedBootstrapStatement(bootstrapScss)) {
  failures.push(
    `${bootstrapScssPath} must use only the package-form Bootstrap Sass import.`
  );
}

if (
  !nextConfig.includes("const SASS_LOAD_PATHS") ||
  !nextConfig.includes("const BOOTSTRAP_PROGRESS_PARTIAL") ||
  !nextConfig.includes('"bootstrap", "scss"') ||
  !nextConfig.includes('"node_modules"')
) {
  failures.push(
    `${nextConfigPath} must keep SASS_LOAD_PATHS pointed at Bootstrap SCSS before node_modules.`
  );
}

if (
  !nextConfig.includes("progress: BOOTSTRAP_PROGRESS_PARTIAL") ||
  !nextConfig.includes('"./node_modules/bootstrap/scss/_progress.scss"')
) {
  failures.push(
    `${nextConfigPath} must keep Turbopack's Bootstrap progress partial alias to avoid resolving the JS progress package from Bootstrap Sass.`
  );
}

const sassOptionsUsesLoadPaths =
  nextConfig.includes("sassOptions:") &&
  nextConfig.includes("loadPaths: SASS_LOAD_PATHS");
const sassOptionsUsesQuietDeps =
  nextConfig.includes("sassOptions:") && nextConfig.includes("quietDeps: true");
const sassOptionsSilencesBootstrapDeprecations =
  nextConfig.includes("silenceDeprecations:") &&
  nextConfig.includes('"import"') &&
  nextConfig.includes('"global-builtin"') &&
  nextConfig.includes('"color-functions"') &&
  nextConfig.includes('"if-function"');

if (!sassOptionsUsesLoadPaths || !sassOptionsUsesQuietDeps) {
  failures.push(
    `${nextConfigPath} must keep sassOptions.loadPaths and quietDeps enabled.`
  );
}

if (!sassOptionsSilencesBootstrapDeprecations) {
  failures.push(
    `${nextConfigPath} must silence Bootstrap Sass dependency deprecation warnings.`
  );
}

if (failures.length > 0) {
  console.error("Bootstrap Sass import guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Bootstrap Sass import guard passed.");
